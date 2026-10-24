/* Demo animado: reproduce los pasos de un flujo, con play/pausa, velocidad y pasos clickeables.
   Uso: Demo('#demo', { modo: 'pantallas' | 'chat', cabecera: html, pasos: [...] })
   - modo pantallas: cada paso tiene { grupo, titulo, html }
   - modo chat: cada paso tiene { grupo, titulo, msgs: [{ yo, t, kb, toca, uno }], nuevo }  (nuevo = empieza conversación) */
function Demo(sel, cfg) {
  var root = document.querySelector(sel);
  var pasos = cfg.pasos, i = 0, timer = null, vel = 1, reproduciendo = false;
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  root.innerHTML =
    '<div class="demo-bar"><div class="t">' + cfg.titulo + '<small>datos de ejemplo</small></div>' +
    '<div class="ctrl"><span class="estado-rep"></span>' +
    '<button type="button" data-a="ant" aria-label="Paso anterior">‹</button>' +
    '<button type="button" data-a="play" aria-label="Reproducir o pausar"></button>' +
    '<button type="button" data-a="sig" aria-label="Paso siguiente">›</button>' +
    '<button type="button" data-a="vel" aria-label="Cambiar velocidad">1×</button>' +
    '<button type="button" data-a="re" aria-label="Volver a empezar">↺</button></div></div>' +
    '<div class="demo-body"><div class="escenario"><div class="caption" aria-live="polite"></div>' +
    '<div class="tel"><div class="tel-in"></div></div><div class="progreso"><i></i></div></div>' +
    '<nav class="pasos" aria-label="Pasos del flujo"></nav></div>' +
    '<div class="demo-nota">Simulación con datos inventados: muestra cómo se usa, no está conectada al sistema real.</div>';

  var tel = root.querySelector('.tel-in'), cap = root.querySelector('.caption'),
      bar = root.querySelector('.progreso i'), lista = root.querySelector('.pasos'),
      bPlay = root.querySelector('[data-a=play]'), bVel = root.querySelector('[data-a=vel]'),
      est = root.querySelector('.estado-rep');

  // lista de pasos agrupada
  var html = '', grupo = null;
  pasos.forEach(function (p, k) {
    if (p.grupo !== grupo) { if (grupo !== null) html += '</ol>'; html += '<h4>' + p.grupo + '</h4><ol>'; grupo = p.grupo; }
    html += '<li><button type="button" data-i="' + k + '"><span>' + (k + 1) + '</span>' + p.titulo + '</button></li>';
  });
  lista.innerHTML = html + '</ol>';
  var botones = lista.querySelectorAll('button');

  function msgHtml(m, anim) {
    var kb = '';
    if (m.kb) kb = '<div class="kb' + (m.uno ? ' uno' : '') + '">' + m.kb.map(function (b, j) {
      return '<span' + (m.toca === j ? ' class="toca"' : '') + '>' + b + '</span>';
    }).join('') + '</div>';
    return '<div class="msg' + (m.yo ? ' yo' : '') + (anim ? ' anim' : '') + '">' + m.t + kb + '</div>';
  }

  function render() {
    var p = pasos[i];
    if (cfg.modo === 'chat') {
      var ini = i; while (ini > 0 && !pasos[ini].nuevo) ini--;
      var cuerpo = '';
      for (var k = ini; k <= i; k++) pasos[k].msgs.forEach(function (m) { cuerpo += msgHtml(m, k === i); });
      tel.innerHTML = cfg.cabecera + '<div class="tg-b">' + cuerpo + '</div>';
    } else {
      tel.innerHTML = '<div class="anim" style="display:flex;flex-direction:column;flex:1">' + p.html + '</div>';
    }
    if (cfg.alRender) cfg.alRender(tel, i);
    cap.textContent = p.titulo;
    bar.style.width = ((i + 1) / pasos.length * 100) + '%';
    botones.forEach(function (b, k) { b.classList.toggle('on', k === i); });
    var activo = botones[i];
    if (activo && lista.scrollHeight > lista.clientHeight + 4) {
      var top = activo.offsetTop - lista.offsetTop - lista.clientHeight / 2;
      lista.scrollTo({ top: top, behavior: reduce ? 'auto' : 'smooth' });
    }
  }
  function ctrl() {
    bPlay.textContent = reproduciendo ? '❚❚' : '▶';
    est.textContent = reproduciendo ? 'reproduciendo' : 'pausado';
    bVel.textContent = vel + '×';
  }
  function programar() {
    clearTimeout(timer);
    if (!reproduciendo) return;
    var dur = (pasos[i].dur || 2800) / vel;
    timer = setTimeout(function () { i = (i + 1) % pasos.length; render(); programar(); }, dur);
  }
  function ir(k, pausar) { i = Math.max(0, Math.min(pasos.length - 1, k)); if (pausar) reproduciendo = false; render(); ctrl(); programar(); }

  root.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.i) return ir(+b.dataset.i, true);
    var a = b.dataset.a;
    if (a === 'play') { reproduciendo = !reproduciendo; ctrl(); programar(); }
    if (a === 'ant') ir(i - 1, true);
    if (a === 'sig') ir(i + 1, true);
    if (a === 're') ir(0, false);
    if (a === 'vel') { vel = vel === 1 ? 2 : vel === 2 ? 0.5 : 1; ctrl(); programar(); }
  });

  // tarjetas del flujo que saltan a un paso del demo
  document.querySelectorAll('[data-ir]').forEach(function (c) {
    c.addEventListener('click', function () {
      ir(+c.dataset.ir, true);
      root.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    });
  });

  reproduciendo = !reduce;
  render(); ctrl(); programar();
  return { ir: ir };
}

/* QR de ejemplo dibujado en canvas (patrón inventado, no se puede escanear) */
function dibujarQR(canvas, semilla) {
  var n = 25, c = canvas.getContext('2d'), s = semilla || 7;
  canvas.width = n; canvas.height = n;
  c.fillStyle = '#fff'; c.fillRect(0, 0, n, n); c.fillStyle = '#111';
  function rnd() { s = (s * 9301 + 49297) % 233280; return s / 233280; }
  for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) if (rnd() > 0.52) c.fillRect(x, y, 1, 1);
  [[0, 0], [n - 7, 0], [0, n - 7]].forEach(function (p) {
    c.fillStyle = '#fff'; c.fillRect(p[0] - 1 < 0 ? 0 : p[0] - 1, p[1] - 1 < 0 ? 0 : p[1] - 1, 9, 9);
    c.fillStyle = '#111'; c.fillRect(p[0], p[1], 7, 7);
    c.fillStyle = '#fff'; c.fillRect(p[0] + 1, p[1] + 1, 5, 5);
    c.fillStyle = '#111'; c.fillRect(p[0] + 2, p[1] + 2, 3, 3);
  });
}
