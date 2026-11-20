(function () {
  "use strict";
  var doc = document.documentElement;
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  // Año automático en el pie de página
  var year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Pantalla de carga ---------- */
  var loader = $("#loader"), bar = $("#loaderBar"), pct = $("#loaderPct");
  var started = performance.now(), loaded = document.readyState === "complete", finished = false;
  document.body.classList.add("loading");
  window.addEventListener("load", function () { loaded = true; });

  function finishLoader() {
    if (finished) return;
    finished = true;
    if (bar) bar.style.width = "100%";
    if (pct) pct.textContent = "100%";
    setTimeout(function () {
      if (loader) loader.classList.add("done");
      document.body.classList.remove("loading");
      doc.classList.add("ready");
      startReveal();
      startTyped();
    }, 250);
  }
  (function tick(now) {
    var t = Math.min((now - started) / (reduce ? 100 : 1500), 1);
    var p = loaded ? t : Math.min(t, .9);
    if (bar) bar.style.width = (p * 100).toFixed(0) + "%";
    if (pct) pct.textContent = (p * 100).toFixed(0) + "%";
    if (loaded && t >= 1) finishLoader(); else if (!finished) requestAnimationFrame(tick);
  })(started);
  setTimeout(finishLoader, 4500); // por si algo tarda demasiado

  /* ---------- Revelado al hacer scroll ---------- */
  function startReveal() {
    var items = $$(".reveal");
    function show(el) {
      var d = parseInt(el.getAttribute("data-delay") || "0", 10);
      el.style.setProperty("--d", d + "ms");
      el.classList.add("in");
      setTimeout(function () { el.classList.add("done"); countUp(el); }, d + 900);
      $$("[data-count]", el).forEach(countUp);
    }
    if (!("IntersectionObserver" in window)) { items.forEach(show); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { show(e.target); io.unobserve(e.target); } });
    }, { threshold: .12, rootMargin: "0px 0px -6% 0px" });
    items.forEach(function (el) { io.observe(el); });
  }
  if (!doc.classList.contains("js")) $$(".reveal").forEach(function (el) { el.classList.add("in"); });

  /* ---------- Contadores ---------- */
  function countUp(root) {
    var el = root.hasAttribute && root.hasAttribute("data-count") ? root : $("[data-count]", root);
    if (!el || el.dataset.done) return;
    el.dataset.done = "1";
    var target = parseInt(el.getAttribute("data-count"), 10), t0 = performance.now(), dur = reduce ? 1 : 1400;
    (function step(now) {
      var k = Math.min((now - t0) / dur, 1), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(target * e);
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* ---------- Texto que se escribe solo ---------- */
  function startTyped() {
    var el = $("#typed");
    if (!el) return;
    var words = ["desarrollador web", "creador de tiendas y catálogos", "inventor de dispositivos con electrónica", "estudiante de ADSO"];
    if (reduce) { el.textContent = words[0]; return; }
    var w = 0, c = 0, del = false;
    (function loop() {
      var word = words[w];
      el.textContent = word.slice(0, c);
      if (!del && c === word.length) { del = true; return setTimeout(loop, 1600); }
      if (del && c === 0) { del = false; w = (w + 1) % words.length; return setTimeout(loop, 350); }
      c += del ? -1 : 1;
      setTimeout(loop, del ? 28 : 65);
    })();
  }

  /* ---------- Menú: sección activa ---------- */
  var links = $$("nav a"), sections = $$("main section[id]");
  if ("IntersectionObserver" in window) {
    var nav = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          links.forEach(function (a) { a.classList.toggle("active", a.getAttribute("href") === "#" + entry.target.id); });
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    sections.forEach(function (s) { nav.observe(s); });
  }

  /* ---------- Parallax por scroll + barra de progreso ---------- */
  var vSet = [], hSet = [], vh = window.innerHeight, ticking = false;
  var topbar = $("#topbar"), progress = $("#progress"), toTop = $("#toTop");

  function measure() {
    vh = window.innerHeight;
    var sy = window.pageYOffset;
    function base(el) {
      var prev = el.style.transform; el.style.transform = "none";
      var r = el.getBoundingClientRect();
      el.style.transform = prev;
      return { el: el, c: r.top + sy + r.height / 2, cx: r.left + r.width / 2 };
    }
    vSet = $$("[data-speed]").map(function (el) { var b = base(el); b.s = parseFloat(el.getAttribute("data-speed")); b.fixed = getComputedStyle(el).position === "fixed"; return b; });
    hSet = $$("[data-hspeed]").map(function (el) { var b = base(el); b.s = parseFloat(el.getAttribute("data-hspeed")); return b; });
    update();
  }
  function update() {
    ticking = false;
    var sy = window.pageYOffset, max = doc.scrollHeight - vh;
    if (progress) progress.style.transform = "scaleX(" + (max > 0 ? sy / max : 0) + ")";
    if (topbar) topbar.classList.toggle("scrolled", sy > 30);
    if (toTop) toTop.classList.toggle("show", sy > 700);
    if (reduce) return;
    vSet.forEach(function (b) {
      var d = b.fixed ? sy : b.c - (sy + vh / 2);
      if (!b.fixed && Math.abs(d) > vh * 1.6) return; // fuera de pantalla
      b.el.style.transform = "translate3d(0," + (-d * b.s).toFixed(1) + "px,0)";
    });
    hSet.forEach(function (b) {
      var d = b.c - (sy + vh / 2);
      if (Math.abs(d) > vh * 2) return;
      b.el.style.transform = "translate3d(" + (d * b.s).toFixed(1) + "px,0,0)";
    });
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(update); } }
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { measure(); });
  window.addEventListener("load", measure);
  measure();
  if (toTop) toTop.addEventListener("click", function () { window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); });

  /* ---------- Foco que sigue al mouse ---------- */
  var spot = $("#spot");
  if (finePointer && !reduce) {
    window.addEventListener("mousemove", function (e) {
      if (!spot) return;
      spot.style.setProperty("--sx", e.clientX + "px");
      spot.style.setProperty("--sy", e.clientY + "px");
      spot.classList.add("on");
    }, { passive: true });
  }

  /* ---------- Parallax con el mouse en el hero ---------- */
  var hero = $(".hero"), layer = $(".float-layer");
  if (hero && layer && finePointer && !reduce) {
    var depth = parseFloat(layer.getAttribute("data-depth")) || 20;
    hero.addEventListener("mousemove", function (e) {
      var r = hero.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      layer.style.transform = "translate3d(" + (x * depth * 2).toFixed(1) + "px," + (y * depth * 2).toFixed(1) + "px,0)";
    });
    hero.addEventListener("mouseleave", function () { layer.style.transform = ""; });
  }

  /* ---------- Inclinación 3D ---------- */
  if (finePointer && !reduce) {
    $$(".tilt").forEach(function (el) {
      var host = el.closest(".shot") || el;
      host.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        el.style.transform = "perspective(1000px) rotateY(" + (x * 12).toFixed(2) + "deg) rotateX(" + (-y * 10).toFixed(2) + "deg) scale3d(1.02,1.02,1.02)";
      });
      host.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------- Brillo que sigue al mouse en las tarjetas ---------- */
  $$(".glow-card").forEach(function (el) {
    el.addEventListener("mousemove", function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty("--mx", (e.clientX - r.left) + "px");
      el.style.setProperty("--my", (e.clientY - r.top) + "px");
    });
  });

  /* ---------- Botones magnéticos ---------- */
  if (finePointer && !reduce) {
    $$(".magnetic").forEach(function (b) {
      b.addEventListener("mousemove", function (e) {
        var r = b.getBoundingClientRect();
        b.style.transform = "translate(" + ((e.clientX - r.left - r.width / 2) * .25).toFixed(1) + "px," + ((e.clientY - r.top - r.height / 2) * .35).toFixed(1) + "px)";
      });
      b.addEventListener("mouseleave", function () { b.style.transform = ""; });
    });
  }

  /* ---------- AlimBox: esquema animado ---------- */
  var cellsG = $("#cells"), NS = "http://www.w3.org/2000/svg";
  if (cellsG) {
    var cells = [];
    for (var i = 0; i < 7; i++) {
      var x = 24 + i * 85;
      var g = document.createElementNS(NS, "g"); g.setAttribute("class", "cell");
      var rect = document.createElementNS(NS, "rect");
      [["x", x], ["y", 88], ["width", 75], ["height", 84], ["rx", 8]].forEach(function (a) { rect.setAttribute(a[0], a[1]); });
      var line = document.createElementNS(NS, "line");
      [["x1", x + 10], ["y1", 100], ["x2", x + 65], ["y2", 100]].forEach(function (a) { line.setAttribute(a[0], a[1]); });
      var tx = document.createElementNS(NS, "text");
      tx.setAttribute("x", x + 37.5); tx.setAttribute("y", 146); tx.textContent = i + 1;
      g.appendChild(rect); g.appendChild(line); g.appendChild(tx);
      cellsG.appendChild(g); cells.push(g);
    }
    var a = $("#oledA"), b = $("#oledB"), cur = 2;
    var times = ["06:00", "07:00", "08:00", "12:00", "14:00", "18:00", "21:00"];
    function light(n) {
      cells.forEach(function (c, k) { c.classList.toggle("on", k === n); });
      if (a) a.textContent = times[n] + "  ·  Hora de su dosis";
      if (b) b.textContent = "Compartimento " + (n + 1);
    }
    light(cur);
    if (!reduce) setInterval(function () { cur = (cur + 1) % 7; light(cur); }, 1800);
  }
})();
