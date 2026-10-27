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

  /* ---------- o lobo do topo: um modelo 3D desenhado ao vivo, que olha para onde o mouse está
     O assets/js/lobo3d.js (three.js, ~150 KB comprimido) e o modelo (1,2 MB) só baixam depois da página pronta: no
     computador, ao primeiro movimento do mouse ou logo depois do load; no celular, ao primeiro toque ou rolagem.
     Até lá (ou sem WebGL), fica a imagem de frente, que é o LCP e sai do mesmo modelo, então a troca não tem salto.
     A cada quadro de tela uma mola leva a cabeça até o alvo: ela gira de verdade, sem misturar imagens.
     No celular ele olha em volta sozinho e olha para onde o dedo toca. */
  var wolf = $('#wolf');
  if (wolf && !reduce) {
    var cv = document.createElement('canvas'), l3 = null, iniciou = false;
    var GIRO = 34, CIMA = 14, BAIXO = 12; // graus até onde a cabeça vai
    var x = 0, y = 0, vx = 0, vy = 0, ax = 0, ay = 0, antes = 0, solto = 0;
    cv.className = 'wolf__cv'; cv.setAttribute('aria-hidden', 'true');
    var medeCv = function () {
      if (!l3) return;
      var r = wolf.getBoundingClientRect();
      l3.tamanho(Math.round(Math.min(r.width, r.height) * Math.min(2, devicePixelRatio || 1)));
    };
    var olha = function (px, py) { // ponto da tela → giro e inclinação alvo
      var r = wolf.getBoundingClientRect();
      var dx = Math.max(-1, Math.min(1, (px - (r.left + r.width / 2)) / (innerWidth * .42)));
      var dy = Math.max(-1, Math.min(1, (py - (r.top + r.height * .34)) / (innerHeight * .42))); // .34: altura dos olhos
      ax = dx * GIRO; ay = dy * (dy < 0 ? CIMA : BAIXO);
      return dx;
    };
    var tick = function (t) {
      var dt = Math.min(.05, antes ? (t - antes) / 1000 : .016); antes = t;
      if (!fino && t > solto) { // sozinho: um ponto novo a cada 1,8 a 3,6 s
        ax = (Math.random() * 2 - 1) * GIRO * .8; ay = (Math.random() * 2 - 1) * (Math.random() < .5 ? CIMA : BAIXO) * .7;
        solto = t + 1800 + Math.random() * 1800;
      }
      var w = fino ? 10 : 4.5; // mola com amortecimento crítico: arranca, freia e chega sem passar do ponto
      vx += (w * w * (ax - x) - 2 * w * vx) * dt; x += vx * dt;
      vy += (w * w * (ay - y) - 2 * w * vy) * dt; y += vy * dt;
      if (!wolf.classList.contains('is-off')) l3.pose(x, y);
      requestAnimationFrame(tick);
    };
    var inicia = function () {
      if (iniciou) return; iniciou = true;
      import(wolf.dataset.js).then(function (m) { return m.lobo(cv, wolf.dataset.glb); }).then(function (l) {
        l3 = l; wolf.appendChild(cv); medeCv(); l3.pose(0, 0);
        wolf.classList.add('is-live');
        addEventListener('resize', medeCv); requestAnimationFrame(tick);
      }).catch(function () { /* sem WebGL ou sem rede: fica a imagem de frente */ });
    };
    if (fino) addEventListener('pointermove', function (e) {
      if (wolf.getBoundingClientRect().bottom < 0) return;
      var dx = olha(e.clientX, e.clientY); inicia();
      wolf.style.setProperty('--px', (dx * 10).toFixed(1) + 'px');
      wolf.style.setProperty('--py', (((e.clientY / innerHeight) - .5) * 8).toFixed(1) + 'px');
    }, { passive: true });
    else {
      addEventListener('pointerdown', function (e) {
        if (wolf.getBoundingClientRect().bottom < 0) return;
        olha(e.clientX, e.clientY); solto = performance.now() + 2600; inicia();
      }, { passive: true });
      addEventListener('scroll', inicia, { passive: true, once: true });
    }
    // no computador, depois do load só baixa (sem executar) e o 3D liga no primeiro movimento do mouse;
    // no celular, sem mouse para esperar, ele liga sozinho um pouco depois do load
    var baixa = function () {
      [[wolf.dataset.js, 'script'], [wolf.dataset.glb, 'fetch']].forEach(function (a) {
        var l = document.createElement('link'); l.rel = 'prefetch'; l.href = a[0]; l.as = a[1]; if (a[1] === 'fetch') l.crossOrigin = 'anonymous';
        document.head.appendChild(l);
      });
    };
    var depois = function () { setTimeout(function () { ('requestIdleCallback' in window ? requestIdleCallback : setTimeout)(fino ? baixa : inicia, { timeout: 3000 }); }, fino ? 800 : 3500); };
    if (document.readyState === 'complete') depois(); else addEventListener('load', depois);
    if (vis) vis.observe(wolf);
  }

  /* ---------- poses: paradas, só esmaecem ao aparecer */
  var poses = $$('.pose');
  if ('IntersectionObserver' in window) {
    var entra = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); entra.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -12% 0px' });
    poses.forEach(function (p) { entra.observe(p); });
  } else poses.forEach(function (p) { p.classList.add('is-in'); });

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
