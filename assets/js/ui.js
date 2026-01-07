(function (window, document) {

    var layout   = document.getElementById('layout'),
        menu     = document.getElementById('menu'),
        menuLink = document.querySelector('[data-js="menu-toggle"]'),
        content  = document.getElementById('main'),
        body = document.body;

    if (!layout || !menu || !content) {
        return;
    }

    function toggleClass(element, className) {
        var classes = element.className.split(/\s+/),
            length = classes.length,
            i = 0;

        for(; i < length; i++) {
          if (classes[i] === className) {
            classes.splice(i, 1);
            break;
          }
        }
        // The className is not found
        if (length === classes.length) {
            classes.push(className);
        }

        element.className = classes.join(' ');
    }

    function toggleAll(e) {
        var active = 'active';

        e.preventDefault();
        toggleClass(layout,active);
        toggleClass(menu,active);
        if (menuLink) {
            toggleClass(menuLink,active);
        }
        toggleClass(body,active);
    }

    if (menuLink) {
        menuLink.onclick = function (e) {
            toggleAll(e);
            body.classList.add("menuTransition");
                setTimeout(function() {
                    body.classList.remove("menuTransition");
                }, 1000);
        };
    }

    content.onclick = function(e) {
        if (menu.className.indexOf('active') !== -1) {
            toggleAll(e);
        }
    };

}(this, this.document));
