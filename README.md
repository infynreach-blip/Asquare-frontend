# Asquare Technologies — Figma to HTML

Built using HTML5, CSS3, Bootstrap 5.3, and vanilla JavaScript (no React, no Tailwind).

## Responsive & SEO pass (this update)

**Responsiveness fixes**
- Fixed a real horizontal-scroll bug: the hero's background glow ("ambient") elements could push past the viewport edge on narrow screens — added `overflow:hidden` on the hero plus an `overflow-x:hidden` safety net on `html`/`body`.
- Removed oversized fixed `min-height` values on cards (service, stat, industry, review, process, feature) at phone widths so single-column mobile layouts don't show large empty gaps.
- Hero/CTA button groups now stack to full-width, centered buttons below 576px instead of shrinking awkwardly.
- Added `img,svg{max-width:100%;height:auto}` as a general safety rule for any future images.
- Added a `prefers-reduced-motion` rule so smooth-scroll/animations respect accessibility settings.
- Verified with automated viewport checks at 360px, 390px, 768px, and 1440px — no horizontal overflow at any of them.

**SEO additions**
- `<link rel="canonical">`, Open Graph tags, and Twitter Card tags (replace the placeholder domain `https://www.asquaretechnologies.com/` with the real one before launch).
- A generated 1200×630 branded social-share image at `assets/images/og-image.png`.
- Favicon set (`favicon.ico`, 16/32/192/512px PNGs, Apple touch icon) generated from the existing brand mark, plus `site.webmanifest`.
- JSON-LD structured data (`Organization` + two `LocalBusiness` entries for the UAE HQ and Canada office + `WebSite`) so search engines can pick up NAP details and service list directly.
- `robots.txt` and `sitemap.xml` at the project root.
- `meta name="keywords"`, `theme-color`, and `robots` tags.

**Before deploying:** replace `https://www.asquaretechnologies.com/` in `index.html`, `robots.txt`, and `sitemap.xml` with the actual production domain.

The hero server telemetry visual is CSS/SVG (no Figma image assets were included in the original ZIP). Layout, colors, typography, sections, cards, forms, navigation, and responsive behavior follow the Figma reference.
