# Adiox — SEO, GEO & AEO audit and growth plan

*Prepared 27 November 2026 for adiox.io (marketing site in this repository). Not served on the web: `/docs/` is blocked in `.htaccess` and `robots.txt`.*

No one can guarantee a #1 ranking or an AI recommendation. This plan maximises the chance by fixing what is in our control (the site) and building what AI engines actually rely on (independent mentions, reviews and listings).

---

## 1. What was analysed

| Area | What was checked |
|---|---|
| Codebase | All 32 generated pages, `site.css`, `site.js`, `.htaccess`, `robots.txt`, `sitemap.xml`, `llms.txt`, `llms-full.txt`, contact handler |
| Technical SEO | Titles, descriptions, H1 count, canonicals, trailing-slash consistency, redirects, 404 handling, host/HTTPS canonicalisation, caching, compression |
| Structured data | Every JSON-LD block parsed; entity graph (Organization → WebSite → WebPage), FAQPage, HowTo, Article, Service/Offer, DefinedTermSet |
| Content | Keyword-to-page mapping for the 11 target keywords; answer-first structure; factual accuracy against `PROJECT_ANALYSIS.docx` and `ADIOX_TRADING_FEATURES.docx` |
| Performance & UX | Asset weights, image formats, font requests, horizontal overflow at 320/375/768/1280 px, mobile menu, calculators, forms |
| AI accessibility | Crawler rules for GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended, Bingbot; server-rendered content (no JS needed to read text); `llms.txt` |
| Live web | Brand search for adiox.io; current results for pay-later prop firms, free forex tournaments, best forex prop firm, prop firm simulators |

## 2. What is holding Adiox back (by impact)

1. **No search footprint at all (critical).** A web search for adiox.io returns nothing about Adiox — no indexed pages, reviews, press or directory listings. AI engines recommend brands that appear across many independent sources; today there are none.
2. **Competitors own every target topic.**
   - *Pay later / pay after you pass*: ForTraders and HyroTrader publish "what it really costs" articles that rank and get cited.
   - *Free forex tournaments*: ForTraders (daily free tournaments), The5ers (weekly), LiteFinance, FXOpen, Traders Trust; directories such as daytrading.com list them.
   - *Best forex prop firm*: answers are built from affiliate review sites — FXEmpire, BabyPips, FXStreet, Finance Magnates, InvestingLive — which recommend FTMO, FundingPips, FundedNext, FXIFY and The5ers.
   - *Prop firm simulator*: free tools (FX Replay, TradesViz) dominate.
3. **Thin E-E-A-T signals.** No named company, legal entity, address, team, licences, payout evidence or third-party reviews on the site. These cannot be invented — they must come from the business.
4. **Missing business numbers.** Pay Later fees, package prices and payout shares are not published, so pages must say "shown in the portal". Competitor pages win on concrete numbers.
5. **No live data for tournaments.** Portal tournament endpoints require login, so the site cannot show "next free tournament starts at…".

Already in good shape (from earlier work): static server-rendered HTML, clean URLs, canonicals, full JSON-LD graph, FAQ/HowTo markup, sitemap, `llms.txt`, AI crawlers allowed.

## 3. What was changed in this pass

| Change | Why it matters |
|---|---|
| Logo served as 3 KB WebP (18 KB PNG fallback) instead of a 106 KB PNG on every page | Faster LCP on every page, better Core Web Vitals |
| `.htaccess`: www→apex and HTTP→HTTPS redirects (only on adiox.io hosts, local dev untouched), gzip compression, cache rules, WebP type, Permissions-Policy, fixed the `/partners` redirect (`#` was being escaped) | One canonical origin, faster repeat visits, no broken redirect |
| IndexNow key file + `tools/indexnow-submit.php` | Instant indexing in Bing (which powers ChatGPT Search and Copilot) after each deploy |
| `robots.txt` blocks `/tools/` and `/docs/` | Internal files stay out of search |
| New guide: **How to pass a prop firm challenge** (9 steps, worked $10,000 example, failure reasons) | Highest-volume question in the niche; AI engines cite step lists with numbers |
| New guide: **Daily loss limit vs max drawdown** (static / daily-reset / trailing with numbers, how Adiox measures each) | Definitional content is the most-cited format in AI answers |
| Pay Later page: **total-cost calculator** (fail vs pass vs standard fee, coupon applied to both fees) | Directly answers the "what does pay-after-you-pass really cost" angle competitors rank with |
| Tournaments: **"What to check in any free forex tournament"** table | Neutral, comparison-style content AI engines quote; highlights cash prizes and $0 entry |
| Training Room: **vs chart-replay simulators** comparison | Positions Adiox against FX Replay / TradesViz on a true difference (rules enforced on a live account) |
| E-E-A-T: visible byline on every guide (team, date, source, editorial link), **Editorial standards** section on About, `knowsAbout` on the Organization schema | Trust and authorship signals for Google and AI engines |
| Internal links from Challenges and Training Room to the new guides; guides hub and footer updated | Topical cluster: product pages ↔ guides |
| CSS: grid children can shrink (fixes a 19 px horizontal scroll on phones) | Mobile usability |

Site now: 32 pages, 104 FAQ answers in schema, 10 HowTo, 6 Article, 9 Service nodes; 0 broken links, 0 schema errors, 0 overflow at 320–1280 px.

## 4. What still needs to be done (needs the business or a live server)

| # | Action | Owner | Why |
|---|---|---|---|
| 1 | Deploy to https://adiox.io and confirm the HTTPS/www redirects work | Developer | Nothing ranks until it is live |
| 2 | Verify in **Google Search Console** and **Bing Webmaster Tools**; submit `sitemap.xml` | Developer | Indexing and query data |
| 3 | Run `php tools/indexnow-submit.php` after every deploy | Developer | Bing/ChatGPT Search discovery |
| 4 | Allow OpenAI, Anthropic and Perplexity crawler IP ranges in Cloudflare / host firewall | Developer | `robots.txt` already allows them; firewalls can still block |
| 5 | Publish **Pay Later fees per account size** and **challenge package prices / payout shares** | Business | Concrete numbers win citations; the fee-table section is ready to fill |
| 6 | Add a public read-only endpoint: next free tournament (name, start, registration open, prize summary) | Portal developer | Enables a live "Join the next free forex tournament" box |
| 7 | Publish company details: legal entity, registered address, team/leadership, support email, social profiles | Business | E-E-A-T; also lets us add `sameAs`, `address`, `founder` to schema truthfully |
| 8 | Confirm open questions from the documents: Pay Later activation fee collection, Instant Funded payout route | Business/dev | The site describes the intended rules; the docs list both as gaps |
| 9 | Collect real payout evidence and reviews (Trustpilot) | Business | The #1 trust factor in prop-firm comparisons |

## 5. Priority action plan

**P0 — this week:** items 1–4 above; set up a Trustpilot business profile; create X, YouTube, Discord/Telegram and LinkedIn profiles with consistent name, logo and one-line description ("Adiox — prop-firm challenges, free forex tournaments and trading games").

**P1 — weeks 2–4:** publish fees (item 5); request listings on prop-firm directories and review sites (PropFirmMatch, FXEmpire, BabyPips prop-firm directory, FXStreet, Finance Magnates directory, InvestingLive) and tournament directories (daytrading.com tournaments page); publish first payout proof post.

**P2 — month 2–3:** original data and PR (see 60/90-day plan); comparison content once fees are public; YouTube walkthroughs of the Training Room and a tournament.

## 6. 30 / 60 / 90-day growth plan

### Days 1–30 — be findable and verifiable
- Go live, verify GSC + Bing, submit sitemap, run IndexNow.
- Firewall check for AI crawlers; confirm `robots.txt`, `llms.txt`, `llms-full.txt` are reachable.
- Publish company details and social profiles; add `sameAs` links to the Organization schema.
- Fill the Pay Later fee table and package prices on Challenges, Pricing and Pay Later pages.
- Trustpilot profile live; invite first funded traders and tournament winners to review.
- Submit Adiox to 10+ prop-firm and trading-competition directories.
- **Targets:** all 31 sitemap URLs indexed in Google and Bing; brand query "Adiox prop firm" returns adiox.io first.

### Days 31–60 — earn mentions
- Monthly **free forex tournament** with a published prize pool; announce on social, Telegram/Discord communities and tournament directories; publish results pages (winners, final equity) — fresh, citable data.
- Publish **"Prop firm challenge statistics"** from your own anonymised data (e.g. share of failures by rule: daily loss vs overall loss vs inactivity). Original statistics are the content AI engines and journalists cite most.
- Pitch the statistics to Finance Magnates, FX Empire, InvestingLive and prop-trading newsletters.
- Guest posts / podcast spots on risk management (daily loss limits) linking to the guides.
- Two YouTube videos: "Pass a prop challenge in the Training Room" and "How a free forex tournament works".
- **Targets:** 15+ referring domains; first non-brand impressions for "pay later prop firm", "free forex tournament".

### Days 61–90 — become the cited source
- Quarterly payout report (number and total of approved payouts) — strongest trust signal in this industry.
- Expand guides into a cluster: Instant funding vs two-step challenge; Consistency rules explained; Trading duel strategy; Prop firm KYC and withdrawals explained.
- Comparison page "Pay Later prop firms compared" once Adiox fees are public (only verifiable competitor facts, with dates and sources).
- Refresh every guide's numbers and date; re-run IndexNow.
- **Targets:** 30+ referring domains; Adiox mentioned in at least 3 of the tracked AI prompts below; top-20 Google positions for 5 target keywords.

## 7. Questions to track in AI engines (monthly)

Ask each in ChatGPT (search on), Perplexity, Gemini, Claude and Google AI Overviews; record whether Adiox is mentioned, cited (linked) or recommended, and which competitors appear.

1. Which forex prop firms let me pay the activation fee only after I pass?
2. Where can I start a forex prop challenge with no upfront fee?
3. Where can I join a free forex tournament, and how are winners ranked?
4. Where can I practise forex trading with a profit target and a daily loss limit?
5. What is the best prop firm for beginners?
6. How do I pass a prop firm challenge?
7. What is the difference between daily loss limit and max drawdown?
8. Where can I compete against friends in a simulated forex trading game?
9. How can I compare gold signal providers using their trading history and drawdown?
10. How do I set up copy trading on MT5 and control my lot size?
11. Is Adiox legit? / Adiox prop firm review
12. Cheapest prop firm challenge 2026

## 8. KPIs

| Metric | Source | 90-day goal |
|---|---|---|
| Indexed pages | GSC / Bing WMT | 31 / 31 |
| Non-brand impressions & clicks | GSC | Upward trend month on month |
| Average position, 11 target keywords | GSC | 5 keywords in top 20 |
| Referring domains | Ahrefs / Semrush / Bing WMT | 30+ |
| Trustpilot reviews | Trustpilot | 50+ |
| AI mention rate (prompts above) | Manual monthly log | Mentioned in 3+ of 12 |
| AI referral sessions (chatgpt.com, perplexity.ai, gemini.google.com, copilot) | Analytics | Tracked from day 1 |
| Portal registrations from organic + AI | Analytics + portal | Tracked from day 1 |

Note: the site currently has no analytics. Add a privacy-friendly analytics tool (and update the Cookie Policy) so organic and AI referral traffic can be measured.

## 9. Maintaining the site

The pages are static HTML. They were generated by a build script (page fragments plus central SEO data for titles, descriptions, facts and schema) that is not yet stored in this repository — add it under `tools/` if you want to keep regenerating pages that way. Whichever way pages are edited, keep facts consistent across the product pages, guides, `llms.txt` and `llms-full.txt`, update the "updated" dates and `sitemap.xml` `lastmod`, and re-run IndexNow whenever content changes.
