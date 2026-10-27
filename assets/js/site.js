/* X Wolves · comportamento do site. O HTML funciona sozinho: sem este arquivo, o lobo fica de frente,
   as soluções viram lista, os números aparecem prontos e o formulário vira o link do WhatsApp. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fino = matchMedia('(pointer: fine)').matches;
  var WHATS = '5511976117343';

  /* ---------- topo: fundo ao rolar */
  var top = $('#top');
  var rolou = function () { top.classList.toggle('is-scrolled', scrollY > 20); };
  addEventListener('scroll', rolou, { passive: true }); rolou();

  /* ---------- menu de soluções (hover no computador, clique em qualquer tela, Esc fecha) e menu do celular */
  $$('[data-menu]').forEach(function (item) {
    var btn = $('.nav__btn', item), t = 0;
    var abre = function (v) { item.classList.toggle('is-open', v); btn.setAttribute('aria-expanded', String(v)); };
    btn.addEventListener('click', function () { abre(!item.classList.contains('is-open')); });
    if (fino) {
      item.addEventListener('mouseenter', function () { clearTimeout(t); abre(true); });
      item.addEventListener('mouseleave', function () { t = setTimeout(function () { abre(false); }, 160); });
    }
    $$('a', item).forEach(function (a) { a.addEventListener('click', function () { abre(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') abre(false); });
  });
  var burger = $('.burger'), mnav = $('#mnav');
  var fechaM = function () { mnav.hidden = true; burger.setAttribute('aria-expanded', 'false'); top.classList.remove('is-open'); };
  burger.addEventListener('click', function () {
    var v = mnav.hidden; mnav.hidden = !v; burger.setAttribute('aria-expanded', String(v)); top.classList.toggle('is-open', v);
  });
  $$('a', mnav).forEach(function (a) { a.addEventListener('click', fechaM); });

  /* ---------- enfeite infinito pausa fora da tela */
  var vis = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { e.target.classList.toggle('is-off', !e.isIntersecting); });
  }, { rootMargin: '100px' }) : null;
  if (vis) $$('[data-loop], .seal, .pose, .hero__down').forEach(function (el) { vis.observe(el); });

  /* ---------- o lobo do topo: a cabeça segue o mouse e ele pisca
     5 quadros (e2 e1 c d1 d2) + piscada. Os outros quadros só baixam depois do load. */
  var wolf = $('#wolf');
  if (wolf) {
    var quadros = {}; $$('img', wolf).forEach(function (im) { quadros[im.dataset.f] = im; });
    var ordem = ['e2', 'e1', 'c', 'd1', 'd2'], atual = 'c';
    var mostra = function (f) {
      if (f === atual || !quadros[f] || !quadros[f].complete || !quadros[f].naturalWidth) return;
      quadros[atual].classList.remove('is-on'); quadros[f].classList.add('is-on'); atual = f;
    };
    var carrega = function () {
      $$('img[data-src]', wolf).forEach(function (im) { im.srcset = im.dataset.srcset; im.src = im.dataset.src; im.removeAttribute('data-src'); });
    };
    var pisca = function () {
      var proximo = 2600 + Math.random() * 3400;
      setTimeout(function () {
        if (atual === 'c' && !document.hidden) { var antes = atual; mostra('p'); setTimeout(function () { if (atual === 'p') { quadros.p.classList.remove('is-on'); quadros[antes].classList.add('is-on'); atual = antes; } }, 150); }
        pisca();
      }, proximo);
    };
    var comecar = function () {
      carrega();
      if (reduce) return;
      pisca();
      if (fino) {
        var pend = 0, ex = 0, ey = 0;
        addEventListener('pointermove', function (e) {
          ex = e.clientX; ey = e.clientY;
          if (pend) return;
          pend = requestAnimationFrame(function () {
            pend = 0;
            var r = wolf.getBoundingClientRect(); if (r.bottom < 0) return;
            var cx = r.left + r.width / 2, dx = (ex - cx) / (innerWidth * 0.42);
            var i = Math.max(0, Math.min(4, Math.round((dx + 1) / 2 * 4)));
            mostra(ordem[i]);
            wolf.style.setProperty('--px', (dx * 10).toFixed(1) + 'px');
            wolf.style.setProperty('--py', (((ey / innerHeight) - .5) * 8).toFixed(1) + 'px');
          });
        }, { passive: true });
      } else {
        // toque: ele olha em volta sozinho, devagar
        var roteiro = ['c', 'e1', 'c', 'd1', 'c', 'e2', 'c', 'd2'], k = 0;
        setInterval(function () { if (!wolf.classList.contains('is-off') && !document.hidden) mostra(roteiro[k = (k + 1) % roteiro.length]); }, 1700);
        if (vis) vis.observe(wolf);
      }
    };
    if (document.readyState === 'complete') comecar(); else addEventListener('load', comecar);
  }

  /* ---------- poses: pulo ao aparecer + inclinação na direção do mouse */
  var poses = $$('.pose');
  if ('IntersectionObserver' in window) {
    var entra = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); entra.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    poses.forEach(function (p) { entra.observe(p); });
  } else poses.forEach(function (p) { p.classList.add('is-in'); });
  if (fino && !reduce) {
    var pp = 0, mx = 0, my = 0;
    addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (pp) return;
      pp = requestAnimationFrame(function () {
        pp = 0;
        poses.forEach(function (p) {
          if (p.classList.contains('is-off')) return;
          var r = p.getBoundingClientRect();
          var dx = (mx - (r.left + r.width / 2)) / innerWidth, dy = (my - (r.top + r.height / 2)) / innerHeight;
          p.style.setProperty('--ry', (dx * 14).toFixed(2) + 'deg');
          p.style.setProperty('--rx', (-dy * 6).toFixed(2) + 'deg');
        });
      });
    }, { passive: true });
  }

  /* ---------- soluções: no computador, a seção fica presa e a rolagem passa os cartões para o lado */
  var rail = $('[data-rail]');
  if (rail) {
    var track = $('.rail__track', rail), largo = matchMedia('(min-width: 1061px) and (min-height: 620px)'), sobra = 0, pr = 0;
    var mede = function () {
      if (!largo.matches) { rail.style.removeProperty('--sobra'); track.style.removeProperty('--x'); return; }
      sobra = Math.max(0, track.scrollWidth - innerWidth);
      rail.style.setProperty('--sobra', sobra + 'px'); move();
    };
    var move = function () {
      pr = 0; if (!largo.matches) return;
      var r = rail.getBoundingClientRect(), curso = rail.offsetHeight - innerHeight;
      var p = Math.min(1, Math.max(0, -r.top / Math.max(1, curso)));
      track.style.setProperty('--x', (-p * sobra).toFixed(1) + 'px');
    };
    addEventListener('scroll', function () { if (!pr) pr = requestAnimationFrame(move); }, { passive: true });
    addEventListener('resize', mede);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(mede);
    mede();
  }

  /* ---------- números contando quando aparecem (o número final já está no HTML) */
  var fmt = function (n) { return n.toLocaleString('pt-BR'); };
  if ('IntersectionObserver' in window && !reduce) {
    var conta = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return; conta.unobserve(e.target);
        var el = e.target, alvo = +el.dataset.count, t0 = performance.now(), dur = 1500;
        var passo = function (t) {
          var k = Math.min(1, (t - t0) / dur), v = Math.round(alvo * (1 - Math.pow(1 - k, 3)));
          el.textContent = fmt(v); if (k < 1) requestAnimationFrame(passo);
        };
        requestAnimationFrame(passo);
      });
    }, { threshold: .6 });
    $$('[data-count]').forEach(function (el) { conta.observe(el); });
  }

  /* ---------- conversa da IA aparece mensagem a mensagem */
  var chat = $('[data-chat]');
  if (chat && 'IntersectionObserver' in window) {
    var ch = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { chat.classList.add('is-in'); ch.disconnect(); }
    }, { threshold: .35 });
    ch.observe(chat);
  } else if (chat) chat.classList.add('is-in');

  /* ---------- formulário: monta a mensagem e abre o WhatsApp */
  var form = $('#form'), msg = $('#formMsg');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    var f = new FormData(form), nome = (f.get('nome') || '').trim(), empresa = (f.get('empresa') || '').trim();
    if (!nome) return void (msg.textContent = 'Conte o seu nome para a gente.');
    if (!empresa) return void (msg.textContent = 'Qual é a empresa?');
    var linhas = ['Olá, X Wolves! Sou ' + nome + ', da ' + empresa + '.', 'Interesse: ' + f.get('produto') + '.'];
    if ((f.get('msg') || '').trim()) linhas.push(f.get('msg').trim());
    if ((f.get('email') || '').trim()) linhas.push('E-mail: ' + f.get('email').trim());
    if ((f.get('celular') || '').trim()) linhas.push('Celular: ' + f.get('celular').trim());
    window.open('https://wa.me/' + WHATS + '?text=' + encodeURIComponent(linhas.join('\n')), '_blank', 'noopener');
    msg.textContent = 'Abrimos o WhatsApp com a sua mensagem pronta. É só enviar.';
  });
})();
