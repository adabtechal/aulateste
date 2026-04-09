# Referência Kestra Open Source API + Plugin de Agent

## Objetivo

Esta referência consolida a documentação oficial do Kestra que será relevante para integrar o nosso sistema com um agente conversacional baseado em flows do Kestra.

Escopo desta referência:

- API Open Source do Kestra
- autenticação da API
- execução síncrona e assíncrona de flows
- webhook para disparo externo
- SDK JavaScript para integração no nosso backend
- plugin `io.kestra.plugin.ai.agent.AIAgent`
- plugin `io.kestra.plugin.ai.tool.AIAgent`

## Leitura executiva

Para o nosso caso de uso, o desenho mais útil é este:

1. O nosso sistema envia mensagens/eventos para o Kestra.
2. O Kestra inicia um flow por API ou por webhook.
3. Dentro do flow, uma task `io.kestra.plugin.ai.agent.AIAgent` executa o raciocínio conversacional.
4. O agente pode usar memória, ferramentas e retrievers.
5. O resultado volta como saída do flow, ou fica disponível para consulta por execução.

Inferência prática a partir da documentação oficial:

- se quisermos menor acoplamento, webhook é o ponto de entrada mais simples
- se quisermos controle fino, status e streaming, a integração via API/SDK JavaScript é melhor
- se quisermos compor agentes especializados, `io.kestra.plugin.ai.tool.AIAgent` serve para expor um agente aninhado como ferramenta

## Fontes oficiais consultadas

- Open Source API Reference: https://kestra.io/docs/api-reference/open-source
- Extend Kestra with the API: https://kestra.io/docs/how-to-guides/api
- JavaScript SDK: https://kestra.io/docs/api-reference/kestra-sdk/javascript-sdk
- Synchronous Executions API: https://kestra.io/docs/how-to-guides/synchronous-executions-api
- Webhook Trigger: https://kestra.io/docs/workflow-components/triggers/webhook-trigger
- Required Basic Authentication: https://kestra.io/docs/migration-guide/v0.24.0/basic-authentication
- AI Tools overview: https://kestra.io/docs/ai-tools
- Plugin `io.kestra.plugin.ai.agent.AIAgent`: https://kestra.io/plugins/plugin-ai/agent/io.kestra.plugin.ai.agent.AIAgent
- Plugin `io.kestra.plugin.ai.tool.AIAgent`: https://kestra.io/plugins/plugin-ai/tool/io.kestra.plugin.ai.tool.AIAgent

Data de consulta: 2026-04-02

## 1. O que a documentação oficial deixa claro

### 1.1 AI Agents x Agent Skills

O Kestra distingue duas coisas diferentes:

- `AI Agents`: rodam dentro dos flows e escolhem ações dinamicamente em tempo de execução
- `Agent Skills`: servem para ensinar ferramentas externas como Claude Code, Cursor e Windsurf a operar Kestra

Para o nosso sistema conversacional, o que importa diretamente é `AI Agents`, não `Agent Skills`.

## 2. Autenticação da API

Na documentação oficial, o Kestra informa que a autenticação básica passou a ser obrigatória nas instâncias Open Source.

Implicação prática para o nosso backend:

- toda chamada de API deve enviar credenciais
- em Open Source, o caminho mais direto é Basic Auth
- em Enterprise também existe uso de Bearer token

Exemplo de chamada autenticada por Basic Auth:

```bash
curl -X POST -u 'admin@kestra.io:kestra' http://localhost:8080/api/v1/executions/company.team/hello_world
```

Observação:

- em exemplos mais recentes da documentação, o tenant `main` aparece no path
- portanto, para evitar ambiguidade, trate `main` como tenant padrão quando a instância usar multi-tenancy

## 3. Modos de integração com o nosso sistema

### 3.1 API direta

Mais indicada quando precisarmos:

- iniciar execuções sob demanda
- consultar status
- acompanhar logs/eventos
- ler outputs de forma controlada

Capacidades mostradas na documentação:

- criar flow
- atualizar flow
- executar flow
- deletar execução
- acompanhar execução por streaming
- acessar arquivos de namespace

### 3.2 Webhook

Mais indicado quando quisermos um endpoint simples de entrada para eventos externos.

O formato documentado do webhook é:

```text
/api/v1/main/executions/webhook/{namespace}/{flowId}/{key}
```

O Kestra aceita `GET`, `POST` e `PUT`, e disponibiliza corpo e headers da requisição dentro do flow.

Uso recomendado no nosso cenário:

- receber mensagem do sistema
- disparar flow conversacional
- opcionalmente responder de forma síncrona com `wait: true` e `returnOutputs: true`

## 4. Endpoints e operações mais relevantes

### 4.1 Executar um flow

Na prática, esta é a operação mais importante para o nosso backend.

Padrão mostrado na documentação:

- `POST /api/v1/main/executions/{namespace}/{flowId}?wait=true`

Quando `wait=true`, a chamada aguarda a conclusão do flow e pode servir como integração síncrona.

Isso é útil quando quisermos:

- mandar uma mensagem do usuário
- aguardar a resposta do agente
- devolver a resposta imediatamente para o front

### 4.2 Acompanhar execução

O SDK JavaScript expõe `followExecution`, que é útil para:

- streaming de progresso
- atualização de status no painel
- captura de logs e eventos durante respostas longas

### 4.3 Arquivos de namespace

A documentação mostra o endpoint:

```text
GET /api/v1/main/namespaces/{namespace}/files/directory
```

Isso é útil para flows que precisem:

- ler arquivos auxiliares
- armazenar prompts ou templates versionados
- publicar artefatos gerados pelo agente

## 5. Integração recomendada em Node.js com SDK oficial

O SDK oficial JavaScript é o caminho mais limpo para a nossa aplicação Node.

Instalação:

```bash
npm install @kestra-io/kestra-sdk
```

Configuração base:

```js
import KestraClient from '@kestra-io/kestra-sdk';

const client = new KestraClient(
  process.env.KESTRA_API_URL ?? 'http://localhost:8080',
  process.env.KESTRA_TOKEN ?? '',
  process.env.KESTRA_USERNAME ?? 'admin@kestra.io',
  process.env.KESTRA_PASSWORD ?? 'Root!1234'
);

export default client;
```

Operações relevantes mostradas pela documentação:

- `client.flowsApi.createFlow(tenant, body)`
- `client.flowsApi.updateFlow(namespace, id, tenant, body)`
- `client.executionsApi.createExecution(namespace, flowId, wait, tenant)`
- `client.executionsApi.followExecution(executionId, tenant)`

## 6. Plugin principal para o agente conversacional

O plugin central é:

```yaml
type: io.kestra.plugin.ai.agent.AIAgent
```

Ele foi documentado pelo Kestra como uma task para rodar um agente de IA com ferramentas.

### 6.1 Capacidades que importam para o nosso caso

Pelo material oficial, o `AIAgent` pode combinar:

- `provider`: modelo/fornecedor LLM
- `systemMessage`: instruções persistentes do agente
- `prompt`: entrada da interação
- `tools`: ferramentas que o agente pode invocar
- `memory`: memória conversacional
- `contentRetrievers`: busca de contexto externo
- `outputFiles`: artefatos gerados
- `configuration.responseFormat`: saída em texto ou JSON estruturado

### 6.2 Providers suportados

A página do plugin lista múltiplos providers, incluindo:

- OpenAI
- Anthropic
- Google Gemini
- Azure OpenAI
- Ollama
- OpenRouter

Para integração inicial, OpenAI ou Gemini parecem os caminhos mais diretos pela maturidade dos exemplos na própria documentação.

## 7. Memória conversacional

O `AIAgent` suporta memória persistida.

Opções mostradas na documentação:

- Kestra KV Store
- PostgreSQL
- Redis

Defaults documentados para memória:

- `memoryId`: `{{ labels.system.correlationId }}`
- `messages`: `10`
- `ttl`: `PT1H`

Interpretação prática:

- para conversas com sessão por usuário, o ponto mais importante é controlar o `memoryId`
- se deixarmos o valor padrão, a memória segue o correlation id da execução
- para chat persistente por usuário/canal, vale definir um `memoryId` estável por conversa

## 8. Ferramentas e composição de agentes

O `AIAgent` aceita `tools`, e a documentação mostra uso com:

- `DockerMcpClient`
- `SseMcpClient`
- `CodeExecution`
- `KestraFlow`
- retrievers web

Além disso, existe o tipo:

```yaml
type: io.kestra.plugin.ai.tool.AIAgent
```

Esse plugin expõe um agente aninhado como ferramenta.

Quando isso faz sentido para nós:

- um agente principal de atendimento
- um subagente para qualificação de leads
- um subagente para FAQ
- um subagente para classificação/intenção

Assim, o agente principal decide quando chamar agentes menores especializados.

## 9. Saídas úteis para a aplicação

A documentação do `AIAgent` expõe campos de saída relevantes:

- `textOutput`
- `jsonOutput`
- `outputFiles`
- `thinking`
- `tokenUsage`
- `toolExecutions`

Para o nosso sistema, os mais importantes são:

- `textOutput`: resposta final do agente para o usuário
- `jsonOutput`: resposta estruturada para automações
- `toolExecutions`: trilha do que o agente chamou
- `tokenUsage`: observabilidade de custo

## 10. Resposta estruturada

O plugin permite configurar `responseFormat` com:

- `TEXT`
- `JSON`

Isso é particularmente útil quando o nosso backend precisar distinguir:

- mensagem final para o usuário
- intenção identificada
- ação sugerida
- dados extraídos

Exemplo de uso válido pela documentação:

```yaml
configuration:
  responseFormat:
    type: JSON
    jsonSchema:
      type: object
      required: ["category", "priority"]
      properties:
        category:
          type: string
        priority:
          type: string
```

## 11. Esqueleto recomendado para o nosso agente conversacional

O YAML abaixo é uma síntese prática baseada nos recursos documentados pelo Kestra, adaptada para o nosso cenário:

```yaml
id: conversational_agent
namespace: app.chat

inputs:
  - id: user_id
    type: STRING
  - id: session_id
    type: STRING
  - id: message
    type: STRING

tasks:
  - id: agent
    type: io.kestra.plugin.ai.agent.AIAgent
    provider:
      type: io.kestra.plugin.ai.provider.OpenAI
      apiKey: "{{ kv('OPENAI_API_KEY') }}"
      modelName: gpt-5-mini
    systemMessage: |
      Você é o agente conversacional oficial do sistema.
      Responda com clareza, objetividade e contexto de negócio.
    prompt: |
      Usuário: {{ inputs.user_id }}
      Sessão: {{ inputs.session_id }}
      Mensagem: {{ inputs.message }}
    memory:
      type: io.kestra.plugin.ai.memory.KestraKVStore
      memoryId: "{{ inputs.session_id }}"
      ttl: PT24H
      messages: 20
    configuration:
      responseFormat:
        type: TEXT

outputs:
  - id: reply
    type: STRING
    value: "{{ outputs.agent.textOutput }}"
```

Observação importante:

- o exemplo acima é uma composição recomendada com base na documentação oficial
- ele não substitui a validação do schema final da versão do plugin instalada no ambiente

## 12. Padrão de integração recomendado para o nosso sistema

Recomendação objetiva:

1. Backend Node chama Kestra via SDK JavaScript.
2. Cada mensagem do usuário dispara um flow conversacional.
3. O flow usa `AIAgent` com `memoryId` vinculado à sessão.
4. A saída principal vem de `textOutput`.
5. Para automações futuras, migrar o formato para `JSON`.
6. Para especialização, adicionar `io.kestra.plugin.ai.tool.AIAgent` como subagentes.

## 13. Decisões técnicas sugeridas

### Boa escolha para MVP

- entrada por API/SDK
- `AIAgent` único
- memória em Kestra KV Store
- resposta em `TEXT`

### Boa escolha para evolução

- webhook para integrações externas
- resposta estruturada em `JSON`
- subagentes via `tool.AIAgent`
- retrievers e tools para busca, execução e automação

## 14. Riscos e pontos de atenção

- a página "Open Source API Reference" funciona mais como portal de referência; para implementação, os guias e SDKs trazem exemplos mais úteis
- a variação de path com tenant exige padronização no nosso backend
- o comportamento real depende da versão do plugin AI instalada no Kestra
- memória por execução e memória por sessão são estratégias diferentes; precisamos decidir isso explicitamente
- se quisermos resposta síncrona ao usuário final, precisamos escolher entre `wait=true` na API ou webhook com `wait: true`

## 15. Próximo passo recomendado

O próximo artefato útil seria um documento interno com:

- contrato de integração `app -> Kestra`
- payload da mensagem
- payload da resposta
- estratégia de `session_id` e `memoryId`
- flow YAML inicial do agente conversacional

