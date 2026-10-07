# Generated backgrounds and public-page redesign

## Visual changes
- Generate three cinematic images: a sport-neutral arena, basketball court and football pitch. Export compressed desktop/mobile WebP versions and tiny blurred placeholders.
- Restore subtle fixed dashboard atmosphere behind the existing solid panels, with theme-aware scrims and one load fade. No dashboard parallax.
- Redesign owner and coach sign-in screens using the existing logo, blue accent and local Noto fonts. Move all existing feature/trust copy below the owner sign-in hero, retain both sign-in actions, and add reduced-motion-aware entrances, background drift and fine-pointer motion.
- Restyle both public registration URLs through their shared form into system-themed iPhone-style grouped sections, segmented choices, a compact scroll-linked header and sticky submit bar.

## Preservation decisions
- Keep all routes, URLs, head/SEO metadata, fields, field order, validation, submit rules, API calls, authentication and database unchanged. Do not publish.
- The current public form has no sibling controls. Do not introduce new sibling fields or actions under the hard field/functionality freeze.
- Keep existing validation and submit eligibility rather than introducing new disabled-until-valid rules. Restyle existing errors without changing when they appear.
- Preserve all existing six-language copy. Replace visible em-dashes with hyphens; relocate lengthy supporting copy below the hero and use existing short copy in the hero.

## Technical approach
- Add reusable presentation-only background, public appearance and motion helpers. Reuse installed Motion and shared Button/Input components.
- Scope public tokens to these pages; leave dashboard surfaces unchanged. Dynamically preload only the current image variant without editing route head metadata.
- Remove old assets only after confirming no remaining references.

## Checks
- Read-only desktop/mobile checks, including 360px and 390×844, system light/dark and reduced motion. Block write requests and never submit either form.
- Check asset sizes, overflow, image loading, Georgian buttons, preview errors and unchanged metadata/logic.