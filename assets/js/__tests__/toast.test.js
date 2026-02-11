describe('toast', () => {
  function loadToastModule() {
    jest.isolateModules(() => {
      require('../toast.js');
    });
  }

  function createTouchEvent(type, x, y) {
    var event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'changedTouches', {
      configurable: true,
      value: [{ clientX: x, clientY: y }]
    });
    return event;
  }

  beforeEach(() => {
    jest.resetModules();
    document.body.innerHTML = '';
    delete window.Toast;
  });

  test('uses fallback sprite path when no existing sprite reference is found', () => {
    loadToastModule();

    window.Toast.show('Grid', 'On', { icon: 'icon-grid-micro', duration: 10000 });

    var useEl = document.querySelector('.toast .toast__icon use');
    expect(useEl).toBeTruthy();
    expect(useEl.getAttribute('href')).toBe('/img/svg/sprite.svg?v=20260211b#icon-grid-micro');
  });

  test('resolves sprite path from existing xlink:href usage', () => {
    document.body.innerHTML = '<svg><use xlink:href="/custom/sprite.svg#icon-mode-micro"></use></svg>';
    loadToastModule();

    window.Toast.show('Grid', 'On', { icon: 'icon-grid-micro', duration: 10000 });

    var useEl = document.querySelector('.toast .toast__icon use');
    expect(useEl).toBeTruthy();
    expect(useEl.getAttribute('href')).toBe('/custom/sprite.svg#icon-grid-micro');
  });

  test('adds no-icon class when toast icon is omitted', () => {
    loadToastModule();

    window.Toast.show('Mode', 'Dark', { duration: 10000 });

    var toastEl = document.querySelector('.toast');
    expect(toastEl).toBeTruthy();
    expect(toastEl.classList.contains('toast--no-icon')).toBe(true);
  });

  test('dismisses toast on swipe up gesture', () => {
    loadToastModule();
    window.Toast.show('Grid', 'On', { icon: 'icon-grid-micro', duration: 10000 });

    var toastEl = document.querySelector('.toast');
    expect(toastEl.classList.contains('toast--visible')).toBe(true);

    toastEl.dispatchEvent(createTouchEvent('touchstart', 20, 120));
    toastEl.dispatchEvent(createTouchEvent('touchmove', 22, 70));
    toastEl.dispatchEvent(createTouchEvent('touchend', 22, 60));

    expect(toastEl.classList.contains('toast--hiding')).toBe(true);
    expect(toastEl.classList.contains('toast--visible')).toBe(false);
  });
});
