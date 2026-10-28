# iphone-duo-playground: journal

## 01 · 2026-10-27 · Brief and M1

Mari's brief: "host the playground in github pages itself. yeah it can be static html page but make it look more like iphone/apple world"; "separate repo like co-presence & hyperlinked here to skills readme, yes we can export & ship it first as planned". The research behind the numbers is in `../skills/journey/duo-web/` (ignored there).

Claude's calls this round: repo name, no build step, estimates labelled in the UI, chrome placement derived from WebKit's arithmetic and marked estimated. M1 built; screenshots in `process/01-m1/`.

**M1 result.** Five poses render with Safari's chrome and the crease; light, dark, 1440 and 375 wide; no console errors. Claude's fixes before hand-over: the pose segmented control truncated its labels (now a 3 + 2 grid), and the sample page's "100vh hero" tag overlapped the size probe at 382 wide (moved to the hero's bottom corner). Snapshot: `process/01-m1/`. Waiting for Mari to look.

## Paused · 2026-10-27

Mari: "I do have some feedbacks on the playground UI itself, we'll stop here. I'll resume later." Resume at the M1 gate: take Mari's UI feedback first, then M2. Labels renamed to "Closed, wide" and "Open, tall" after the last screenshots. Nothing committed yet.

Skill name confirmed by Mari: `fit-iphone-duo` ("Yeah, fit-iphone-duo works"). The playground's links already use it.

## 02 · 2026-10-28 · UX round

Mari's feedback, in Mari's words:
- "The actual preview is the main attraction of this playground, so it has to be taking the max space & attention. Other details should be limited & arranged with proper spacing"
- "It should feel like trying a real browser in iphone duo device (safari). So let's show browser kind of url bar at all"
- "This pose section: we can show only critical details, let's hide/remove additional details"
- "Why is it showing the view 2 times in split view? Is it how it would show in real device?"
- "make it feel like a real device, the padding, spacing etc"

What changed: the stage is the page; one header line, one caption line, one floating toolbar; facts moved behind ⋯. Safari's bars are drawn in every pose with a working address field (tap it to load a site). Split View now shows your site beside a neutral second app; showing the site twice was Claude's round-01 shortcut and not what the device does. Device sized from Apple's millimetres (DESIGN.md §Device). Fold toggle only appears where there is a crease.

Claude's calls: "Bars / Scrolled" as the names for the two heights (what a visitor sees, not svh/lvh); the host shown for the sample is `northwind.example`; the tag moved to 62% height after it covered the address field; the home indicator moved down where it overlapped the toolbar. Snapshot: `process/02-ux/`.

## 03 · 2026-10-28 · M2

Mari: "This looks great, let's move to the next steps."

Built: the mid-fold resize between outer and inner poses (466 × 498 for 150 ms, no reload); export (a link to the view, Playwright presets, poses.json); the flags mode in `duo-flags.js`, where flags off hides the APIs as Safari does by default, and flags on gives posture, segments, `matchMedia` and the page's own fold `@media` CSS with `env()` resolved. Also `tests/smoke.cjs` with 23 checks on what the framed page receives, `scripts/size.sh`, and the README.

Proved the tests bite with three planted bugs, each caught by exactly the check it should break: the scrolled height ignored (5 failures), no mid-fold resize (1), `env()` not substituted (1). Files restored and diffed afterwards.

Claude's calls: the fold gap is 24 pt, estimated; a flag change reloads the page, as in Safari; same-origin pages load through `srcdoc` so the shim runs first; the size guard went from 40 KB to 64 KB, with the reason in DESIGN.md. Snapshot: `process/03-m2/`.

Next: M3, publishing. Waiting for Mari's go, because it creates a public repo.

## 04 · 2026-10-28 · Fold, marker, sample

Mari, on the probe box and the red chips: "the hint can stay somewhere outside I guess. Looks ugly here, else make it like a info pointer & reveal on interaction. We can remove it if not adding so much value". On the sample: "the sample page itself is not so stunning, let's craft a good looking purposeful page in claude shade theme. Keep it lightweight & interactive. For eg: it doesn't itself hide when I click "accept all". I just don't want it be fake". On the animation: "the animation to close & open is not so smooth. I want something like how real iphone duo would fold & open in a nice glassomorphic effect", pointing to chuspeeism/iphone-duo.

Done: the probe overlay and both red chips are gone. The crease explanation lives in a "Fold" marker outside the device that opens on hover, focus or tap. The new sample, "Fold Notes", is a working field guide: live readout, checklist saved in the browser, tap menu, and a notice that really dismisses. The fold is now a CSS 3D cover swing with frosted glass, borrowing the reference's three ideas without Three.js.

Claude's calls and corrections along the way: shade 0.55 → 0.28 (read as slate); rounded clip corners (the first cut left square notches); perspective 2200 → 3200 px (the cover reached the header); timing from `performance.now()`. The frame captures themselves needed a paused fake clock: twice, frames that looked "finished" were the capture clock running on, not the animation. Smoke test now 27 checks, adding a real readout, a real dismiss, a mid-swing cover and no leftovers. Snapshot: `process/04-fold/` (exact frames at 10–90% in `sheet-slow.png`).

## 05 · 2026-10-28 · Smoother

Mari: "It's too fast, can we make it even more smooth on transitions overall"

Done: the fold is slower (1150 / 980 ms) on smootherstep. Turning the device now rotates it a quarter turn, then cross-fades the layout. Open and Split View cross-fade. Bars and Scrolled glide the page height and fade the bars. The fold band and the marker fade.

Claude's calls: one easing (smootherstep) for hand-driven motion and one CSS curve for the rest. Contents fade, never the screen itself: the first cut faded through black glass, caught in the frame captures. The size guard went from 64 to 72 KB, with the reason in DESIGN.md. Test waits were lengthened to match. 27 checks green. Snapshot: `process/05-smooth/sheet.png` (exact frames of turn, turn back, open, Split View and close).

## 06 · 2026-10-28 · Back, Forward, Reload

Mari: "Can we also make the browser back work. I go from 1 page to the checklist page, unable to reset or come back"

Cause: the sample is loaded with a `<base>` so the flags shim runs first, and that turned its "#checklist" links into loads of the real page URL, a copy without the shim. Safari's back, forward and reload buttons were also drawn but not wired.

Done: same-page links scroll in place. Back and Forward walk in-page jumps and real loads inside the frame, dimmed when there's nowhere to go. Reload resets the page. Every load gets a fresh frame, so Back can never leave the playground. Eight new checks (35 in all). Planting the old bug back failed exactly the link check with `{"srcdoc":false,"shim":false}`, the state Mari hit.

## 07 · 2026-10-28 · Glass cover

Mari: "While it folds or opens, the inner surface can look glassy, transparent such that the underlying page is visible. Currently it feels like nothing inside & page pops up from nowhere."

Done: the inside of the cover is clear glass over the blurred page, which sharpens as the cover lands. Two follow-ups seen in exact frames. The blur covered the whole device and smeared the bezel, so it now covers only the screen. Edge-on, the flat page left an empty strip of glass, so the reveal now follows the cover's perspective. The change went 426 bytes over the size guard; dead code was removed instead of raising it (71,991 / 72,000). 35 checks green. Frames: `process/05-smooth/glass-open-700.png`, `glass-open-900.png`.

## 08 · 2026-10-28 · A gentle close

Mari: "Still while closing it feels like sudden. It should be like slow as someone would close/open in a real device (not damaging the screen)"

Found in frames: closing ended in a cut. The frosted cover vanished and a different-sized closed phone appeared, its screen jumping from grey to blank before the page faded in.

Done: slower (open 240 + 1400 ms, close 1500 + 420 ms), with a landing curve that lengthens the last stretch. The cover's outer face is now the closed phone at its real size, so at the end of closing the cover fades away over the identical device while the page wakes. Opening starts by dimming the closed screen. The Dynamic Island stays out of every fade. 35 checks green. Size guard 72 → 76 KB, with the reason in DESIGN.md. Frames through the hand-off: `process/06-gentle/sheet.png`.

## 09 · 2026-10-28 · Morph, settled reveal

Mari: "when I come back to close from somewhere. the revealing of page content is not smooth. It appears sudden in white screen, make it smooth" and "when I move from closed, wide to open - it's wierd changing from as both are different orientations, ideally we should fade smooth & make the transition smooth. Same in few other combinations as well"

Done: the new page now waits until it has settled at its size (after the mid-fold step and a reflow), then fades in over 420 ms. Pairs that don't fold into each other on the device (Closed ↔ Open tall, Closed wide ↔ Open or Split View) now morph. Content and Safari's chrome fade out, the frame flows to the new shape, and the new page fades in. The natural pairs keep the fold. Caught in frames: mid-morph, the outer screen's column drifted into the middle of the growing frame, so the chrome now fades out with the page. Three new checks (38 in all). Comments repeating DESIGN.md were cut to stay under the size guard (75,739 / 76,000). Frames: `process/07-morph/sheet.png`.

## 10 · 2026-10-28 · Shipped

Mari: "Yeah let's create the public repo, push & turn on github pages"

Created public `Marigameo/iphone-duo-playground`, switched Pages to GitHub Actions before the first push so the first deploy would succeed, pushed `main`. The deploy succeeded. Live: https://marigameo.github.io/iphone-duo-playground/. The smoke test ran against the live site: 38/38. Loaded live in Chromium and WebKit with no page errors; both report 951 × 585 at Open.

Still to do, in the skills repo: link the playground from the skills README when `fit-iphone-duo` ships. The playground's "Fix it with the skill" link points at the skills repo until then.

## 11 · 2026-10-28 · Design-engineering pass

Mari: "let's start with audits with design skills to make this better. But make sure whatever purposely done to align to apple guidelines shouldn't change", using Emil Kowalski's `emil-design-eng` skill. On the findings: "Yeah 1-11, 13 if found valid after measuring", "size is fine, we can raise for now", and the optional ones "if [they don't] change anything visually (drastic) & adds value".

Kept on purpose, though the skill's rules say otherwise: the long device motions (explanatory, and slowed at Mari's request in rounds 05 and 08), smootherstep for them, the bar glide animating `top`/`height` (the page must get real sizes), the 10 px glass blur (under his 20 px cap), Safari's own buttons, iOS colours and geometry.

Done: a found bug, the fold tip stayed open after a second press (hover and focus held it) while telling screen readers it was closed. Hover now only on real pointers. The segmented controls slide their thumb with his clip-path technique, so label weight no longer shifts the text. The menu grows from ⋯, the sheet eases in, both leave faster. Buttons press to 0.97. The copy buttons keep their width. The theme button shows a sun in dark mode. The morph sets the screen radius on the element instead of a variable on `.rig`. Reduce Motion keeps fades, and pose changes cross-fade instead of cutting.

Measured before deciding #13 (the Web Animations API): no long tasks during the fold at 1×, 4× or 6× CPU throttling, and frame times didn't change with throttling. The cost is paint, not script, so it was dropped.

Optional ones taken: reversing a fold mid-swing turns the cover round from where it is; a 2 px blur rides the screen fades; first load settles in (device, caption, toolbar, 60 ms apart); the dark selected segment is `#636366` as on iOS (it was nearly invisible); touch targets reach 44 pt without changing what's drawn.

Seen, not fixed (it predates this round): after folding to Split View in dark mode, the sample's notice text sometimes doesn't paint in headless Chromium, though its colours are right in the DOM. Needs a look in real Safari.

Size: 82,700 bytes; guard 76,000 → 86,000. Smoke test 38 → 43 checks, plus a one-off 30-check pass on the new behaviour. Snapshot: `process/08-polish/`.

## 12 · 2026-10-28 · Apple-style motion pass

Mari shared five more of Emil Kowalski's skills (apple-design, find-animation-opportunities, improve-animations, animate, animation-performance): "don't blindly apply any. Just check if anything useful out of those." Then, on the findings: "We can accommodate whatever adds value & doesn't break", and on size: "It's an application & not a component so I'm fine if size exceeds. Will do a size audit at last & optimise if required."

Measured before proposing. Frame numbers so far (round 11 included) came from Chromium's software renderer; on the GPU (Metal, M3 Pro) the fold, turn and morph hold 60 fps. A turn "jank" found in software rendering was not real. `will-change: transform` on the device was tried as a fix and made closing worse, so it was dropped.

Done: the toolbar slides to make room for the Fold control instead of jumping 66 px; Safari's progress line in the address field while a page loads; the theme cross-fades instead of flashing; segments dim on press; turn, morph and Open ↔ Split View reverse from where they are, and a fold reversal keeps the cover's speed; Reduce Transparency and Increase Contrast are honoured; one `--ease-drawer` token for a curve typed three times.

Rejected, with reasons in the findings: animated caption numbers (data being read), press-scale on Safari's own buttons, springs for the fold (button-driven, timing tuned by Mari), drag-to-fold (a new feature, not polish), ease-in exits, animating the backdrop blur, per-size letter spacing, a `plans/` folder.

Caught in testing: the Fold control didn't fade in, because the toolbar's measure-and-animate step switches transitions off at the moment it appears; fixed. The check that the framed page follows the theme button was wrong: the sample follows the system setting, unchanged since round 01.

Size: 89,957 bytes; guard 86,000 → 100,000. Smoke test 43 → 47 checks, three planted bugs each caught by their own check, plus a one-off 18-check pass with the GPU and a WebKit sanity run. Snapshot: `process/09-motion/`.

## 13 · 2026-10-28 · A blank card in Chrome

Mari: "Fix if anything is pending. Install xcode as well if required for some verification & finally we can push everything together"

The pending item was the sample's notice drawing as an empty card in Chromium (GPU and software alike), only after reaching Split View from the outer screen, by fold or by morph. WebKit was always fine. Bisected: the text was in the DOM and clickable, so this was a paint bug, not CSS. Neither the mid-fold resize nor the dimming caused it, nor did a plain resize-and-move or a direct render. It took the device's size animation together with the page's new position. A 1px resize, or giving the page its own layer, cured it. The own layer, `.vp { will-change: transform }`, also prevents it on every path, with sharpness and frame rate measured unchanged. The fix is in the playground rather than the sample, because any site with a fixed element would have hit it. New smoke check, proven to fail without the fix (1,601-byte blank card vs ~8 KB with text). Snapshot: `process/10-repaint/`.

Checked, nothing pending: `poses.json` matches the skill's copy; the skills README already links the playground (the to-do from round 10 is done). The skill's self-test passes (13 planted problems caught, the fixed page clean).

Xcode: only the Command Line Tools are on this Mac, so the skill's simulator script skips ("only the Command Line Tools are installed"). Installing Xcode 27.1 needs Mari's Apple ID, so it can't be done from here. It would let the skill's Safari pass run for the first time, and measure the numbers still marked estimated (the crease in Open tall, where Safari draws its bars).

Size: 90,321 bytes. Smoke test 48 checks.

## 14 · 2026-10-28 · Code review

Mari: "start with code review on changes done so far, simplify code … this is just for demo/application kind of usage so we no need to optimise speed … Make sure nothing breaks"

The playground diff (rounds 11–13) went to an independent reviewer, since Claude had written it. Every finding was checked against the code before acting. Fixed:
- Reversing a morph during its fade-out left the Fold marker hidden.
- A stray Escape stopped the fold tip opening on hover until the pointer had passed over and left.
- The sideways fold tip lost its scale-in: `var(--tx, none) scale(0.97)` is invalid when the variable is unset, so its fallback is now `translate(0)` and the variable is `--tip-x`, no longer sharing a name with the toolbar's `--tx`.
- The progress line appeared at 90% on a sheet load, because the address field is redrawn; it restarts on a redraw now.
- A turn or morph could be reversed only once.
- A WebKit "ResizeObserver loop" page error on window resizes, new since round 11. The root cause was the page's `auto` grid column growing with the device mid-resize; the column is now `minmax(0, 1fr)`. Deferring the observer also worked, but only hid the cause.

Simplified: turn and morph share one `tween()`; one `hintOpen()` for every way the tip closes; the two `.vp` rules merged; the touch-target rules split instead of overridden; the entrance rules grouped.

Kept on purpose: hover then press pins the tip (hover previews it, a press pins it, the next press unpins). The reviewer read this as a bug.

Tests: two brittle checks replaced (the notice check counts text pixels instead of PNG bytes; the toolbar slide is sampled every frame in the page), and five new ones. 53 checks pass; six bugs planted back were each caught by their own check. GPU, WebKit and Split View checks pass. Size 90,848 bytes.

Then `/simplify` (Mari: "Let's also run /simplify on both. Make sure it doesn't break any"). Four read-only reviewers (reuse, simplification, efficiency, altitude). Applied, all behaviour-preserving:
- The fold now has its own `anim.reverse` like turn, morph and swap, so `changePose` has one reversal path instead of a fold-only branch. Its frame loop runs on the shared `tween()`.
- `turnRound` drives its own tween; swap and morph share `fadeBack`; `L()` and `releaseDevice()` replace repeated inline code.
- The toolbar fades a newly shown group in through `@starting-style` alone (`.flip` keeps the opacity transition), instead of an extra inline-opacity path.
- Layout reads come before writes in the segment thumb and the toolbar slide; arrow keys reuse the button list.
- The progress timer is a local next to `progress()`; the reduce-motion transform override is split so it no longer borrows the tip's variable.
- Smoke test: `choose()` and `rotAround()` replace 17 click-and-wait pairs and a duplicated rotation read.

Skipped: a CSS `:hover` delay for the tip (tried in round 11: clicks waited for it), a `@keyframes` progress line, rewriting the fold around `tween()`'s progress beyond the loop, parallel behaviour loads in the skill (noise in the comparison that sets severity), moving the user agent into `poses.json`. Smoke 53/53, GPU and WebKit checks clean, 90,800 bytes.
