# deal'ke design rules

The rules the site follows, why, and where each one lives in the code. The look itself copies Miro's own Base44 app (2 Nov 2026): warm cream page, white cards with 14 px corners and soft shadows, lime for every action, mustard for the big moments, Libre Baskerville headings with Inter for everything else.

## Spacing

| Rule | In the site | Source |
|---|---|---|
| 8-point grid: every gap is 4, 8, 12, 16, 24, 32, 48, 64 or 96 px | `--s1`…`--s9` tokens in `app.css`; nothing uses other values | Material Design spacing guidance; common practice across design systems |
| Proximity: things that belong together sit closer than things that don't | 8 px between price and per-kg price, 16 px from photo to name, 48 px between card rows | [Law of Proximity](https://lawsofux.com/law-of-proximity/) (Gestalt) |
| Common region: one band holds all filters | Deal type and Stores rows share one bordered band | [Law of Common Region](https://lawsofux.com/law-of-common-region/) |
| Whitespace over boxes | Cards have no border or shadow; the photo area is the card | Same Gestalt principles; fewer lines means less to scan |

## Type

| Rule | In the site | Source |
|---|---|---|
| One modular scale, ratio 1.25 (major third) from 16 px: 13 · 16 · 20 · 25 · 31 · 39 · 49 · 61 | `--t-xs`…`--t-5xl` | Tim Brown, *More Meaningful Typography* (A List Apart); [type-scale.com](https://type-scale.com) |
| Body text at least 16 px, line height about 1.5 | `body{font-size:16px;line-height:1.6}`; inputs 16 px+ so iPhones don't zoom | [WCAG 1.4.12 Text Spacing](https://www.w3.org/WAI/WCAG22/Understanding/text-spacing.html) |
| Lines 45 to 75 characters | Hero lead capped at 34ch (large text), footer at 75ch | [Baymard: line length](https://baymard.com/blog/line-length-readability); Bringhurst |
| Two families only: a serif for headings, a sans for text and prices | Libre Baskerville / Inter | Standard pairing practice: contrast in structure, harmony in proportion |
| Small uppercase labels get +0.08em tracking | `.tool-lbl`, `.tag`, buttons | Caps need extra letter spacing to stay legible |
| Prices use tabular figures so digits line up | `font-variant-numeric: tabular-nums` | |

## Colour

| Rule | In the site | Source |
|---|---|---|
| 60-30-10: cream page 60%, white cards 30%, lime and mustard 10% | `--bg`, `--card`, `--lime`/`--mustard` | Interior design rule, widely used in UI |
| Accents mean one thing each: lime = act (add, my list, active filter, saving), mustard = the one big step (hero button, week band) | Lime `#C6F135`, mustard `#D9A23A` | [Von Restorff effect](https://lawsofux.com/von-restorff-effect/): the thing that differs gets noticed |
| Text contrast at least 4.5:1 (3:1 for large headings) | Muted text `#69655B`: 5.3:1 on cream, 5.8:1 on white; ink on lime 13.9:1, on mustard 8.0:1; savings text `#2E4300` on pale lime 9.9:1; the mustard headline word uses a darker `#B07F1E` (3.2:1, large text) | [WCAG 1.4.3 Contrast](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html) |

## Speed and effort (the "time is money" rules)

| Rule | In the site | Source |
|---|---|---|
| Big, close targets are faster to hit | Every control is at least 44 × 44 px (chips 40 px high with wide padding); the + button sits in the same corner on every card | [Fitts's law](https://lawsofux.com/fittss-law/); [Apple HIG 44 pt](https://developer.apple.com/design/human-interface-guidelines/accessibility); [WCAG 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html) |
| Fewer choices, faster decisions | Only deal types, stores and categories that have deals right now are shown, each with its count, so empty choices never appear | [Hick's law](https://lawsofux.com/hicks-law/) |
| Respond in under 400 ms | Filters and search update instantly in the browser, no Apply button, no page loads | [Doherty threshold](https://lawsofux.com/doherty-threshold/) |
| Price first | Card reads photo → name → price (big, green) → per-kg price → store; default sort is the real price per kg/L after the deal | NN/g [F-pattern scanning](https://www.nngroup.com/articles/f-shaped-pattern-reading-web-content/) |
| Familiar patterns | Search on top, list/cart button top right, details slide up from the bottom on phones | [Jakob's law](https://lawsofux.com/jakobs-law/) |
| Remember the user | Postal code, radius, language, sort and My list are stored on the device; returning visitors skip the hero and land on their deals | Saves a step on every visit |
| Filters stay in reach | On desktop the filter band sticks under the header while scrolling | |
| Shareable state | Every filter is in the address bar (`?type=2+1&store=Lidl`), so a link opens the same view and Back works | |
| Search forgives typos and learns | Suggestions appear while typing (photo, store, price); a typo still finds the product ("kipfillet", "mlek"); products you open, add and search for most rank first, with recent searches when the box is empty. All in the browser (`search.js`), history on the device or in the account | [Google autocomplete](https://support.google.com/websearch/answer/7368877); NN/g [site search suggestions](https://www.nngroup.com/articles/site-search-suggestions/) |
| Keyboard | `/` jumps to search, Esc closes panels or clears search, Enter opens a focused card | |

## Deal types people can filter on

The collector turns each store's promo text (Dutch, French, English) into one key, in `collector/parse.py` → `deal_kind()`:

| Key | Shown as | Examples it catches |
|---|---|---|
| `1+1` | 1+1 (2 for 1) | "1+1 gratis", "2 voor 1", "1+1 offert" |
| `2+1` | 2+1 (3 for 2) | "2+1 gratis", "3 voor 2", "3 pour 2" |
| other `N+M` | Buy more | "2+2 gratis", "4 voor 3" |
| `2nd_half` | 2nd half price | "2de aan halve prijs", "2e à -50%" |
| `2nd_pct` | 2nd discounted | "2de -30%" |
| `percent` | % off | "-25%", "30% korting" |
| `bundle` | Bundle price | "2 voor € 5", "2 pour 4,50 €" |
| `price_drop` | Price drop | "Prijsdaling", "baisse de prix" |

The price per kg/L shown on each card already counts the deal (1+1 at €2 for 500 g is €2/kg, not €4/kg).
