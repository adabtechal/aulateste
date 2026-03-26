# Design System Strategy: The Architectural Ledger

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Architectural Ledger."** 

Moving away from the ephemeral, "floaty" aesthetic of generic SaaS, this system is rooted in structural integrity and FinTech precision. It treats the interface as a physical workspace—think of high-end drafting tables and premium archival paper. We achieve a "high-end editorial" feel not through decorative flourishes, but through intentional asymmetry, extreme typographic hierarchy, and tectonic layering. Every element must feel heavy, purposeful, and permanent.

The goal is to provide users with a sense of "Information Authority," where data isn't just displayed; it is curated within a robust, professional framework.

---

## 2. Colors & Tonal Architecture
The palette is built on a foundation of professional trust (Navy and Slate) punctuated by high-velocity kinetic energy (Action Green).

- **Primary (`#10B981`):** Reserved exclusively for "success" states and the singular most important action on a screen. Use `primary_container` for subtle highlights.
- **Secondary (`#1E3A8A`):** The "Executive Navy." Used for navigation, headers, and elements that require an authoritative presence.
- **Tertiary (`#64748B`):** The "Utility Slate." Used for secondary information, metadata, and supporting structural elements.

### The "No-Line" Rule
Standard CRM interfaces are cluttered with 1px borders that create visual noise. This design system **prohibits** 1px solid borders for sectioning. Boundaries must be defined solely through background color shifts.
- To separate a sidebar from a content area, use `surface_container_low` against a `surface` background.
- To define a header, use a subtle tonal shift rather than a stroke.

### Surface Hierarchy & Nesting
Treat the UI as a series of nested layers. 
- **Base:** `surface` (#f7f9fb)
- **Primary Layout Blocks:** `surface_container_low`
- **Interactive Cards:** `surface_container_lowest` (pure white) to create a "lift" effect without shadows.

### The Glass & Gradient Rule
For floating elements like modals or dropdowns, use Glassmorphism. Apply a `surface_container_highest` color at 80% opacity with a `20px` backdrop blur. For primary CTAs, apply a subtle linear gradient from `primary` to `primary_container` at a 135-degree angle to give the button a "machined" metallic finish.

---

## 3. Typography: The Montserrat Manifesto
We use **Montserrat** exclusively. Its geometric purity lends itself to a robust, FinTech-forward aesthetic. To achieve an editorial feel, we use high-contrast scaling.

- **Display (3.5rem, Bold):** Used for "Big Data" moments—total revenue, lead counts, or hero headlines. Negative letter-spacing (-0.02em) is required.
- **Headline (1.5rem - 2rem, SemiBold):** Used for section titles. These should feel like newspaper mastheads—authoritative and clear.
- **Body (0.875rem, Regular):** The workhorse. Increased line-height (1.6) ensures readability in data-heavy CRM tables.
- **Labels (0.6875rem, ExtraBold, Uppercase):** Used for table headers and small metadata. Increased letter-spacing (+0.05em) ensures these "technical" snippets feel intentional and distinct from body copy.

---

## 4. Elevation & Depth
Depth in this system is achieved through **Tonal Layering** rather than traditional drop shadows.

### The Layering Principle
Hierarchy is established by stacking surface tiers. A `surface_container_lowest` card sitting on a `surface_container_low` background provides enough contrast to signify elevation without visual clutter.

### Ambient Shadows
Shadows are only permitted for "Floating" elements (Modals, Tooltips). 
- **Value:** `0px 12px 32px`
- **Color:** Use the `on_surface` color at 6% opacity. Never use pure black for shadows; tint the shadow with the Navy (`#1E3A8A`) to keep it harmonious with the palette.

### The Ghost Border Fallback
If accessibility requires a border, use a "Ghost Border." Use the `outline_variant` token at 15% opacity. It should be felt, not seen.

---

## 5. Components

### Buttons (Roundness: 0.375rem / md)
- **Primary:** Action Green (#10B981) with White text. Bold weight. No border.
- **Secondary:** Surface-container-high background with Navy text.
- **Tertiary:** No background. Navy text with an underline that appears only on hover.

### Input Fields
- **Default State:** `surface_container_highest` background. No border. Sharp corners (`sm` or `md`).
- **Focus State:** 2px solid `secondary` (Navy).
- **Validation:** Error states use `error` (#ba1a1a) but only as a bottom-border "accent" to maintain the structural integrity of the field.

### Cards & Data Lists
- **No Dividers:** Forbid the use of horizontal rules. Use `spacing-6` (1.3rem) of vertical white space to separate items.
- **Hover State:** When hovering over a list item, shift the background to `surface_container_high`. Do not move the element or add a shadow; the color shift is sufficient.

### High-End Detail: The "Audit Rail"
A unique component for this system: A thin vertical accent line (2px) using `primary_fixed` that sits to the left of "active" or "new" data entries in a list, signaling urgency without using loud icons.

---

## 6. Do's and Don'ts

### Do:
- **Use "Space as Structure":** Rely on the Spacing Scale (specifically `spacing-8` and `spacing-12`) to group elements.
- **Embrace Asymmetry:** In dashboards, allow the left column (navigation/filters) to feel "heavier" (darker surface) than the right column (content/data).
- **Align to the Grid:** Every element must align to the `0.2rem` (spacing-1) increments.

### Don't:
- **Don't use 1px Borders:** Never use them to create containers. Use background color shifts.
- **Don't use Rounded-Full:** Avoid "pills" or circular buttons unless they are icons. Maintain the "Sharp to Medium" (ROUND_FOUR) aesthetic to keep the professional, FinTech tone.
- **Don't use generic AI icons:** Use thick-stroke, geometric iconography that matches the weight of Montserrat Bold.

---

## 7. Spacing Reference
Use the following scale for all layouts to ensure the "Editorial" breathing room:
- **Tight (Information):** `0.4rem` (spacing-2)
- **Standard (Components):** `0.9rem` (spacing-4)
- **Sectional (Layout):** `2.25rem` (spacing-10)
- **Hero (Editorial):** `4.5rem` (spacing-20)