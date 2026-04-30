---
name: leadtrack-design
description: Use this skill to generate well-branded interfaces and assets for LeadTrack Pro, either for production or throwaway prototypes/mocks. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping a modern CRM for AI-assisted lead management.
user-invocable: true
---

Read the README.md file within this skill, and explore the other available files. The key tokens live in `colors_and_type.css`; the UI kit (sidebar, kanban, cards, buttons, etc.) lives in `ui_kits/leadtrack/`.

If creating visual artifacts (slides, mocks, throwaway prototypes, etc), copy assets out and create static HTML files for the user to view. Link `colors_and_type.css` and the Google Fonts CDN (Geist + Instrument Serif + Geist Mono) at the top of each file. For iconography, use Lucide via CDN.

If working on production code, copy the tokens into the project's Tailwind config (or equivalent), and read the rules in the README to become an expert in designing with this brand.

If the user invokes this skill without any other guidance, ask them what they want to build or design, ask a few clarifying questions (which screen? data-dense or marketing-style? dark mode or light?), and act as an expert designer who outputs HTML artifacts or production code, depending on the need.

**North star:** "Calm Intelligence" — data-dense CRM that feels modern without AI-slop tropes (no purple-blue gradients, no emoji cards, no left-border-accent boxes). Use violet `#6d43f5` disciplined and sparingly. Use Instrument Serif italic as editorial punctuation, never as body text.
