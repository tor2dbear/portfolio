window.matchMedia('(orientation: portrait)').addListener(function(m) {
    let layoutRot   = document.getElementById('layout');
    let menuRot     = document.getElementById('menu');
    let contentRot  = document.getElementById('main');
    let bodyRot = document.body;
    if (m.matches) {
            layoutRot.classList.add('portrait');
            layoutRot.classList.remove('landscape');
         } else {
            layoutRot.classList.add('landscape');
            layoutRot.classList.remove('portrait');
            layoutRot.classList.remove('active');
            menuRot.classList.remove('active');
            contentRot.classList.remove('active');
            bodyRot.classList.remove('active');
         }
 });