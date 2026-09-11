// This Japanese Adobe Fonts project uses dynamic subsetting, not a CSS embed.
// Keep the page visible in its existing fallback fonts while the kit loads.
(function () {
  var kit = document.createElement('script');
  kit.src = 'https://use.typekit.net/aym8vre.js';
  kit.async = true;
  kit.onload = function () {
    if (window.Typekit) {
      try { window.Typekit.load({ async: true }); } catch (error) { /* Keep fallbacks. */ }
    }
  };
  document.head.appendChild(kit);
})();
