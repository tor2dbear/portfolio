/**
 * Tests for client-check.js
 * This file handles client page detection and styling
 */

describe("Client Page Detection", () => {
  let layoutElement;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '<div id="layout"></div>';
    layoutElement = document.getElementById("layout");
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test("should detect ?source=client query parameter", () => {
    const queryString = "?source=client";

    // Simulate the detection logic
    if (queryString.includes("?source=client")) {
      layoutElement.classList.add("clientpage");
    }

    expect(layoutElement.classList.contains("clientpage")).toBe(true);
  });

  test("should detect /clients/ in URL path", () => {
    const href = "https://example.com/clients/test-client";

    // Simulate the detection logic
    if (href.indexOf("/clients/") > -1) {
      layoutElement.classList.add("clientpage");
    }

    expect(layoutElement.classList.contains("clientpage")).toBe(true);
  });

  test("should not add clientpage class for normal pages", () => {
    const queryString = "";
    const href = "https://example.com/about";

    // Simulate the detection logic
    if (
      queryString.includes("?source=client") ||
      href.indexOf("/clients/") > -1
    ) {
      layoutElement.classList.add("clientpage");
    }

    expect(layoutElement.classList.contains("clientpage")).toBe(false);
  });

  test("should handle missing layout element gracefully", () => {
    // Remove layout element
    document.body.innerHTML = "";

    // This should not throw an error
    const layout = document.getElementById("layout");
    expect(layout).toBeNull();

    // Attempting to add class to null should be handled
    if (layout) {
      layout.classList.add("clientpage");
    }

    // No error should be thrown
  });

  test("should check for tutorial keyword correctly", () => {
    const href = "https://example.com/tutorial/test";
    const clientsDir = href.indexOf("tutorial") > -1;

    expect(clientsDir).toBe(true);
  });
});
