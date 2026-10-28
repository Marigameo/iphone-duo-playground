/* Smoke test for the playground. Serves nothing itself: run `python3 -m http.server 8765` in the repo first.
 *   PLAYWRIGHT=/path/to/node_modules/playwright node tests/smoke.cjs
 * Checks what the framed page actually receives, not what the playground draws. Exit 1 on any failure. */
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');
const poses = require('../poses.json').poses;
const BASE = process.env.BASE || 'http://127.0.0.1:8765/';
let failed = 0;
const check = (name, ok, detail = '') => { console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : `  ${detail}`}`); if (!ok) failed++; };

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: new URL(BASE).origin });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });

  const sample = async () => { for (let i = 0; i < 50; i++) { const f = page.frames().find((x) => x !== page.mainFrame()); if (f) { try { if (await f.evaluate(() => !!document.getElementById('live'))) return f; } catch {} } await page.waitForTimeout(100); } throw new Error('sample frame not found'); };
  const size = async () => (await sample()).evaluate(() => [innerWidth, innerHeight]);
  const choose = async (pose, ms) => { await page.click(`#poses [data-v="${pose}"]`); await page.waitForTimeout(ms); };
  // The device's rotation, read just before and just after choosing a pose, in one go so the turn can't move in between.
  const rotAround = (pose) => page.evaluate((v) => {
    const rot = () => +((/rotate\((-?[\d.]+)deg\)/.exec(document.getElementById('rig').style.transform) || [0, 0])[1]);
    const a = rot(); document.querySelector(`#poses [data-v="${v}"]`).click(); return [a, rot()];
  }, pose);

  // 1. Every pose hands the page WebKit's viewport, with bars and scrolled.
  await page.goto(BASE, { waitUntil: 'networkidle' });
  for (const p of poses) {
    await page.click(`#poses [data-v="${p.id}"]`); await page.waitForTimeout(2400);
    await page.click('#bars [data-v="svh"]'); await page.waitForTimeout(600);
    const [w, h] = await size();
    check(`${p.id}: page gets ${p.viewport.width} × ${p.viewport.svh}`, w === p.viewport.width && h === p.viewport.svh, `got ${w} × ${h}`);
    await page.click('#bars [data-v="lvh"]'); await page.waitForTimeout(600);
    const [w2, h2] = await size();
    check(`${p.id}: scrolled, page gets ${p.viewport.width} × ${p.viewport.lvh}`, w2 === p.viewport.width && h2 === p.viewport.lvh, `got ${w2} × ${h2}`);
  }
  await page.click('#bars [data-v="svh"]');

  // 2. Opening the device resizes through the mid-fold size, without a reload.
  await choose('closed-portrait', 2400);
  const f = await sample();
  await f.evaluate(() => { window.__marks = 'kept'; window.__sizes = []; addEventListener('resize', () => window.__sizes.push(`${innerWidth}x${innerHeight}`)); });
  await choose('open-landscape', 2400);
  const seq = await f.evaluate(() => window.__sizes.join(' → '));
  check('opening passes through 466x498 and settles at 951x585', /466x498.*951x585/.test(seq), seq);
  check('opening does not reload the page', await f.evaluate(() => window.__marks === 'kept'));

  // 3. Flags off: the APIs are absent, as in Safari by default.
  const probe = async () => (await sample()).evaluate(() => ({ posture: document.getElementById('posture').textContent, seg: document.getElementById('seg').textContent, cols: getComputedStyle(document.querySelector('.grid')).gridTemplateColumns.split(' ').length, gap: getComputedStyle(document.querySelector('.cta')).columnGap, gridGap: getComputedStyle(document.querySelector('.grid')).columnGap }));
  let r = await probe();
  check('flags off: no Device Posture API', r.posture === 'not available', r.posture);
  check('flags off: no Viewport Segments API', r.seg === 'not available', r.seg);

  // 4. Flags on, open and folded: posture folded, two segments, and the page's segment CSS applies.
  await page.click('#menuBtn'); await page.click('#flags'); await page.keyboard.press('Escape');
  await page.waitForTimeout(2400);
  r = await probe();
  check('flags on, flat: posture continuous, 1 segment', r.posture === 'continuous' && r.seg === '1', JSON.stringify(r));
  check('flags on, flat: segment CSS inactive (2 columns, 20px gutter, 16px CTA gap)', r.cols === 2 && r.gridGap === '20px' && r.gap === '16px', JSON.stringify(r));
  await page.click('#fold [data-v="folded"]'); await page.waitForTimeout(400);
  r = await probe();
  check('flags on, folded: posture folded, 2 segments', r.posture === 'folded' && r.seg === '2', JSON.stringify(r));
  check('flags on, folded: grid gutter spans the fold (44px)', r.cols === 2 && r.gridGap === '44px', JSON.stringify(r));
  check('flags on, folded: CTA gap spans the fold (48px)', r.gap === '48px', r.gap);
  await choose('open-portrait', 2400);
  r = await probe();
  check('flags on, open tall, folded: still 2 segments', r.seg === '2', JSON.stringify(r));
  await choose('closed-portrait', 2400);
  r = await probe();
  check('flags on, closed: continuous, 1 segment', r.posture === 'continuous' && r.seg === '1', JSON.stringify(r));

  // 4b. Chromium once drew the page's fixed notice without its text after folding into Split View
  //     (playground.css, .vp will-change). Count the pixels inside the card that differ clearly from its
  //     background: text gives hundreds, a blank card none.
  await choose('closed-portrait', 2600);
  await choose('split-view', 3200);
  const nbox = await page.evaluate(() => { const f = document.getElementById('frame'), r = f.getBoundingClientRect(), n = f.contentDocument.getElementById('notice').getBoundingClientRect(); return { x: r.left + n.left + 16, y: r.top + n.top + 12, width: n.width - 32, height: n.height - 24 }; });
  const ink = await page.evaluate(async (src) => {
    const img = new Image(); img.src = src; await img.decode();
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
    const g = c.getContext('2d'); g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, c.width, c.height).data, lum = (i) => 0.3 * d[i] + 0.59 * d[i + 1] + 0.11 * d[i + 2];
    let n = 0; for (let i = 0; i < d.length; i += 4) if (Math.abs(lum(i) - lum(0)) > 60) n++;
    return n;
  }, 'data:image/png;base64,' + (await page.screenshot({ clip: nbox })).toString('base64'));
  check('after folding into Split View, the page\'s notice is drawn with its text', ink > 200, `${ink} text pixels`);
  await choose('closed-portrait', 2600);

  // 5. The sample is real: its readout matches what the page gets, and its notice goes when told.
  const sf = await sample();
  const live = await sf.evaluate(() => ({ vp: document.getElementById('vp').textContent, w: innerWidth, h: innerHeight }));
  check('sample readout shows the real viewport', live.vp === `${live.w} × ${live.h}`, JSON.stringify(live));
  await sf.click('#gotit'); await page.waitForTimeout(400);
  check('sample notice dismisses on "Got it"', await sf.evaluate(() => document.getElementById('notice').classList.contains('gone')));

  // 6. The fold animation runs mid-way and leaves nothing behind.
  await choose('open-landscape', 900);
  const mid = await page.evaluate(() => ({ fx: !document.getElementById('foldfx').hidden, rot: document.getElementById('flap').style.transform }));
  check('opening shows the cover mid-swing', mid.fx && /rotateY\((?!0deg|180deg)[\d.]+deg\)/.test(mid.rot), JSON.stringify(mid));
  await page.waitForTimeout(1500);
  const end = await page.evaluate(() => ({ fx: document.getElementById('foldfx').hidden, clip: document.getElementById('device').style.clipPath }));
  check('after opening, no overlay or clip remains', end.fx && !end.clip, JSON.stringify(end));

  // 6b. Poses that don't fold into each other morph instead: no cover, and the page ends at its size.
  await choose('closed-landscape', 2400);
  await choose('open-landscape', 600);
  check('Closed wide → Open morphs, without the fold cover', await page.evaluate(() => document.getElementById('foldfx').hidden));
  await page.waitForTimeout(1800);
  const [mw, mh] = await size();
  check('after the morph, the page gets 951 × 585', mw === 951 && mh === 585, `${mw} × ${mh}`);
  const shown = await page.evaluate(() => getComputedStyle(document.getElementById('vp')).opacity);
  check('after the morph, the page is fully revealed', shown === '1', shown);

  // 6c. Choosing the starting pose mid-fold turns the cover round from where it is, and it still lands clean.
  await choose('closed-portrait', 2600);
  await choose('open-landscape', 940);
  const turn = await page.evaluate(() => { // read, reverse and read again in one go, so the swing can't move in between
    const deg = () => +/(-?[\d.]+)deg/.exec(document.getElementById('flap').style.transform)[1];
    const a = deg(); document.querySelector('#poses [data-v="closed-portrait"]').click(); return [a, deg()];
  });
  check('reversing mid-fold continues from the same angle', turn[0] > 5 && turn[0] < 175 && Math.abs(turn[0] - turn[1]) < 0.5, JSON.stringify(turn));
  await page.waitForTimeout(2200);
  const rev = await page.evaluate(() => ({ fx: document.getElementById('foldfx').hidden, clip: document.getElementById('device').style.clipPath }));
  const [rw] = await size();
  check('the reversed fold lands closed, with nothing left behind', rev.fx && !rev.clip && rw === 382, JSON.stringify({ ...rev, rw }));

  // 6d. When the Fold control appears, the toolbar's groups slide over rather than jump.
  const slide = await page.evaluate(() => new Promise((done) => { // sampled every frame, in the page
    const left = () => Math.round(document.getElementById('poses').getBoundingClientRect().left);
    const l0 = left(), path = [], t0 = performance.now();
    document.querySelector('#poses [data-v="open-landscape"]').click();
    const tick = () => { path.push(left()); if (performance.now() - t0 < 1200) requestAnimationFrame(tick); else done({ l0, path }); };
    requestAnimationFrame(tick);
  }));
  await page.waitForTimeout(1500);
  const l1 = await page.evaluate(() => Math.round(document.getElementById('poses').getBoundingClientRect().left));
  check('the toolbar slides to make room for the Fold control', slide.path.filter((x) => x < slide.l0 - 2 && x > l1 + 2).length >= 2, JSON.stringify({ ...slide, l1 }));

  // 6e. A turn chosen back mid-way turns back from where it is.
  await choose('open-portrait', 350);
  const tb = await rotAround('open-landscape');
  await page.waitForTimeout(900);
  const [tw] = await size();
  check('a turn chosen back mid-way returns without finishing first', Math.abs(tb[0]) > 10 && Math.abs(tb[0] - tb[1]) < 1 && tw === 951, JSON.stringify({ tb, tw }));

  // 6f. …and can turn round again: reverse, then reverse back, with no jump, landing on the last choice.
  await choose('open-portrait', 350);
  const r1 = await rotAround('open-landscape'); await page.waitForTimeout(120);
  const r2 = await rotAround('open-portrait'); await page.waitForTimeout(1000);
  const [t2w] = await size();
  check('a turn can be reversed twice without a jump', Math.abs(r2[0]) > 5 && Math.abs(r2[0] - r2[1]) < 1 && t2w === 669, JSON.stringify({ r1, r2, t2w }));
  check('the sideways fold tip scales in (its offset variable has a valid fallback)', (await page.evaluate(() => getComputedStyle(document.getElementById('foldTip')).transform)).startsWith('matrix(0.97'));
  await choose('open-landscape', 1500);

  // 6g. A morph chosen back while it is still fading out fades straight back, Fold marker and all.
  await choose('closed-landscape', 80);
  await choose('open-landscape', 600);
  const mb = await page.evaluate(() => ({ marker: !document.getElementById('foldHint').hidden, op: getComputedStyle(document.getElementById('vp')).opacity, w: document.getElementById('frame').contentWindow.innerWidth }));
  check('a morph reversed during its fade-out keeps the page and the Fold marker', mb.marker && mb.op === '1' && mb.w === 951, JSON.stringify(mb));

  // 7. Back, Forward and Reload: in-page links stay in the page and can be walked back; nothing escapes.
  const before = page.url();
  let nf = await sample();
  const backDim = async () => page.evaluate(() => [...document.querySelectorAll('#chrome [data-act="back"]')].every((b) => b.classList.contains('dim')));
  check('nothing to go back to on a fresh page', await backDim());
  await page.click('#chrome [data-act="back"]'); await page.waitForTimeout(400);
  check('Back with nothing to go back to stays in the playground', page.url() === before, page.url());
  await nf.click('a[href="#checklist"]'); await page.waitForTimeout(1200);
  nf = await sample();
  const at = await nf.evaluate(() => ({ y: Math.round(scrollY), srcdoc: location.href === 'about:srcdoc', shim: !!window.__duoMatchMedia }));
  check('a "#checklist" link scrolls within the page, keeping the shim', at.y > 200 && at.srcdoc && at.shim, JSON.stringify(at));
  check('Back is available after the jump', !(await backDim()));
  await page.click('#chrome [data-act="back"]'); await page.waitForTimeout(1200);
  check('Back returns to the top', (await nf.evaluate(() => Math.round(scrollY))) < 5);
  await page.click('#chrome [data-act="fwd"]'); await page.waitForTimeout(1200);
  check('Forward returns to the checklist', Math.abs((await nf.evaluate(() => Math.round(scrollY))) - at.y) < 5);
  await page.click('#chrome [data-act="reload"]');
  check('Reload shows Safari\'s progress line', await page.evaluate(() => document.getElementById('chrome').classList.contains('loading')));
  await page.waitForTimeout(1500);
  check('the progress line clears once loaded', await page.evaluate(() => !/loading|loaded/.test(document.getElementById('chrome').className)));
  nf = await sample();
  check('Reload resets to the top with an empty history', (await nf.evaluate(() => Math.round(scrollY))) === 0 && await backDim());
  check('the playground URL never changed', page.url() === before, page.url());

  // 8. Export: the presets carry all five viewports.
  await page.click('#menuBtn'); await page.click('#copyPresets'); await page.waitForTimeout(200);
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  check('presets list every pose', poses.every((p) => clip.includes(`width: ${p.viewport.width}, height: ${p.viewport.svh}`)), clip.slice(0, 120));
  await page.keyboard.press('Escape');

  // 9. Controls: the fold tip closes on a second press even under the pointer; the thumb sits on the chosen segment.
  const tip = () => page.evaluate(() => getComputedStyle(document.getElementById('foldTip')).opacity);
  await page.keyboard.press('Escape'); // with nothing open: must not stop the tip opening on hover
  await page.hover('#foldHintBtn'); await page.waitForTimeout(500);
  check('after a stray Escape, hovering still opens the fold tip', (await tip()) === '1', await tip());
  await page.mouse.move(5, 450); await page.waitForTimeout(300);
  await page.click('#foldHintBtn'); await page.waitForTimeout(300); const tipA = await tip();
  await page.click('#foldHintBtn'); await page.waitForTimeout(300); const tipB = await tip();
  check('the fold tip opens on a press and closes on the next', tipA === '1' && tipB === '0', `${tipA} ${tipB}`);
  const thumb = await page.evaluate(() => {
    const b = document.querySelector('#poses [aria-checked=true]').getBoundingClientRect(), t = document.querySelector('#poses .on > span');
    const r = t.getBoundingClientRect(), m = /inset\(0px ([\d.]+)px 0px ([\d.]+)px/.exec(getComputedStyle(t).clipPath);
    return Math.abs(b.left - (r.left + +m[2])) < 1 && Math.abs(b.right - (r.right - +m[1])) < 1;
  });
  check('the selected thumb lines up with the chosen pose', thumb);

  // 9b. Opening a page from the sheet: the progress line starts from empty and creeps, rather than appearing at 90%.
  await page.click('#openSite'); await page.waitForTimeout(300);
  const sx = await page.evaluate(() => {
    document.getElementById('useSample').click();
    const t = getComputedStyle(document.querySelector('#chrome .pill, #chrome .mini'), '::after').transform;
    return t === 'none' ? 1 : +/matrix\(([\d.]+)/.exec(t)[1];
  });
  check('a sheet load starts the progress line from empty', sx < 0.5, String(sx));
  await page.waitForTimeout(1500);

  // 10. Reduce Motion: no fold, but the change still cross-fades.
  const rctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const rp = await rctx.newPage();
  rp.on('pageerror', (e) => errors.push(e.message));
  await rp.goto(BASE, { waitUntil: 'networkidle' }); await rp.waitForTimeout(800);
  await rp.click('#poses [data-v="open-landscape"]'); await rp.waitForTimeout(100);
  const rm = await rp.evaluate(() => ({ cover: !document.getElementById('foldfx').hidden, op: +getComputedStyle(document.getElementById('vp')).opacity }));
  check('reduce motion: no fold cover, a cross-fade instead', !rm.cover && rm.op < 1, JSON.stringify(rm));
  await rctx.close();

  check('no console errors', errors.length === 0, errors.join(' | '));
  await browser.close();
  console.log(failed ? `\n${failed} failed` : '\nall passed');
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
