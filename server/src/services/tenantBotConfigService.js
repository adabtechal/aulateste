const DEFAULT_CONFIG = {
  enabled: true,
  agentName: 'Atendimento WhatsApp',
  namespace: 'company.bot',
  flowId: 'tenant-conversation-agent',
  whatsappInstance: '',
  webhookPath: '/api/webhook/messages',
  provider: 'openai',
  providerApiKey: '',
  model: 'gpt-4.1-mini',
  temperature: 0.3,
  maxTokens: 900,
  maxSequentialToolsInvocations: 6,
  memoryEnabled: true,
  memoryKey: 'lead_phone',
  welcomeMessage: 'Olá! Sou o assistente virtual da operação. Posso ajudar com dúvidas, qualificação e próximos passos.',
  systemPrompt:
    'Você é o agente conversacional oficial desta tenant. Responda em português do Brasil, com contexto comercial, use o histórico do lead quando disponível e nunca invente status, preços ou promessas. Quando faltar contexto, peça confirmação antes de agir.',
  executionLabels: {
    channel: 'whatsapp',
    source: 'leadtrack',
  },
  handoffInstructions:
    'Quando a conversa indicar urgência comercial, objeção sensível ou pedido humano explícito, encaminhe para a equipe e registre resumo do contexto.',
  safetyNotes:
    'Não compartilhar dados internos, não confirmar pagamentos sem evidência e não enviar arquivos não solicitados.',
  tools: ['web_search', 'flow_call', 'task_run', 'crm_lookup'],
  lastPublishedAt: null,
  lastPublishedFlowRevision: null,
  lastPublishedBy: null,
};

const PROVIDER_TYPE_MAP = {
  openai: 'io.kestra.plugin.ai.provider.OpenAI',
  anthropic: 'io.kestra.plugin.ai.provider.Anthropic',
  mistral: 'io.kestra.plugin.ai.provider.MistralAI',
  openrouter: 'io.kestra.plugin.ai.provider.OpenRouter',
};

const TOOL_IDS = ['web_search', 'flow_call', 'task_run', 'crm_lookup'];

function normalizeLabels(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...DEFAULT_CONFIG.executionLabels };
  }

  return Object.entries(value).reduce((acc, [key, item]) => {
    if (key && item !== undefined && item !== null && String(item).trim()) {
      acc[key] = String(item).trim();
    }
    return acc;
  }, {});
}

function normalizeTools(value) {
  if (!Array.isArray(value)) {
    return [...DEFAULT_CONFIG.tools];
  }

  const unique = Array.from(new Set(value.filter((tool) => TOOL_IDS.includes(tool))));
  return unique.length > 0 ? unique : [...DEFAULT_CONFIG.tools];
}

function normalizeConfig(payload = {}) {
  const provider = Object.prototype.hasOwnProperty.call(PROVIDER_TYPE_MAP, payload.provider)
    ? payload.provider
    : DEFAULT_CONFIG.provider;

  return {
    enabled: payload.enabled !== undefined ? Boolean(payload.enabled) : DEFAULT_CONFIG.enabled,
    agentName: payload.agentName?.trim() || DEFAULT_CONFIG.agentName,
    namespace: payload.namespace?.trim() || DEFAULT_CONFIG.namespace,
    flowId: payload.flowId?.trim() || DEFAULT_CONFIG.flowId,
    whatsappInstance: payload.whatsappInstance?.trim() || '',
    webhookPath: payload.webhookPath?.trim() || DEFAULT_CONFIG.webhookPath,
    provider,
    providerApiKey: payload.providerApiKey?.trim() || '',
    model: payload.model?.trim() || DEFAULT_CONFIG.model,
    temperature: Number.isFinite(Number(payload.temperature)) ? Number(payload.temperature) : DEFAULT_CONFIG.temperature,
    maxTokens: Number.isFinite(Number(payload.maxTokens)) ? Number(payload.maxTokens) : DEFAULT_CONFIG.maxTokens,
    maxSequentialToolsInvocations: Number.isFinite(Number(payload.maxSequentialToolsInvocations))
      ? Number(payload.maxSequentialToolsInvocations)
      : DEFAULT_CONFIG.maxSequentialToolsInvocations,
    memoryEnabled: payload.memoryEnabled !== undefined ? Boolean(payload.memoryEnabled) : DEFAULT_CONFIG.memoryEnabled,
    memoryKey: payload.memoryKey?.trim() || DEFAULT_CONFIG.memoryKey,
    welcomeMessage: payload.welcomeMessage?.trim() || DEFAULT_CONFIG.welcomeMessage,
    systemPrompt: payload.systemPrompt?.trim() || DEFAULT_CONFIG.systemPrompt,
    executionLabels: normalizeLabels(payload.executionLabels),
    handoffInstructions: payload.handoffInstructions?.trim() || DEFAULT_CONFIG.handoffInstructions,
    safetyNotes: payload.safetyNotes?.trim() || DEFAULT_CONFIG.safetyNotes,
    tools: normalizeTools(payload.tools),
    lastPublishedAt: payload.lastPublishedAt || null,
    lastPublishedFlowRevision: payload.lastPublishedFlowRevision ?? null,
    lastPublishedBy: payload.lastPublishedBy || null,
  };
}

function toRow(tenantId, config, userId = null) {
  return {
    tenant_id: tenantId,
    enabled: config.enabled,
    agent_name: config.agentName,
    namespace: config.namespace,
    flow_id: config.flowId,
    whatsapp_instance: config.whatsappInstance || null,
    webhook_path: config.webhookPath,
    provider: config.provider,
    provider_api_key: config.providerApiKey || null,
    model: config.model,
    temperature: config.temperature,
    max_tokens: config.maxTokens,
    max_sequential_tools_invocations: config.maxSequentialToolsInvocations,
    memory_enabled: config.memoryEnabled,
    memory_key: config.memoryKey,
    welcome_message: config.welcomeMessage,
    system_prompt: config.systemPrompt,
    execution_labels: config.executionLabels,
    handoff_instructions: config.handoffInstructions,
    safety_notes: config.safetyNotes,
    tools: config.tools,
    ...(userId ? { last_published_by: userId } : {}),
  };
}

function fromRow(row, tenant = null) {
  if (!row) {
    return null;
  }

  return normalizeConfig({
    enabled: row.enabled,
    agentName: row.agent_name,
    namespace: row.namespace,
    flowId: row.flow_id,
    whatsappInstance: row.whatsapp_instance,
    webhookPath: row.webhook_path,
    provider: row.provider,
    providerApiKey: row.provider_api_key,
    model: row.model,
    temperature: row.temperature,
    maxTokens: row.max_tokens,
    maxSequentialToolsInvocations: row.max_sequential_tools_invocations,
    memoryEnabled: row.memory_enabled,
    memoryKey: row.memory_key,
    welcomeMessage: row.welcome_message,
    systemPrompt: row.system_prompt,
    executionLabels: row.execution_labels,
    handoffInstructions: row.handoff_instructions,
    safetyNotes: row.safety_notes,
    tools: row.tools,
    lastPublishedAt: row.last_published_at,
    lastPublishedFlowRevision: row.last_published_flow_revision,
    lastPublishedBy: row.last_published_by,
    tenant,
  });
}

function buildExecutionPayload(config, tenant) {
  return {
    wait: false,
    inputs: {
      tenantId: tenant.id,
      phone: '{{incoming_phone}}',
      incomingMessage: '{{incoming_message}}',
    },
    labels: {
      tenant: tenant.name,
      tenantSlug: tenant.slug,
      whatsappInstance: config.whatsappInstance || 'not-configured',
      agentEnabled: String(config.enabled),
      ...config.executionLabels,
    },
  };
}

function buildWebhookTriggerKey(config, tenant) {
  const raw = `${tenant.slug}-${config.flowId}`;
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

function buildKestraFlowYaml(config, tenant) {
  const providerType = PROVIDER_TYPE_MAP[config.provider] || PROVIDER_TYPE_MAP.openai;
  const apiKeyLine = config.providerApiKey
    ? `      apiKey: "${config.providerApiKey}"`
    : `      apiKey: "{{ kv('openai_api_key') }}"`;

  return `id: ${config.flowId}
namespace: ${config.namespace}

description: |
  Agente SDR conversacional. Conversa com o lead enquanto ele estiver nas
  primeiras pipelines. Quando qualifica, move o lead, registra mensagens
  no inbox e gera nota interna com resumo para o closer.

inputs:
  - id: tenantId
    type: STRING
    required: true
  - id: leadId
    type: STRING
    required: true
  - id: phone
    type: STRING
    required: true
  - id: incomingMessage
    type: STRING
    required: true
  - id: currentStageId
    type: STRING
    required: true
  - id: currentStageName
    type: STRING
    required: true
    defaults: ""
  - id: nextStageId
    type: STRING
    required: true
    defaults: ""
  - id: nextStageName
    type: STRING
    required: true
    defaults: ""

tasks:
  - id: tenant_agent
    type: io.kestra.plugin.ai.agent.AIAgent
    systemMessage: |
      ${config.systemPrompt.split('\n').join('\n      ')}

      COMO MARCAR A QUALIFICAÇÃO:
      - Quando decidir qualificar, INCLUA no FINAL da sua resposta a marca
        [MOVE_NEXT] em uma linha separada. Essa marca será removida antes do
        envio ao usuário, mas dispara automaticamente a transição de pipeline.

      Handoff:
      ${config.handoffInstructions.split('\n').join('\n      ')}

      Segurança:
      ${config.safetyNotes.split('\n').join('\n      ')}
    prompt: |
      Tenant: {{ inputs.tenantId }}
      Lead: {{ inputs.leadId }}
      Telefone: {{ inputs.phone }}
      Pipeline atual: {{ inputs.currentStageName }}
      Próxima pipeline (ao qualificar): {{ inputs.nextStageName }}

      Mensagem recebida do lead:
      {{ inputs.incomingMessage }}
    provider:
      type: ${providerType}
${apiKeyLine}
      modelName: "${config.model}"
    configuration:
      temperature: ${config.temperature}
      maxToken: ${config.maxTokens}
    maxSequentialToolsInvocations: ${config.maxSequentialToolsInvocations}
    tools: []
    memory:
      type: io.kestra.plugin.ai.memory.KestraKVStore
      messages: "30"
      ttl: "PT1H"
      memoryId: "{{ inputs.leadId }}"
      drop: "NEVER"

  - id: fetch_instance
    type: io.kestra.plugin.core.http.Request
    uri: "https://cfzkvgazkurcknkmpknz.supabase.co/rest/v1/whatsapp_instances?tenant_id=eq.{{ inputs.tenantId }}&status=eq.connected&select=instance_name&limit=1"
    headers: '{"Accept":"application/json","apikey":"{{ kv('"'"'supabase_service_role_key'"'"') }}","Authorization":"Bearer {{ kv('"'"'supabase_service_role_key'"'"') }}"}'
    options:
      followRedirects: "true"

  - id: send_whatsapp
    type: io.kestra.plugin.core.http.Request
    allowFailure: true
    runIf: "{{ (fromJson(outputs.fetch_instance.body) | length) > 0 }}"
    uri: "https://evolution.aulan8ntech.shop/message/sendText/{{ fromJson(outputs.fetch_instance.body)[0].instance_name }}"
    method: POST
    body: |
      {
        "number": "{{ inputs.phone }}",
        "text": {{ outputs.tenant_agent.textOutput | replace({'[MOVE_NEXT]': ''}) | trim | json }},
        "delay": 1000,
        "linkPreview": false
      }
    headers: '{"apikey":"{{ kv('"'"'evolution_api_key'"'"') }}"}'
    options:
      followRedirects: "true"

  - id: record_agent_message
    type: io.kestra.plugin.core.http.Request
    description: "Registra a mensagem do agente no message_log para aparecer no inbox"
    uri: "https://cfzkvgazkurcknkmpknz.supabase.co/rest/v1/message_log"
    method: POST
    body: |
      {
        "lead_id": "{{ inputs.leadId }}",
        "direction": "outgoing",
        "message_type": "text",
        "content": {{ outputs.tenant_agent.textOutput | replace({'[MOVE_NEXT]': ''}) | trim | json }},
        "status": "sent"
      }
    headers: '{"Prefer":"return=minimal","Content-Type":"application/json","apikey":"{{ kv('"'"'supabase_service_role_key'"'"') }}","Authorization":"Bearer {{ kv('"'"'supabase_service_role_key'"'"') }}"}'
    options:
      followRedirects: "true"

  - id: move_pipeline
    type: io.kestra.plugin.core.http.Request
    runIf: "{{ outputs.tenant_agent.textOutput contains '[MOVE_NEXT]' and inputs.nextStageId != '' }}"
    uri: "https://cfzkvgazkurcknkmpknz.supabase.co/rest/v1/leads?id=eq.{{ inputs.leadId }}"
    method: PATCH
    body: |
      {"current_stage_id": "{{ inputs.nextStageId }}"}
    headers: '{"Prefer":"return=minimal","apikey":"{{ kv('"'"'supabase_service_role_key'"'"') }}","Authorization":"Bearer {{ kv('"'"'supabase_service_role_key'"'"') }}"}'
    options:
      followRedirects: "true"

  - id: record_stage_history
    type: io.kestra.plugin.core.http.Request
    runIf: "{{ outputs.tenant_agent.textOutput contains '[MOVE_NEXT]' and inputs.nextStageId != '' }}"
    uri: "https://cfzkvgazkurcknkmpknz.supabase.co/rest/v1/lead_stage_history"
    method: POST
    body: |
      {
        "lead_id": "{{ inputs.leadId }}",
        "from_stage_id": "{{ inputs.currentStageId }}",
        "to_stage_id": "{{ inputs.nextStageId }}"
      }
    headers: '{"Prefer":"return=minimal","Content-Type":"application/json","apikey":"{{ kv('"'"'supabase_service_role_key'"'"') }}","Authorization":"Bearer {{ kv('"'"'supabase_service_role_key'"'"') }}"}'
    options:
      followRedirects: "true"

  - id: generate_summary
    type: io.kestra.plugin.ai.agent.AIAgent
    runIf: "{{ outputs.tenant_agent.textOutput contains '[MOVE_NEXT]' and inputs.nextStageId != '' }}"
    systemMessage: |
      Você é um assistente que gera resumos concisos de conversas comerciais.
      Gere um resumo em português do Brasil com no máximo 5 linhas contendo:
      - O interesse principal do lead
      - Informações relevantes coletadas (nome, empresa, necessidade)
      - Motivo da qualificação
      - Qualquer objeção ou ponto de atenção mencionado
      Seja direto e objetivo. O closer precisa entender rapidamente o contexto.
    prompt: |
      Gere um resumo da conversa com este lead para o closer que vai assumir:

      Telefone: {{ inputs.phone }}
      Pipeline anterior: {{ inputs.currentStageName }}
      Pipeline destino: {{ inputs.nextStageName }}
      Última mensagem do lead: {{ inputs.incomingMessage }}
      Resposta do agente: {{ outputs.tenant_agent.textOutput | replace({'[MOVE_NEXT]': ''}) | trim }}
    provider:
      type: io.kestra.plugin.ai.provider.OpenAI
      modelName: "gpt-4.1-mini"
      baseUrl: "https://api.openai.com/v1"
      apiKey: "{{ kv('openai_api_key') }}"
    configuration:
      temperature: "0.3"
      maxToken: "400"
    tools: []

  - id: record_internal_note
    type: io.kestra.plugin.core.http.Request
    runIf: "{{ outputs.tenant_agent.textOutput contains '[MOVE_NEXT]' and inputs.nextStageId != '' }}"
    uri: "https://cfzkvgazkurcknkmpknz.supabase.co/rest/v1/message_log"
    method: POST
    body: |
      {
        "lead_id": "{{ inputs.leadId }}",
        "direction": "internal",
        "message_type": "text",
        "content": {{ outputs.generate_summary.textOutput | json }},
        "status": "delivered"
      }
    headers: '{"Prefer":"return=minimal","Content-Type":"application/json","apikey":"{{ kv('"'"'supabase_service_role_key'"'"') }}","Authorization":"Bearer {{ kv('"'"'supabase_service_role_key'"'"') }}"}'
    options:
      followRedirects: "true"`;
}

module.exports = {
  DEFAULT_CONFIG,
  normalizeConfig,
  toRow,
  fromRow,
  buildExecutionPayload,
  buildKestraFlowYaml,
};
