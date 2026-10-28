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
