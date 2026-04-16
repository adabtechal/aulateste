import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Kestra (agente SDR) — disparado quando um lead novo é criado
const kestraApiUrl = Deno.env.get("KESTRA_API_URL") || "";
const kestraUsername = Deno.env.get("KESTRA_USERNAME") || "";
const kestraPassword = Deno.env.get("KESTRA_PASSWORD") || "";
const kestraTenant = Deno.env.get("KESTRA_TENANT") || "main";
const kestraSdrNamespace = Deno.env.get("KESTRA_SDR_NAMESPACE") || "";
const kestraSdrFlowId = Deno.env.get("KESTRA_SDR_FLOW_ID") || "";

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Dispara o flow do agente SDR no Kestra de forma fire-and-forget.
 * Tenta primeiro o endpoint com tenant; se 404, faz fallback sem tenant
 * (mesma estratégia do server/src/services/kestraApi.js).
 * Silencia erros para não bloquear o webhook da Evolution.
 */
async function triggerKestraSdr(inputs: Record<string, unknown>): Promise<void> {
  if (!kestraApiUrl || !kestraUsername || !kestraPassword || !kestraSdrNamespace || !kestraSdrFlowId) {
    console.warn("[kestra] SDR flow não configurado — setar KESTRA_API_URL, KESTRA_USERNAME, KESTRA_PASSWORD, KESTRA_SDR_NAMESPACE, KESTRA_SDR_FLOW_ID");
    return;
  }

  const auth = "Basic " + btoa(`${kestraUsername}:${kestraPassword}`);
  const base = kestraApiUrl.replace(/\/+$/, "");
  const pathWithTenant = `${base}/api/v1/${kestraTenant}/executions/${kestraSdrNamespace}/${kestraSdrFlowId}`;
  const pathWithoutTenant = `${base}/api/v1/executions/${kestraSdrNamespace}/${kestraSdrFlowId}`;

  // Kestra exige multipart/form-data nos inputs (NÃO JSON).
  // Cada input vai como um field separado no FormData.
  const buildFormData = () => {
    const fd = new FormData();
    for (const [key, val] of Object.entries(inputs)) {
      fd.append(key, val == null ? "" : String(val));
    }
    return fd;
  };

  const headers = { Authorization: auth }; // Content-Type é setado automaticamente pelo FormData

  try {
    const res = await fetch(pathWithTenant, { method: "POST", headers, body: buildFormData() });
    if (res.status === 404) {
      // Fallback: Kestra sem multi-tenant (precisa novo FormData — body já consumido)
      const resFallback = await fetch(pathWithoutTenant, { method: "POST", headers, body: buildFormData() });
      if (!resFallback.ok) {
        console.error(`[kestra] fallback ${resFallback.status}:`, await resFallback.text());
      } else {
        console.log("[kestra] SDR flow disparado (fallback sem tenant)");
      }
      return;
    }
    if (!res.ok) {
      console.error(`[kestra] ${res.status}:`, await res.text());
    } else {
      console.log("[kestra] SDR flow disparado");
    }
  } catch (err) {
    console.error("[kestra] erro ao disparar:", err);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { event, data, instance } = body;

    // Apenas processa eventos de mensagem recebida
    if (event !== "messages.upsert") {
      return new Response(
        JSON.stringify({ received: true, skipped: "not_messages_upsert" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const message = data;

    // fromMe=true significa "saiu desta conta WhatsApp" — pode ter sido:
    //   (a) enviada pelo nosso backend (já gravada em message_log via messageService)
    //   (b) enviada pelo celular/WhatsApp Web do usuário fora do sistema
    // Não barramos mais — deduplicamos por whatsapp_message_id mais abaixo.
    const fromMe = !!message?.key?.fromMe;

    const remoteJid = message?.key?.remoteJid || "";

    // Ignora mensagens de grupo
    if (remoteJid.includes("@g.us")) {
      return new Response(
        JSON.stringify({ received: true, skipped: "group" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extrai telefone limpo (sem @s.whatsapp.net)
    const phone = remoteJid.replace("@s.whatsapp.net", "");
    if (!phone) {
      return new Response(
        JSON.stringify({ received: true, skipped: "no_phone" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extrai nome do contato (pushName da Evolution API).
    // Em mensagens fromMe=true o pushName é o do REMETENTE (atendente), não
    // do contato — descartamos pra não usar como nome do lead.
    const pushName = !fromMe ? (message?.pushName || message?.verifiedBizName || "") : "";

    // Extrai conteudo da mensagem
    const msg = message?.message || {};
    const isImage = !!msg.imageMessage;
    const content =
      msg.conversation ||
      msg.extendedTextMessage?.text ||
      msg.imageMessage?.caption ||
      "";

    // --- LOGICA PRINCIPAL ---

    // 0. Resolve tenant_id a partir da instância Evolution que recebeu o webhook.
    // O payload da Evolution inclui `instance` (instance_name). Buscamos a tenant
    // dona dessa instância — assim leads herdam a tenant correta e o agente SDR
    // do Kestra sabe em qual contexto operar.
    let tenantId: string | null = null;
    if (instance) {
      const { data: inst } = await supabase
        .from("whatsapp_instances")
        .select("tenant_id")
        .eq("instance_name", instance)
        .maybeSingle();
      tenantId = inst?.tenant_id ?? null;
    }
    if (!tenantId) {
      console.warn(`[webhook] tenant_id não resolvido para instância "${instance}" — lead será criado sem tenant`);
    }

    // 1. Busca lead pelo telefone (escopado pela tenant quando disponível)
    let leadQuery = supabase
      .from("leads")
      .select("id, tenant_id, current_stage_id")
      .eq("phone", phone);
    if (tenantId) {
      leadQuery = leadQuery.eq("tenant_id", tenantId);
    }
    const { data: existingLead } = await leadQuery.maybeSingle();

    let leadId: string;
    let currentStageId: string | null = null;

    if (existingLead) {
      // Lead ja existe - usa o ID existente, sem alteracoes no cadastro
      leadId = existingLead.id;
      currentStageId = existingLead.current_stage_id ?? null;
      // Garante tenantId para o trigger Kestra mesmo que a busca tenha sido sem filtro
      if (!tenantId) tenantId = existingLead.tenant_id ?? null;
    } else {
      // Lead NAO existe - cadastra e joga no primeiro stage (Primeiro Contato)
      // Busca o primeiro stage ativo do kanban (menor position)
      const { data: firstStage, error: stageError } = await supabase
        .from("kanban_stages")
        .select("id")
        .eq("is_active", true)
        .order("position", { ascending: true })
        .limit(1)
        .single();

      if (stageError) {
        console.error("Erro ao buscar primeiro stage:", stageError.message);
        return new Response(
          JSON.stringify({ received: true, error: "no_active_stage" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Cria o novo lead (com tenant_id quando resolvido)
      const { data: newLead, error: leadError } = await supabase
        .from("leads")
        .insert({
          name: pushName || phone,
          phone,
          current_stage_id: firstStage.id,
          tags: ["novo-whatsapp"],
          ...(tenantId ? { tenant_id: tenantId } : {}),
        })
        .select("id")
        .single();

      if (leadError) {
        // Se erro de unique constraint (lead criado entre o select e o insert), busca novamente
        if (leadError.code === "23505") {
          const { data: retryLead } = await supabase
            .from("leads")
            .select("id")
            .eq("phone", phone)
            .single();
          leadId = retryLead!.id;
        } else {
          console.error("Erro ao criar lead:", leadError.message);
          return new Response(
            JSON.stringify({ received: true, error: leadError.message }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      } else {
        leadId = newLead.id;
        currentStageId = firstStage.id;

        // Registra historico de stage (entrada no kanban)
        await supabase.from("lead_stage_history").insert({
          lead_id: leadId,
          from_stage_id: null,
          to_stage_id: firstStage.id,
        });

        // Agenda auto-messages do primeiro stage (se houver)
        const { data: autoMessages } = await supabase
          .from("auto_messages")
          .select("*")
          .eq("stage_id", firstStage.id)
          .eq("is_active", true);

        if (autoMessages?.length) {
          const scheduled = autoMessages.map((am) => ({
            lead_id: leadId,
            auto_message_id: am.id,
            stage_id: firstStage.id,
            scheduled_at: new Date(
              Date.now() + am.delay_minutes * 60000
            ).toISOString(),
            status: "pending",
          }));
          await supabase.from("scheduled_messages").insert(scheduled);
        }
      }
    }

    // 1.5. Decide se o agente SDR deve atuar nessa mensagem.
    // Regra: agente conversa enquanto o lead está em positions <= 1 (Novo Lead,
    // Contato Inicial). Quando o agente decide qualificar, faz move para
    // position 2 (Qualificado) — daí em diante humano assume.
    // - msg outgoing (fromMe) → nunca dispara
    // - lead sem tenant ou sem stage → não dispara
    let shouldTriggerAgent = false;
    let nextStageId: string | null = null;
    let currentStageName = "";
    let nextStageName = "";

    if (!fromMe && tenantId && currentStageId) {
      const { data: stages } = await supabase
        .from("kanban_stages")
        .select("id, name, position")
        .eq("is_active", true)
        .order("position", { ascending: true });

      if (stages && stages.length > 0) {
        const currentIdx = stages.findIndex((s) => s.id === currentStageId);
        const current = currentIdx >= 0 ? stages[currentIdx] : null;
        currentStageName = current?.name ?? "";
        // Próximo stage = stage com position imediatamente maior
        const next = currentIdx >= 0 && currentIdx + 1 < stages.length ? stages[currentIdx + 1] : null;
        nextStageId = next?.id ?? null;
        nextStageName = next?.name ?? "";
        // Agente atua somente nas duas primeiras pipelines
        shouldTriggerAgent = (current?.position ?? 99) <= 1;
      }
    }

    // 2. Dedup: se a msg já foi gravada (backend enviou e gravou via messageService),
    // o whatsapp_message_id estará no message_log. Skip pra não duplicar bolha.
    const waMessageId = message?.key?.id;
    if (waMessageId) {
      const { data: existingMsg } = await supabase
        .from("message_log")
        .select("id")
        .eq("whatsapp_message_id", waMessageId)
        .maybeSingle();
      if (existingMsg) {
        return new Response(
          JSON.stringify({ received: true, skipped: "duplicate", lead_id: leadId! }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // 3. Registra a mensagem no message_log
    // - fromMe=true sem dedup match → mensagem externa (celular/WhatsApp Web do user) → outgoing
    // - fromMe=false → mensagem do contato → incoming
    const { error: msgError } = await supabase.from("message_log").insert({
      lead_id: leadId!,
      direction: fromMe ? "outgoing" : "incoming",
      message_type: isImage ? "image" : "text",
      content,
      media_url: msg.imageMessage?.url || null,
      whatsapp_message_id: waMessageId,
      status: fromMe ? "sent" : "received",
    });

    if (msgError) {
      console.error("Erro ao registrar mensagem:", msgError.message);
    }

    // 4. Dispara o agente SDR no Kestra (fire-and-forget) — depois de gravar
    // a msg no log para que o agente eventualmente possa ler o histórico.
    if (shouldTriggerAgent) {
      triggerKestraSdr({
        tenantId: tenantId!,
        leadId: leadId!,
        phone,
        incomingMessage: content,
        currentStageId: currentStageId ?? "",
        currentStageName,
        nextStageId: nextStageId ?? "",
        nextStageName,
      }).catch((err) => console.error("[kestra] unhandled:", err));
    }

    return new Response(
      JSON.stringify({
        received: true,
        lead_id: leadId!,
        is_new_lead: !existingLead,
        direction: fromMe ? "outgoing" : "incoming",
        agent_triggered: shouldTriggerAgent,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Webhook error:", err);
    // Sempre retorna 200 para a Evolution API nao reenviar
    return new Response(
      JSON.stringify({ received: true, error: String(err) }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
