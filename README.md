# iPhone Duo playground

**See your website the way Safari 27.1 shows it on iPhone Duo.** Closed, open, turned and in Split View, with Safari's bars where they are and the crease drawn in.

**[Open the playground →](https://marigameo.github.io/iphone-duo-playground/)**

Most iPhone Duo previewers divide the screen's pixels by three and call that the viewport. Safari doesn't give your page the whole screen: on the closed phone its controls take a column down the right edge, so your page is 382px wide, not 466. This playground uses the viewports WebKit published for Safari 27.1, so what you see here is the size your CSS actually gets.

| Pose | Your page gets (CSS px) | Scrolled, bars hidden |
| --- | --- | --- |
| Closed | 382 × 580 | 382 × 618 |
| Closed, wide | 594 × 368 | 594 × 406 |
| Open | 951 × 585 | 951 × 620 |
| Open, tall | 669 × 867 | 669 × 902 |
| Split View, each window | 385 × 571 | 385 × 609 |

Source: [WebKit Features for Safari 27.1](https://webkit.org/blog/18486/webkit-features-for-safari-27-1/). All of it lives in [`poses.json`](poses.json).

## What it does

- **Five poses on a device drawn to scale.** The bezel and corners come from Apple's published dimensions.
- **Safari in every pose.** The address field, toolbar and status bar are where Safari keeps them, tinted with your page's background colour as Safari does. Tap the address field to load your site.
- **The crease.** It sits at the centre of the open screen, as a faint line when flat. When folded it becomes the band Apple says to keep small controls out of.
- **Opening and closing without a reload.** Switching between the closed and open poses resizes your page through the in-between size Safari reports mid-fold. Code that measured the window once and kept the number shows up here.
- **Split View as it really is.** Your site sits in one window, another app in the other, and each keeps its controls on its outer edge.
- **Safari's feature flags.** Safari 27.1 has the Device Posture and Viewport Segments APIs behind two flags. Turn them on in the ⋯ menu to see what a fold-aware page does when someone has switched them on. With them off, the APIs are absent, as in Safari by default.
- **Export.** Copy a link to the exact view, or the five poses as Playwright presets for your own tests.

## What the skill reports

The [fit-iphone-duo skill](https://github.com/marigameo/skills/tree/main/skills/fit-iphone-duo) audits your site in WebKit and hands you a report like **[this sample →](https://marigameo.github.io/iphone-duo-playground/report/)**: one card per thing it found, with the crease drawn and the element outlined, sorted into what needs your answer, what your agent will pick, what's a safe fix and what to leave. The sample audits the skill's own test site.

## Limits, said plainly

- **Your browser renders the page, not Safari.** The sizes are Safari's; the engine is whatever you're using. For WebKit itself, run the [fit-iphone-duo skill](https://github.com/marigameo/skills), which audits in Playwright's WebKit.
- **Some sites refuse to be framed.** They set `X-Frame-Options` or a CSP `frame-ancestors`, and stay blank here. Run the playground locally next to your site, or use the skill. To allow the hosted playground, send `Content-Security-Policy: frame-ancestors 'self' https://marigameo.github.io` instead of `X-Frame-Options: DENY`.
- **http addresses open as https** on the hosted playground, since an https page can't frame an http one. `localhost` stays as typed.
- **The flags mode needs a page from the same origin**, such as the built-in sample or your site served next to a local copy of the playground.
- **A few numbers are estimates, and the page marks them.** The crease's height inside the page on "Open, tall", where Safari draws each bar inside the screen, the fold region's width, and the corner radius. Each one is explained in [DESIGN.md](DESIGN.md).

## Run it locally

No build step and no dependencies.

```sh
git clone https://github.com/marigameo/iphone-duo-playground
cd iphone-duo-playground
python3 -m http.server 8765
```

Open http://localhost:8765. To try your own site with the flags, copy these files into your site's public folder and open `/index.html?url=/`.

Checks, with Playwright installed somewhere:

```sh
PLAYWRIGHT=/path/to/node_modules/playwright node tests/smoke.cjs
./scripts/size.sh
```

The smoke test reads what the framed page actually receives: every viewport in both bar states, the mid-fold resize, both flag states, and the export.

## Fix what you find

The [fit-iphone-duo skill](https://github.com/marigameo/skills) takes a site from here to fixed. It audits the five viewports and the crease in WebKit, fixes the cause rather than adding a patch layer, and proves the fix. It reads the same `poses.json`.

## Credits

Built by [Mari](https://mariappan.netlify.app) with Claude Code. The numbers come from WebKit and Apple. Apple's [Human Interface Guidelines for iPhone Duo](https://developer.apple.com/design/human-interface-guidelines/designing-for-iphone-duo) and its Tech Talks shaped the drawing. Thanks to [duo-ready](https://github.com/gurovdigital/duo-ready) for showing early how much honesty about emulation matters.

iPhone is a trademark of Apple Inc. This project is not affiliated with or endorsed by Apple.

MIT licensed.
