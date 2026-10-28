# iphone-duo-playground: plan

> Current step: **Round 04 done (fold animation, marker, sample); waiting for the owner to look, then the go to publish (M3).** The owner approved round 02 ("This looks great, let's move to the next steps", 28 Oct 2026). The brief (§0) and the What (§1) are agreed (Mari, 27 Oct 2026: "playground 1st", "host the playground in github pages itself", "static html page but make it look more like iphone/apple world", "separate repo like co-presence", "yes we can export & ship it first as planned").

## 0. Brief

### Who it's for

- **People who own a website** and want to know, in a minute, what it looks like on iPhone Duo without the device or Xcode.
- **People using the `fit-iphone-duo` skill**, before and after a fix, to see the result and to hand the skill a URL plus a pose.
- **The skill itself**, which takes its viewport presets from this repo's `poses.json`.

### The problem in one line

Every online iPhone Duo previewer renders at estimated sizes (466 × 678, 890 × 626) and ignores Safari's side column, so what they show is not what Safari shows, and they never show the two worst poses (368px tall, 385px Split View).

### What it is

One static page. A URL (or the built-in sample) in an iframe at the exact Safari 27.1 viewport for each pose, inside a drawn iPhone Duo with Safari's chrome where it is and the crease where it is. Switch pose, fold, Split View, and controls shown or hidden; export the numbers.

### What it is not

- Not WebKit. It renders in the visitor's browser. It says so on the page.
- Not an audit. It shows; the skill inspects. No findings list here.
- Not a device mock-up generator for client decks.
- Not a proxy. Sites that refuse to be framed stay blank, with an honest note.

## 1. What (agreed)

| Part | Behaviour |
| --- | --- |
| Poses | Closed, Closed wide, Open, Open tall, Split View. From `poses.json`. "Wide" and "tall" name the shape, which is what a layout reacts to |
| Frame | An iPhone Duo drawn at the screen's point size, scaled to fit the window, with Safari's side column (outer and Split View) or top and bottom bars (inner), and the vertical Dynamic Island on the outer display |
| Viewport | The iframe at the true CSS size; the frame scales around it with a transform, so media queries fire at the real width |
| Crease | Drawn at the centre of the inner screen, vertical when open, horizontal when open and tall. Flat shows a faint line; Folded shows the band. A "Fold" marker outside the device explains it on hover, focus or tap (owner, round 04) |
| Fold animation | Opening and closing swing the cover on the hinge as frosted glass, with the page resizing underneath (owner, round 04) |
| Sample | "Fold Notes": a working field guide that follows its own advice (owner, round 04) |
| Controls shown or hidden | Toggles between the svh and lvh heights |
| Background extension | The side column is filled with a colour the visitor picks, defaulting to white, to show what Safari does with the page's background there |
| Source | Safari's address field inside the device opens a sheet to type a URL; the sample page by default. Blocked embeds are explained in the sheet (owner, round 02) |
| Caption | One line: the viewport size and the crease state. The rest (table, sources, page colour) behind ⋯ (owner, round 02) |
| Theme | Light and dark, following the system, with a toggle |
| M2 | Fold transition that resizes the iframe through the transient size without reload. Split View as two frames. Export: `poses.json`, a Playwright preset snippet. Flags-on mode for the sample page |

## 2. Milestones

| M | Scope | Gate |
| --- | --- | --- |
| **M1** | Page, poses, frame, chrome, crease, URL and sample, facts, theme, phone width | Screenshots, light and dark, desktop and 375px. Owner looks |
| **M2** | Mid-fold resize, export, flags mode for same-origin pages, smoke test, size guard (Split View moved into round 02) | Smoke test green and proven to bite; screenshots |
| **M3** | Deploy to Pages, README, link from `marigameo/skills` | Live URL |

## 3. Decisions

| # | Decision | Who |
| --- | --- | --- |
| 1 | Playground before the skill; it is the skill's harness | Mari |
| 2 | Separate repo, GitHub Pages, static, Apple-world look | Mari |
| 3 | Exports the numbers; the skill vendors `poses.json` | Mari ("yes we can export") |
| 4 | Repo name `iphone-duo-playground` | Claude's call: says the device and the thing; searchable |
| 5 | No build step, no dependencies | Claude's call: a previewer should be one file people can read and copy |
| 6 | Estimated numbers are labelled in the UI, not only in docs | Claude's call: the whole point is being more honest than the other previewers |
| 7 | The skill is named `fit-iphone-duo` | Mari ("Yeah, fit-iphone-duo works") |
