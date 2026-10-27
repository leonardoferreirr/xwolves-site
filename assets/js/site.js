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

  /* ---------- o lobo do topo: olha para onde o mouse está, para os lados, para cima e para baixo
     Um modelo 3D do lobo (tools/lobo3d) foi renderizado numa grade de olhares: linha = altura do olhar, coluna = giro.
     Só o pescoço gira, então cada quadro traz só a parte de cima e o corpo é uma imagem à parte, igual em todos.
     O canvas mistura os quatro quadros vizinhos (nunca pula de um para o outro) e uma mola leva o olhar até o alvo,
     com arranque e freio de movimento real. Os quadros baixam depois do load, do olhar de frente para as pontas.
     Até chegarem (ou sem JS), fica a imagem de frente, que é o LCP. No toque ele olha em volta sozinho. */
  var wolf = $('#wolf');
  if (wolf) {
    var cv = document.createElement('canvas'), ctx = cv.getContext('2d');
    var aux = document.createElement('canvas'), actx = aux.getContext('2d'); // a linha de baixo, antes de misturar
    var grande = fino && matchMedia('(min-width: 901px)').matches, ds = wolf.dataset;
    var C = +(grande ? ds.cols : ds.colsM), L = +(grande ? ds.rows : ds.rowsM), corte = +(grande ? ds.cut : ds.cutM);
    var pasta = grande ? ds.dir : ds.dirM, corpo = new Image();
    var q = [], cx0 = (C - 1) / 2, cy0 = (L - 1) / 2, vivo = false, ult = '', topo = 0;
    for (var l = 0; l < L; l++) q.push(new Array(C));
    var x = cx0, y = cy0, vx = 0, vy = 0, ax = cx0, ay = cy0; // posição (coluna, linha), velocidade e alvo
    cv.className = 'wolf__cv'; cv.setAttribute('aria-hidden', 'true'); wolf.appendChild(cv);
    var medeCv = function () {
      var r = wolf.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
      cv.width = aux.width = Math.round(r.width * d); cv.height = Math.round(r.height * d);
      topo = aux.height = Math.round(cv.height * corte); ult = '';
    };
    var pega = function (l, c) { // quadro carregado mais perto na linha; se a linha ainda não chegou, a do meio
      for (var k = 0; k < C; k++) { if (q[l][c + k]) return q[l][c + k]; if (q[l][c - k]) return q[l][c - k]; }
      return l === Math.round(cy0) ? null : pega(Math.round(cy0), c);
    };
    var linhaEm = function (g, l) { // uma linha já misturando as duas colunas vizinhas
      var c0 = Math.floor(x), f = x - c0, a = pega(l, c0), b = f > .003 ? pega(l, Math.min(C - 1, c0 + 1)) : null;
      if (!a) return false;
      g.globalAlpha = 1; g.drawImage(a, 0, 0, cv.width, topo);
      if (b && b !== a) { g.globalAlpha = f; g.drawImage(b, 0, 0, cv.width, topo); g.globalAlpha = 1; }
      return true;
    };
    var desenha = function () {
      var k = x.toFixed(3) + ' ' + y.toFixed(3); if (k === ult) return;
      var l0 = Math.min(L - 2, Math.floor(y)), fy = y - l0;
      if (fy > .997) { l0++; fy = 0; }
      ctx.clearRect(0, 0, cv.width, cv.height);
      if (!linhaEm(ctx, l0)) return;
      if (fy > .003) { actx.clearRect(0, 0, aux.width, aux.height); if (linhaEm(actx, l0 + 1)) { ctx.globalAlpha = fy; ctx.drawImage(aux, 0, 0); ctx.globalAlpha = 1; } }
      ctx.drawImage(corpo, 0, topo, cv.width, cv.height - topo);
      ult = k;
    };
    var mola = function (p, v, alvo, w, dt) { return v + (w * w * (alvo - p) - 2 * w * v) * dt; }; // amortecimento crítico: chega sem passar do ponto
    // o alvo é sempre um quadro inteiro: parado, a cabeça fica num quadro só, nítida; a mistura só aparece em movimento.
    // A folga (.6) evita ficar trocando de quadro com o mouse parado na divisa.
    var assenta = function (bruto, atual, max) { bruto = Math.max(0, Math.min(max, bruto)); return Math.abs(bruto - atual) > .6 ? Math.round(bruto) : atual; };
    var olha = function (px, py) { // ponto da tela → coluna e linha alvo
      var r = wolf.getBoundingClientRect();
      var dx = (px - (r.left + r.width / 2)) / (innerWidth * .42), dy = (py - (r.top + r.height * .34)) / (innerHeight * .42); // .34: altura dos olhos
      ax = assenta(cx0 + dx * cx0, ax, C - 1);
      ay = assenta(cy0 + dy * cy0, ay, L - 1);
      return dx;
    };
    var antes = 0, solto = 0;
    var tick = function (t) {
      var dt = Math.min(.05, antes ? (t - antes) / 1000 : .016); antes = t;
      if (!fino && t > solto) { // sozinho: um ponto novo a cada 1,6 a 3,4 s
        ax = Math.round((.1 + Math.random() * .8) * (C - 1)); ay = Math.round(Math.random() * (L - 1));
        solto = t + 1600 + Math.random() * 1800;
      }
      vx = mola(x, vx, ax, fino ? 9 : 7, dt); x = Math.max(0, Math.min(C - 1, x + vx * dt));
      vy = mola(y, vy, ay, fino ? 9 : 7, dt); y = Math.max(0, Math.min(L - 1, y + vy * dt));
      if (Math.abs(x - ax) < .004 && Math.abs(vx) < .01) { x = ax; vx = 0; } // chegou: encaixa no quadro
      if (Math.abs(y - ay) < .004 && Math.abs(vy) < .01) { y = ay; vy = 0; }
      if (!wolf.classList.contains('is-off')) desenha();
      requestAnimationFrame(tick);
    };
    var vira = function () { // do olhar de frente para as pontas: a cabeça já mexe antes de tudo baixar
      var ordem = [];
      for (var l2 = 0; l2 < L; l2++) for (var c2 = 0; c2 < C; c2++) ordem.push([l2, c2]);
      ordem.sort(function (a, b) { return (Math.abs(a[0] - cy0) * 2 + Math.abs(a[1] - cx0)) - (Math.abs(b[0] - cy0) * 2 + Math.abs(b[1] - cx0)); });
      var baixa = function (p) {
        var im = new Image();
        return chega(im, pasta + p[0] + '-' + String(p[1]).padStart(2, '0') + '.webp').then(function (ok) { if (ok) { q[p[0]][p[1]] = im; ult = ''; } });
      };
      var ativos = 0;
      var proximo = function () {
        while (ativos < 6 && ordem.length) {
          ativos++; baixa(ordem.shift()).then(function () {
            ativos--;
            if (!vivo && corpo.complete && corpo.naturalWidth && q[Math.round(cy0)][Math.round(cx0)]) { vivo = true; medeCv(); desenha(); wolf.classList.add('is-live'); }
            proximo();
          });
        }
      };
      chega(corpo, grande ? ds.body : ds.bodyM).then(proximo);
    };
    var chega = function (im, src) { // baixou → tenta decodificar antes de usar, mas não espera para sempre: em aba de fundo o decode() fica parado
      return new Promise(function (ok) {
        im.onload = function () { Promise.race([im.decode ? im.decode() : 0, new Promise(function (r) { setTimeout(r, 300); })]).catch(function () {}).then(function () { ok(true); }); };
        im.onerror = function () { ok(false); };
        im.src = src;
      });
    };
    var comeca = function () {
      if (reduce || !C) return;
      vira(); addEventListener('resize', medeCv); requestAnimationFrame(tick);
      if (fino) addEventListener('pointermove', function (e) {
        if (wolf.getBoundingClientRect().bottom < 0) return;
        var dx = olha(e.clientX, e.clientY);
        wolf.style.setProperty('--px', (dx * 10).toFixed(1) + 'px');
        wolf.style.setProperty('--py', (((e.clientY / innerHeight) - .5) * 8).toFixed(1) + 'px');
      }, { passive: true });
      else addEventListener('pointerdown', function (e) { // no toque, ele olha para onde o dedo encostou
        if (wolf.getBoundingClientRect().bottom < 0) return;
        olha(e.clientX, e.clientY); solto = performance.now() + 2600;
      }, { passive: true });
      if (vis) vis.observe(wolf);
    };
    if (document.readyState === 'complete') comeca(); else addEventListener('load', comeca);
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
