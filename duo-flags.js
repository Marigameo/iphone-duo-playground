/* duo-flags: what a page sees when Safari 27.1's two feature flags are on, emulated for a same-origin frame.
 *
 * Safari 27.1 ships the Device Posture API and the Viewport Segments API behind flags (Settings › Apps ›
 * Safari › Advanced › Feature Flags). This file gives a framed page the same surface:
 *   navigator.devicePosture.type and its change event
 *   window.viewport.segments (DOMRects)
 *   matchMedia() for (device-posture: …) and (horizontal|vertical-viewport-segments: n)
 *   CSS @media blocks on those features, with env(viewport-segment-*) replaced by numbers
 * With the flags off it hides the APIs, which is what Safari does by default (Chrome would otherwise expose
 * its own). It only works on pages the playground can reach: the sample and anything served from the same origin.
 */
(() => {
  'use strict';
  const FEATURE = /\(\s*(horizontal-viewport-segments|vertical-viewport-segments|device-posture)\s*:\s*([\w-]+)\s*\)/;
  const FEATURE_G = new RegExp(FEATURE.source, 'g');
  const ENV_G = /env\(\s*viewport-segment-(width|height|top|right|bottom|left)\s+(\d+)\s+(\d+)\s*(?:,[^)]*)?\)/g;

  // The emulated state for one pose. gap is the fold region's width; Apple has not published it (estimated).
  function stateFor({ viewport, crease, folded, gap }) {
    const { width: vw, height: vh } = viewport;
    const one = { posture: folded ? 'folded' : 'continuous', h: 1, v: 1, segs: [{ x: 0, y: 0, width: vw, height: vh }] };
    if (!folded || !crease || crease.viewportPos == null) return one;
    const c = crease.viewportPos, g = gap / 2;
    if (crease.axis === 'vertical') return { posture: 'folded', h: 2, v: 1, segs: [{ x: 0, y: 0, width: c - g, height: vh }, { x: c + g, y: 0, width: vw - (c + g), height: vh }] };
    return { posture: 'folded', h: 1, v: 2, segs: [{ x: 0, y: 0, width: vw, height: c - g }, { x: 0, y: c + g, width: vw, height: vh - (c + g) }] };
  }

  function segmentAt(emu, i, j) {
    if (emu.h === 2 && j === 0) return emu.segs[i] || null;
    if (emu.v === 2 && i === 0) return emu.segs[j] || null;
    return i === 0 && j === 0 ? emu.segs[0] : null;
  }
  function envValue(emu, side, i, j) {
    const s = segmentAt(emu, i, j);
    if (!s) return '0px';
    const v = { width: s.width, height: s.height, top: s.y, left: s.x, right: s.x + s.width, bottom: s.y + s.height }[side];
    return `${Math.round(v * 100) / 100}px`;
  }
  // Swap each fold feature for a condition every browser evaluates: always true, or always false.
  function rewriteQuery(q, emu) {
    return q.replace(FEATURE_G, (_, name, value) => {
      let ok;
      if (name === 'device-posture') ok = !!emu && emu.posture === value;
      else if (name === 'horizontal-viewport-segments') ok = !!emu && String(emu.h) === value;
      else ok = !!emu && String(emu.v) === value;
      return ok ? '(min-width: 0px)' : '(max-width: 0.001px)';
    });
  }

  // Pull @media blocks that mention a fold feature out of a stylesheet's text, with brace matching.
  function foldBlocks(css) {
    const out = [];
    let i = 0;
    while ((i = css.indexOf('@media', i)) !== -1) {
      const open = css.indexOf('{', i);
      if (open === -1) break;
      const prelude = css.slice(i + 6, open).trim();
      let depth = 1, k = open + 1;
      while (k < css.length && depth) { if (css[k] === '{') depth++; else if (css[k] === '}') depth--; k++; }
      if (FEATURE.test(prelude)) out.push({ prelude, body: css.slice(open + 1, k - 1) });
      i = k;
    }
    return out;
  }

  async function collectCss(win) {
    const doc = win.document;
    const texts = [...doc.querySelectorAll('style:not([data-duo-flags])')].map((s) => s.textContent || '');
    const links = [...doc.querySelectorAll('link[rel~="stylesheet"][href]')];
    for (const l of links) {
      try {
        const u = new URL(l.getAttribute('href'), doc.baseURI);
        if (u.origin !== location.origin) continue;
        texts.push(await (await fetch(u)).text());
      } catch { /* unreadable sheet: skip it */ }
    }
    win.__duoBlocks = texts.flatMap(foldBlocks);
  }

  function applyCss(win) {
    const doc = win.document;
    let el = doc.querySelector('style[data-duo-flags]');
    const emu = win.__duoEmu;
    if (!emu || !win.__duoBlocks) { if (el) el.remove(); return; }
    const css = win.__duoBlocks
      .filter((b) => win.__duoMatchMedia(rewriteQuery(b.prelude, emu)).matches)
      .map((b) => b.body.replace(ENV_G, (_, side, i, j) => envValue(emu, side, Number(i), Number(j))))
      .join('\n');
    if (!el) { el = doc.createElement('style'); el.dataset.duoFlags = ''; (doc.head || doc.documentElement).appendChild(el); }
    el.textContent = css;
  }

  // Runs inside the framed page before its own scripts (see playground.js: the page is loaded with this call first).
  function install(win, emu) {
    win.__duoEmu = emu;
    const target = new win.EventTarget();
    const posture = {
      get type() { return win.__duoEmu ? win.__duoEmu.posture : 'continuous'; },
      onchange: null,
      addEventListener: (...a) => target.addEventListener(...a),
      removeEventListener: (...a) => target.removeEventListener(...a),
      dispatchEvent: (e) => target.dispatchEvent(e),
    };
    target.addEventListener('change', (e) => { if (typeof posture.onchange === 'function') posture.onchange.call(posture, e); });
    win.__duoPostureTarget = target;
    const segmentsGetter = () => (win.__duoEmu ? win.__duoEmu.segs.map((s) => new win.DOMRect(s.x, s.y, s.width, s.height)) : undefined);
    const viewportObj = { get segments() { return segmentsGetter(); } };
    try { Object.defineProperty(win.navigator, 'devicePosture', { configurable: true, get: () => (win.__duoEmu ? posture : undefined) }); } catch {}
    try { Object.defineProperty(win, 'viewport', { configurable: true, get: () => (win.__duoEmu ? viewportObj : undefined) }); } catch {
      try { if (win.Viewport) Object.defineProperty(win.Viewport.prototype, 'segments', { configurable: true, get: segmentsGetter }); } catch {}
    }
    const nativeMM = win.matchMedia.bind(win);
    win.__duoMatchMedia = nativeMM;
    win.matchMedia = (q) => nativeMM(FEATURE.test(String(q)) ? rewriteQuery(String(q), win.__duoEmu) : q);
  }

  function update(win, emu) {
    if (!win || !win.__duoMatchMedia) return;
    const before = win.__duoEmu ? win.__duoEmu.posture : null;
    win.__duoEmu = emu;
    applyCss(win);
    if (emu && before && before !== emu.posture) win.__duoPostureTarget.dispatchEvent(new win.Event('change'));
  }

  window.DuoFlags = { stateFor, install, update, collectCss, applyCss, rewriteQuery, foldBlocks };
})();
