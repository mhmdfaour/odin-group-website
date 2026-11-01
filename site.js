// Home-page filter, copy-SHA button, scroll reveal, parallax and header progress. The site works without this file.
(function () {
  var root = document.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduce) {
    root.classList.add('js');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    document.querySelectorAll('[data-reveal]').forEach(function (el) { io.observe(el); });
  }

  var header = document.querySelector('.site-header');
  var depthEls = reduce ? [] : document.querySelectorAll('[data-depth]');
  depthEls.forEach(function (el) { el.style.setProperty('--d', el.dataset.depth); });
  var ticking = false;
  function frame() {
    ticking = false;
    var y = window.scrollY || 0;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    root.style.setProperty('--sy', y);
    if (header) {
      header.classList.toggle('scrolled', y > 24);
      header.style.setProperty('--progress', max > 0 ? Math.min(1, y / max) : 0);
    }
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(frame); } }, { passive: true });
  frame();

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
