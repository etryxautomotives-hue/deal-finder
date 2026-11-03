# Getting deal'ke found on Google

## What Belgians search for

People do not search for a brand they do not know yet. They search for a store, a week, or a type of deal.
These are the searches deal'ke is built to answer, grouped by how people type them.

| Intent | Dutch (Flanders, Brussels) | French (Wallonia, Brussels) | deal'ke page |
|---|---|---|---|
| A store's folder | aldi folder, lidl folder deze week, delhaize promoties, folder intermarché | dépliant aldi, folder lidl, promo delhaize cette semaine | `/promoties/aldi/`, `/promos/aldi/` (one per store) |
| All promos this week | supermarkt promoties, promoties deze week, folders deze week | promos supermarché, promotions de la semaine | `/promoties/`, `/promos/` |
| A deal type | 1+1 gratis, 2+1 gratis, 2de aan halve prijs | 1+1 gratuit, 2+1 gratuit, 2e à moitié prix | `/promoties/1-plus-1-gratis/` and so on |
| A product group | vlees promotie, bier promo, wasmiddel promotie | promo viande, promo bière, promo lessive | `/promoties/vlees-vis/`, `/promos/viande-poisson/` and so on |
| Comparing | goedkoopste supermarkt, prijs per kilo vergelijken | supermarché le moins cher, comparer prix | home page text and titles |

How this list was made: the store and deal-type searches are the ones the existing Belgian folder sites
(Promobutler, myShopi, Promotiez, folders.be) build their pages around, and the ones Google suggests
when you type a store name plus "promo" or "folder". Exact monthly volumes need Google Keyword Planner
or Search Console, which this project does not have access to yet (see "After launch").

### Where deal'ke can win

- **"[store] folder" / "[store] promoties"** has big volume but strong competition (the store itself and the
  folder apps). deal'ke's edge is a page with the actual products as text, updated every morning, which a
  flipbook folder cannot offer.
- **"1+1 gratis" and "2de aan halve prijs" across all stores** is a gap: the folder sites sort by store, not by deal.
- **Product group plus promo** ("vlees promotie", "promo bière") is smaller per search but there are many of
  them and few good answers.
- **The name.** Keep deal'ke as the brand, but write it `dealke` in the domain and anywhere people type it.
  The apostrophe is skipped by search engines and hard to type on a phone. Once people know the brand,
  they will search "dealke", so the structured data names both spellings.

## What the site does for search engines

`seo/build.py` runs in the daily workflow, right after the deals are collected. It writes:

- **32 landing pages** (16 in Dutch, 16 in French): all deals, one per store, one per deal type, one per
  product group. Each lists the deals as plain text, so Google can read them without running JavaScript,
  and links into the app with the right filter already set.
- **A title and description per page** with the search words and this week's dates, e.g.
  "Aldi promoties deze week (3 – 9 november) | Aldi folder | deal’ke".
- **Structured data** (schema.org JSON-LD): a list of products with price, store and end date per page,
  breadcrumbs, and on the home page the site name with a search box Google can show.
- **hreflang links** between each Dutch page and its French twin, so a French speaker gets the French page.
- **sitemap.xml** with every page and **robots.txt** pointing to it.
- **Plain links in the home page footer** to every landing page.

Pages only appear when there are deals for them, and expired deals are left out.

## Changing the web address

The address used in all of the above comes from one setting. To move to your own domain (e.g. dealke.be):

1. Buy the domain and point it at GitHub Pages (repository Settings → Pages → Custom domain).
2. In the repository, go to Settings → Secrets and variables → Actions → Variables, and add
   `SITE_URL` with the value `https://dealke.be`.
3. Run the workflow once (Actions → Collect deals and publish the site → Run workflow).

Without the variable, the site uses `https://etryxautomotives-hue.github.io/deal-finder`.

## After launch

1. Add the site to **Google Search Console** (search.google.com/search-console) and submit
   `<your address>/sitemap.xml`. Do the same in **Bing Webmaster Tools**, which also feeds DuckDuckGo
   and Ecosia. This is the step that gets the pages indexed, usually within a few days.
2. After four weeks, look at Search Console's "Queries" report. It shows the real searches people used
   to find deal'ke, with volumes. Turn the best of them into new landing pages.
3. Links from other sites matter a lot: a mention on a Belgian savings blog, a Reddit r/belgium post,
   or a local Facebook group gets Google to trust a new site sooner.
4. A share image (og:image) would make links look better on WhatsApp and Facebook. It needs a logo first.
