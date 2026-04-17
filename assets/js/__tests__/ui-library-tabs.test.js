describe('ui-library tabs', () => {
  function loadModule() {
    jest.isolateModules(() => {
      require('../ui-library-tabs.js');
      require('../tabs.js');
    });
  }

  beforeEach(() => {
    jest.resetModules();
    document.body.innerHTML = `
      <div class="ui-library__tabs" data-js="tabs" data-ui-library-tabs>
        <nav class="tabs-nav" role="tablist">
          <button
            type="button"
            id="tab-tokens"
            class="tab-button is-active"
            data-tab="tokens"
            role="tab"
            aria-selected="true"
            aria-controls="panel-tokens"
          >
            Tokens
          </button>
          <button
            type="button"
            id="tab-grid"
            class="tab-button"
            data-tab="grid"
            role="tab"
            aria-selected="false"
            aria-controls="panel-grid"
          >
            Grid
          </button>
          <button
            type="button"
            id="tab-components"
            class="tab-button"
            data-tab="components"
            role="tab"
            aria-selected="false"
            aria-controls="panel-components"
          >
            Components
          </button>
        </nav>
        <div class="tabs-content">
          <div id="panel-tokens" class="tab-panel is-active" data-panel="tokens" role="tabpanel">
            <details class="accordion" data-sort="b"></details>
            <details class="accordion" data-sort="a"></details>
          </div>
          <div id="panel-grid" class="tab-panel" data-panel="grid" role="tabpanel">
            <details class="accordion" data-sort="c"></details>
          </div>
          <div id="panel-components" class="tab-panel" data-panel="components" role="tabpanel">
            <details class="accordion" data-sort="d"></details>
          </div>
        </div>
      </div>
    `;

  });

  test('switches the active ui-library panel after top-level tab switch', () => {
    loadModule();

    document.getElementById('tab-grid').click();

    expect(document.getElementById('panel-grid').classList.contains('is-active')).toBe(true);
    expect(document.getElementById('panel-tokens').classList.contains('is-active')).toBe(false);
  });
});
