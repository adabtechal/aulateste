import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bot, BrainCircuit, CheckCircle2, Cpu, Database, MessageSquareShare, Network, Save, Send, ShieldAlert, Sparkles, Webhook, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import * as api from '../services/api';

const toolOptions = [
  { id: 'web_search', label: 'Web Search', description: 'Busca contexto externo quando o fluxo precisar enriquecer a resposta.' },
  { id: 'flow_call', label: 'Flow Call', description: 'Permite acionar outros flows do Kestra como ferramentas.' },
  { id: 'task_run', label: 'Task Run', description: 'Expõe tasks declarativas do Kestra como ações reutilizáveis.' },
  { id: 'crm_lookup', label: 'CRM Lookup', description: 'Consulta lead, estágio e histórico antes de responder.' },
];

const providerOptions = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'mistral', label: 'Mistral' },
  { value: 'openrouter', label: 'OpenRouter' },
];

const modelSuggestions = {
  openai: 'gpt-4.1-mini',
  anthropic: 'claude-3-7-sonnet-latest',
  mistral: 'mistral-large-latest',
  openrouter: 'openai/gpt-4.1-mini',
};

const initialConfig = {
  enabled: true,
  agentName: 'Atendimento WhatsApp',
  namespace: 'company.bot',
  flowId: 'tenant-conversation-agent',
  whatsappInstance: '',
  webhookPath: '/api/webhook/messages',
  provider: 'openai',
  providerApiKey: '',
  model: modelSuggestions.openai,
  temperature: 0.3,
  maxTokens: 900,
  maxSequentialToolsInvocations: 6,
  memoryEnabled: true,
  memoryKey: 'lead_phone',
  welcomeMessage: 'Olá! Sou o assistente virtual da operação. Posso ajudar com dúvidas, qualificação e próximos passos.',
  systemPrompt: 'Você é o agente conversacional oficial desta tenant. Responda em português do Brasil, com contexto comercial, use o histórico do lead quando disponível e nunca invente status, preços ou promessas. Quando faltar contexto, peça confirmação antes de agir.',
  executionLabels: { channel: 'whatsapp', source: 'leadtrack' },
  handoffInstructions: 'Quando a conversa indicar urgência comercial, objeção sensível ou pedido humano explícito, encaminhe para a equipe e registre resumo do contexto.',
  safetyNotes: 'Não compartilhar dados internos, não confirmar pagamentos sem evidência e não enviar arquivos não solicitados.',
  tools: ['web_search', 'flow_call', 'task_run', 'crm_lookup'],
  lastPublishedAt: null,
  lastPublishedFlowRevision: null,
  lastPublishedBy: null,
};

function labelsToString(labels = {}) {
  return Object.entries(labels).filter(([key, value]) => key && value !== undefined && value !== null && String(value).trim()).map(([key, value]) => `${key}:${String(value).trim()}`).join(',');
}

function stringToLabels(value) {
  return value.split(',').map((item) => item.trim()).filter(Boolean).map((item) => item.split(':')).filter(([key, labelValue]) => key && labelValue).reduce((acc, [key, labelValue]) => ({ ...acc, [key.trim()]: labelValue.trim() }), {});
}

function toFormConfig(config) {
  return {
    ...initialConfig,
    ...config,
    executionLabelsInput: labelsToString(config?.executionLabels || initialConfig.executionLabels),
    tools: Array.isArray(config?.tools) && config.tools.length > 0 ? config.tools : initialConfig.tools,
  };
}

function toApiConfig(config) {
  return {
    enabled: config.enabled,
    agentName: config.agentName,
    namespace: config.namespace,
    flowId: config.flowId,
    whatsappInstance: config.whatsappInstance,
    webhookPath: config.webhookPath,
    provider: config.provider,
    providerApiKey: config.providerApiKey,
    model: config.model,
    temperature: Number(config.temperature),
    maxTokens: Number(config.maxTokens),
    maxSequentialToolsInvocations: Number(config.maxSequentialToolsInvocations),
    memoryEnabled: config.memoryEnabled,
    memoryKey: config.memoryKey,
    welcomeMessage: config.welcomeMessage,
    systemPrompt: config.systemPrompt,
    executionLabels: stringToLabels(config.executionLabelsInput || ''),
    handoffInstructions: config.handoffInstructions,
    safetyNotes: config.safetyNotes,
    tools: config.tools,
  };
}

export default function BotConfigPage() {
  const queryClient = useQueryClient();
  const { profile, loading: authLoading, isSuperAdmin, isTenantAdmin } = useAuth();
  const canManage = isSuperAdmin || isTenantAdmin;
  const { data: tenants = [], error: tenantsError, isLoading: tenantsLoading } = useQuery({ queryKey: ['user-tenants'], queryFn: api.getUserTenants, enabled: canManage, retry: false });

  const defaultTenantId = isSuperAdmin ? tenants[0]?.id || '' : profile?.tenant_id || profile?.tenant?.id || '';
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [config, setConfig] = useState({ ...toFormConfig(initialConfig), executionLabelsInput: labelsToString(initialConfig.executionLabels) });

  useEffect(() => {
    if (defaultTenantId && !selectedTenantId) setSelectedTenantId(defaultTenantId);
  }, [defaultTenantId, selectedTenantId]);

  const activeTenantId = isSuperAdmin ? selectedTenantId : defaultTenantId;
  const activeTenant = useMemo(() => {
    if (!activeTenantId) return profile?.tenant || null;
    return tenants.find((tenant) => tenant.id === activeTenantId) || profile?.tenant || null;
  }, [activeTenantId, profile?.tenant, tenants]);

  const { data: instances = [] } = useQuery({
    queryKey: ['whatsapp-instances', activeTenantId],
    queryFn: () => api.getInstances(activeTenantId),
    enabled: canManage && Boolean(activeTenantId),
  });

  const { data: kestraHealth, isLoading: kestraLoading, error: kestraError, refetch: refetchKestraHealth } = useQuery({
    queryKey: ['kestra-health'],
    queryFn: api.getKestraHealth,
    enabled: canManage,
    retry: false,
  });

  const botConfigQuery = useQuery({
    queryKey: ['bot-config', activeTenantId],
    queryFn: () => api.getBotConfig(activeTenantId),
    enabled: canManage && Boolean(activeTenantId),
    retry: false,
  });

  useEffect(() => {
    if (botConfigQuery.data?.config) setConfig(toFormConfig(botConfigQuery.data.config));
  }, [botConfigQuery.data]);

  const enabledTools = useMemo(() => toolOptions.filter((tool) => config.tools?.includes(tool.id)).length, [config.tools]);

  const saveMutation = useMutation({
    mutationFn: () => api.saveBotConfig(activeTenantId, toApiConfig(config)),
    onSuccess: (data) => {
      queryClient.setQueryData(['bot-config', activeTenantId], data);
      setConfig(toFormConfig(data.config));
      toast.success('Configuração salva');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Não foi possível salvar a configuração'),
  });

  const publishMutation = useMutation({
    mutationFn: () => api.publishBotConfig(activeTenantId, toApiConfig(config)),
    onSuccess: (data) => {
      queryClient.setQueryData(['bot-config', activeTenantId], data);
      setConfig(toFormConfig(data.config));
      toast.success('Flow publicado no Kestra');
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Não foi possível publicar o flow no Kestra'),
  });

  async function copyText(value, successMessage) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(successMessage);
    } catch {
      toast.error('Não foi possível copiar para a área de transferência');
    }
  }

  function updateField(field, value) {
    setConfig((current) => ({ ...current, [field]: value }));
  }

  function handleProviderChange(provider) {
    setConfig((current) => ({ ...current, provider, model: modelSuggestions[provider] }));
  }

  function toggleTool(toolId) {
    setConfig((current) => {
      const currentTools = Array.isArray(current.tools) ? current.tools : [];
      const tools = currentTools.includes(toolId) ? currentTools.filter((item) => item !== toolId) : [...currentTools, toolId];
      return { ...current, tools };
    });
  }

  if (authLoading) return <StateCard title="Carregando perfil..." />;
  if (!canManage) return <StateCard title="Acesso restrito" description="A configuração do agente por tenant fica disponível apenas para perfis administrativos." icon={ShieldAlert} tone="warning" footer={`Debug: role atual = ${profile?.role || 'null'}`} />;
  if (tenantsError) return <StateCard title="Erro ao carregar tenants" description={tenantsError.response?.data?.message || tenantsError.message} tone="danger" footer="Verifique se o backend está rodando em http://localhost:3001 e se você está autenticado." />;
  if (tenantsLoading) return <StateCard title="Carregando tenants..." />;
  if (isSuperAdmin && tenants.length === 0) return <StateCard title="Nenhuma tenant cadastrada" description="Crie uma tenant antes de configurar o agente. Você pode criar pela página de Usuários adicionando um tenant_admin." tone="warning" />;

  if (!activeTenantId) {
    return (
      <StateCard title="Selecione uma tenant" description={isSuperAdmin ? 'Um superadmin precisa escolher a tenant alvo antes de salvar ou publicar o agente.' : 'Seu perfil não está vinculado a uma tenant. Contate o administrador.'} tone="warning">
        {isSuperAdmin && tenants.length > 0 && (
          <div className="mt-5">
            <Field label="Tenant" as="select" value={selectedTenantId} onChange={setSelectedTenantId}>
              <option value="">Selecione uma tenant</option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>{tenant.name} ({tenant.slug})</option>
              ))}
            </Field>
          </div>
        )}
      </StateCard>
    );
  }

  const flowYaml = botConfigQuery.data?.generated?.flowYaml || '';
  const executionPayload = botConfigQuery.data?.generated?.executionPayload || {};
  const lastPublishedAt = botConfigQuery.data?.config?.lastPublishedAt || config.lastPublishedAt;
  const lastPublishedRevision = botConfigQuery.data?.config?.lastPublishedFlowRevision || config.lastPublishedFlowRevision;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.16),_transparent_28%),linear-gradient(180deg,_#f8fbff_0%,_#eef4ff_52%,_#f6f8fc_100%)] px-4 py-5 lg:px-6">
      <div className="mx-auto max-w-[1440px] space-y-6">
        <section className="overflow-hidden rounded-[32px] border border-slate-900/5 bg-slate-950 text-white shadow-[0_24px_80px_rgba(15,23,42,0.18)]">
          <div className="grid gap-6 px-5 py-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)] lg:px-8 lg:py-8">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-sky-100">
                <Bot size={12} />
                Kestra Agent Control
              </div>
              <h1 className="mt-4 max-w-4xl text-2xl font-semibold leading-tight lg:text-4xl">Central de configuração do agente conversacional por tenant.</h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300 lg:text-base">
                Ajuste identidade, modelo, mensagens e publicação do flow com um layout mais limpo, sem cards comprimidos e sem blocos difíceis de ler.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                <HeroBadge label="Tenant ativa" value={activeTenant?.name || 'Não selecionada'} />
                <HeroBadge label="Namespace" value={config.namespace} />
                <HeroBadge label="Flow ID" value={config.flowId} />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
              <MetricCard icon={Network} label="Kestra" value={kestraLoading ? 'Verificando' : kestraHealth?.connected ? `Online (${kestraHealth.tenant})` : 'Offline'} accent={kestraHealth?.connected ? 'emerald' : 'rose'} />
              <MetricCard icon={MessageSquareShare} label="Instâncias WhatsApp" value={String(instances.length)} accent="sky" />
              <MetricCard icon={BrainCircuit} label="Ferramentas marcadas" value={String(enabledTools)} accent="slate" />
            </div>
          </div>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(360px,420px)]">
          <section className="min-w-0 space-y-6">
            <Panel eyebrow="Estrutura" title="Canal, namespace e vínculo operacional" icon={Cpu}>
              <div className="grid gap-4 lg:grid-cols-2">
                {isSuperAdmin && (
                  <Field label="Tenant alvo" as="select" value={selectedTenantId} onChange={setSelectedTenantId} description="Selecione a tenant que receberá esta configuração.">
                    <option value="">Selecione uma tenant</option>
                    {tenants.map((tenant) => (
                      <option key={tenant.id} value={tenant.id}>{tenant.name} ({tenant.slug})</option>
                    ))}
                  </Field>
                )}
                <Field label="Nome do agente" value={config.agentName} onChange={(value) => updateField('agentName', value)} description="Nome de apresentação da operação." />
                <Field label="Instância WhatsApp" as="select" value={config.whatsappInstance} onChange={(value) => updateField('whatsappInstance', value)} description="Instância vinculada para entrada e saída da conversa.">
                  <option value="">Selecione uma instância</option>
                  {instances.map((instance) => (
                    <option key={instance.id} value={instance.instance_name}>{instance.instance_name}</option>
                  ))}
                </Field>
                <Field label="Namespace Kestra" value={config.namespace} onChange={(value) => updateField('namespace', value)} description="Agrupa os flows dentro da instância do Kestra." />
                <Field label="Flow ID" value={config.flowId} onChange={(value) => updateField('flowId', value)} description="Identificador do flow publicado." />
                <Field label="Webhook interno" value={config.webhookPath} onChange={(value) => updateField('webhookPath', value)} description="Rota do backend que recebe os eventos da operação." />
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
                <InfoCallout title="Fluxo da operação" description="O backend salva em tenant_bot_configs, gera o YAML e publica no Kestra. Este campo de webhook continua descrevendo a rota interna do sistema." />
                <ToggleField label="Agente habilitado" description="Controla se a tenant deve disparar o agente conversacional." checked={config.enabled} onChange={(value) => updateField('enabled', value)} />
              </div>
            </Panel>

            <Panel eyebrow="Modelo" title="Provider, limites e comportamento de execução" icon={Sparkles}>
              <div className="grid gap-4 lg:grid-cols-2">
                <Field label="Provider" as="select" value={config.provider} onChange={handleProviderChange} description="Fornecedor do modelo usado pelo agent.">
                  {providerOptions.map((provider) => (
                    <option key={provider.value} value={provider.value}>{provider.label}</option>
                  ))}
                </Field>
                <Field label="API key do provider" type="password" value={config.providerApiKey} onChange={(value) => updateField('providerApiKey', value)} description="Chave usada pelo plugin do Kestra para autenticar no provider selecionado." />
                <Field label="Model" value={config.model} onChange={(value) => updateField('model', value)} description="Modelo exato enviado no blueprint do Kestra." />
                <Field label="Temperature" type="number" step="0.1" min="0" max="2" value={config.temperature} onChange={(value) => updateField('temperature', value)} description="Mais baixo para previsibilidade, mais alto para variação." />
                <Field label="Max tokens" type="number" min="100" value={config.maxTokens} onChange={(value) => updateField('maxTokens', value)} description="Limite de saída do provider." />
                <Field label="Chamadas de tool sequenciais" type="number" min="1" value={config.maxSequentialToolsInvocations} onChange={(value) => updateField('maxSequentialToolsInvocations', value)} description="Mantém o agent sob controle operacional." />
                <ToggleField label="Memória habilitada" description="A intenção continua salva na configuração da tenant." checked={config.memoryEnabled} onChange={(value) => updateField('memoryEnabled', value)} />
              </div>
            </Panel>

            <Panel eyebrow="Conteúdo" title="Prompting e tom de atendimento" icon={BrainCircuit}>
              <div className="grid gap-4">
                <Field label="Mensagem inicial" as="textarea" rows={4} value={config.welcomeMessage} onChange={(value) => updateField('welcomeMessage', value)} description="Mensagem sugerida para abertura de conversa." />
                <Field label="System prompt" as="textarea" rows={8} value={config.systemPrompt} onChange={(value) => updateField('systemPrompt', value)} description="Instruções centrais do comportamento do agente." />
                <div className="grid gap-4 lg:grid-cols-2">
                  <Field label="Instruções de handoff" as="textarea" rows={5} value={config.handoffInstructions} onChange={(value) => updateField('handoffInstructions', value)} description="Quando escalar para humano ou operação comercial." />
                  <Field label="Notas de segurança" as="textarea" rows={5} value={config.safetyNotes} onChange={(value) => updateField('safetyNotes', value)} description="Guardrails para evitar respostas indevidas." />
                </div>
              </div>
            </Panel>

            <Panel eyebrow="Ferramentas" title="Ferramentas e labels de execução" icon={Database}>
              <div className="grid gap-3 lg:grid-cols-2">
                {toolOptions.map((tool) => {
                  const enabled = config.tools?.includes(tool.id);
                  return (
                    <button key={tool.id} type="button" onClick={() => toggleTool(tool.id)} className={`rounded-[20px] border p-4 text-left transition ${enabled ? 'border-sky-200 bg-sky-50 shadow-[0_12px_30px_rgba(14,165,233,0.10)]' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 rounded-xl p-2 ${enabled ? 'bg-sky-100 text-sky-700' : 'bg-slate-100 text-slate-500'}`}>
                          {enabled ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900">{tool.label}</p>
                          <p className="mt-1 text-sm leading-6 text-slate-600">{tool.description}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <Field label="Chave de memória" value={config.memoryKey} onChange={(value) => updateField('memoryKey', value)} description="Identificador lógico da conversa persistida." />
                <Field label="Labels de execução" value={config.executionLabelsInput || ''} onChange={(value) => updateField('executionLabelsInput', value)} placeholder="channel:whatsapp,source:leadtrack" description="Labels enviadas junto da execução do flow." />
              </div>
            </Panel>
          </section>

          <aside className="min-w-0 space-y-6 xl:sticky xl:top-6 xl:self-start">
            <Panel eyebrow="Status" title="Saúde da integração" icon={Webhook}>
              <div className="space-y-3">
                <StatusRow label="Kestra API" value={kestraLoading ? 'Verificando' : kestraHealth?.connected ? `Conectado em ${kestraHealth.baseURL}` : 'Sem resposta válida'} tone={kestraHealth?.connected ? 'success' : 'danger'} />
                <StatusRow label="Tenant atual" value={activeTenant?.name || 'Não selecionada'} />
                <StatusRow label="Namespace / Flow" value={`${config.namespace} / ${config.flowId}`} />
                <StatusRow label="Última publicação" value={lastPublishedAt ? `${new Date(lastPublishedAt).toLocaleString('pt-BR')}${lastPublishedRevision ? ` · rev ${lastPublishedRevision}` : ''}` : 'Ainda não publicado'} />
              </div>
              <button type="button" onClick={() => refetchKestraHealth()} className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-white">
                Revalidar conexão
              </button>
              {kestraError?.response?.data?.message && <div className="mt-4 rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">{kestraError.response.data.message}</div>}
            </Panel>

            <Panel eyebrow="Resumo" title="Snapshot operacional" icon={Cpu}>
              <div className="grid gap-3">
                <SummaryChip label="Agente" value={config.agentName} />
                <SummaryChip label="Instância" value={config.whatsappInstance || 'Não vinculada'} />
                <SummaryChip label="Provider" value={`${config.provider} · ${config.model}`} />
                <SummaryChip label="API key" value={config.providerApiKey ? 'Configurada' : 'Não informada'} />
                <SummaryChip label="Memória" value={config.memoryEnabled ? `Ativa (${config.memoryKey})` : 'Desabilitada'} />
              </div>
            </Panel>

            <Panel eyebrow="Blueprint" title="Flow YAML gerado" icon={BrainCircuit}>
              <CodeBlock value={flowYaml || 'Salve a configuração para gerar o blueprint.'} onCopy={() => copyText(flowYaml, 'YAML copiado')} />
            </Panel>

            <Panel eyebrow="Execução" title="Payload sugerido" icon={Network}>
              <CodeBlock value={JSON.stringify(executionPayload, null, 2)} onCopy={() => copyText(JSON.stringify(executionPayload, null, 2), 'Payload copiado')} />
            </Panel>

            <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-4 shadow-[0_18px_60px_rgba(148,163,184,0.12)] backdrop-blur">
              <div className="mb-4 flex items-center gap-3">
                <div className="rounded-2xl bg-slate-950 p-2 text-white"><Send size={16} /></div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Publicação</p>
                  <p className="text-sm text-slate-700">Salve primeiro se quiser persistir sem publicar.</p>
                </div>
              </div>
              <div className="grid gap-3">
                <button type="button" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || publishMutation.isPending || botConfigQuery.isLoading} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
                  <Save size={16} />
                  {saveMutation.isPending ? 'Salvando...' : 'Salvar configuração'}
                </button>
                <button type="button" onClick={() => publishMutation.mutate()} disabled={publishMutation.isPending || saveMutation.isPending || botConfigQuery.isLoading} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-3 text-sm font-medium text-sky-800 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60">
                  <Send size={16} />
                  {publishMutation.isPending ? 'Publicando...' : 'Salvar e publicar no Kestra'}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function StateCard({ title, description, footer, icon: Icon = ShieldAlert, tone = 'neutral', children }) {
  const toneClasses = {
    neutral: 'border-slate-200 bg-white text-slate-900',
    warning: 'border-amber-200 bg-gradient-to-br from-amber-50 via-white to-orange-50 text-slate-900',
    danger: 'border-rose-200 bg-rose-50 text-rose-950',
  };
  const iconClasses = {
    neutral: 'bg-slate-100 text-slate-600',
    warning: 'bg-amber-100 text-amber-700',
    danger: 'bg-rose-100 text-rose-700',
  };

  return (
    <div className="min-h-screen px-4 py-6 lg:px-6">
      <div className={`mx-auto max-w-3xl rounded-[28px] border p-8 shadow-sm ${toneClasses[tone]}`}>
        <div className={`mb-6 inline-flex rounded-full p-3 ${iconClasses[tone]}`}><Icon size={22} /></div>
        <h2 className="text-2xl font-semibold">{title}</h2>
        {description && <p className="mt-3 text-sm leading-6 opacity-80">{description}</p>}
        {footer && <p className="mt-2 text-xs opacity-60">{footer}</p>}
        {children}
      </div>
    </div>
  );
}

function Panel({ eyebrow, title, icon: Icon, children }) {
  return (
    <section className="min-w-0 rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_18px_60px_rgba(148,163,184,0.16)] backdrop-blur lg:p-6">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700">{eyebrow}</p>
          <h2 className="mt-2 text-xl font-semibold leading-tight text-slate-950">{title}</h2>
        </div>
        <div className="shrink-0 rounded-2xl bg-sky-100 p-3 text-sky-700"><Icon size={18} /></div>
      </div>
      {children}
    </section>
  );
}

function HeroBadge({ label, value }) {
  return <div className="rounded-full border border-white/10 bg-white/5 px-4 py-2"><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p><p className="mt-1 text-sm font-medium text-white">{value}</p></div>;
}

function MetricCard({ icon: Icon, label, value, accent }) {
  const accentClasses = {
    emerald: 'bg-emerald-500/15 text-emerald-200',
    rose: 'bg-rose-500/15 text-rose-200',
    sky: 'bg-sky-500/15 text-sky-200',
    slate: 'bg-white/10 text-slate-100',
  };
  return (
    <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
      <div className={`inline-flex rounded-2xl p-2 ${accentClasses[accent] || accentClasses.slate}`}><Icon size={16} /></div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function Field({ label, as = 'input', children, onChange, description, ...props }) {
  const baseClassName = 'w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-400 focus:bg-white';
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-slate-800">{label}</label>
      {as === 'textarea' ? <textarea {...props} onChange={(event) => onChange(event.target.value)} className={`${baseClassName} min-h-[128px] resize-y`} /> : as === 'select' ? <select {...props} onChange={(event) => onChange(event.target.value)} className={baseClassName}>{children}</select> : <input {...props} onChange={(event) => onChange(event.target.value)} className={baseClassName} />}
      {description && <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>}
    </div>
  );
}

function ToggleField({ label, description, checked, onChange }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className={`flex min-h-full flex-col items-start justify-between rounded-[24px] border p-4 text-left transition ${checked ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
      <div className="flex w-full items-center justify-between gap-3">
        <p className="text-sm font-semibold text-slate-900">{label}</p>
        {checked ? <CheckCircle2 className="text-emerald-600" size={18} /> : <XCircle className="text-slate-300" size={18} />}
      </div>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </button>
  );
}

function InfoCallout({ title, description }) {
  return <div className="rounded-[24px] border border-amber-100 bg-amber-50/80 px-4 py-4"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">{title}</p><p className="mt-2 text-sm leading-6 text-amber-950">{description}</p></div>;
}

function StatusRow({ label, value, tone = 'neutral' }) {
  const toneClasses = {
    success: 'border-emerald-100 bg-emerald-50 text-emerald-800',
    danger: 'border-rose-100 bg-rose-50 text-rose-800',
    neutral: 'border-slate-200 bg-slate-50 text-slate-700',
  };
  return <div className={`rounded-2xl border px-4 py-3 ${toneClasses[tone] || toneClasses.neutral}`}><p className="text-[11px] font-semibold uppercase tracking-[0.18em] opacity-70">{label}</p><p className="mt-1 text-sm leading-6">{value}</p></div>;
}

function SummaryChip({ label, value }) {
  return <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"><p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</p><p className="mt-1 text-sm font-medium text-slate-900">{value}</p></div>;
}

function CodeBlock({ value, onCopy }) {
  return (
    <div className="min-w-0 overflow-hidden rounded-[22px] border border-slate-200 bg-slate-950">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-400">Preview</p>
        <button type="button" onClick={onCopy} className="rounded-xl border border-white/10 px-3 py-1.5 text-[11px] font-medium text-slate-200 transition hover:border-white/20 hover:bg-white/5">Copiar</button>
      </div>
      <pre className="max-h-[360px] overflow-auto px-4 py-4 text-[12px] leading-6 text-slate-100"><code>{value}</code></pre>
    </div>
  );
}
