/**
 * Settings bottom-sheet detents (settings-dropdown.js): the pure decision that
 * maps a released drag's proposed sheet height to dismiss / expand / rest.
 * The sheet follows the finger between the rest and full heights; on release it
 * settles to the nearest detent (or dismisses when pulled well below rest).
 */
describe("settings sheet detent target", () => {
  let decideSheetTarget;

  beforeAll(() => {
    jest.isolateModules(() => {
      require("../settings-dropdown.js");
    });
    decideSheetTarget = window.__settingsSheetInternals.decideSheetTarget;
  });

  const REST = 500; // resting detent height (px)
  const FULL = 800; // expanded detent height (px)
  const DISMISS = 120; // dismiss threshold below rest (px) → dismiss at <= 380
  // midpoint between rest and full = 650

  test("pulled well below rest dismisses", () => {
    expect(decideSheetTarget(360, REST, FULL, DISMISS)).toBe("dismiss");
  });

  test("just below rest but within the dismiss threshold settles at rest", () => {
    expect(decideSheetTarget(420, REST, FULL, DISMISS)).toBe("rest");
  });

  test("held at the resting height settles at rest", () => {
    expect(decideSheetTarget(500, REST, FULL, DISMISS)).toBe("rest");
  });

  test("below the midpoint settles at rest (snap back / collapse)", () => {
    expect(decideSheetTarget(600, REST, FULL, DISMISS)).toBe("rest");
  });

  test("at the midpoint expands", () => {
    expect(decideSheetTarget(650, REST, FULL, DISMISS)).toBe("expand");
  });

  test("near full height expands", () => {
    expect(decideSheetTarget(790, REST, FULL, DISMISS)).toBe("expand");
  });
});
