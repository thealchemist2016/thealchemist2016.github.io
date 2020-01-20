$('.hamburger').on('click', function () {

  $('.menu').toggleClass('open');
  
  });
  
  $( '.menu a' ).on("click", function(){
  $('.menu').hide();
  });

import { configure } from "path/to/honeybadger";
configure({
  apiKey: "039edf52"
});

function externalLinks() { for(var c = document.getElementsByTagName("a"),  a = 0;a < c.length;a++) { var b = c[a]; b.getAttribute("href") && b.hostname !== location.hostname && (b.target = "_blank") } } ; externalLinks();

Read //html.com/attributes/a-target/#s