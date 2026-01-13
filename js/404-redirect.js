/**
 * 404 Language Redirect
 *
 * GitHub Pages only serves /404.html for all 404 errors.
 * This script redirects to the correct language-specific 404 page
 * based on the original URL path.
 */
(function() {
  var path = window.location.pathname;

  // Check if we're on the root 404.html and the original path was Swedish
  if (path.startsWith('/sv/') && !path.endsWith('/404.html')) {
    // Redirect to Swedish 404
    window.location.replace('/sv/404.html');
  }
})();
