$('.navbar').on('click', 'a[href^="#"]', function (event) {
    event.preventDefault();

    $('html, body').animate({
        scrollTop: $($.attr(this, 'href')).offset().top
    }, 500);
});

const Honeybadger = require("path/to/honeybadger");
Honeybadger.configure({
  apiKey: '039edf52'
});