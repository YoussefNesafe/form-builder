// Flat controls: no shadows, no ring halos — states communicate via border
// color only. The important var override outbeats focus-visible ring
// utilities. Shared so the mandated flat style cannot drift between the
// renderer and the stepper.
export const FLAT_GRID_CLASS =
  "grid grid-cols-12 gap-[var(--fb-space-8,4.272vw)] tablet:gap-[var(--fb-space-8-tablet,2vw)] desktop:gap-[var(--fb-space-8-desktop,0.832vw)] [&_*]:shadow-none [&_*]:[--tw-ring-shadow:0_0_#0000]!";
