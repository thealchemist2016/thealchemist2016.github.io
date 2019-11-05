$(".navbar").on("click", 'a[href^="#"]', function(event) {
  event.preventDefault();

  $("html, body").animate(
    {
      scrollTop: $($.attr(this, "href")).offset().top
    },
    500
  );
});

import { configure } from "path/to/honeybadger";
configure({
  apiKey: "039edf52"
});
