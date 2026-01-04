/**
 * Example test file demonstrating Jest and jsdom setup
 * This file can be used as a template for writing new tests
 */

describe("Test Environment Setup", () => {
  test("should have access to DOM", () => {
    const element = document.createElement("div");
    element.textContent = "Hello, World!";
    expect(element.textContent).toBe("Hello, World!");
  });

  test("should have localStorage mocked", () => {
    localStorage.setItem("test", "value");
    // Verify it was called
    expect(localStorage.setItem).toBeDefined();

    // Get item should also be defined
    localStorage.getItem("test");
    expect(localStorage.getItem).toBeDefined();
  });

  test("should have window.matchMedia mocked", () => {
    const mediaQuery = window.matchMedia("(max-width: 768px)");
    expect(mediaQuery).toBeDefined();
    expect(mediaQuery.matches).toBe(false);
    expect(typeof mediaQuery.addEventListener).toBe("function");
  });

  test("should have fetch mocked", () => {
    expect(fetch).toBeDefined();
    expect(typeof fetch).toBe("function");
  });
});

describe("Example DOM Manipulation Tests", () => {
  beforeEach(() => {
    // Setup fresh DOM before each test
    document.body.innerHTML = `
      <div id="app">
        <button id="testButton">Click me</button>
        <div id="output"></div>
      </div>
    `;
  });

  test("should find elements by ID", () => {
    const button = document.getElementById("testButton");
    expect(button).toBeDefined();
    expect(button.textContent).toBe("Click me");
  });

  test("should handle click events", () => {
    const button = document.getElementById("testButton");
    const output = document.getElementById("output");

    button.addEventListener("click", () => {
      output.textContent = "Button clicked!";
    });

    button.click();
    expect(output.textContent).toBe("Button clicked!");
  });

  test("should manipulate classes", () => {
    const button = document.getElementById("testButton");

    button.classList.add("active");
    expect(button.classList.contains("active")).toBe(true);

    button.classList.remove("active");
    expect(button.classList.contains("active")).toBe(false);
  });
});
