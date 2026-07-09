/**
 * Toolchain guard: coverage instrumentation path
 *
 * Regression test for the `minimatch is not a function` class of bug.
 *
 * Background: a global `minimatch@10` override left `test-exclude@6` calling
 * the v10 namespace object as a function, so any run of `jest --coverage`
 * threw before a single line was instrumented. The fix upgraded the consumer
 * to `test-exclude@7`. Nothing exercised that path in the suite, so the break
 * only surfaced when someone happened to run coverage locally.
 *
 * This test drives `test-exclude` directly — the same library Jest/istanbul
 * use to decide which files to instrument — using this project's real
 * `collectCoverageFrom` globs. If the minimatch <-> test-exclude wiring ever
 * regresses again, `shouldInstrument` throws here instead of silently only
 * inside `npm run test:coverage`.
 */

const path = require("path");
const TestExclude = require("test-exclude");
const jestConfig = require("../jest.config.js");

describe("coverage instrumentation toolchain", () => {
  // Mirror Jest's own coverage selection so this guards the real path.
  const exclude = new TestExclude({
    include: jestConfig.collectCoverageFrom,
    // istanbul/jest resolve against the project root
    cwd: path.resolve(__dirname, ".."),
  });

  test("shouldInstrument is callable (minimatch resolves as a function)", () => {
    // The bug manifested as a TypeError the moment shouldInstrument ran, so
    // simply invoking it without throwing is the core assertion.
    expect(typeof exclude.shouldInstrument).toBe("function");
    expect(() =>
      exclude.shouldInstrument(path.resolve(__dirname, "../assets/js/ui.js"))
    ).not.toThrow();
  });

  test("instruments source JS but not tests, minified, or non-source files", () => {
    const root = path.resolve(__dirname, "..");
    const abs = (rel) => path.resolve(root, rel);

    // Included by collectCoverageFrom → instrumented
    expect(exclude.shouldInstrument(abs("assets/js/ui.js"))).toBe(true);

    // Excluded by the `!assets/js/**/*.min.js` glob
    expect(exclude.shouldInstrument(abs("assets/js/vendor.min.js"))).toBe(
      false
    );

    // Outside the include globs entirely
    expect(exclude.shouldInstrument(abs("assets/css/foo.css"))).toBe(false);
    expect(exclude.shouldInstrument(abs("scripts/quality/gate.mjs"))).toBe(
      false
    );
  });
});
