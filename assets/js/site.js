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

  /* ---------- o lobo do topo: a cabeça segue o mouse sem degraus
     Um vídeo da cabeça virando (Higgsfield) foi cortado em quadros (data-frames). Eles baixam depois do load,
     do meio para as pontas, e são desenhados num canvas: o mouse escolhe o quadro e a cabeça desliza até ele.
     Até os quadros chegarem (ou sem JS), fica a imagem de frente, que é o LCP. No toque ele olha em volta sozinho.
     A piscada dos 5 quadros antigos saiu: o rosto do vídeo não bate com ela. */
  var wolf = $('#wolf');
  if (wolf) {
    var poster = $('img', wolf), cv = document.createElement('canvas'), ctx = cv.getContext('2d');
    var grande = fino && matchMedia('(min-width: 901px)').matches;
    var N = +(grande ? wolf.dataset.frames : wolf.dataset.framesM), pasta = grande ? wolf.dataset.dir : wolf.dataset.dirM;
    var quadros = new Array(N), meio = (N - 1) / 2, alvo = meio, pos = meio, desenhado = -1, vivo = false;
    cv.className = 'wolf__cv'; cv.setAttribute('aria-hidden', 'true'); wolf.appendChild(cv);
    var medeCv = function () {
      var r = wolf.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1);
      cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); desenhado = -1;
    };
    var perto = function (i) { // quadro carregado mais perto do pedido
      for (var k = 0; k < N; k++) { if (quadros[i + k]) return i + k; if (quadros[i - k]) return i - k; }
      return -1;
    };
    var desenha = function () {
      var i = perto(Math.round(pos)); if (i < 0) return;
      if (i === desenhado) return;
      ctx.clearRect(0, 0, cv.width, cv.height); ctx.drawImage(quadros[i], 0, 0, cv.width, cv.height); desenhado = i;
    };
    var t0 = performance.now();
    var tick = function (t) {
      if (!fino) alvo = meio + Math.sin((t - t0) / 1900) * meio * 0.8;
      pos += (alvo - pos) * (fino ? 0.16 : 0.08);
      if (!wolf.classList.contains('is-off')) desenha();
      requestAnimationFrame(tick);
    };
    var vira = function () { // quadros chegam do meio para as pontas: a cabeça já mexe antes de tudo baixar
      var ordem = [Math.round(meio)];
      for (var k = 1; k <= meio + 1; k++) { if (meio - k >= 0) ordem.push(Math.round(meio - k)); if (meio + k <= N - 1) ordem.push(Math.round(meio + k)); }
      ordem = ordem.filter(function (v, i, a) { return a.indexOf(v) === i; });
      var baixa = function (i) {
        var im = new Image(); im.decoding = 'async'; im.src = pasta + String(i).padStart(2, '0') + '.webp';
        return im.decode().then(function () { quadros[i] = im; }).catch(function () {});
      };
      var fila = ordem.slice(), ativos = 0;
      var proximo = function () {
        while (ativos < 6 && fila.length) {
          ativos++; baixa(fila.shift()).then(function () {
            ativos--;
            if (!vivo && quadros[Math.round(meio)]) { vivo = true; medeCv(); desenha(); wolf.classList.add('is-live'); }
            proximo();
          });
        }
      };
      proximo();
    };
    var comeca = function () {
      if (reduce || !N) return;
      vira(); addEventListener('resize', medeCv); requestAnimationFrame(tick);
      if (fino) addEventListener('pointermove', function (e) {
        var r = wolf.getBoundingClientRect(); if (r.bottom < 0) return;
        var dx = (e.clientX - (r.left + r.width / 2)) / (innerWidth * 0.42);
        alvo = meio + Math.max(-1, Math.min(1, dx)) * meio;
        wolf.style.setProperty('--px', (dx * 10).toFixed(1) + 'px');
        wolf.style.setProperty('--py', (((e.clientY / innerHeight) - .5) * 8).toFixed(1) + 'px');
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
