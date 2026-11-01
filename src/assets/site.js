// Home-page filter and copy-SHA button. The site works without this file.
(function () {
  var bar = document.querySelector('[data-filters]');
  if (bar) {
    bar.hidden = false;
    var cards = document.querySelectorAll('[data-type]');
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button[data-filter]');
      if (!b) return;
      bar.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      cards.forEach(function (c) { c.hidden = b.dataset.filter !== 'all' && c.dataset.type !== b.dataset.filter; });
    });
  }
  document.querySelectorAll('button[data-copy]').forEach(function (b) { b.hidden = false; });
  document.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-copy]');
    if (!b || !navigator.clipboard) return;
    navigator.clipboard.writeText(b.dataset.copy).then(function () {
      var old = b.textContent;
      b.textContent = 'Copied';
      setTimeout(function () { b.textContent = old; }, 1500);
    });
  });
})();
