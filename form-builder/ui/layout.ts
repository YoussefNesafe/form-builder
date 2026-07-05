// Flat controls: no shadows, no ring halos — states communicate via border
// color only. The important var override outbeats focus-visible ring
// utilities. Shared so the mandated flat style cannot drift between the
// renderer and the stepper.
export const FLAT_GRID_CLASS =
  "grid grid-cols-12 gap-[16px] tablet:gap-[16px] desktop:gap-[16px] [&_*]:shadow-none [&_*]:[--tw-ring-shadow:0_0_#0000]!";
