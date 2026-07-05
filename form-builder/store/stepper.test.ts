import { describe, expect, it } from "vitest";
import { createStepperStore } from "./stepper";

describe("createStepperStore", () => {
  it("starts at step 0", () => {
    expect(createStepperStore(3).getState().step).toBe(0);
  });

  it("next increments up to last step", () => {
    const store = createStepperStore(3);
    store.getState().next();
    store.getState().next();
    store.getState().next();
    expect(store.getState().step).toBe(2);
  });

  it("prev floors at 0", () => {
    const store = createStepperStore(3);
    store.getState().prev();
    expect(store.getState().step).toBe(0);
  });

  it("goTo clamps into range", () => {
    const store = createStepperStore(3);
    store.getState().goTo(99);
    expect(store.getState().step).toBe(2);
    store.getState().goTo(-5);
    expect(store.getState().step).toBe(0);
  });

  it("reset returns to 0", () => {
    const store = createStepperStore(3);
    store.getState().goTo(2);
    store.getState().reset();
    expect(store.getState().step).toBe(0);
  });
});
