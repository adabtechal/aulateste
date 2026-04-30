# LeadTrack Pro — Design System

> CRM moderno para gestão de leads com inteligência artificial.
> Concept: **"Calm Intelligence"** — uma interface discreta que deixa os dados respirarem, pontuada por cor e tipografia para criar autoridade sem ruído.

---

## Contexto do produto

**LeadTrack Pro** (internamente: `leadtrack-pro`, ver `sistema_aula_26/package.json`) é um sistema de CRM construído em volta de três pilares:

1. **Kanban visual de vendas** — pipeline arrastar-e-soltar, estágios configuráveis, histórico por lead.
2. **Central de Leads** — cadastro, filtros, tags, importação, detalhe com histórico completo.
3. **Automação via WhatsApp (Evolution API v2)** — instâncias, QR code, mensagens automáticas por estágio com delays configuráveis, log de conversas.

O stack é **React 18 + Vite + TailwindCSS** (client), **Node + Express** (server), **Supabase (PostgreSQL + Realtime)** como banco e **Evolution API v2** para WhatsApp. Ver `sistema_aula_26/docs/prd.md` para o PRD completo.

### Por que um novo design?

A v1 do sistema utilizava o conceito "Architectural Ledger" (Velocity Pro) com Navy (`#1E3A8A`) + Action Green (`#10B981`) + Montserrat. O feedback: **"precisamos utilizar novas cores — o sistema precisa ser mais moderno, está muito básico."**

Esta v2 reposiciona a marca para **Calm Intelligence**: um CRM com identidade de produto moderno, sem cair nas fórmulas saturadas de SaaS (roxo-azul gradiente, emojis, cards com borda colorida à esquerda). Usamos violet elétrico pontual, uma coral quente para calor humano, e tipografia híbrida sans-serif + serif para rítmo editorial.

---

## Sources

| Source | Caminho |
|---|---|
| Codebase mounted | `sistema_aula_26/` (local mount) |
| PRD | `sistema_aula_26/docs/prd.md` |
| Design System v1 (Velocity Pro) | `sistema_aula_26/docs/design-system.md` |
| Referências visuais v1 | `sistema_aula_26/referencias/*/` |
| Client | `sistema_aula_26/client/src/` |

Os arquivos-fonte permanecem read-only no mount; este design system (v2) é **independente** e substitui o v1.

---

## Index do projeto

- **`colors_and_type.css`** — tokens CSS de cor, tipografia, espaçamento, sombras e motion. Importe este arquivo em qualquer HTML que use o sistema.
- **`README.md`** — este arquivo.
- **`SKILL.md`** — instruções para invocar este sistema como um Agent Skill.
- **`assets/`** — logos, ícones e quaisquer imagens do sistema.
- **`fonts/`** — (não necessário — usamos Google Fonts CDN: Geist + Instrument Serif + Geist Mono).
- **`preview/`** — cards de preview individuais para a aba Design System.
- **`ui_kits/leadtrack/`** — UI kit do produto (React JSX, `index.html` com tela clicável).
- **`slides/`** — (não criado — nenhum template de deck foi fornecido pelo usuário).

---

## CONTENT FUNDAMENTALS

O produto é **em português do Brasil**. O tom é profissional mas próximo — tratamos o usuário de "você", nunca "tu" ou formalismo excessivo.

### Vozes e tom

- **Direto e orientado a ação.** "Novo Lead", "Mover para Negociação", "Conectar WhatsApp" — verbos no imperativo.
- **Claro sobre o estado do sistema.** "Mensagem enviada", "Lead criado", "Instância conectada" em toasts; nada de "Sucesso!" genérico.
- **Erros com contexto útil.** "E-mail ou senha incorretos" em vez de "Invalid login credentials".
- **Empty states humanizados**, não vazios. Ex: "Nenhum lead neste estágio ainda. Arraste um card para começar."

### Casing

- **Títulos de tela**: Capitalização de frase. "Pipeline de vendas", "Central de leads", "Configuração de WhatsApp".
- **Botões primários**: Capitalização de frase, curtos. "Novo lead", "Enviar mensagem", "Conectar".
- **Labels de tabela / metadados**: UPPERCASE com tracking expandido (`--tracking-widest`). "ESTÁGIO", "ÚLTIMO CONTATO", "ORIGEM".
- **Badges de status**: UPPERCASE, compactos. "QUALIFICADO", "PROPOSTA", "GANHO".

### Copywriting: exemplos

| Situação | ❌ Evitar | ✅ Preferir |
|---|---|---|
| Toast sucesso | "Sucesso!" | "Lead criado" |
| CTA principal | "Clique aqui" | "Novo lead" |
| Estado vazio | "No data" | "Ainda não há leads por aqui" |
| Confirmar ação destrutiva | "Tem certeza?" | "Excluir este lead? Esta ação não pode ser desfeita." |
| Erro | "Erro 401" | "Sua sessão expirou. Entre novamente." |

### Uso de emoji / unicode

**Não usamos emoji na UI.** Status, ações e metadados são expressados com ícones Lucide ou tipografia. Em copy de mensagens do usuário final (templates de WhatsApp que o usuário escreve), o usuário é livre — o sistema é agnóstico.

Unicode para símbolos estruturais é aceitável em casos específicos: `→` em breadcrumbs, `·` como separador inline, `—` em sentenças.

### Números

- **Moeda**: `R$ 12.400` (sem centavos em cards de pipeline, com centavos em transações: `R$ 12.450,00`).
- **Percentuais**: `+12%`, `72%` (com sinal quando é delta).
- **Tempo**: `há 3h`, `há 2 dias`, `agora` (usando `date-fns` / ptBR).

---

## VISUAL FOUNDATIONS

### Concept: Calm Intelligence

O sistema treat data como material — denso mas bem iluminado. Não há gradientes de fundo, nem orbs, nem blur decorativo. O "moderno" vem de:

1. **Escala tipográfica ampla** (body 14px → kpi 64px — um range dramático).
2. **Uma única cor de destaque** (violet elétrico) usada com disciplina.
3. **Hierarquia por camadas tonais** (surface → panel → elevated) sem bordas 1px em todo lugar.
4. **Serif itálico** como pontuação editorial ocasional — títulos hero, estados vazios, quotes.

### Color

- **Primary: Violet (`--violet-500: #6d43f5`)** — AI-forward, moderno, confiável. Reservado para ações primárias, links ativos, progress.
- **Accent: Coral (`--coral-500: #f04e1a`)** — calor humano; usado em highlights (novo lead, menção), notificações, indicadores de urgência.
- **Ink scale (neutrals)** — 14 steps, levemente cool (`#0b0d12` → `#ffffff`).
- **Semantic** — success (`#16a365`), warning (`#e09200`), danger (`#dc3545`), info (`#2b6ef0`).
- **Kanban stage hues** — cada estágio recebe sua cor (violet/blue/green/amber/coral/deep-green/grey).

Regras críticas:

- Nunca use preto puro (`#000`). O mais escuro é `--ink-950: #0b0d12`.
- Sombras são tintadas com ink (rgba(20, 23, 31, ...)), nunca pretas.
- Violet é **pontual**. Um dashboard não deve ter 10 coisas violeta — apenas a ação primária, o nav ativo, e 1–2 destaques.

### Typography

- **Geist (sans)** — 300 a 900. Default para tudo. Substitui Montserrat + Inter — uma única família cobre UI e body com feeling moderno.
- **Instrument Serif (serif)** — usado em itálico para títulos editoriais ocasionais ("Receita do *mês*", hero de empty state). Pontuação, não padrão.
- **Geist Mono** — valores numéricos em tabelas densas, códigos, tokens.

Escala: ver `colors_and_type.css`. Display hero = 64px; KPI = 38px; body = 14px; label = 11px uppercase.

### Spacing

Grid base `4px`. Tokens: `--space-1` (4) a `--space-20` (80). Padding padrão de card = `--space-6` (24px); padding de página = `--space-8` a `--space-12`; gap entre seções = `--space-12` (48px).

### Backgrounds

**Sem imagens de fundo, sem gradientes decorativos, sem padrões repetidos.** O fundo é plano (`--ink-50`) com camadas tonais (`--ink-75` para painéis secundários, `--ink-0` para cards elevados).

Exceção única: o estado dark mode / modo apresentação usa `--ink-950` como base.

### Animation & Motion

- **Ease padrão**: `--ease-out-quart` (`cubic-bezier(0.25, 1, 0.5, 1)`) — saídas rápidas, chegadas suaves.
- **Ease tátil (drag-drop, add lead)**: `--ease-spring` para micro-bounce leve.
- **Durações**: fast `120ms` (hover/focus), base `200ms` (transições de estado), slow `320ms` (enter/exit de modais/panels).
- **Sem bounces ou animações flamboyant.** O sistema se move, mas com contenção.

### Hover states

- **Botão primário**: escurece de `--violet-500` para `--violet-600`, shadow cresce sutilmente.
- **Botão secundário**: bg muda de `--ink-0` para `--ink-75`.
- **Linha de tabela**: bg vai para `--ink-75`; texto do nome ganha peso 600.
- **Card kanban**: shadow `sm` → `md`, sem movimento (não translate).
- **Link / texto**: underline revela-se, cor desloca para `--violet-600`.

### Press / active states

- **Botões**: `scale(0.98)` + shadow colapsa.
- **Cards clicáveis**: `scale(0.995)` sutil.
- Nenhuma animação de "pressed" em navegação — sidebar se contenta com mudança de cor.

### Borders

- **Uso criterioso.** Preferir mudança tonal de superfície. Quando borda é necessária:
  - Cards no mesmo nível de surface: `1px solid var(--border)` (`--ink-150`).
  - Divisores em tabelas: `1px solid var(--border-subtle)` (`--ink-100`).
  - Inputs: `1px solid var(--border-strong)` (`--ink-200`).
- **Nunca** borda colorida apenas à esquerda como "accent" (padrão AI slop). Exceção: o **accent rail** de 3px nas linhas de tabela "novas/ativas" — é um componente assinado, usado com parcimônia.

### Shadows

Tintadas com ink, não pretas puras. Escala: `--shadow-xs` → `--shadow-xl`. Uma sombra especial `--shadow-violet` para o CTA primário (glow sutil em violet 25%).

Regra: **cards estáticos não têm sombra.** Só flutuantes (dropdown, popover, modal, toast) e o CTA primary.

### Corner radius

- `4px` (`--radius-xs`): chips, badges micro
- `6px` (`--radius-sm`): inputs, selects
- `10px` (`--radius-md`): botões, badges grandes
- `14px` (`--radius-lg`): cards de conteúdo
- `20px` (`--radius-xl`): painéis de hero, modais
- `28px` (`--radius-2xl`): surfaces de marketing
- `9999px` (`--radius-full`): avatares, pílulas

**No-pill rule em botões**: botões primários usam `--radius-md` (10px), não `rounded-full`. Pílulas ficam reservadas para status badges.

### Cards

Receita padrão:

```css
background: var(--bg-panel);           /* ink-0 */
border: 1px solid var(--border);       /* ink-150 */
border-radius: var(--radius-lg);       /* 14px */
padding: var(--space-6);               /* 24px */
/* no shadow on resting state */
```

Em hover (se clicável): `border-color: var(--border-strong)` + `box-shadow: var(--shadow-sm)`.

### Transparency & blur

Usado apenas em:

- **Overlays de modal**: `rgba(11, 13, 18, 0.48)` + `backdrop-filter: blur(4px)`.
- **Sticky top bar** com scroll: `rgba(249, 250, 251, 0.85)` + `backdrop-filter: blur(12px)`.

Nada mais. Nenhum card com transparência; nenhum "glass" em conteúdo de trabalho.

### Layout rules

- **Shell**: sidebar fixa 260px à esquerda + topbar 64px sticky + conteúdo com `max-width: 1440px` centralizado.
- **Kanban**: colunas de 320px fixas, scroll horizontal.
- **Dashboard**: grid 12 colunas, gap de 24px.
- **Central de Leads**: full-width com filters em top-bar secundária.

### Image vibe

Quando imagens são necessárias (avatares, attachments): **warm-neutral, nunca saturado**. Avatares de usuários são fotos reais ou iniciais em background `--violet-500` / `--coral-500` alternados deterministicamente pelo hash do nome.

---

## ICONOGRAPHY

### Sistema principal: Lucide (CDN)

O codebase já usa `lucide-react` (ver `client/package.json`). Mantemos **Lucide** como a biblioteca oficial — ícones lineares de stroke 1.5px, geometricamente limpos, que combinam com a densidade do Geist.

**CDN para HTML estático:** `<script src="https://unpkg.com/lucide@latest"></script>` + `<i data-lucide="chevron-right"></i>` + `lucide.createIcons()`.

### Tamanhos padrão

| Contexto | Tamanho | Stroke |
|---|---|---|
| Inline em body text | 14px | 1.5 |
| Botão (prefix) | 16px | 1.5 |
| Sidebar nav | 18px | 1.75 |
| Ação de linha (tabela) | 16px | 1.5 |
| KPI decorativo | 20-24px | 1.5 |
| Hero / empty state | 48px | 1.25 |

### Cor dos ícones

Ícones herdam cor do texto por padrão (`stroke="currentColor"`). Em inactive nav: `--fg-muted`; em active: `--fg-accent`.

### Emoji / Unicode

**Emoji não é usado na UI do produto.** Estrutura visual = ícones; estado = badges coloridos; enfase = tipografia.

Unicode para símbolos inline (→, ·, —) é permitido em copy.

### Assets em `assets/`

Mantemos nesta pasta:

- `logo.svg` — marca LeadTrack Pro (wordmark + símbolo)
- `logo-mark.svg` — apenas o símbolo (para favicon, avatars)
- `logo-lockup-dark.svg` — versão dark-mode
- `illustrations/` — ilustrações vetoriais para empty states e hero (criadas sob demanda — placeholders modernos até que assets finais sejam fornecidos)

---

## Ask para iteração

Este design system é uma **v2 proposta**. Antes de congelar, confirme com o time:

1. **Paleta**: violet `#6d43f5` como primary funciona para a marca? Ou preferem algo como indigo, teal ou um tom mais sóbrio?
2. **Tipografia**: Geist é moderno e open-source, mas não é "comum" ainda. Aceitável, ou preferem algo mais neutro (Inter)?
3. **Serif editorial**: Instrument Serif itálico como acento ocasional — adiciona personalidade ou é uma distração?
4. **Logo**: substituir o placeholder por marca real quando disponível.
