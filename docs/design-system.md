# Design System - Sistema Aula 26

> Baseado na referencia visual "Velocity Pro" — Conceito criativo: **"The Architectural Ledger"**
> Documento de referencia central para toda a construcao do sistema.

---

## 1. North Star Criativo

O design system segue o conceito **"The Architectural Ledger"** (Livro-Razao Arquitetural): uma interface que transmite **autoridade informacional**, tratando dados como artefatos curados dentro de um framework profissional e robusto.

**Principios fundamentais:**
- Interface como mesa de trabalho premium — pesada, proposital, permanente
- Estetica FinTech editorial, nao SaaS generico
- Hierarquia atraves de camadas tonais, nao decoracao
- Assimetria intencional em layouts de dashboard
- Dados curados, nao apenas exibidos

---

## 2. Paleta de Cores

### 2.1 Cores Principais

| Token | Hex | Uso |
|-------|-----|-----|
| `primary` | `#10B981` | Action Green — estados de sucesso, CTA principal da tela |
| `secondary` | `#1E3A8A` | Executive Navy — navegacao, headers, autoridade |
| `tertiary` | `#64748B` | Utility Slate — informacao secundaria, metadata |
| `error` | `#ba1a1a` | Erros e validacao |

### 2.2 Superficies (Hierarquia de Camadas)

| Token | Hex | Uso |
|-------|-----|-----|
| `surface` | `#f7f9fb` | Base da aplicacao / background |
| `surface-container-low` | `#f2f4f6` | Blocos primarios de layout (sidebar, filtros) |
| `surface-container` | `#eceef0` | Container intermediario |
| `surface-container-high` | `#e6e8ea` | Badges, separadores tonais, hover states |
| `surface-container-highest` | `#e0e3e5` | Glassmorphism base, inputs destacados |
| `surface-container-lowest` | `#ffffff` | Cards interativos — efeito "elevacao" sem sombra |
| `surface-dim` | `#d8dadc` | Superficies rebaixadas |
| `surface-variant` | `#e0e3e5` | Variante de superficie |

### 2.3 Cores de Texto (On-Surface)

| Token | Hex | Uso |
|-------|-----|-----|
| `on-surface` | `#191c1e` | Texto principal sobre surface |
| `on-surface-variant` | `#444651` | Texto secundario |
| `on-primary` | `#ffffff` | Texto sobre primary (branco) |
| `on-secondary` | `#ffffff` | Texto sobre secondary (branco) |
| `on-error` | `#ffffff` | Texto sobre error |

### 2.4 Cores Estendidas

| Token | Hex | Uso |
|-------|-----|-----|
| `primary-fixed` | `#6ffbbe` | Accent line do Audit Rail |
| `primary-fixed-dim` | `#4edea3` | Gradiente do CTA primario |
| `primary-container` | `#d1fae5` | Highlights sutis de primary |
| `on-primary-container` | `#27c38a` | Texto sobre primary-container |
| `secondary-container` | `#8fa7fe` | Container de secondary |
| `secondary-fixed` | `#dce1ff` | Fundo fixo de secondary |
| `error-container` | `#ffdad6` | Background de estados de erro |
| `on-error-container` | `#93000a` | Texto sobre error-container |
| `inverse-surface` | `#2d3133` | Cards escuros (ex: Queue Health) |
| `inverse-primary` | `#4edea3` | Primary invertido (sobre fundo escuro) |
| `outline` | `#757682` | Outlines fortes |
| `outline-variant` | `#c5c5d3` | Ghost borders (15% opacity) |

### 2.5 Regras Criticas de Cor

**Regra "No-Line" (Sem Bordas 1px):**
- PROIBIDO usar `border: 1px solid` para seccionar areas
- Usar mudancas de background-color entre camadas de superficie
- Sidebar vs conteudo: `surface-container-low` contra `surface`
- Header vs body: mudanca tonal sutil, sem stroke

**Regra do Glass & Gradient:**
- Elementos flutuantes (modais, dropdowns): `surface-container-highest` a 80% opacity + `backdrop-blur: 20px`
- CTAs primarios: gradiente linear 135deg de `primary` para `primary-container` (acabamento metalico)

**Ghost Border (Fallback de Acessibilidade):**
- Quando borda for necessaria por acessibilidade: `outline-variant` a 15% opacity
- Deve ser "sentida, nao vista"

---

## 3. Tipografia

### 3.1 Font Stack

| Familia | Uso | Weights |
|---------|-----|---------|
| **Montserrat** | Headlines, brand, labels UI, navigation | 400, 500, 600, 700, 800, 900 |
| **Inter** | Body text, tabelas de dados, conteudo longo | 400, 500, 600, 700 |

### 3.2 Escala Tipografica

| Nivel | Tamanho | Weight | Linha | Letter-Spacing | Uso |
|-------|---------|--------|-------|-----------------|-----|
| **Display** | `3.5rem` (56px) | 800 (ExtraBold) | 1.0 | `-0.02em` | KPIs gigantes (receita total, contagem de leads) |
| **Headline XL** | `2.5rem` (40px) | 800 | 1.1 | `-0.02em` | Hero titles com split-color |
| **Headline LG** | `2rem` (32px) | 700 (Bold) | 1.2 | `tight` | Titulos de secao |
| **Headline MD** | `1.5rem` (24px) | 700 | 1.3 | `tight` | Subtitulos de secao |
| **Title LG** | `1.25rem` (20px) | 700 | 1.4 | `tighter` | Titulos de card/panel |
| **Title MD** | `1.125rem` (18px) | 700 | 1.4 | `tighter` | Titulos menores |
| **Body LG** | `0.9375rem` (15px) | 400/500 | 1.6 | normal | Texto principal |
| **Body MD** | `0.875rem` (14px) | 400 | 1.6 | normal | Texto padrao em tabelas/listas |
| **Body SM** | `0.8125rem` (13px) | 400/500 | 1.5 | normal | Texto secundario |
| **Label LG** | `0.6875rem` (11px) | 800 | 1.0 | `+0.1em` | Headers de tabela (uppercase) |
| **Label MD** | `0.625rem` (10px) | 800/900 | 1.0 | `+0.2em` | Metadata, badges, timestamps (uppercase) |
| **Label SM** | `0.5625rem` (9px) | 700 | 1.0 | `tighter` | Micro-badges em cards kanban |

### 3.3 Regras Tipograficas

- **Headlines:** Sempre `font-montserrat`, tracking `tight` ou `tighter`
- **Labels:** Sempre `UPPERCASE` com letter-spacing expandido (`tracking-widest` ou `tracking-[0.2em]`)
- **Body:** `font-inter` (ou `font-body`) com `leading-relaxed` (1.6)
- **KPIs/Numeros grandes:** `font-montserrat font-black tracking-tighter`
- **Sufix de unidade:** Tamanho menor que o numero (ex: `text-2xl` para "%" quando numero e `text-editorial-display`)

---

## 4. Espacamento

### 4.1 Escala de Espacamento

| Token | Valor | Uso |
|-------|-------|-----|
| `spacing-1` | `0.2rem` (3.2px) | Grid base — todos elementos alinham a isso |
| `spacing-2` | `0.4rem` (6.4px) | Tight — entre informacoes densas |
| `spacing-3` | `0.6rem` (9.6px) | Gaps minimos |
| `spacing-4` | `0.9rem` (14.4px) | Standard — entre componentes |
| `spacing-6` | `1.3rem` (20.8px) | Separacao de itens em lista (substitui dividers) |
| `spacing-8` | `1.8rem` (28.8px) | Agrupamento de elementos |
| `spacing-10` | `2.25rem` (36px) | Sectional — entre secoes de layout |
| `spacing-12` | `3rem` (48px) | Gap largo entre blocos |
| `spacing-20` | `4.5rem` (72px) | Hero/Editorial — respiro maximo |

### 4.2 Regras de Espacamento

- **Padding de pagina:** `p-8` a `p-10` (2rem a 2.5rem)
- **Gap entre cards no grid:** `gap-6` a `gap-10`
- **Padding interno de cards:** `p-5` (kanban) a `p-8`/`p-10` (dashboard)
- **Separacao de itens em lista:** Usar `space-y-4` a `space-y-8` (NUNCA `<hr>`)
- **Sidebar padding:** `px-3` a `px-6`, `py-6`

---

## 5. Elevacao e Profundidade

### 5.1 Principio de Camadas Tonais

A hierarquia visual e criada por **empilhamento de camadas de superficie**, nao por sombras:

```
surface (#f7f9fb)                    ← Base
  └─ surface-container-low (#f2f4f6) ← Sidebar, filtros, blocos de layout
       └─ surface-container-lowest (#ffffff) ← Cards interativos (efeito "lift")
```

### 5.2 Sombras (Apenas Elementos Flutuantes)

| Tipo | Valor CSS | Quando usar |
|------|-----------|-------------|
| **Card sutil** | `shadow-sm` | Cards sobre surface-container-low |
| **Card hover** | `shadow-md` | Hover em cards kanban |
| **CTA destaque** | `shadow-lg shadow-primary/20` | Botoes primarios com glow verde |
| **Flutuante** | `0px 12px 32px rgba(30,58,138,0.06)` | Modais, tooltips, dropdowns |
| **FAB** | `shadow-2xl` | Floating Action Button |

**Regra:** Sombras sao tintadas com Navy (`#1E3A8A`) a 6% opacity — NUNCA preto puro.

### 5.3 Glassmorphism

```css
.glass-panel {
  background: rgba(224, 227, 229, 0.8);  /* surface-container-highest */
  backdrop-filter: blur(20px);
}

.glass-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
}
```

---

## 6. Border Radius

| Token | Valor | Uso |
|-------|-------|-----|
| `DEFAULT` | `0.125rem` (2px) | Elementos minimos |
| `md` | `0.375rem` (6px) | Botoes, inputs, badges |
| `lg` | `0.5rem` (8px) | Cards kanban, panels |
| `xl` | `0.75rem` (12px) | Cards de destaque, filtros, insight cards |
| `full` | `9999px` | Badges de status, avatares, dots |

**Regra "No Pill":** Evitar `rounded-full` em botoes e containers. Manter estetica "sharp to medium" para tom profissional FinTech.

---

## 7. Iconografia

### 7.1 Sistema de Icones

- **Biblioteca:** Material Symbols Outlined (Google)
- **Configuracao base:**
```css
font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
```

### 7.2 Tamanhos

| Contexto | Tamanho | Classe |
|----------|---------|--------|
| Navegacao sidebar | 20px | `text-[20px]` |
| Icone em card | 24px (default) | — |
| Icone hero/decorativo | 48-64px | `text-6xl` |
| Background decorativo | 120-200px | `text-[120px]` a `text-[200px]` com `opacity-10` |
| Micro icone (setas) | 14px | `style="font-size: 14px"` |

### 7.3 Variantes

- **Outline (padrao):** `FILL: 0` — maioria dos icones
- **Filled:** `FILL: 1` — icone ativo na sidebar, icones de status
```css
font-variation-settings: 'FILL' 1;
```

### 7.4 Icones Decorativos de Background

Usado em KPI cards e hero sections:
```html
<div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
  <span class="material-symbols-outlined text-6xl">leaderboard</span>
</div>
```

---

## 8. Componentes

### 8.1 Botoes

#### Primary (CTA Principal)
```
bg-primary text-white font-bold rounded-md
hover:opacity-90 active:scale-95 transition-all
shadow-lg shadow-primary/20
```
- Texto: branco, bold, Montserrat
- Sem borda
- Label: `text-xs uppercase tracking-widest` (quando compact)

#### Secondary (Acao Secundaria)
```
bg-white border border-slate-200 text-secondary font-bold
hover:bg-slate-50 transition-colors
```
- Ou: `bg-secondary text-white` para destaque (ex: Q3 Projection)

#### Tertiary (Ghost)
```
text-tertiary font-bold text-xs uppercase
hover:text-secondary transition-colors
```
- Sem background
- Underline aparece apenas no hover

#### Destrutivo/Descarte
```
text-tertiary font-bold
hover:text-error transition-colors
```

#### FAB (Floating Action Button)
```
fixed bottom-10 right-10 w-16 h-16
bg-secondary text-white rounded-full
shadow-2xl hover:scale-110 active:scale-95 transition-all
```

### 8.2 Inputs

#### Campo de Texto
```
bg-surface-container-low border-none rounded-md
p-4 text-sm text-secondary
focus:ring-2 focus:ring-primary (ou focus:ring-secondary)
```

#### Campo de Busca
```
bg-surface-container-low (ou bg-slate-200/50) border-none rounded-md
pl-10 pr-4 py-2 text-sm
// Icone search posicionado absolute a esquerda
```

#### Textarea
```
bg-surface-container-low border-none rounded-md
p-6 text-sm leading-relaxed text-secondary
focus:ring-2 focus:ring-primary
```

#### Select/Dropdown
```
bg-surface-container-lowest border-none rounded-md shadow-sm
py-2 px-4 text-sm font-medium
focus:ring-2 focus:ring-secondary
```

#### Validacao de Erro
- Apenas `border-bottom: 2px solid #ba1a1a` — manter integridade estrutural do campo

### 8.3 Cards

#### Card KPI (Dashboard)
```
bg-surface-container-lowest p-8 rounded-none shadow-sm
relative overflow-hidden group
```
- Icone decorativo no canto superior direito (opacity-10, hover opacity-20)
- Label: `text-[0.6875rem] font-black uppercase tracking-widest text-slate-400`
- Valor: `text-editorial-display text-secondary` (3.5rem, 800)
- Indicador de tendencia: `text-primary font-bold text-sm` com icone trending_up
- Progress bar embaixo: `h-1 bg-slate-100` com fill `bg-primary`

#### Card Kanban
```
bg-surface-container-lowest p-5 rounded-lg shadow-sm
hover:shadow-md transition-shadow group cursor-pointer
```
- Border-left opcional: `border-l-4 border-primary-fixed` (para cards ativos)
- Source badge: `text-[9px] font-bold uppercase` com background de cor
- Titulo: `font-montserrat font-bold text-secondary`
- Valor: `text-lg font-black text-secondary font-montserrat tracking-tighter`
- Footer com avatar stack e seta

#### Card Insight (Bento Grid)
```
// Navy card
bg-secondary text-white p-8 rounded-xl relative overflow-hidden

// White card
bg-surface-container-lowest p-8 rounded-xl border border-outline-variant/20

// Green card
bg-primary p-8 rounded-xl text-white shadow-xl shadow-primary/10
```

#### Card Escuro (Destaque)
```
bg-slate-900 p-8 rounded-lg relative overflow-hidden
// Texto branco, icone decorativo em background
```

### 8.4 Tabelas de Dados

#### Header
```
bg-surface-container-low/50
th: px-6 py-4 text-[11px] font-black text-secondary uppercase
    tracking-[0.1em] font-montserrat border-b border-surface-container-high
```

#### Rows
```
hover:bg-surface-container-low/30 transition-colors group
td: px-6 py-5
// Sem dividers horizontais visveis — usar divide-y divide-surface-container-low
```

#### Audit Rail em Row Ativa
```css
.audit-rail-active {
  border-left: 2px solid #10B981;
}
```

#### Paginacao
```
bg-surface-container-low/30 border-t border-surface-container-high
// Botao ativo: bg-secondary text-white rounded font-bold
// Botao inativo: hover:bg-surface-container-high text-secondary
```

### 8.5 Navegacao

#### Sidebar
```
h-screen w-64 fixed left-0 top-0
bg-slate-100 border-r border-slate-200
```
- **Brand:** `text-lg font-black text-blue-900 tracking-tighter font-montserrat`
- **Subtitle:** `text-[10px] uppercase tracking-widest font-bold text-slate-500`
- **Item inativo:** `text-slate-600 font-medium hover:bg-slate-200/50`
- **Item ativo:**
```
bg-white text-blue-900 font-bold shadow-sm
border-l-4 border-emerald-500 translate-x-1
```
- **CTA bottom:** Botao primary full-width com shadow

#### Top Bar
```
h-16 sticky top-0 z-40
bg-slate-50 border-b border-slate-200
px-8 a px-10
```
- Titulo da pagina: `text-xl font-bold text-blue-900 tracking-tighter font-montserrat`
- Badge de versao/filtro: `bg-surface-container-high px-2 py-0.5 rounded text-xs`
- Notification dot: `w-2 h-2 bg-primary rounded-full` ou `bg-error`

### 8.6 Badges e Status

#### Badge de Status (Tabela)
```
inline-flex items-center px-3 py-1 rounded-full
text-[10px] font-black uppercase tracking-wider
```

| Status | Estilo |
|--------|--------|
| Negotiation | `bg-primary/10 text-primary border border-primary/20` |
| Qualified | `bg-secondary/10 text-secondary border border-secondary/20` |
| Discovery | `bg-slate-100 text-slate-600 border border-slate-200` |

#### Badge de Source (Kanban)
```
text-[9px] font-bold uppercase tracking-tighter px-2 py-0.5 rounded
```

| Source | Estilo |
|--------|--------|
| Organic Search | `text-emerald-600 bg-emerald-50` |
| Referral | `text-blue-600 bg-blue-50` |
| Cold Outreach | `text-slate-600 bg-slate-100` |
| Enterprise | `text-emerald-600 bg-emerald-50` |

#### Badge de Tag/Versao
```
px-2 py-0.5 rounded text-xs font-semibold text-tertiary
bg-surface-container-high
```

### 8.7 Progress Bars

#### Barra Simples
```html
<div class="h-1 bg-slate-100">
  <div class="h-full bg-primary" style="width: 72%"></div>
</div>
```

#### Barra com Label
```html
<div class="h-2 w-full bg-slate-100 overflow-hidden">
  <div class="h-full bg-primary" style="width: 48%"></div>
</div>
```

#### Barra Segmentada
```html
<div class="flex space-x-1">
  <div class="h-1 flex-1 bg-primary"></div>
  <div class="h-1 flex-1 bg-primary"></div>
  <div class="h-1 flex-1 bg-slate-200"></div>
</div>
```

#### Propensity Score (Tabela)
```html
<div class="flex items-center gap-3">
  <div class="w-24 h-2 bg-surface-container-high rounded-full overflow-hidden">
    <div class="h-full bg-primary" style="width: 92%"></div>
  </div>
  <span class="text-sm font-black text-secondary font-montserrat">92</span>
</div>
```

### 8.8 Audit Rail (Componente Unico)

Linha vertical de 2px que sinaliza entradas "ativas" ou "novas" em listas:

```css
.audit-rail {
  border-left: 2px solid #10B981;  /* primary */
}
```

Uso: em activity feeds, trigger lists e table rows ativos.

### 8.9 Avatar Stack

```html
<div class="flex -space-x-2">
  <img class="w-6 h-6 rounded-full border-2 border-white object-cover" />
  <img class="w-6 h-6 rounded-full border-2 border-white object-cover" />
  <div class="w-6 h-6 rounded-full border-2 border-white bg-slate-100
              flex items-center justify-center text-[8px] font-bold text-slate-500">
    +139
  </div>
</div>
```

### 8.10 Filtros

```
bg-surface-container-low p-6 rounded-xl
flex flex-wrap items-center gap-6
```
- Label: `text-[10px] font-black text-secondary uppercase tracking-[0.1em] font-montserrat`
- Select: `bg-surface-container-lowest border-none rounded-md shadow-sm`
- Range slider: `accent-primary`
- Clear filters: botao tertiary ghost

### 8.11 Template Editor (Painel Lateral)

```
bg-surface-container-lowest p-8
border border-outline-variant shadow-sm
```
- Header com label `text-[10px] font-black uppercase tracking-widest text-primary`
- Labels de campo: `text-[10px] font-black uppercase tracking-widest text-tertiary`
- Variable chips: `px-3 py-1 bg-slate-100 text-[10px] font-bold text-secondary rounded uppercase`
- Footer: `border-t border-outline-variant` com Discard + Save

---

## 9. Patterns de Layout

### 9.1 Shell da Aplicacao

```
┌──────────┬────────────────────────────────────────┐
│          │  Top Bar (h-16, sticky)                │
│ Sidebar  ├────────────────────────────────────────┤
│ (w-64,   │                                        │
│  fixed)  │  Content Area                          │
│          │  (p-8 a p-10, max-w-7xl mx-auto)      │
│          │                                        │
│          │                                        │
└──────────┴────────────────────────────────────────┘
```

- Sidebar: `w-64 fixed left-0 top-0 h-screen z-50`
- Main: `ml-64 min-h-screen`

### 9.2 Page Header (Editorial Assimetrico)

```html
<div class="flex justify-between items-end">
  <div>
    <h3 class="text-[0.6875rem] font-black uppercase tracking-[0.2em] text-primary mb-2">
      Subtitulo / Categoria
    </h3>
    <h2 class="text-4xl font-bold text-secondary font-montserrat tracking-tight">
      Titulo Principal
    </h2>
  </div>
  <div class="flex space-x-3">
    <!-- Botoes de acao -->
  </div>
</div>
```

### 9.3 Bento Grid (KPIs)

```html
<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
  <!-- Card KPI 1 -->
  <!-- Card KPI 2 -->
  <!-- Card KPI 3 -->
</div>
```

### 9.4 Layout Assimetrico (Conteudo + Sidebar)

```html
<div class="grid grid-cols-12 gap-10">
  <section class="col-span-12 lg:col-span-7">
    <!-- Conteudo principal -->
  </section>
  <aside class="col-span-12 lg:col-span-5">
    <!-- Painel lateral -->
  </aside>
</div>
```

### 9.5 Layout de Chart (2/3 + 1/3)

```html
<div class="grid grid-cols-1 lg:grid-cols-3 gap-10">
  <div class="lg:col-span-2"><!-- Chart grande --></div>
  <div><!-- Lista/dados complementares --></div>
</div>
```

### 9.6 Kanban Board

```html
<div class="flex-1 overflow-x-auto px-8 pb-8">
  <div class="flex gap-6 h-full items-start">
    <!-- Colunas: min-w-[320px] max-w-[320px] -->
  </div>
</div>
```

### 9.7 Footer de Metricas

```html
<footer class="px-10 py-12 bg-surface-container-low
               grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-12
               border-t border-outline-variant">
  <!-- Metrica cards -->
</footer>
```

---

## 10. Estados e Interacoes

### 10.1 Hover States

| Elemento | Hover |
|----------|-------|
| Card KPI | Icone decorativo: `opacity-10 → opacity-20` |
| Card Kanban | `shadow-sm → shadow-md` + titulo muda cor |
| Item de lista | `bg → surface-container-high` (shift de cor, sem movimento) |
| Nav item | `text-slate-600 → text-secondary` + `bg-slate-200/50` |
| Botao primary | `opacity-90` |
| Botao FAB | `scale-110` |
| Link/texto | `underline` ou `text-secondary` |

### 10.2 Active/Click States

| Elemento | Active |
|----------|--------|
| Botao primary | `scale-95` |
| FAB | `scale-95` |
| Nav item ativo | `bg-white border-l-4 border-emerald-500 translate-x-1 shadow-sm` |

### 10.3 Focus States

| Elemento | Focus |
|----------|-------|
| Input | `ring-2 ring-primary` (ou `ring-secondary/20`) |
| Select | `ring-2 ring-secondary` |

### 10.4 Transicoes

```
transition-all duration-150   → Nav items
transition-colors             → Backgrounds e textos
transition-shadow             → Cards
transition-opacity            → Botoes, icones
```

### 10.5 Animacoes

#### Ping (Status Online)
```html
<div class="relative flex h-3 w-3">
  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
  <span class="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
</div>
```

#### Background Glow
```html
<div class="fixed bottom-0 right-0 w-[500px] h-[500px]
            bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none">
</div>
```

---

## 11. Paginas do Sistema

### 11.1 Dashboard de Leads
- **Page header** editorial assimetrico com subtitulo primary
- **Bento grid** 3 colunas com KPI cards (Total Leads, Conversion Rate, New Today)
- **Chart section** 2/3 + 1/3 (grafico de crescimento + lista de sources)
- **Activity feed** com audit rails e grid 3 colunas

### 11.2 Kanban de Vendas (Sales Pipeline)
- **Header** com titulo editorial + pipeline value + botao Add Lead
- **Board horizontal** scroll com colunas fixas (320px)
- **Colunas:** New Leads → Contacted → Proposal Sent → Negotiation → Closed Won
- **Column header:** dot colorido + label uppercase + counter badge
- **Cards** com source badge, empresa, valor, avatar stack

### 11.3 Diretorio de Leads
- **Hero section** com titulo split-color ("Institutional **Ledger**" com Ledger em primary)
- **Filtros** em barra horizontal com selects + range slider
- **Data table** com audit rail em rows ativos
- **Colunas:** Entity, Primary Contact, Engagement Status, Propensity Score, Last Interaction
- **Paginacao** numerada
- **Insight cards** em bento grid (Navy, White, Green)

### 11.4 Automacao de Mensagens
- **Layout** 7/5 colunas (triggers + editor lateral)
- **Trigger list** com icones, status badges, success rates
- **Queue Health** card escuro com indicadores visuais
- **Template editor** lateral com campos, variaveis e preview
- **Footer de metricas** com Messages Sent, Engagement Rate, System Status

---

## 12. Do's and Don'ts

### DO:
- Usar "espaco como estrutura" — `spacing-8` e `spacing-12` para agrupar
- Abracar assimetria — sidebar mais escura/pesada que conteudo
- Alinhar ao grid de `0.2rem` (spacing-1)
- Usar camadas tonais para hierarquia ao inves de sombras
- Labels sempre uppercase com tracking expandido
- Icones de tracos grossos, geometricos

### DON'T:
- Usar bordas 1px para criar containers
- Usar `rounded-full` em botoes (exceto FAB e avatares)
- Usar sombras com preto puro (tintar com Navy)
- Usar icones genericos/finos — manter peso visual compativel com Montserrat Bold
- Usar `<hr>` para separar itens — usar espacamento vertical
- Usar decoracao desnecessaria — cada elemento deve ser proposital

---

## 13. Tokens CSS Customizados

```css
/* Classe utilitaria para display KPI */
.text-editorial-display {
  font-size: 3.5rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
}

/* Audit Rail */
.audit-rail {
  border-left: 2px solid #10B981;
}

/* Glassmorphism */
.glass-panel {
  background: rgba(224, 227, 229, 0.8);
  backdrop-filter: blur(20px);
}

.glass-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
}

/* Custom scrollbar (para kanban) */
.custom-scrollbar::-webkit-scrollbar { height: 8px; }
.custom-scrollbar::-webkit-scrollbar-track { background: #f2f4f6; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
```

---

## 14. Tailwind Config Base

```javascript
tailwind.config = {
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#10B981",
        "secondary": "#1E3A8A",
        "tertiary": "#64748B",
        "error": "#ba1a1a",
        "surface": "#f7f9fb",
        "surface-container-low": "#f2f4f6",
        "surface-container": "#eceef0",
        "surface-container-high": "#e6e8ea",
        "surface-container-highest": "#e0e3e5",
        "surface-container-lowest": "#ffffff",
        "surface-dim": "#d8dadc",
        "surface-variant": "#e0e3e5",
        "on-surface": "#191c1e",
        "on-surface-variant": "#444651",
        "on-primary": "#ffffff",
        "on-secondary": "#ffffff",
        "on-error": "#ffffff",
        "primary-fixed": "#6ffbbe",
        "primary-fixed-dim": "#4edea3",
        "primary-container": "#d1fae5",
        "on-primary-container": "#27c38a",
        "secondary-container": "#8fa7fe",
        "secondary-fixed": "#dce1ff",
        "error-container": "#ffdad6",
        "on-error-container": "#93000a",
        "inverse-surface": "#2d3133",
        "inverse-primary": "#4edea3",
        "outline": "#757682",
        "outline-variant": "#c5c5d3",
      },
      fontFamily: {
        "montserrat": ["Montserrat", "sans-serif"],
        "inter": ["Inter", "sans-serif"],
        "headline": ["Montserrat", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "label": ["Inter", "sans-serif"],
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "md": "0.375rem",
        "lg": "0.5rem",
        "xl": "0.75rem",
        "full": "9999px",
      },
    },
  },
}
```

---

## 15. Responsividade

| Breakpoint | Comportamento |
|------------|---------------|
| `< md` (< 768px) | Grid 1 coluna, sidebar colapsa, kanban scroll horizontal |
| `md` (768px+) | Grid 2-3 colunas para KPIs e insights |
| `lg` (1024px+) | Layout completo: sidebar + content, grid 12 colunas |
| `xl` (1280px+) | `max-w-7xl mx-auto` para conteudo centralizado |

---

*Design System v1.0 — Baseado nas referencias visuais Velocity Pro*
*Documento de referencia para toda a construcao do sistema*
