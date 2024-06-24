function onSubmit(token) {
    var form = document.getElementById("contact-form");
    form.submit();
}

document.addEventListener('DOMContentLoaded', function() {
    grecaptcha.ready(function() {
        document.querySelector('.g-recaptcha').addEventListener('click', function(event) {
            event.preventDefault();
            grecaptcha.execute('6LeDDAAqAAAAAHLkCglixFS15w54eLJyTocW4k7U', {action: 'submit'}).then(function(token) {
                document.getElementById('recaptchaToken').value = token;
                var form = document.getElementById('contact-form');
                var xhr = new XMLHttpRequest();
                xhr.open("POST", form.action, true);
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                xhr.onload = function() {
                    if (xhr.status >= 200 && xhr.status < 400) {
                        // Successful form submission
                        window.location.href = thankYouURL;
                    } else {
                        // Handle error
                        alert('Form submission failed. Please try again.');
                    }
                };
                xhr.send(new URLSearchParams(new FormData(form)).toString());
            });
        });
    });
});