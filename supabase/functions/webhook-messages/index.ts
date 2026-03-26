import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
    const { event, data } = body;

    // Apenas processa eventos de mensagem recebida
    if (event !== "messages.upsert") {
      return new Response(
        JSON.stringify({ received: true, skipped: "not_messages_upsert" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const message = data;

    // Ignora mensagens enviadas por nós
    if (message?.key?.fromMe) {
      return new Response(
        JSON.stringify({ received: true, skipped: "from_me" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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

    // Extrai nome do contato (pushName da Evolution API)
    const pushName = message?.pushName || message?.verifiedBizName || "";

    // Extrai conteudo da mensagem
    const msg = message?.message || {};
    const isImage = !!msg.imageMessage;
    const content =
      msg.conversation ||
      msg.extendedTextMessage?.text ||
      msg.imageMessage?.caption ||
      "";

    // --- LOGICA PRINCIPAL ---

    // 1. Busca lead pelo telefone
    const { data: existingLead } = await supabase
      .from("leads")
      .select("id")
      .eq("phone", phone)
      .maybeSingle();

    let leadId: string;

    if (existingLead) {
      // Lead ja existe - usa o ID existente, sem alteracoes no cadastro
      leadId = existingLead.id;
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

      // Cria o novo lead
      const { data: newLead, error: leadError } = await supabase
        .from("leads")
        .insert({
          name: pushName || phone,
          phone,
          current_stage_id: firstStage.id,
          tags: ["novo-whatsapp"],
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

    // 2. Registra a mensagem no message_log
    const { error: msgError } = await supabase.from("message_log").insert({
      lead_id: leadId!,
      direction: "incoming",
      message_type: isImage ? "image" : "text",
      content,
      media_url: msg.imageMessage?.url || null,
      whatsapp_message_id: message?.key?.id,
      status: "received",
    });

    if (msgError) {
      console.error("Erro ao registrar mensagem:", msgError.message);
    }

    return new Response(
      JSON.stringify({
        received: true,
        lead_id: leadId!,
        is_new_lead: !existingLead,
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
