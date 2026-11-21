'use strict'; // esta linha deve ser a primeira do ficheiro, para que o modo estrito se aplique a todo o script. esse modo evita erros silenciosos e permite otimizações do motor de JavaScript.
(function () {
  // Número de WhatsApp: só dígitos com indicativo, sem + nem espaços (ex.: 244900000000).
  let WA_NUMBER = '244939417862';

  let root = document.documentElement;
  root.classList.add('js');
  let $ = function (s, c) {
    return (c || document).querySelector(s);
  };
  let $$ = function (s, c) {
    return Array.prototype.slice.call((c || document).querySelectorAll(s));
  };
  let reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Ano no rodapé (textContent: nunca innerHTML).
  let ano = $('#ano'); if (ano) ano.textContent = new Date().getFullYear();

  // WhatsApp: valida o número e codifica a mensagem; sem número válido, esconde o botão fixo.
  let valido = /^\d{8,15}$/.test(WA_NUMBER);
  $$('[data-wa]').forEach(function (a) {
    if (valido) {
      a.href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(a.getAttribute('data-wa'));
      a.target = '_blank'; a.rel = 'noopener noreferrer';
    } else {
      a.addEventListener('click', function (e) {
        e.preventDefault();
        let n = $('.wa-note');
        if (n) n.hidden = false;
        $('#contactos').scrollIntoView();
      });
    }
  });
  if (!valido) { let f = $('.wa-fixed'); if (f) f.hidden = true; }

  // Menu móvel
  let burger = $('.burger'), menu = $('#menu');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    menu.classList.toggle('open', open);
  }
  burger.addEventListener('click', function () {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });
  $$('a', menu).forEach(function (a) {
    a.addEventListener('click', function () {
      setMenu(false);
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      setMenu(false);
      burger.focus({
        preventScroll: true
      });
    }
  });

  // Hero: progresso do scroll (0 a 1) para a transição do claro para o escuro.
  let hero = $('.hero'), ticking = false;
  function update() {
    let p = reduce ? 0 : Math.min(1, Math.max(0, window.scrollY / (hero.offsetHeight * 0.7)));
    hero.style.setProperty('--p', p.toFixed(3)); ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) {
      ticking = true; requestAnimationFrame(update);
    }
  }, {
    passive: true
  });
  update();

  // Revelação ao entrar no ecrã, com pequenos atrasos em sequência.
  let rv = $$('.rv');
  if ('IntersectionObserver' in window && !reduce) {
    let io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (!en.isIntersecting) return;
        let sib = $$('.rv', en.target.parentElement).indexOf(en.target);
        en.target.style.setProperty('--d', Math.max(0, sib) * 0.12 + 's');
        en.target.classList.add('in'); io.unobserve(en.target);
        (function (el) {
          setTimeout(function () {
            el.style.setProperty('--d', '0s');
          }, 1800);
        })(en.target);
      });
    }, { threshold: 0.15 });
    rv.forEach(function (el) {
      io.observe(el);
    });
  } else {
    rv.forEach(function (el) {
      el.classList.add('in');
    });
  }

  // Link ativo no menu
  let links = $$('a', menu);
  if ('IntersectionObserver' in window) {
    let so = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) links.forEach(function (l) {
          l.classList.toggle('on', l.getAttribute('href') === '#' + en.target.id);
        });
      });
    }, {
      rootMargin: '-45% 0px -50% 0px'
    });
    $$('main section[id]').forEach(function (s) {
      so.observe(s);
    });
  }

  // Lightbox (<dialog>: foco e Escape tratados pelo navegador)
  let lb = $('.lb'), lbImg = $('img', lb), items = $$('[data-full]'), cur = 0, ultimo = null;
  function show(i) {
    cur = (i + items.length) % items.length;
    let src = items[cur].getAttribute('data-full');
    if (!/^img\/[\w\-./]+$/.test(src)) return;     // só imagens locais
    lbImg.src = src; lbImg.alt = items[cur].getAttribute('data-alt') || '';
  }
  items.forEach(function (b, i) { b.addEventListener('click', function () { ultimo = b; show(i); if (lb.showModal) lb.showModal(); }); });
  $('.lb__x').addEventListener('click', function () { lb.close(); });
  $('.lb__p').addEventListener('click', function () { show(cur - 1); });
  $('.lb__n').addEventListener('click', function () { show(cur + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb) lb.close(); });
  lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') show(cur - 1); if (e.key === 'ArrowRight') show(cur + 1); });
  lb.addEventListener('close', function () { if (ultimo) ultimo.focus(); });

  // Fotos horizontais revelam-se da esquerda para a direita (as verticais, de baixo para cima).
  $$('[data-orientacao]').forEach(function (f) {
    let img = $('img', f); if (!img) return;
    function a() { if (img.naturalWidth > img.naturalHeight) f.classList.add('rv--h'); }
    if (img.complete) a(); else img.addEventListener('load', a);
  });

  // Galeria: cada obra só começa quando a anterior terminou a sua animação.
  let obras = $$('.obra'), fila = [], ocupado = false;
  function proxima() {
    if (ocupado || !fila.length) return;
    let o = fila.shift(), foto = $('.obra__foto', o); ocupado = true;
    function fim() { if (!ocupado) return; ocupado = false; proxima(); }
    foto.addEventListener('transitionend', function h(e) { if (e.propertyName === 'clip-path') { foto.removeEventListener('transitionend', h); fim(); } });
    setTimeout(fim, 1800);
    o.classList.add('in');
  }
  if ('IntersectionObserver' in window && !reduce) {
    let go = new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (!en.isIntersecting) return; fila.push(en.target); go.unobserve(en.target); });
      fila.sort(function (a, b) { return obras.indexOf(a) - obras.indexOf(b); }); proxima();
    }, { threshold: 0.3 });
    obras.forEach(function (o) { go.observe(o); });
  } else { obras.forEach(function (o) { o.classList.add('in'); }); }

  // Botões do WhatsApp: feedback visual curto ao clicar.
  $$('[data-wa]').forEach(function (a) {
    a.addEventListener('click', function () { a.classList.add('is-loading'); setTimeout(function () { a.classList.remove('is-loading'); }, 900); });
  });
})();
