# ♠ Spades 27

A feature-rich, zero-dependency browser Spades card game. Pure HTML/CSS/JS — no build step, no server, no frameworks.

![Version](https://img.shields.io/badge/Version-v3-blue)
![MIT License](https://img.shields.io/badge/License-MIT-green)
![Pure JS](https://img.shields.io/badge/Stack-HTML%2FCSS%2FJS-blue)
![No Dependencies](https://img.shields.io/badge/Dependencies-None-orange)
![Languages](https://img.shields.io/badge/Languages-EN%20ES%20AR%20ZH-purple)

## ▶ [Play Now](https://keithadler.github.io/spades27/)

No install needed. Just click the link above or open `index.html` in any browser.

```bash
# Or serve locally:
python3 -m http.server 8080
# → http://localhost:8080
```

## Features

**Gameplay** — Full Spades rules with 2v2 partnership or cutthroat (FFA) modes, house rules (Nil and Blind Nil on/off, Board of 4, Jokers & Deuces), last-trick review, a suggested bid, bidding with Nil and Blind Nil support, trick-taking with spades as trump, "breaking spades" rule, bag tracking with 10-bag penalty, 3 AI difficulty levels, 5 AI personality types, save/resume games, and keyboard shortcuts.

**AI** — Heuristic scoring engine with 3 difficulty levels and a memory of every card played this hand. Easy plays like a beginner (leads high, wastes winners) but never trumps a partner's winning card. Medium uses the full heuristics with some variety. Hard plays like a solid club player: third hand high, leads cards that are the highest left in their suit instead of unprotected kings, covers a partner's Nil with its highest winner, goes for the set when the opponents need nearly every trick left, and fights bags once the team bid is made. Blind Nil only when partner has bid big enough to cover it. Each opponent gets a random generation (Gen Z, Millennial, Gen X, Boomer) with culturally authentic Spades trash talk. 5 personalities: Aggressive, Defensive, Chaotic, Calculated, Bully.

**Visuals** — A casino card table: green felt oval with a wooden rim (5 felt colors), a real printed-deck look drawn in vector art (standard pip layouts, crowned double-headed court cards, an ornamental Ace of Spades, lattice card backs), your hand fanned in an arc with playable cards raised, opponents' hands fanned behind their seat plates, the winning card glowing in the trick, a gold scoreboard, bid chips laid on the felt while your hand stays in view, a round-results scoreboard with a race-to-500 bar, and a victory screen with the four aces. Deal animation, particle effects, screen shake, 6 card skins, and victory celebrations that scale with margin.

**i18n** — English, Spanish, Arabic (full RTL), Chinese. Auto-detects browser language. First-visit language picker. Language selector on menu and in preferences. Full UI translations (100+ keys per language), translated rules and 9-step tutorial, culturally authentic names/cities/trash talk per language.

**Accessibility** — ARIA roles and labels on all screens, overlays, menus, and cards. `aria-live` regions for trick results. Cards are fully keyboard-playable (Tab + Enter/Space, or number keys 1-9). Colorblind mode with a 4-color deck (blue diamonds, green clubs). Pinch zoom enabled. Screen reader support for game state.

**Progression** — XP leveling, 13 achievements (First Victory, Nil Master, Blind Faith, Boston, Perfect Bid, Clean Game, and more), lifetime stats, head-to-head records vs each AI opponent.

**Quality of Life** — Save/resume games, dark/light theme, 6 table felt themes, 6 card skins (Classic, Midnight, Gold, Neon, Wood, Marble), game speed control (Fast/Normal/Slow), AI trash talk frequency slider (Off/Low/Normal/Max), interactive 9-step tutorial, in-game name editing, colorblind mode (4-color deck), suit-grouped bid panel, prefers-reduced-motion support.

**Mobile** — Responsive across phones, tablets, and desktop. PWA installable with offline support via service worker (stale-while-revalidate, so updates reach returning players automatically). Touch support, safe area support for notched devices.

## Game Modes

| Mode | Players | Scoring |
|------|---------|---------|
| **2v2 Teams** | You + AI partner vs 2 AI opponents | Team bids combined, shared score & bags |
| **Cutthroat** | 4-player free-for-all | Individual bids, individual scoring |

## How Spades Works

1. **Deal** — 13 cards each from a standard 52-card deck
2. **Blind Nil?** — If your team is down 100+, you're offered Blind Nil (+200/−200) before seeing your cards
3. **Bid** — Each player bids how many tricks they'll win (1–13, or Nil for zero). You see previous bids and scores.
4. **Play** — 13 tricks. Must follow lead suit. Spades are trump. Can't lead spades until broken.
5. **Score** — Make your bid: `bid × 10` + 1/bag. Miss it: `−bid × 10`. Nil: +100/−100. Blind Nil: +200/−200. Tricks taken by a Nil bidder don't count toward the partner's bid, but they do count as bags.
6. **Bags** — Every 10 overtricks = −100 penalty. Don't win too many extras.
7. **Win** — First to target score (default 500) wins; if both sides pass it on the same hand, the higher score wins, and a tie for first means one more hand. A side that drops to −200 loses.

## AI Strategy

The AI uses a 7-factor scoring system for card play:

| Factor | What it does |
|--------|-------------|
| **F1: Leading** | Nil-protect / aggressive / hard-duck / bag-avoid modes |
| **F2: Following (can win)** | Win cheaply when needed, hard-duck when done |
| **F3: Following (can't win)** | Dump high cards when done, save high when not |
| **F4: Partner awareness** | Don't overtake or trump partner's winning card, rescue nil partner |
| **F5: Nil protection** | Always win to cover partner's nil bid |
| **F6: Nil busting** | Lead low to trap opponent nil, duck under winning nil |
| **F7: Bag warfare / setting** | Force bags on opponents, avoid own team's bags, fight for the trick that sets the opponents |

Bidding estimates tricks from high spades, spade length, side-suit honours and ruffing potential, rounds to the nearest trick, and applies bag-aware and team-overbid adjustments. In partnership mode "do I need tricks?" is answered for the team, not the individual, so a partner keeps working until the combined bid is made. Full details in the [ai.js source](ai.js).

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1`–`9` | Play card by position |
| `M` | Open menu |
| `R` | Rules |
| `G` | Game log |
| `L` | Last trick |
| `A` | Stats & Achievements |
| `E` | Preferences |
| `?` | Toggle shortcuts panel |
| `Esc` | Close any overlay |

## Project Structure

```
├── index.html       — Single-page app shell with ARIA accessibility
├── styles.css       — Styles, animations, responsive, dark/light themes
├── locales.js       — i18n: 4 languages, 100+ keys each, phrases, rules
├── card.js          — Card class, deck creation, shuffle, sort
├── card-art.js      — Vector card faces and backs (pip layouts, court cards)
├── portraits/       — Painted player portraits (01–16.webp)
├── player.js        — Player model (human + AI), nil/blindNil tracking
├── rules.js         — The rules as pure functions: trick winner, scoring, game end
├── ai.js            — AI engine: 7-factor scoring, 3 difficulties (~560 lines)
├── audio.js         — Synthesized SFX + dynamic jazz music engine
├── stats.js         — Win/loss records, 13 achievements, XP, head-to-head
├── ui-helpers.js    — Avatars, themes, skins, tutorial, personalities, particles
├── game.js          — Main game controller with save/resume (~1800 lines)
├── game-fx.js       — Visual effects: deal animation, popups, shake, particles
├── sw.js            — Service worker for offline play
├── test.js          — Automated test suite (102 tests)
├── sim.js           — Headless simulator: thousands of AI games, rule checks, table stats
├── manifest.json    — PWA manifest
├── CONTRIBUTING.md  — Contribution guidelines
├── LICENSE          — MIT License
└── README.md
```

## Tech Stack

- **Rendering** — DOM-based card rendering with CSS animations
- **Audio** — Web Audio API oscillator synthesis (no audio files)
- **Persistence** — localStorage for stats, achievements, settings, save games
- **Offline** — Service worker caches all assets for offline play, refreshing them in the background
- **Accessibility** — ARIA roles, labels, live regions, keyboard navigation, 4-color colorblind deck
- **Portraits** — 16 painted character portraits in `portraits/` (AI-generated for this project), bundled so they work offline
- **Typography** — System font stack (no webfont download)

## Running Tests

```bash
node test.js
# 102 tests covering: deck, cards, shuffle, sort, player rules,
# nil/blindNil properties, AI bidding, AI play, trick resolution,
# partnership + cutthroat scoring, bag penalties, game end and ties,
# Jokers & Deuces, board minimums and Nil switches

node sim.js 2000 hard teams
# Plays 2000 full AI games, checks every rule on every trick, and reports
# how the table plays (bids, sets, nils, bags, hands per game)
```

## Changelog

### v4.2 — September 2026
Fixes from a veteran-player review of the AI, each checked against a scripted hand:
- The AI remembers every card played this hand, so it knows which of its cards are now the highest left in their suit
- Third hand high: with partner winning and an opponent still to play, it takes the trick instead of ducking
- It leads cards that are the highest left in their suit, not a king while the ace is still out
- Partner covers your Nil from second seat with its highest winner (it used to play its cheapest)
- A busted Nil is no longer protected; a busted Nil bidder forced to win throws its biggest winner
- Goes for the set whenever the opponents need nearly every remaining trick, even at the cost of a bag
- Easy partners no longer trump your winning card from third seat
- AI Blind Nil only once partner has bid 4+ (success 22% → 36%); Nil is rarer beside a weak partner
- The game saves right after the deal and after every bid, and resumes mid-bidding: reloading is no longer a free re-deal
- Net effect (Hard, 2,000 games): Nil made 74% → 80%, games lost at −200 5.6% → 2.4%

### v4.1 — September 2026
- House rules on the menu: Nil on/off, Blind Nil on/off, Board of 4 (a partnership must bid at least 4; the second partner makes up the difference), and Jokers & Deuces (Big Joker, Little Joker, 2♦, 2♠ over A♠; 2♣ and 2♥ removed) with joker card art and trump badges on the promoted deuces
- The AI plays every house rule; its Jokers & Deuces bidding is calibrated separately on simulated hands (table bids ~12 of 13, sets ~14%)
- Last-trick review (button or L), dealer chip on the dealer's seat, suggested bid in the bid panel
- 101 tests; `node sim.js 1000 hard teams jokers,board` simulates any rule set

### v4 — September 2026
- New look: a felt card table with a wooden rim in a dark room, gold-and-charcoal interface, serif gold logo
- Real card art in vector graphics: standard pip layouts, crowned court cards, ornamental Ace of Spades, patterned backs; crisp at any size, and card skins and the colorblind deck still apply
- Your hand is a fanned arc of full-size cards; playable cards rise, others dim. Opponents sit at seat plates with their hands fanned behind them and a tricks/bid chip; whoever's turn it is glows
- Bidding happens on the table with poker-chip buttons while your real hand stays visible
- Redesigned round results (per-team scoreboard, points for the hand, race-to-target bars), menu (four-ace hero, two-column layout on desktop) and victory/defeat screen
- Phone layout: smaller cards that always fit, compact seats
- Painted character portraits replace the cartoon avatars; bundled locally (offline-ready), and no two players at a table share a face

### v3.2 — September 2026
- Rules live in one place (`rules.js`); the game, the AI and the tests all use it
- Ties for first no longer end the game (the human used to be handed the loss) — play another hand, as at a real table
- Round results showed "Made" for a team whose busted Nil partner's tricks were propping up the count, while the score correctly said Set; results now come from the same calculation as the score, and show each hand's points and bag penalties
- Cutthroat: a busted Nil's tricks count as bags, same as in partnership
- The game refuses an illegal card (out of turn, not following suit, leading unbroken spades) no matter how it was played
- AI bidding calibrated against 30,000 simulated hands: the old estimate ran ~0.6 tricks low per player, so the table bid ~10 of 13 and was set 2.5% of the time. Now ~12 of 13 with sets ~13%, like a real table
- AI can bid 10+ on a monster hand (was capped at 9); Medium bids Nil too; Nil in cutthroat needs a weaker hand since nobody covers you
- AI opponents and partners go Blind Nil when their team is down 100+, more often the further behind they are
- New `sim.js` simulator: 100,000+ hands played with zero rule violations

### v3.1 — September 2026
- Partnership fix: an AI now keeps taking tricks until the TEAM bid is made, instead of ducking as soon as its own bid was in and leaving its partner to carry the hand
- AI no longer overtakes or trumps its partner's winning card (all difficulties as last player; Medium/Hard in third seat too)
- Bidding recalibrated: rounds to the nearest trick and credits spade length and ruffing properly (the table used to bid ~7 of 13 tricks, so nobody ever got set and bags piled up)
- AI fights for the trick that sets the opponents instead of handing it over
- Nil cover only spends winners when the nil partner is actually at risk in the trick
- Team scoring: tricks taken by a busted Nil bidder now count as bags for the partnership (standard rule)

### v3 — July 2026
- Fixed a game-corrupting bug where pending AI timers from an abandoned game leaked into the next one (duplicate plays, desynced tricks, and a hang at trick 13)
- AI overhaul: partners reliably cover Nil bids at every difficulty, nil bidders duck their own tricks, cutthroat nil-busting activates, no more phantom partnership logic in FFA
- 25+ bug fixes across scoring edge cases, stats tracking (tricks, nils), all 13 achievements now earnable, save/resume integrity, dialog double-fires, and keyboard input
- Modernized UI: real card faces with corner indices, felt table well, status chips, and a redesigned suit-grouped bid screen for desktop and mobile
- Colorblind mode implemented as a 4-color deck with a settings toggle
- Complete Spanish, Arabic, and Chinese localization including the tutorial; corrected Arabic card terminology
- Service worker switched to stale-while-revalidate so deployed updates reach returning players

### v2 — July 2026
- Initial fix wave and Pages deployment

### v1
- Original release

## License

MIT — see [LICENSE](LICENSE).

---
Made by Keith Adler
