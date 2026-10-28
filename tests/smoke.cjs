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
  await page.click('#poses [data-v="closed-portrait"]'); await page.waitForTimeout(2400);
  const f = await sample();
  await f.evaluate(() => { window.__marks = 'kept'; window.__sizes = []; addEventListener('resize', () => window.__sizes.push(`${innerWidth}x${innerHeight}`)); });
  await page.click('#poses [data-v="open-landscape"]'); await page.waitForTimeout(2400);
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
  await page.click('#poses [data-v="open-portrait"]'); await page.waitForTimeout(2400);
  r = await probe();
  check('flags on, open tall, folded: still 2 segments', r.seg === '2', JSON.stringify(r));
  await page.click('#poses [data-v="closed-portrait"]'); await page.waitForTimeout(2400);
  r = await probe();
  check('flags on, closed: continuous, 1 segment', r.posture === 'continuous' && r.seg === '1', JSON.stringify(r));

  // 5. The sample is real: its readout matches what the page gets, and its notice goes when told.
  const sf = await sample();
  const live = await sf.evaluate(() => ({ vp: document.getElementById('vp').textContent, w: innerWidth, h: innerHeight }));
  check('sample readout shows the real viewport', live.vp === `${live.w} × ${live.h}`, JSON.stringify(live));
  await sf.click('#gotit'); await page.waitForTimeout(400);
  check('sample notice dismisses on "Got it"', await sf.evaluate(() => document.getElementById('notice').classList.contains('gone')));

  // 6. The fold animation runs mid-way and leaves nothing behind.
  await page.click('#poses [data-v="open-landscape"]'); await page.waitForTimeout(900);
  const mid = await page.evaluate(() => ({ fx: !document.getElementById('foldfx').hidden, rot: document.getElementById('flap').style.transform }));
  check('opening shows the cover mid-swing', mid.fx && /rotateY\((?!0deg|180deg)[\d.]+deg\)/.test(mid.rot), JSON.stringify(mid));
  await page.waitForTimeout(1500);
  const end = await page.evaluate(() => ({ fx: document.getElementById('foldfx').hidden, clip: document.getElementById('device').style.clipPath }));
  check('after opening, no overlay or clip remains', end.fx && !end.clip, JSON.stringify(end));

  // 6b. Poses that don't fold into each other morph instead: no cover, and the page ends at its size.
  await page.click('#poses [data-v="closed-landscape"]'); await page.waitForTimeout(2400);
  await page.click('#poses [data-v="open-landscape"]'); await page.waitForTimeout(600);
  check('Closed wide → Open morphs, without the fold cover', await page.evaluate(() => document.getElementById('foldfx').hidden));
  await page.waitForTimeout(1800);
  const [mw, mh] = await size();
  check('after the morph, the page gets 951 × 585', mw === 951 && mh === 585, `${mw} × ${mh}`);
  const shown = await page.evaluate(() => getComputedStyle(document.getElementById('vp')).opacity);
  check('after the morph, the page is fully revealed', shown === '1', shown);

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
  await page.click('#chrome [data-act="reload"]'); await page.waitForTimeout(1500);
  nf = await sample();
  check('Reload resets to the top with an empty history', (await nf.evaluate(() => Math.round(scrollY))) === 0 && await backDim());
  check('the playground URL never changed', page.url() === before, page.url());

  // 8. Export: the presets carry all five viewports.
  await page.click('#menuBtn'); await page.click('#copyPresets'); await page.waitForTimeout(200);
  const clip = await page.evaluate(() => navigator.clipboard.readText());
  check('presets list every pose', poses.every((p) => clip.includes(`width: ${p.viewport.width}, height: ${p.viewport.svh}`)), clip.slice(0, 120));

  check('no console errors', errors.length === 0, errors.join(' | '));
  await browser.close();
  console.log(failed ? `\n${failed} failed` : '\nall passed');
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
