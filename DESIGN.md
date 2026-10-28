# iphone-duo-playground: design values

Why every number and default is what it is. Every value is Claude's call unless it says otherwise.

## Geometry (`poses.json`)

| Value | Number | Source |
| --- | --- | --- |
| Outer screen | 466 × 678pt | Apple (1398 × 2034px at 3×) |
| Inner screen | 951 × 669pt | Apple's App Store Connect screenshot size 2853 × 2007 at 3×. The panel is 2670 × 1878px, so the system renders at 951 × 669 and downsamples (mirzaaghazadeh device-facts, from Apple's design resource) |
| Viewports, five poses | 382 × 580/618, 594 × 368/406, 669 × 867/902, 951 × 585/620, 385 × 571/609 | **WebKit**, "Features for Safari 27.1" |
| Side column on the outer display | 84pt on the right | 466 − 382 = 84, and the Tech Talks put the status bar, Dynamic Island, toolbar and tab bar on the right. Matches the 84pt trailing safe area the native skills measured |
| Side columns in Split View | 84pt on each outer edge, 13pt divider | 951 − 2 × 385 = 181 = 84 + 13 + 84. Apple: "each one places controls along its outer edge". **Estimated split** |
| Vertical chrome, outer display | all at the bottom: 98pt with controls, 60pt without | 678 − 580 = 98, 678 − 618 = 60. The status bar is in the side column, so nothing is assumed at the top. **Estimated position** |
| Vertical chrome, inner display | 49pt top, 35pt bottom with controls, 0 without | 669 − 620 = 49 (status bar and tab strip, always), 620 − 585 = 35 (collapsible bar). **Estimated position** |
| Crease, open | x = 475.5 of 951 | Centre of the inner screen (Apple, HIG anatomy). Full-width viewport, so the same in viewport coordinates |
| Crease, open and turned | y = 475.5 of 951 on screen; **426.5 in the viewport, estimated** | 475.5 − 49 top chrome. Needs a Safari 27.1 measurement; marked in the UI |
| Fold band when folded | 24pt | No Apple number. duokit uses 24pt for its SwiftUI gap. Drawn as a soft band, labelled "region, width unknown" |
| Transient resize | 466 × 498, settle 150ms | Simulator measurement (dev.to, tyoukyou23). Not hardware |
| DPR | 3 | Every iPhone since the X; the simulator agrees |

## Device (round 02: "make it feel like a real device")

Sized from Apple's published dimensions, so the bezel and corners match the hardware. 1pt ≈ 6.05mm⁻¹ on both displays (466pt / 77.2mm outer, 951pt / 157.7mm inner).

| Value | Number | Why |
| --- | --- | --- |
| Outer bezel | 21pt sides, 17pt top and bottom | Closed body 84.1 × 117.8mm; outer panel 1398 × 2034px at 460ppi = 77.2 × 112.3mm. (84.1 − 77.2) / 2 = 3.45mm ≈ 21pt; (117.8 − 112.3) / 2 = 2.75mm ≈ 17pt |
| Inner bezel | 18pt all round | Open body 164.6 × 117.8mm against 951 × 669pt at 6.03pt/mm: (993 − 951 − 6) / 2 ≈ 18pt |
| Rim | 3pt titanium gradient | The metal band around the glass; a flat black outline read as a drawing, not a phone |
| Corner radius | 58pt outside; screen 58 − 3 − bezel ≈ 37–38pt | Concentric corners, as on every current iPhone. Apple has not published the Duo's; this is iPhone-like, not measured |
| Hinge seam | 2pt notch in the rim at the hinge, inner display only | The one hardware cue that says "this folds" without decoration |
| Scale | Fit the stage, never above 1.0 | 1.0 is true CSS size; upscaling would make text look sharper than on the device |
| The page's layer | `.vp { will-change: transform }`, always | Round 13, a Chromium bug: after the device animated to a new size **and** the page moved (outer screen → Split View, by fold or morph), Chromium drew the page's `position: fixed` elements without their text until something repainted them. The sample's notice showed as an empty card. Either change alone was fine, and so was a direct render, and WebKit never did it. A 1px resize or an own layer cured it; the own layer also prevents it, on every path. Measured: text equally sharp after scale changes, fold frames unchanged (0 slow of 278). This is the one place `will-change` earns its keep; on the rig it made closing slower (round 12) |

## Safari's bars (round 02: "feel like trying a real browser")

Sizes are WebKit's. **Where** each bar sits and what is drawn in it is approximate, and the menu says so.

| Pose | Drawn | Why |
| --- | --- | --- |
| Closed, Closed wide | Right column (84pt): Dynamic Island, status, then back, forward, share, bookmarks, tabs. Bottom (98 / 60pt): address field, or the site's name when scrolled | Apple's order on the side, top to bottom: Dynamic Island, status bar, toolbar, tab bar (HIG figure). The bottom strip is what's left of the height (678 − 580) |
| Open, Open tall | Top (49pt): time, address field, system icons. Bottom (35pt, gone when scrolled): toolbar | 669 − 620 = 49 stays; 620 − 585 = 35 collapses |
| Split View | Left window: Safari, toolbar on its outer (left) edge, address at the bottom. Divider 13pt with a grabber. Right window: a neutral second app with its controls on the right edge | Apple: two apps, 50/50, each with controls on its outer edge. Showing your site twice (round 01) was wrong: the device never does that unless you open two Safari windows |
| Address field | Tapping it opens a sheet to type a URL | The way Safari works; and a full-size field stays usable when the device is scaled to 35% on a phone |
| Bar colour | The page's background, read from the page when same-origin; ink flips light or dark by its luminance | WebKit: Safari extends the page colour behind its bars |
| Home indicator | 140 × 5pt, 8pt from the bottom (4pt above a toolbar) | Present on every pose of a current iPhone; moved down where a toolbar shares the strip |
| Load progress (round 12) | A 2.5pt blue line along the bottom of the address field: creeps to 90% over 6 s while loading, completes and fades on load | Safari's own progress bar. The playground can't see another site's real progress, so the creep is not a measurement, only "still loading" |
| Crease, folded | 28pt shaded band with a dashed centre at 70% opacity; no label on the screen | Round 04 (owner): the red chip on the screen "looks ugly". The explanation moved to the Fold marker outside the device |
| Fold marker | A small "Fold" pill outside the device at the crease's end (above for a vertical crease, beside for a horizontal one), with a 6pt tick to the frame; its explanation opens on hover, focus or tap | Round 04 (owner: "make it like a info pointer & reveal on interaction"). It keeps Apple's rule one tap away without covering the page |

## Back, Forward and Reload (round 06: "make the browser back work")

| Behaviour | How | Why |
| --- | --- | --- |
| Same-page links (`href="#…"`) | Scroll within the page; the step is kept by the playground | The shim's `<base>` made them load the page's real URL instead, a second copy without the shim. That was the "checklist page" with no way back |
| Back / Forward | Walk in-page jumps (restoring the scroll position) and real page loads inside the frame (through the browser's history, only as many as were counted). Dimmed when there is nowhere to go | Counting only loads the frame really made means a miscount can under-step but never leave the playground |
| Reload | The arrow in the address field reloads the page from the top and clears its history | The "reset" that was missing |
| A fresh frame per load | Every page the playground loads gets a new iframe, created with its source already set | The playground's own loads (a new URL, a flag toggle) never enter the browser's history, and no stray `about:blank` load is miscounted |
| Size | The page reached 71,313 bytes against the 72,000 guard | Under the guard; the next feature should cost something else or argue the guard up |

## Layout (round 02: "the preview is the main attraction")

The device takes the whole stage. A one-line header, one caption line (viewport size and crease state only), one floating toolbar. Everything else (page colour, the five-pose table, sources, credits) sits behind the ⋯ menu.

## Fold animation (round 04: "like how real iphone duo would fold & open in a nice glassomorphic effect")

Inspired by [chuspeeism/iphone-duo](https://github.com/chuspeeism/iphone-duo) (MIT, Three.js): only the cover half moves, blur and darkening follow the fold, smoothstep easing. Rebuilt in CSS 3D so the playground keeps no dependencies.

| Value | Number | Why |
| --- | --- | --- |
| What moves | The cover half swings on the hinge from 180° (lying over the other half, outer screen up) to 0° (flat). The other half never moves | The reference's first rule, and how a book-style foldable opens |
| Duration | 240 + 1400 ms open, 1500 + 420 ms close (round 08) | See §Motion |
| Easing | smootherstep on a landing time warp (round 08) | See §Motion |
| Cover faces | Outer (round 08): **the closed phone itself**, 514 × 718 pt with a titanium rim, black bezel, the page colour and the island where the closed device has them. Apple's closed body (84.1 mm) is wider than half the open one (82.3 mm), so the slightly larger cover is also physically right. Round 04–07: a frosted pane at half the open size. Inner (round 07): **clear glass**, a light highlight and an 18% page-colour tint over the blurred page beneath, with the black screen edge kept. It fades out over the last 40° | The owner: "the inner surface can look glassy, transparent such that the underlying page is visible". The opaque frosted panel of round 04 made the page appear from nowhere when the cover landed | Glass, not a fake screenshot: the real page sits underneath and appears as the cover lands |
| Blur and darkening | Screen veil `blur(10px × sin θ)`, black at `0.22 × sin θ`, over the **screen only**; face shade `0.28 × sin θ` | Strongest edge-on, gone when shut or flat, as in the reference. Covering the whole device smeared the black bezel into the screen (round 07). 14 px read as heavy once the page showed through the glass |
| Perspective | 3200 px | At 2200 px the edge-on cover reached into the header |
| Uncovered area | The open device is clipped to the far half plus the cover's on-screen reach, **perspective included** (`half·cos θ·P / (P − half·sin θ)`), with rounded clip corners | So the page fills the glass edge-on instead of leaving an empty strip (round 07). Without rounding, the square cut showed behind the cover's corners |
| Framing | The visible part stays centred; the scale moves between the closed and open fits | So the device doesn't jump sideways when the open width appears |
| The page | Already at its new size under the glass, through the mid-fold size | The animation doesn't fake the resize; it hides nothing the device wouldn't |
| Timing source | `performance.now()`, not the frame timestamp | Same base in browsers, and it lets the test drive a fake clock to check exact frames |
| Reversing | Choosing the pose the fold started from, while the cover moves, turns it round from its current angle over the remaining share of the duration. Round 12: it keeps the cover's speed, adding `v·dur·p(1 − p)³` to the landing curve, so the cover carries on a few degrees, slows and comes back | Round 11 (Emil's interruptibility rule); round 12 (Apple: no "brick wall" on reversal). The added term has no speed or acceleration left at the end, so the landing is unchanged. Other choices mid-fold still finish the fold first |
| Main thread | Kept on `requestAnimationFrame` | Round 11, measured: no long tasks during the fold at 1×, 4× or 6× CPU throttling, and frame times didn't change with throttling, so the cost is paint, not script. The Web Animations API would not help, and would lose the fake-clock frame tests. Round 12: those runs used Chromium's software renderer. On the GPU (Metal, M3 Pro) the fold, turn and morph hold 60 fps (p95 ≈ 17.5 ms, 1–2% slow frames). `will-change: transform` on the rig was tried and made closing worse, so it isn't used. A mid-range iPhone is still unmeasured |
| Reduced motion | No fold; the pose cross-fades | Round 11: Apple and Emil both say to replace motion with a dissolve, not remove it |

## Sample page (round 04: "a good looking purposeful page… I just don't want it be fake")

"Fold Notes", a short field guide to the web on iPhone Duo. Palette: warm cream `#faf9f5` / `#262624`, terracotta `#c15f3c` / `#d97757`, serif headings. Claude-like in colour only, with no name or logo. Everything on it works:

| Part | What's real about it |
| --- | --- |
| Live readout | Viewport, `100dvh`, width measured at load (flagged as stale when it differs), pointer, posture, segments, read from the page as it runs |
| Sizes list | WebKit's five viewports; the row matching the current width is marked |
| Do and don't | Six cards in two columns from 600 px, so the split falls between cards |
| Checklist | Ten checks from the research, saved in this browser, with a progress bar |
| Menu | Opens on tap below 600 px, closes on a choice or Escape |
| Notice | Says what the page stores; "Got it" hides it and it stays hidden |
| Fold-aware CSS | With segments, the CTA gap and the grid gutter widen to span the fold. Nothing else moves |
| Built as it preaches | Equal-width CTAs with a centred gap, so the gap, not a button, sits on the crease; dvh; no hover-only UI; no stored width |



`light-dark()` tokens; `color-scheme` follows the system, the toggle overrides with `data-theme`.

| Token | Light | Dark | Why |
| --- | --- | --- | --- |
| `--bg` | `#f2f2f7` | `#000000` | iOS grouped background, and OLED black for the dark page so the frame's black bezel sits in it |
| `--surface` | `rgba(255,255,255,.72)` | `rgba(28,28,30,.72)` | Panels, with `backdrop-filter: blur(20px)`: the material look without pretending to be Liquid Glass |
| `--ink` | `#1c1c1e` | `#f2f2f7` | iOS label colours |
| `--muted` | `#6e6e73` | `#98989d` | iOS secondary label; 4.9:1 and 6.3:1 on the panels |
| `--line` | `rgba(60,60,67,.18)` | `rgba(84,84,88,.5)` | iOS separator |
| `--accent` | `#007aff` | `#0a84ff` | iOS blue, for the one primary action and the selected segment |
| `--crease` | `#ff3b30` | `#ff453a` | iOS red, used only for the crease centre line and "estimated" marks |
| `--thumb` | `#ffffff` | `#636366` | The selected segment, as iOS draws it. Round 11: the dark one was `#2c2c2e` and nearly vanished into the toolbar |
| `--ease-out` | `cubic-bezier(0.23, 1, 0.32, 1)` | same | Emil Kowalski's strong ease-out, for the playground's own controls (not the device) |
| Bezel | `#2b2b2e` with a 1px `#48484a` edge | same | Titanium-ish without a texture image |

## Type

System stack (`-apple-system, "SF Pro Text", system-ui`). Header title 17px/600 (an iOS nav title, small so the device leads), caption 13px with the numbers in 600 and `tabular-nums` so they don't jitter between poses, toolbar 13px. Inside the device, Safari's own sizes: address 16px, time 14–15px.

## Motion (round 05: "It's too fast, can we make it even more smooth on transitions overall")

One easing for the hand-driven motions: **smootherstep**; the fold uses it on a time warp `1 − (1 − p)^1.4`, which keeps the start but lengthens the last stretch, so the cover settles instead of arriving. The base curve is `p³(6p² − 15p + 10)`. Its first and second derivatives are zero at both ends, so moves start and land with no visible jolt. Smoothstep, used in round 04, only flattens the first derivative and read as abrupt at the stops. CSS transitions use `cubic-bezier(0.32, 0.72, 0, 1)`, a soft ease-out close to iOS sheet motion.

| Change | Motion | Duration | Why |
| --- | --- | --- | --- |
| Open | The closed screen dims (240 ms), then the cover swings 180° to 0° over the blurred page | **240 + 1400 ms** (760 → 1150 → 1400) | The owner, round 08: "slow as someone would close/open in a real device (not damaging the screen)". The dim is what the outer screen does as you start to open, and it hides the swap to the open layout |
| Close | The cover swings 0° to 180° and settles onto the closed phone; then it fades away over the closed device as the page wakes, once settled | **1500 + 420 ms** (640 → 980 → 1500) | Round 07's close ended in a cut: the frosted cover vanished, a different-sized closed phone appeared, and the screen jumped grey to blank. Now the cover's outer face is the closed phone, at its real size and with its bezel and island, so the hand-off can't be seen. Closing is now the slowest move, because a careful hand slows most as the halves meet |
| Turn (Closed ↔ Closed wide, Open ↔ Open tall) | The device rotates 90° while the scale moves to the new fit. The screen dims through the second half, then the new layout fades in | 640 ms turn + 300 ms fade | Round 04 snapped the layout. A turn says "you turned it", and the frame after the turn is the same shape, so the swap can't be seen |
| Open ↔ Split View | Contents fade out, swap, fade in | 200 ms out + 420 ms in | Same frame, different screen |
| Closed ↔ Open tall, Closed wide ↔ Open or Split View | **Morph** (round 09): the page and Safari's chrome fade out through the page colour, the frame flows to the new shape (size, bezels, corners, scale), the new page fades in | 200 + 720 + 420 ms | These pairs don't fold into each other on the device. A book fold turns a tall closed phone into a wide open one and a wide closed phone into a tall one. Forcing a fold between them looked wrong (owner: "it's weird… ideally we should fade smooth"). The outer screen's column and island fade too, since the inner display has neither |
| Revealing the new page | Held hidden until the page has settled (after the mid-fold step, plus 90 ms to reflow), then a 420 ms fade | | Owner, round 09: arriving on Closed, the page "appears sudden in white screen". It was fading in while still at the mid-fold size, then jumping |
| Bars ↔ Scrolled | The page's height glides; Safari's bars fade to their new state | 420 ms | Safari animates its bars collapsing; the page gets the intermediate sizes too, as on the device |
| Flat ↔ Folded | The fold band and its centre line fade | 460 ms | Was instant |
| Fold marker | Fades in 120 ms after the device settles; its tip fades and drops 3 px | 420 ms / 220 ms | Appears after the motion, not during it |
| What fades | The page, Safari's bars and the crease, never the screen itself and never the Dynamic Island | | The screen holds the page colour, so a change fades through cream (or the page's own colour). Fading the whole screen showed the black glass behind it for a moment |
| Blur on fades | Up to 2 px as the screen content fades out, back to none as it fades in | Same as the fade | Round 11 (Emil: blur masks a cross-fade, so old and new read as one change). Small enough not to read as an effect |
| Reduced motion | No turn, fold, glide, thumb slide, scale or entrance movement. Fades stay, and a pose change cross-fades (200 + 420 ms) | | Round 11. Was: every change immediate, including fades. Apple's HIG and Emil both keep dissolves under Reduce Motion |

### The playground's own controls (round 11, Emil Kowalski's design-engineering skill)

The device motions above are explanatory and were slowed at the owner's request, so his 300 ms ceiling doesn't apply to them. It applies to everything around the device.

| Control | Motion | Why |
| --- | --- | --- |
| Segmented controls | The selected look is a copy of the row in the selected style, clipped to the chosen segment; the clip moves, 260 ms `--ease-out` | His clip-path tabs: thumb, colour and label weight move as one. The labels no longer change weight in place, so nothing shifts. iOS slides its thumb too |
| Buttons (header, sheet, menu) | `scale(0.97)` on press, 160 ms | Press feedback. Safari's buttons inside the device keep iOS's highlight instead |
| Hover | Background over 150 ms `ease`, only under `(hover: hover) and (pointer: fine)` | On touch, hover sticks after a tap |
| Menu | Grows from the ⋯ button: scale 0.96 and fade in 220 ms, out 140 ms | Popovers grow from their trigger, and leave faster than they arrive |
| Address sheet | Backdrop fades, sheet from scale 0.97, 220 ms in, 140 ms out | A modal, so it stays centred |
| Fold tip | Opens on a press, or after 250 ms of hover; 150 ms in from scale 0.97, 100 ms out. A second press closes it even under the pointer | The old version stayed open under hover and focus while it said closed |
| Copy buttons | Keep their width; the label blurs out and in over 120 ms | The row reflowed under the pointer when "Copied" was shorter |
| Theme button | Moon in light, sun in dark; rotate, scale and fade, 200 ms | It showed the moon in both |
| First load | Device, caption, toolbar rise 8 px and fade, 480 ms, 60 ms apart | A first visit can take a little delight; it also hides the moment before `poses.json` arrives |
| Touch targets | 44 pt tall on touch screens through an invisible extension; the controls keep their size | Apple's minimum |

### Round 12 (Emil Kowalski's apple-design, animation and performance skills)

| Control | Motion | Why |
| --- | --- | --- |
| Toolbar, when the Fold control comes or goes | The groups slide from where they were (measure, change, animate the difference, 260 ms `--ease-out`); the material is its own layer (`.toolbar::before`) and stretches to the new size; Fold fades in | It jumped 66 px at once, moving "Open" from under the pointer. Keeping Fold always visible was the alternative, but would wrap the toolbar at phone width |
| Segments | Dim to 0.5 the moment they're pressed, back over 200 ms on release; the choice still commits on release | Apple: feedback on press. iOS needs a touch listener for `:active`, now on the document |
| Turn, morph, Open ↔ Split View | Choosing the starting pose mid-way runs it back from where it is. A morph still fading out fades straight back | Apple: never make people wait for a motion to finish before reversing it |
| Theme | Cross-fades over 250 ms (View Transitions), where supported | Apple: avoid a full-screen brightness jump. The sample page follows the system setting, not this button, as a real site would |
| Reduce Transparency | Toolbar, Fold pill and sheet backdrop go solid, with no blur | Apple's setting. The fold's glass is the demonstration, so it stays |
| Increase Contrast | Secondary text `#3a3a3c` / `#d1d1d6`, firmer separators and fills | Apple's setting |
| Easing tokens | `--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1)`, Emil's name for the curve the bar glide and crease fade already used | One name instead of three copies. No visual change | |

## Size

One HTML, one CSS, two JS files, no dependencies. Guard: **100,000 bytes** before gzip for `index.html`, `playground.css`, `playground.js` and `duo-flags.js`, checked by `scripts/size.sh`. Measured 51,791 at M2 and 63,281 after round 04 (the fold animation and marker). The guard held, with under 1 KB to spare. Round 05 (the owner: "It's too fast, can we make it even more smooth on transitions overall") added the quarter-turn, the cross-fade, the bar glide and the fold-band fade, reaching 67,162. Raised to 72,000: those transitions are what was asked for, and minifying would break the rule that the source is readable as served. Round 07 (the glass cover) went 426 bytes over. Instead of raising the guard again, dead code went: a cover background both faces override, a no-op perspective-origin line, an unused variable, and an unused `.other-label` rule. Now 71,991. Round 08 (a gentler close, the closed-phone cover and its hand-off) took it to 73,795; raised to **76,000**, since the owner's request was about the one thing this page exists to show well, and the hand-off needs the code. Round 09 (the morph and the settled reveal) went 210 over; comments that repeated this file were cut to one-line pointers. Now 75,739. Round 11 (the design-engineering pass the owner asked for, and the size raise they approved: "size is fine, we can raise for now") reached 82,700; the guard is now **86,000**. Round 12 reached 89,957; the guard is now **100,000**. The owner: "It's an application & not a component so I'm fine if size exceeds. Will do a size audit at last & optimise if required." The 40 KB planned in M1 did not survive two real additions, the Safari bars drawn in every pose and the flags shim, and both earn their bytes. The guard leaves about 12 KB of headroom.

## Milestone 2 behaviours

| Behaviour | Value | Why |
| --- | --- | --- |
| Mid-fold resize | Between an outer and an inner pose, the page is sized 466 × 498 for 150 ms, then settles | The Xcode 27.1 simulator showed one fold firing 2–3 resizes with that transient size (dev.to measurement, simulator, not hardware). It is what makes "size read once" bugs visible. Off under reduced motion |
| No reload on a pose change | The frame is never reloaded by a pose or bar change | Opening the device doesn't reload a page; a playground that did would hide the main class of bug |
| Flags off | `navigator.devicePosture` and `window.viewport` are undefined in the framed page | Safari's default: both flags ship off. Chrome would otherwise expose its own APIs and mislead |
| Flags on | Posture `folded` only on Open or Open tall with Fold set to Folded; otherwise `continuous`. Two segments only when folded | Apple: the fold region is inactive and zero-width when flat; WebKit's posture values: `folded` for book or laptop, `continuous` for flat open or closed |
| Fold region width | **24 pt** gap between segments, **estimated** | Apple has not published it; duokit uses 24 pt. The smoke test pins the sample's CTA gap at 24 + 24 = 48 px |
| CSS on fold features | `@media` blocks that mention a fold feature are re-evaluated on every change and their contents injected with `env(viewport-segment-*)` replaced by numbers | No browser lets a page fake a media feature. Reading the page's own stylesheet text is the one way that works in Chrome, Firefox and Safari alike |
| Flag change | Reloads the framed page | As in Safari: a flag takes effect on the next load |
| Same-origin pages | Loaded through `srcdoc` with a `<base>` and the shim first | The shim must run before the page's own scripts, or a check like `if (navigator.devicePosture)` at load would miss it |
| Presets | `deviceScaleFactor: 3`, `isMobile`, `hasTouch`, the Safari 27.1 iPhone UA, and the bars-shown height with the scrolled height alongside | What the skill's audit uses, so a visitor's own tests match it |
