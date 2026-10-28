/* iphone-duo-playground. Viewport numbers come from poses.json; device geometry from DESIGN.md §Device. */
(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const SAMPLE = 'sample/index.html';
  const RIM = 3;
  // Bezels in points, from Apple's millimetres (DESIGN.md §Device). Given for the display held upright.
  const BEZEL = { outer: { side: 21, end: 17 }, inner: { side: 18, end: 18 } };
  const RADIUS = 58;
  const FOLD_GAP = 24; // the fold region's width when folded; Apple hasn't published it (DESIGN.md, estimated)
  const PERSPECTIVE = 3200; // matches .foldfx in playground.css
  const MS = { open: 1400, close: 1500, pre: 240, settle: 420, turn: 640, morph: 720, out: 200, fade: 420 }; // DESIGN.md §Motion
  const EASE = (p) => p * p * p * (p * (p * 6 - 15) + 10); // smootherstep: softer starts and landings than smoothstep
  const LAND = (p) => EASE(1 - (1 - p) ** 1.4); // the same, with a longer, slower last stretch: a careful hand
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');

  const ICON = {
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    fwd: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 5l7 7-7 7"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M7 10H6a1 1 0 00-1 1v9a1 1 0 001 1h12a1 1 0 001-1v-9a1 1 0 00-1-1h-1"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 6.5C10.5 5 8 4.5 4 4.5v14c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2v-14c-4 0-6.5.5-8 2z"/><path d="M12 6.5v14"/></svg>',
    tabs: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3.5" y="7.5" width="13" height="13" rx="3"/><path d="M7.5 4.5h10a3 3 0 013 3v10"/></svg>',
    reload: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 12A7.5 7.5 0 1117.3 6.7"/><path d="M19.5 4v4.5H15"/></svg>',
    compose: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h8"/><path d="M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>',
    more: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="5" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="12" cy="19" r="1.8"/></svg>',
    batt: '<svg viewBox="0 0 27 13" fill="none"><rect x="0.5" y="0.5" width="23" height="12" rx="3.5" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="18" height="9" rx="2" fill="currentColor"/><path d="M25 4.5v4a2 2 0 000-4z" fill="currentColor" opacity=".4"/></svg>',
    wifi: '<svg viewBox="0 0 17 12" fill="currentColor"><path d="M8.5 2.2c2.4 0 4.6.9 6.3 2.5l1.2-1.2A10.6 10.6 0 008.5.5 10.6 10.6 0 001 3.5l1.2 1.2A9 9 0 018.5 2.2zm0 3.4c1.5 0 2.9.6 4 1.6l1.2-1.2a7.3 7.3 0 00-10.4 0l1.2 1.2c1.1-1 2.5-1.6 4-1.6zm0 3.4c.6 0 1.2.2 1.6.7L8.5 11.3 6.9 9.7c.4-.5 1-.7 1.6-.7z"/></svg>',
    signal: '<svg viewBox="0 0 18 12" fill="currentColor"><rect x="0" y="8" width="3" height="4" rx="1"/><rect x="5" y="5.5" width="3" height="6.5" rx="1"/><rect x="10" y="3" width="3" height="9" rx="1"/><rect x="15" y="0" width="3" height="12" rx="1"/></svg>',
  };
  const GLYPH = {
    'closed-portrait': '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5" y="2" width="8" height="14" rx="2"/></svg>',
    'closed-landscape': '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="5" width="14" height="8" rx="2"/></svg>',
    'open-landscape': '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1.5" y="3.5" width="15" height="11" rx="2"/><path d="M9 3.5v11" stroke-dasharray="1.5 1.5"/></svg>',
    'open-portrait': '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3.5" y="1.5" width="11" height="15" rx="2"/><path d="M3.5 9h11" stroke-dasharray="1.5 1.5"/></svg>',
    'split-view': '<svg viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1.5" y="3.5" width="15" height="11" rx="2"/><path d="M9 3.5v11"/></svg>',
  };

  const els = {
    poses: $('poses'), bars: $('bars'), fold: $('fold'), foldSep: $('foldSep'),
    stage: $('stage'), scaler: $('scaler'), rig: $('rig'), device: $('device'), screen: $('screen'),
    vp: $('vp'), frame: $('frame'), chrome: $('chrome'), crease: $('crease'),
    seamA: $('seamA'), seamB: $('seamB'), caption: $('caption'),
    fx: $('foldfx'), veil: $('veil'), flap: $('flap'),
    hint: $('foldHint'), hintBtn: $('foldHintBtn'),
    sheet: $('sheet'), sheetForm: $('sheetForm'), url: $('url'), cancel: $('cancel'), useSample: $('useSample'), openSite: $('openSite'),
    menu: $('menu'), menuBtn: $('menuBtn'), bg: $('bg'), bgv: $('bgv'), bgAuto: $('bgAuto'), table: $('table'), sources: $('sources'),
    theme: $('theme'), flags: $('flags'), copyLink: $('copyLink'), copyPresets: $('copyPresets'),
    toolbar: document.querySelector('.toolbar'),
  };
  // iOS Safari only shows :active (press feedback) when a touch listener exists.
  document.addEventListener('touchstart', () => {}, { passive: true });
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} },
  };
  const state = {
    data: null, pose: 'closed-portrait', bars: 'svh', fold: 'flat', url: SAMPLE, bg: '#ffffff', bgFromPage: true,
    dims: null, scale: 1, flags: false, sameOrigin: true, lastDisplay: null, settle: 0, anim: null, target: null, syncPoses: null,
    nav: { back: [], fwd: [], traversing: null, baseline: true }, settling: false, reveal: 0,
  };

  // Theme
  const savedTheme = store.get('duo-theme');
  if (savedTheme === 'light' || savedTheme === 'dark') document.documentElement.dataset.theme = savedTheme;
  els.theme.addEventListener('click', () => {
    const dark = document.documentElement.dataset.theme ? document.documentElement.dataset.theme === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
    const next = dark ? 'light' : 'dark';
    const apply = () => { document.documentElement.dataset.theme = next; };
    // Cross-fade the whole page, so the brightness doesn't jump in one frame (DESIGN.md §Motion).
    if (document.startViewTransition) document.startViewTransition(apply); else apply();
    store.set('duo-theme', next);
  });

  const params = new URLSearchParams(location.search);
  if (params.get('pose')) state.pose = params.get('pose');
  if (params.get('url')) state.url = params.get('url');
  if (params.get('flags') === '1') state.flags = true;

  const px = (n) => `${n}px`;
  const poseById = (id) => state.data.poses.find((p) => p.id === id) || state.data.poses[0];
  const pose = () => poseById(state.pose);
  const hostLabel = () => {
    if (state.url === SAMPLE) return 'foldnotes.example';
    try { return new URL(state.url).host.replace(/^www\./, ''); } catch { return state.url; }
  };

  // Device geometry for a pose: bezels, outer size, screen radius.
  function geometry(p) {
    const W = p.screen.width, H = p.screen.height;
    const b = BEZEL[p.display];
    const upright = H >= W;
    const bx = upright ? b.side : b.end, by = upright ? b.end : b.side;
    return { W, H, bx, by, w: W + 2 * (bx + RIM), h: H + 2 * (by + RIM), rScreen: RADIUS - RIM - Math.min(bx, by) };
  }
  function fitScale(dims) {
    const cs = getComputedStyle(els.stage);
    const aw = els.stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    const ah = els.stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
    return Math.max(0.2, Math.min(1, aw / dims.w, ah / dims.h));
  }

  // Ink for Safari's bars follows the page colour, as Safari's does.
  function inkFor(hex) {
    const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
    if (!m) return 'light';
    const [r, g, b] = m.slice(1).map((h) => parseInt(h, 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? 'light' : 'dark';
  }
  function applyColours() {
    const light = inkFor(state.bg) === 'light';
    const s = els.rig.style;
    s.setProperty('--page-bg', state.bg);
    s.setProperty('--bar-ink', light ? '#1c1c1e' : '#f5f5f7');
    s.setProperty('--bar-wash', light ? 'rgba(118,118,128,0.07)' : 'rgba(255,255,255,0.06)');
    s.setProperty('--bar-fill', light ? 'rgba(255,255,255,0.86)' : 'rgba(255,255,255,0.14)');
    s.setProperty('--home', light ? 'rgba(0,0,0,0.78)' : 'rgba(255,255,255,0.82)');
    els.bg.value = state.bg; els.bgv.textContent = state.bg;
  }

  const ic = (name, cls = '') => `<span class="ic ${cls}">${ICON[name]}</span>`;
  const pill = () => `<div class="pill hit" data-edit><span class="aa">aA</span><button type="button" class="host" data-edit aria-label="Address: ${hostLabel()}. Change it">${hostLabel()}</button><button type="button" class="reload" data-act="reload" aria-label="Reload">${ICON.reload}</button></div>`;
  const navBtn = (act) => `<button type="button" class="ic hit${(act === 'back' ? state.nav.back : state.nav.fwd).length ? '' : ' dim'}" data-act="${act}" aria-label="${act === 'back' ? 'Back' : 'Forward'}">${ICON[act === 'back' ? 'back' : 'fwd']}</button>`;
  const mini = () => `<button type="button" class="mini hit" data-edit aria-label="Address: ${hostLabel()}. Change it">${hostLabel()}</button>`;
  const statusCol = (withIsland) => `${withIsland ? '<span class="island"></span>' : ''}<span class="status"><span>9:41</span><span style="width:24px;display:block">${ICON.batt}</span></span>`;
  const safariTools = () => `<span class="tools">${navBtn('back')}${navBtn('fwd')}${ic('share')}${ic('book')}${ic('tabs')}</span>`;

  function chromeHTML(p) {
    const W = p.screen.width, H = p.screen.height;
    const shown = state.bars === 'svh';
    const bottom = p.chrome.bottom[state.bars];
    const vw = p.viewport.width;
    let h = '';
    if (p.display === 'outer') {
      // Column on the right: Dynamic Island, status, then Safari's toolbar (Apple's order, top to bottom).
      h += `<div class="bar col" style="left:${W - 84}px">${statusCol(true)}${safariTools()}</div>`;
      h += `<div class="bar bbar" style="left:0;width:${vw}px;top:${H - bottom}px;height:${bottom}px">${shown ? pill() : mini()}</div>`;
      h += `<span class="home" style="left:${vw / 2}px"></span>`;
    } else if (p.id === 'split-view') {
      const sw = p.chrome.sideWidth, div = p.chrome.divider;
      h += `<div class="bar col" style="left:0">${safariTools()}</div>`;
      h += `<div class="bar bbar" style="left:${sw}px;width:${vw}px;top:${H - bottom}px;height:${bottom}px">${shown ? pill() : mini()}</div>`;
      h += `<div class="divider" style="left:${sw + vw}px;width:${div}px"><i></i></div>`;
      const ox = sw + vw + div;
      h += `<div class="other" style="left:${ox}px;width:${W - ox}px">
              <div class="content" style="width:${vw}px"><h4>Another app</h4><div class="search"></div>
                <div class="card">${'<div class="row"><b style="width:62%"></b><s style="width:86%"></s></div>'.repeat(5)}</div></div>
              <div class="ocol">${statusCol(false)}<span class="tools">${ic('compose')}${ic('more')}</span></div>
            </div>`;
      h += `<span class="home" style="left:${W / 2}px"></span>`;
    } else {
      const top = p.chrome.top[state.bars];
      h += `<div class="bar tbar" style="height:${top}px"><span class="time">9:41</span>${shown ? pill() : mini()}<span class="sys">${ICON.signal}${ICON.wifi}<span style="width:25px;display:block">${ICON.batt}</span></span></div>`;
      if (bottom) h += `<div class="bar btbar"><span class="tools row">${navBtn('back')}${navBtn('fwd')}${ic('share')}${ic('book')}${ic('tabs')}</span></div>`;
      h += `<span class="home" style="left:${W / 2}px"></span>`;
    }
    return h;
  }

  function place(el, x, y, w, h) { el.style.left = px(x); el.style.top = px(y); el.style.width = px(w); el.style.height = px(h); }

  function render() {
    const p = pose();
    const g = geometry(p);
    state.dims = g;

    els.device.style.width = px(g.w); els.device.style.height = px(g.h);
    els.rig.style.setProperty('--r-out', px(RADIUS));
    els.rig.style.setProperty('--r-screen', px(g.rScreen));
    els.screen.style.borderRadius = '';
    place(els.screen, RIM + g.bx, RIM + g.by, g.W, g.H);

    // The hinge shows as a seam in the frame on the inner display.
    const inner = p.display === 'inner';
    els.seamA.hidden = els.seamB.hidden = !inner;
    if (inner) {
      if (g.W > g.H) { place(els.seamA, g.w / 2 - 1, 0, 2, RIM + 1); place(els.seamB, g.w / 2 - 1, g.h - RIM - 1, 2, RIM + 1); }
      else { place(els.seamA, 0, g.h / 2 - 1, RIM + 1, 2); place(els.seamB, g.w - RIM - 1, g.h / 2 - 1, RIM + 1, 2); }
    }

    // The page. Opening or closing the device passes through the size Safari reports mid-fold
    // (466 × 498 on the Xcode 27.1 simulator), then settles: no reload, just resizes, as on the device.
    const vh = p.viewport[state.bars], vw = p.viewport.width;
    const finalRect = p.display === 'outer' ? [0, 0, vw, vh]
      : p.id === 'split-view' ? [p.chrome.sideWidth, 0, vw, vh]
      : [0, p.chrome.top[state.bars], vw, vh];
    clearTimeout(state.settle);
    const t = state.data.transientResize;
    state.settling = !!(state.lastDisplay && state.lastDisplay !== p.display && t && !reduceMotion.matches);
    if (state.settling) {
      place(els.vp, 0, 0, t.width, t.height);
      state.settle = setTimeout(() => { place(els.vp, ...finalRect); syncFlags(); }, t.settleMs);
    } else {
      place(els.vp, ...finalRect);
    }
    state.lastDisplay = p.display;

    applyColours();
    els.chrome.innerHTML = chromeHTML(p);

    // The crease: on the open poses only. In Split View it runs under the divider.
    const showCrease = !!p.crease && p.id !== 'split-view';
    els.crease.hidden = !showCrease;
    if (els.fold.hidden === showCrease) flipToolbar(() => { els.fold.hidden = els.foldSep.hidden = !showCrease; });
    els.crease.className = 'crease';
    els.stage.classList.toggle('crease-v', showCrease && p.crease.axis === 'vertical');
    els.stage.classList.toggle('crease-h', showCrease && p.crease.axis === 'horizontal');
    if (showCrease) {
      els.crease.classList.add(p.crease.axis === 'vertical' ? 'v' : 'h');
      if (state.fold === 'folded') els.crease.classList.add('folded');
      if (p.crease.axis === 'vertical') { els.crease.style.left = px(p.crease.screenPos); els.crease.style.top = ''; }
      else { els.crease.style.top = px(p.crease.screenPos); els.crease.style.left = ''; }
    }

    renderCaption(p, vw, vh);
    renderTable(p);
    syncFlags();
    if (!state.anim) state.target = null;
    if (state.syncPoses) state.syncPoses();
    fit();
  }

  // The Fold control comes and goes with the crease. Instead of the toolbar jumping to its new width, its groups
  // slide from where they were and its material stretches to fit (measure, change, then animate the difference).
  function flipToolbar(change) {
    const tb = els.toolbar;
    if (reduceMotion.matches || !document.body.classList.contains('ready')) { change(); return; }
    const kids = [...tb.children], r0 = tb.getBoundingClientRect(), k0 = kids.map((k) => k.getBoundingClientRect());
    change();
    const r1 = tb.getBoundingClientRect();
    tb.classList.add('flip');
    const s = tb.style;
    s.setProperty('--tx', px(r0.left + r0.width / 2 - (r1.left + r1.width / 2)));
    s.setProperty('--ty', px(r0.top + r0.height / 2 - (r1.top + r1.height / 2)));
    s.setProperty('--sx', r0.width / r1.width); s.setProperty('--sy', r0.height / r1.height);
    kids.forEach((k, i) => {
      const a = k0[i], b = k.getBoundingClientRect();
      if (a.width && b.width) k.style.transform = `translate(${a.left - b.left}px, ${a.top - b.top}px)`;
      else if (b.width) k.style.opacity = '0'; // newly shown: fades in
    });
    void tb.offsetWidth;
    tb.classList.remove('flip');
    for (const v of ['--tx', '--ty', '--sx', '--sy']) s.removeProperty(v);
    kids.forEach((k) => { k.style.transform = k.style.opacity = ''; });
  }

  // Scale the rig to the stage, and keep the fold marker at the crease's end, outside the screen.
  function fit() {
    if (state.anim || !state.dims) return;
    const g = state.dims;
    const s = fitScale(g);
    state.scale = s;
    els.rig.style.transform = `scale(${s})`;
    els.scaler.style.width = px(g.w * s);
    els.scaler.style.height = px(g.h * s);
    placeHint(s);
  }
  function placeHint(s) {
    const p = pose(), g = state.dims;
    const show = !!p.crease && p.id !== 'split-view' && !state.anim;
    els.hint.hidden = !show;
    if (!show) return;
    const v = p.crease.axis === 'vertical';
    els.hint.className = `fold-hint ${v ? 'v' : 'h'}`;
    els.hintBtn.setAttribute('aria-expanded', 'false');
    if (v) { els.hint.style.left = px((RIM + g.bx + p.crease.screenPos) * s); els.hint.style.top = '0px'; }
    else { els.hint.style.left = '0px'; els.hint.style.top = px((RIM + g.by + p.crease.screenPos) * s); }
  }
  // A press toggles the tip. Closing it marks it "shut", so hover and focus can't hold it open until they leave.
  function hintOpen(open) {
    els.hint.classList.toggle('open', open);
    els.hint.classList.toggle('shut', !open);
    els.hintBtn.setAttribute('aria-expanded', String(open));
  }
  els.hintBtn.addEventListener('click', () => hintOpen(!els.hint.classList.contains('open')));
  // Mouse hover opens it after a moment, so passing over doesn't; a press opens it at once.
  let hoverT = 0;
  els.hint.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') hoverT = setTimeout(() => els.hint.classList.add('hover'), 250); });
  els.hint.addEventListener('pointerleave', () => { clearTimeout(hoverT); els.hint.classList.remove('hover', 'shut'); });
  els.hint.addEventListener('focusout', () => els.hint.classList.remove('shut'));
  document.addEventListener('click', (e) => { if (!els.hint.contains(e.target)) { els.hint.classList.remove('open'); els.hintBtn.setAttribute('aria-expanded', 'false'); } });

  // ——— The fold (DESIGN.md §Fold animation): the cover swings 180° (shut) to 0° (flat) over the real page ———
  // e0 > 0 resumes from a fold that was reversed part-way (see changePose); outerId is then the closed pose, and
  // v0 the cover's speed at that moment (progress per ms, negative: still moving the old way).
  function foldTo(next, dir, e0 = 0, outerId, v0 = 0) {
    cancelFold();
    const from = pose(), to = poseById(next);
    const innerPose = dir === 'open' ? to : from, outerPose = outerId ? poseById(outerId) : dir === 'open' ? from : to;
    const axis = innerPose.crease && innerPose.crease.axis === 'horizontal' ? 'h' : 'v';
    const anim = { raf: 0, timer: 0, kind: 'fold', dir, next, done: false, e: null, v: 0, t: 0, from: (dir === 'open' ? outerPose : innerPose).id };
    state.anim = anim; els.hint.hidden = true;
    const run = () => {
      if (anim.done) return;
      if (dir === 'open' && !e0) { state.pose = next; render(); screenFade(1, 0); } // the open page waits under the cover
      const g = state.dims, gc = geometry(outerPose); // the open device, which the animation runs on, and the closed one
      const sOpen = fitScale(g), sClosed = fitScale(gc);
      setupFlap(g, axis, gc);
      els.device.style.transition = 'none'; // the fold drives the size; no CSS tween on top of it
      els.fx.style.transition = 'none'; els.fx.style.opacity = '1'; els.fx.style.transform = '';
      els.fx.hidden = false;
      const dur = Math.max(1, MS[dir] * (1 - e0)), t0 = performance.now();
      // A reversal keeps the cover's speed: it carries on a little, slows, turns and comes back, rather than
      // stopping dead. p(1 − p)³ starts at that speed and fades out with no speed or acceleration left at the end,
      // so the landing is the same as ever.
      const m0 = v0 * dur;
      const at = (e) => {
        const now = performance.now();
        if (anim.e != null && now > anim.t) anim.v = (e - anim.e) / (now - anim.t);
        anim.e = e; anim.t = now;
        const theta = dir === 'open' ? 180 * (1 - e) : 180 * e;
        frame(g, axis, theta, dir === 'open' ? sClosed + (sOpen - sClosed) * e : sOpen + (sClosed - sOpen) * e);
      };
      const step = () => {
        const p = Math.min(1, (performance.now() - t0) / dur);
        at(Math.min(1, Math.max(0, e0 + (1 - e0) * LAND(p) + m0 * p * (1 - p) ** 3)));
        if (p < 1) anim.raf = requestAnimationFrame(step);
        else finishFold(anim, { g, gc, axis });
      };
      at(e0);
      anim.raf = requestAnimationFrame(step);
    };
    // Opening starts as the outer screen does: it dims, then the cover lifts.
    if (dir === 'open' && !e0) { screenFade(0, MS.pre); anim.timer = setTimeout(run, MS.pre); } else run();
  }
  function setupFlap(g, axis, gc) {
    const f = els.flap, inner = f.querySelector('.face.inner'), outer = f.querySelector('.face.outer');
    const ip = inner.querySelector('.pane'), op = outer.querySelector('.pane'), isl = outer.querySelector('.island');
    const v = axis === 'v', fw = v ? g.w / 2 : g.w, fh = v ? g.h : g.h / 2;
    els.fx.style.width = px(g.w); els.fx.style.height = px(g.h);
    place(f, 0, 0, fw, fh);
    f.style.transformOrigin = v ? '100% 50%' : '50% 100%';
    f.style.setProperty('--outer-flip', v ? 'rotateY(180deg)' : 'rotateX(180deg)');
    // Inner face: the open screen's near half, as clear glass in its frame (no rim on the hinge side).
    inner.style.borderRadius = v ? `${RADIUS}px 0 0 ${RADIUS}px` : `${RADIUS}px ${RADIUS}px 0 0`;
    inner.style.borderWidth = v ? `${RIM}px 0 ${RIM}px ${RIM}px` : `${RIM}px ${RIM}px 0 ${RIM}px`;
    ip.style.inset = v ? `${g.by}px 0 ${g.by}px ${g.bx}px` : `${g.by}px ${g.bx}px 0 ${g.bx}px`;
    ip.style.borderRadius = v ? `${g.rScreen}px 0 0 ${g.rScreen}px` : `${g.rScreen}px ${g.rScreen}px 0 0`;
    // Outer face: the closed phone at its own size (a touch wider than half the open one, as the hardware is),
    // with its bezel and Dynamic Island where the closed device has them, so the hand-off can't be seen.
    place(outer, fw / 2 - gc.w / 2, fh / 2 - gc.h / 2, gc.w, gc.h);
    op.style.inset = `${gc.by}px ${gc.bx}px`;
    op.style.borderRadius = `${gc.rScreen}px`;
    isl.style.top = px(gc.by + 14); isl.style.right = px(gc.bx + 35);
    // The blur covers the screen only, so the black bezel isn't smeared into it.
    place(els.veil, RIM + g.bx, RIM + g.by, g.W, g.H);
    els.veil.style.borderRadius = `${g.rScreen}px`;
  }
  function frame(g, axis, theta, s) {
    const rad = (theta * Math.PI) / 180;
    const half = axis === 'v' ? g.w / 2 : g.h / 2;
    // What of the open device is uncovered: the far half, plus as much of the near half as the cover spans
    // on screen, perspective included, so the page fills the glass instead of leaving an empty strip.
    const reach = theta >= 90 ? 0 : (half * Math.cos(rad) * PERSPECTIVE) / (PERSPECTIVE - half * Math.sin(rad));
    const clip = Math.max(0, half - reach);
    const clipCss = axis === 'v' ? `inset(0 0 0 ${clip}px round ${RADIUS}px)` : `inset(${clip}px 0 0 0 round ${RADIUS}px)`;
    els.device.style.clipPath = clipCss;
    const sc = axis === 'v' ? Math.max(0, clip - RIM - g.bx) : Math.max(0, clip - RIM - g.by);
    els.veil.style.clipPath = axis === 'v' ? `inset(0 0 0 ${sc}px round ${g.rScreen}px)` : `inset(${sc}px 0 0 0 round ${g.rScreen}px)`;
    els.flap.style.transform = axis === 'v' ? `rotateY(${theta}deg)` : `rotateX(${-theta}deg)`;
    const k = Math.sin(rad); // 0 when flat or shut, 1 edge-on
    const blur = (10 * k).toFixed(2);
    els.veil.style.backdropFilter = els.veil.style.webkitBackdropFilter = `blur(${blur}px) saturate(${1 + 0.4 * k})`;
    els.veil.style.background = `rgba(0,0,0,${(0.22 * k).toFixed(3)})`;
    els.flap.style.setProperty('--shade', (0.28 * k).toFixed(3));
    els.flap.style.setProperty('--sheen', `${(theta / 180) * 100}%`);
    els.flap.querySelector('.face.inner').style.opacity = theta < 40 ? (theta / 40).toFixed(3) : '1';
    // Keep the visible part centred while the scale moves between the closed and open fits.
    const visW = axis === 'v' ? g.w - clip : g.w, visH = axis === 'v' ? g.h : g.h - clip;
    els.scaler.style.width = px(visW * s); els.scaler.style.height = px(visH * s);
    els.rig.style.transform = axis === 'v' ? `translateX(${-clip * s}px) scale(${s})` : `translateY(${-clip * s}px) scale(${s})`;
  }
  function finishFold(anim, soft) {
    if (anim.done) return;
    anim.done = true;
    cancelAnimationFrame(anim.raf); clearTimeout(anim.timer);
    els.device.style.clipPath = ''; els.veil.style.clipPath = '';
    state.anim = null;
    if (anim.dir === 'close') { state.pose = anim.next; render(); fadeIn(); } else { screenFade(1, 0); fit(); }
    if (soft && anim.dir === 'close') {
      // The cover now sits exactly over the closed device: move it onto the device's frame, then let it fade
      // while the closed screen wakes underneath.
      const { g, gc, axis } = soft;
      const cx = axis === 'v' ? (3 * g.w) / 4 : g.w / 2, cy = axis === 'v' ? g.h / 2 : (3 * g.h) / 4;
      els.fx.style.transform = `translate(${gc.w / 2 - cx}px, ${gc.h / 2 - cy}px)`;
      els.fx.style.transition = `opacity ${MS.settle}ms ease`;
      els.fx.style.opacity = '0';
      setTimeout(() => { if (!state.anim) els.fx.hidden = true; }, MS.settle);
    } else els.fx.hidden = true;
    requestAnimationFrame(() => { els.device.style.transition = ''; });
  }
  function cancelFold() {
    const a = state.anim;
    if (!a) return;
    if (a.kind === 'turn') finishTurn(a); else if (a.kind === 'swap') finishSwap(a); else if (a.kind === 'morph') finishMorph(a); else finishFold(a);
  }

  // Turning (Closed ↔ Closed wide, Open ↔ Open tall): a quarter turn, then the new layout fades in.
  function turnTo(next) {
    const to = poseById(next);
    const g1 = state.dims, g2 = geometry(to);
    const s1 = state.scale, s2 = fitScale(g2);
    const deg = to.screen.width > to.screen.height ? -90 : 90;
    const anim = { raf: 0, kind: 'turn', next, from: state.pose, done: false, p: 0 };
    state.anim = anim; els.hint.hidden = true;
    els.device.style.transition = 'none';
    const show = (p) => {
      anim.p = p;
      const e = EASE(p), sc = s1 + (s2 - s1) * e;
      const bw = g1.w * s1 + (g2.w * s2 - g1.w * s1) * e, bh = g1.h * s1 + (g2.h * s2 - g1.h * s1) * e;
      els.scaler.style.width = px(bw); els.scaler.style.height = px(bh);
      els.rig.style.transform = `translate(${bw / 2}px, ${bh / 2}px) rotate(${deg * e}deg) scale(${sc}) translate(${-g1.w / 2}px, ${-g1.h / 2}px)`;
      screenFade(p < 0.5 ? 1 : (1 - (p - 0.5) / 0.5).toFixed(3), 0);
    };
    // From p0 to p1 over the matching share of the turn's duration; a reversal runs it back from where it is.
    const run = (p0, p1) => {
      const t0 = performance.now(), dur = Math.max(1, MS.turn * Math.abs(p1 - p0));
      const step = () => {
        const k = Math.min(1, (performance.now() - t0) / dur);
        show(p0 + (p1 - p0) * k);
        if (k < 1) anim.raf = requestAnimationFrame(step); else finishTurn(anim);
      };
      anim.raf = requestAnimationFrame(step);
    };
    anim.reverse = () => { cancelAnimationFrame(anim.raf); anim.next = anim.from; anim.back = true; run(anim.p, 0); };
    run(0, 1);
  }
  function finishTurn(anim) {
    if (anim.done) return;
    anim.done = true; cancelAnimationFrame(anim.raf);
    state.anim = null; state.pose = anim.next;
    render();
    if (anim.back) screenFade(1, MS.out); else fadeIn(); // turned back: the same layout, so no fade from blank
    requestAnimationFrame(() => { els.device.style.transition = ''; });
  }
  // Open ↔ Split View: same frame, different screen. A soft cross-fade.
  function swapTo(next) {
    const anim = { kind: 'swap', next, from: state.pose, done: false, timer: 0 };
    state.anim = anim;
    screenFade(0, MS.out);
    anim.timer = setTimeout(() => finishSwap(anim), MS.out);
    // Chosen back before the swap: fade the same screen back in.
    anim.reverse = () => { anim.done = true; clearTimeout(anim.timer); state.anim = null; screenFade(1, MS.out); };
  }
  function finishSwap(anim) {
    if (anim.done) return;
    anim.done = true; clearTimeout(anim.timer);
    state.anim = null; state.pose = anim.next;
    render(); fadeIn();
  }
  // Fade what's on the screen, never the screen itself: it holds the page colour, so a change fades
  // through that colour rather than through the black glass behind it.
  function screenFade(opacity, ms) {
    // The Dynamic Island is hardware: it stays while everything around it fades.
    // A 2px blur as it goes, so old and new read as one change rather than two layers crossing.
    const blur = 2 * (1 - opacity);
    for (const el of [els.vp, els.crease, ...els.chrome.querySelectorAll(':scope > :not(.col), .col > :not(.island)')]) {
      el.style.transition = ms ? `opacity ${ms}ms ease, filter ${ms}ms ease` : 'none';
      el.style.opacity = String(opacity);
      el.style.filter = blur ? `blur(${blur.toFixed(2)}px)` : '';
    }
  }
  // Reveal the new screen only once the page has settled at its size (after the mid-fold step, and a moment
  // to reflow), so it fades in finished instead of appearing blank and then jumping.
  function fadeIn() {
    screenFade(0, 0);
    clearTimeout(state.reveal);
    const wait = state.settling ? state.data.transientResize.settleMs + 90 : 90;
    state.reveal = setTimeout(() => requestAnimationFrame(() => requestAnimationFrame(() => {
      screenFade(1, MS.fade);
      els.chrome.style.transition = `opacity ${MS.fade}ms ease`; els.chrome.style.opacity = '1'; // back after a morph
    })), wait);
  }

  // Between poses that don't fold into each other (Closed ↔ Open tall, Closed wide ↔ Open or Split View):
  // the page fades out through its colour, the frame flows to the new shape, the new page fades in.
  function morphTo(next) {
    const g1 = state.dims, g2 = geometry(poseById(next)), s1 = state.scale, s2 = fitScale(g2);
    const anim = { raf: 0, timer: 0, kind: 'morph', next, from: state.pose, done: false, p: null };
    state.anim = anim; els.hint.hidden = true;
    els.device.style.transition = 'none';
    screenFade(0, MS.out);
    // Changing display: the outer screen's column and island go too, rather than drift across the new shape.
    const chromeTo = (o) => { els.chrome.style.transition = `opacity ${MS.out}ms ease`; els.chrome.style.opacity = o; };
    chromeTo('0');
    const L = (a, b, e) => a + (b - a) * e;
    const show = (p) => {
      anim.p = p;
      const e = EASE(p);
      const w = L(g1.w, g2.w, e), h = L(g1.h, g2.h, e), bx = L(g1.bx, g2.bx, e), by = L(g1.by, g2.by, e), sc = L(s1, s2, e);
      els.device.style.width = px(w); els.device.style.height = px(h);
      place(els.screen, RIM + bx, RIM + by, w - 2 * (RIM + bx), h - 2 * (RIM + by));
      els.screen.style.borderRadius = px(L(g1.rScreen, g2.rScreen, e)); // on the element: a variable on .rig re-styles everything under it
      els.scaler.style.width = px(w * sc); els.scaler.style.height = px(h * sc);
      els.rig.style.transform = `scale(${sc})`;
    };
    const run = (p0, p1) => {
      const t0 = performance.now(), dur = Math.max(1, MS.morph * Math.abs(p1 - p0));
      const step = () => {
        const k = Math.min(1, (performance.now() - t0) / dur);
        show(p0 + (p1 - p0) * k);
        if (k < 1) anim.raf = requestAnimationFrame(step); else finishMorph(anim);
      };
      anim.raf = requestAnimationFrame(step);
    };
    anim.timer = setTimeout(() => { els.seamA.hidden = els.seamB.hidden = true; run(0, 1); }, MS.out);
    // Chosen back mid-way: still fading out, fade back in; already changing shape, flow back from where it is.
    anim.reverse = () => {
      clearTimeout(anim.timer); cancelAnimationFrame(anim.raf);
      anim.next = anim.from;
      if (anim.p == null) { anim.done = true; state.anim = null; screenFade(1, MS.out); chromeTo('1'); requestAnimationFrame(() => { els.device.style.transition = ''; }); }
      else run(anim.p, 0);
    };
  }
  function finishMorph(anim) {
    if (anim.done) return;
    anim.done = true; cancelAnimationFrame(anim.raf); clearTimeout(anim.timer);
    state.anim = null; state.pose = anim.next;
    render(); fadeIn();
    requestAnimationFrame(() => { els.device.style.transition = ''; });
  }

  function changePose(next) {
    const a = state.anim;
    const q = new URLSearchParams(location.search); q.set('pose', next);
    // Back to where a move started, while it's still moving: it turns round from where it is (Apple's
    // interruptibility), instead of finishing first and then setting off again.
    if (a && !a.done && next === a.from && (a.kind === 'fold' ? a.e != null : a.reverse)) {
      state.target = next; history.replaceState(null, '', `?${q}`);
      if (a.kind === 'fold') {
        a.done = true; cancelAnimationFrame(a.raf); state.anim = null;
        foldTo(next, a.dir === 'open' ? 'close' : 'open', 1 - a.e, a.dir === 'close' ? a.next : null, -a.v);
      } else a.reverse();
      return;
    }
    cancelFold();
    if (next === state.pose) { state.target = null; state.syncPoses && state.syncPoses(); return; }
    const from = pose(), to = poseById(next);
    state.target = next;
    history.replaceState(null, '', `?${q}`);
    const wide = (x) => x.screen.width > x.screen.height;
    const outerP = from.display === 'outer' ? from : to, innerP = from.display === 'outer' ? to : from;
    if (reduceMotion.matches) swapTo(next); // no movement, but a cross-fade (DESIGN.md §Motion)
    // A book fold turns a tall closed phone into a wide open one, and a wide closed phone into a tall one.
    else if (from.display !== to.display && wide(outerP) !== wide(innerP)) foldTo(next, to.display === 'inner' ? 'open' : 'close');
    else if (from.display !== to.display) morphTo(next);
    else if (wide(from) !== wide(to)) turnTo(next);
    else swapTo(next);
  }

  function renderCaption(p, vw, vh) {
    const est = '<span class="est" title="Estimated: needs a measurement in Safari 27.1" aria-label="estimated"></span>';
    let crease;
    if (!p.crease) crease = 'no crease';
    else if (p.id === 'split-view') crease = 'crease under the divider';
    else if (p.crease.axis === 'vertical') crease = state.fold === 'folded' ? `crease at x ${p.crease.viewportPos}, keep small controls off it` : `crease at x ${p.crease.viewportPos}, inactive while flat`;
    else crease = (state.fold === 'folded' ? `crease at y ≈ ${p.crease.viewportPos}, keep small controls off it` : `crease at y ≈ ${p.crease.viewportPos}, inactive while flat`) + est;
    const each = p.id === 'split-view' ? ' each' : '';
    const e = emu();
    const flags = !state.flags ? '' : state.sameOrigin ? ` · flags on: posture ${e.posture}, ${e.segs.length} segment${e.segs.length > 1 ? 's' : ''}` : ' · flags need a same-origin page';
    els.caption.innerHTML = `<strong>${vw} × ${vh}</strong> CSS px${each} · ${crease}${flags}`;
  }

  function renderTable(p) {
    els.table.tBodies[0].innerHTML = state.data.poses.map((q) => `<tr class="${q.id === p.id ? 'current' : ''}"><td>${q.label}</td><td>${q.viewport.width}</td><td>${q.viewport.svh}</td><td>${q.viewport.lvh}</td></tr>`).join('');
    els.sources.innerHTML = 'Sources: ' + state.data.sources.map((s) => `<a href="${s.url}" rel="noopener">${s.title}</a>`).join(' · ');
  }

  // Feature flags: what the page would see with Safari's two flags on, for pages we can reach.
  function emu() {
    if (!state.flags) return null;
    const p = pose();
    const folded = state.fold === 'folded' && !!p.crease && p.id !== 'split-view';
    return DuoFlags.stateFor({ viewport: { width: p.viewport.width, height: p.viewport[state.bars] }, crease: p.crease, folded, gap: FOLD_GAP });
  }
  function frameWin() { try { const w = els.frame.contentWindow; return w && w.document ? w : null; } catch { return null; } }
  function syncFlags() { const w = frameWin(); if (w) DuoFlags.update(w, emu()); }
  window.__duoBoot = (win) => DuoFlags.install(win, emu());

  function segmented(container, get, set) {
    // The selected look is a copy of the row clipped to one segment (playground.css, .seg .on).
    const btns = [...container.querySelectorAll('[role=radio]')];
    const on = document.createElement('span'), track = document.createElement('span');
    on.className = 'on'; on.setAttribute('aria-hidden', 'true');
    track.innerHTML = btns.map((b) => `<i>${b.innerHTML}</i>`).join('');
    on.append(track); container.append(on);
    const thumb = () => {
      const sel = btns.find((x) => x.dataset.v === get());
      if (!sel || !container.offsetWidth) return;
      [...track.children].forEach((i, k) => { i.style.width = px(btns[k].offsetWidth); });
      const l = sel.offsetLeft - 2;
      track.style.clipPath = `inset(0 ${track.offsetWidth - l - sel.offsetWidth}px 0 ${l}px round 9px)`;
    };
    // Sizes change with the window and when the Fold control appears: move the thumb there without sliding.
    new ResizeObserver(() => { track.style.transition = 'none'; thumb(); void track.offsetWidth; track.style.transition = ''; }).observe(container);
    const sync = () => {
      btns.forEach((x) => {
        const chosen = x.dataset.v === get();
        x.setAttribute('aria-checked', String(chosen));
        x.tabIndex = chosen ? 0 : -1;
      });
      thumb();
    };
    container.addEventListener('click', (e) => {
      const btn = e.target.closest('[role=radio]'); if (!btn) return;
      set(btn.dataset.v); sync();
    });
    container.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const list = [...container.querySelectorAll('[role=radio]')];
      const i = list.findIndex((x) => x.getAttribute('aria-checked') === 'true');
      const next = list[(i + (e.key === 'ArrowRight' ? 1 : list.length - 1)) % list.length];
      next.focus(); next.click(); e.preventDefault();
    });
    sync();
    return sync;
  }

  // Loading a page, and reading its colour when the browser allows it (same origin only).
  function readPageColour() {
    if (!state.bgFromPage) return;
    try {
      const d = els.frame.contentDocument;
      if (!d || !d.body) return;
      const pick = (el) => { const c = getComputedStyle(el).backgroundColor; return /rgba?\(0, 0, 0, 0\)|transparent/.test(c) ? null : c; };
      const c = pick(d.body) || pick(d.documentElement) || 'rgb(255, 255, 255)';
      const m = c.match(/\d+/g).slice(0, 3).map(Number);
      state.bg = '#' + m.map((n) => n.toString(16).padStart(2, '0')).join('');
      applyColours();
    } catch { /* another origin: keep the current colour; the menu can set it */ }
  }
  // ——— The page and its history (DESIGN.md §Back, Forward and Reload) ———
  function makeFrame({ src, srcdoc }) {
    const f = document.createElement('iframe');
    f.id = 'frame'; f.title = 'Website preview'; f.referrerPolicy = 'no-referrer';
    if (srcdoc != null) f.srcdoc = srcdoc; else f.src = src; // set before insertion: one load, no about:blank
    state.nav = { back: [], fwd: [], traversing: null, baseline: true };
    f.addEventListener('load', onFrameLoad);
    els.frame.replaceWith(f);
    els.frame = f;
    updateNav();
  }
  // Safari's progress line in the address field (playground.css .pill::after): it creeps while a page loads
  // and completes when it has. The class lives on #chrome, which survives the bars being redrawn.
  function progress(on) {
    const c = els.chrome;
    clearTimeout(state.loadedT);
    c.classList.remove('loading', 'loaded');
    if (on) { void c.offsetWidth; c.classList.add('loading'); return; } // restart from empty
    c.classList.add('loaded');
    state.loadedT = setTimeout(() => c.classList.remove('loaded'), 500);
  }
  async function onFrameLoad() {
    progress(false);
    const nav = state.nav;
    if (nav.baseline) nav.baseline = false;
    else if (nav.traversing) nav.traversing = null;
    else { nav.back.push({ type: 'doc' }); nav.fwd = []; }
    updateNav();
    readPageColour();
    const w = frameWin();
    if (w) hookLinks(w);
    if (w && w.__duoMatchMedia) { await DuoFlags.collectCss(w); syncFlags(); }
  }
  // Same-page links scroll in place; the shim's <base> would otherwise make them load the real URL.
  function hookLinks(w) {
    w.document.addEventListener('click', (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = e.target.closest && e.target.closest('a[href]');
      const raw = a && a.getAttribute('href');
      if (!raw || raw[0] !== '#') return;
      e.preventDefault();
      const id = decodeURIComponent(raw.slice(1));
      state.nav.back.push({ type: 'hash', y: w.scrollY }); state.nav.fwd = [];
      const target = id && w.document.getElementById(id);
      if (target) target.scrollIntoView(); else w.scrollTo({ top: 0 });
      updateNav();
    });
  }
  function step(dir) {
    const nav = state.nav, w = frameWin();
    const from = dir === 'back' ? nav.back : nav.fwd, to = dir === 'back' ? nav.fwd : nav.back;
    const s = from.pop();
    if (!s) return;
    if (s.type === 'hash') { if (w) { to.push({ type: 'hash', y: w.scrollY }); w.scrollTo({ top: s.y }); } }
    else { to.push({ type: 'doc' }); nav.traversing = dir; progress(true); if (dir === 'back') history.back(); else history.forward(); }
    updateNav();
  }
  function updateNav() {
    els.chrome.querySelectorAll('[data-act="back"]').forEach((b) => { b.classList.toggle('dim', !state.nav.back.length); b.setAttribute('aria-disabled', String(!state.nav.back.length)); });
    els.chrome.querySelectorAll('[data-act="fwd"]').forEach((b) => { b.classList.toggle('dim', !state.nav.fwd.length); b.setAttribute('aria-disabled', String(!state.nav.fwd.length)); });
  }

  // A same-origin page is loaded with the flags shim running first, so its own scripts see Safari's
  // API surface from the start (as after turning a flag on and reloading). Other origins load as they are.
  async function navigate(url) {
    const abs = new URL(url, location.href);
    progress(true);
    state.sameOrigin = abs.origin === location.origin;
    if (!state.sameOrigin) { makeFrame({ src: abs.href }); return; }
    try {
      const html = await (await fetch(abs)).text();
      const boot = `<base href="${abs.href}"><script>parent.__duoBoot && parent.__duoBoot(window)<\/script>`;
      makeFrame({ srcdoc: /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, (m) => m + boot) : boot + html });
    } catch { makeFrame({ src: abs.href }); }
  }

  function load(url) {
    state.url = url;
    state.bgFromPage = true;
    if (url !== SAMPLE) { state.bg = '#ffffff'; }
    navigate(url);
    const q = new URLSearchParams(location.search);
    if (url !== SAMPLE) q.set('url', url); else q.delete('url');
    history.replaceState(null, '', q.toString() ? `?${q}` : location.pathname);
    render();
  }

  // The address sheet.
  let lastFocus = null;
  function openSheet() {
    lastFocus = document.activeElement;
    els.url.value = state.url === SAMPLE ? '' : state.url;
    els.sheet.hidden = false;
    requestAnimationFrame(() => { els.url.focus(); els.url.select(); });
  }
  function closeSheet() { els.sheet.hidden = true; if (lastFocus) lastFocus.focus(); }
  els.openSite.addEventListener('click', openSheet);
  els.chrome.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]');
    if (act) { if (act.dataset.act === 'reload') navigate(state.url); else step(act.dataset.act); return; }
    if (e.target.closest('[data-edit]')) openSheet();
  });
  els.cancel.addEventListener('click', closeSheet);
  els.sheet.addEventListener('click', (e) => { if (e.target === els.sheet) closeSheet(); });
  els.useSample.addEventListener('click', () => { closeSheet(); load(SAMPLE); });
  els.sheetForm.addEventListener('submit', (e) => {
    e.preventDefault();
    let u = els.url.value.trim();
    if (!u) return;
    if (!/^https?:\/\//i.test(u)) u = `https://${u}`;
    closeSheet(); load(u);
  });

  // The menu.
  function toggleMenu(open) {
    const next = open ?? els.menu.hidden;
    els.menu.hidden = !next;
    els.menuBtn.setAttribute('aria-expanded', String(next));
  }
  els.menuBtn.addEventListener('click', (e) => { e.stopPropagation(); toggleMenu(); });
  document.addEventListener('click', (e) => { if (!els.menu.hidden && !els.menu.contains(e.target) && e.target !== els.menuBtn) toggleMenu(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (!els.sheet.hidden) closeSheet();
    else if (!els.menu.hidden) { toggleMenu(false); els.menuBtn.focus(); }
    else if (!els.hint.hidden) hintOpen(false);
  });
  els.bg.addEventListener('input', () => { state.bgFromPage = false; state.bg = els.bg.value; applyColours(); });
  els.bgAuto.addEventListener('click', () => { state.bgFromPage = true; readPageColour(); });

  // Export: a link to this view, and the five poses as Playwright presets.
  function presets() {
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 27_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/27.1 Mobile/15E148 Safari/604.1';
    const rows = state.data.poses.map((p) => `  { name: '${p.id}', viewport: { width: ${p.viewport.width}, height: ${p.viewport.svh} }, scrolledHeight: ${p.viewport.lvh} },`).join('\n');
    return `// iPhone Duo in Safari 27.1: viewports from WebKit, via iphone-duo-playground/poses.json (${state.data.collected}).\n// Use with: browser.newContext({ ...duoContext, viewport: pose.viewport })\nexport const duoContext = { deviceScaleFactor: ${state.data.devicePixelRatio}, isMobile: true, hasTouch: true, userAgent: '${ua}' };\nexport const duoPoses = [\n${rows}\n];\n`;
  }
  // The button keeps its width and the label blurs across, so the row doesn't reflow under the pointer.
  function relabel(btn, text, done) {
    btn.classList.add('swap');
    setTimeout(() => { btn.firstElementChild.textContent = text; btn.classList.remove('swap'); if (done) done(); }, 120);
  }
  async function copy(btn, text) {
    if (btn.style.width) return; // still showing the last result
    const label = btn.textContent;
    btn.style.width = px(btn.offsetWidth);
    let ok;
    try { await navigator.clipboard.writeText(text); ok = true; }
    catch {
      const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select();
      ok = document.execCommand('copy'); ta.remove();
    }
    relabel(btn, ok ? 'Copied' : 'Copy failed');
    setTimeout(() => relabel(btn, label, () => { btn.style.width = ''; }), 1400);
  }
  els.copyLink.addEventListener('click', () => copy(els.copyLink, location.href));
  els.copyPresets.addEventListener('click', () => copy(els.copyPresets, presets()));

  els.flags.addEventListener('change', () => {
    state.flags = els.flags.checked;
    const q = new URLSearchParams(location.search);
    if (state.flags) q.set('flags', '1'); else q.delete('flags');
    history.replaceState(null, '', q.toString() ? `?${q}` : location.pathname);
    load(state.url); // a flag change needs a reload, as in Safari
  });

  fetch('poses.json').then((r) => r.json()).then((data) => {
    state.data = data;
    if (!data.poses.some((p) => p.id === state.pose)) state.pose = data.poses[0].id;
    els.poses.innerHTML = data.poses.map((p) => `<button type="button" role="radio" aria-checked="false" data-v="${p.id}" aria-label="${p.label}" title="${p.label}">${GLYPH[p.id] || ''}<span>${p.label}</span></button>`).join('');
    state.syncPoses = segmented(els.poses, () => state.target || state.pose, (v) => changePose(v));
    segmented(els.bars, () => state.bars, (v) => {
      state.bars = v; cancelFold();
      // Safari's bars collapse and grow back smoothly; so does the page under them here.
      els.vp.classList.add('glide');
      render();
      els.chrome.classList.remove('fade'); void els.chrome.offsetWidth; els.chrome.classList.add('fade');
      setTimeout(() => els.vp.classList.remove('glide'), 460);
    });
    segmented(els.fold, () => state.fold, (v) => { state.fold = v; render(); });
    els.flags.checked = state.flags;
    navigate(state.url);
    render();
    new ResizeObserver(fit).observe(els.stage);
    document.body.classList.add('ready');
  }).catch(() => {
    els.caption.textContent = 'poses.json did not load. Serve this folder over HTTP; browsers block fetch from file://.';
    document.body.classList.add('ready');
  });
})();
