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

**Gameplay** — Full Spades rules with 2v2 partnership or cutthroat (FFA) modes, bidding with Nil and Blind Nil support, trick-taking with spades as trump, "breaking spades" rule, bag tracking with 10-bag penalty, 3 AI difficulty levels, 5 AI personality types, save/resume games, and keyboard shortcuts.

**AI** — 7-factor heuristic scoring engine with 3 difficulty levels. Easy plays like a beginner (leads high, wastes winners). Medium uses full heuristics with weighted randomness (top 3, 5:3:1 odds). Hard plays optimally with partner awareness, nil protection/busting, and bag warfare. Nil protection overrides all other priorities — your partner will always cover your nil. Each opponent gets a random generation (Gen Z, Millennial, Gen X, Boomer) with culturally authentic Spades trash talk. 5 personalities: Aggressive, Defensive, Chaotic, Calculated, Bully.

**Visuals** — Cinematic deal animation with shuffle, 3-2-1 countdown, round announcements over the table felt, card fly-in animations, screen shake on trick wins and spades broken, particle effects, score popups, combo counters, nil bust banners, floating turn arrow, ambient dust motes, time-of-day lighting, haptic feedback, 6 card skins, and victory celebrations that scale with margin (double confetti for blowouts, subtle gold for close games).

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
5. **Score** — Make your bid: `bid × 10` + 1/bag. Miss it: `−bid × 10`. Nil: +100/−100. Blind Nil: +200/−200.
6. **Bags** — Every 10 overtricks = −100 penalty. Don't win too many extras.
7. **Win** — First to target score (default 500) wins. Game also ends if a team drops to −200.

## AI Strategy

The AI uses a 7-factor scoring system for card play:

| Factor | What it does |
|--------|-------------|
| **F1: Leading** | Nil-protect / aggressive / hard-duck / bag-avoid modes |
| **F2: Following (can win)** | Win cheaply when needed, hard-duck when done |
| **F3: Following (can't win)** | Dump high cards when done, save high when not |
| **F4: Partner awareness** | Don't overtake partner, rescue nil partner |
| **F5: Nil protection** | Always win to cover partner's nil bid |
| **F6: Nil busting** | Lead low to trap opponent nil, duck under winning nil |
| **F7: Bag warfare** | Force bags on opponents, avoid own team's bags |

Bidding uses conservative trick counting (floor, not round) with bag-aware adjustments and team overbid protection. Full details in the [ai.js source](ai.js).

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1`–`9` | Play card by position |
| `M` | Open menu |
| `R` | Rules |
| `G` | Game log |
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
├── player.js        — Player model (human + AI), nil/blindNil tracking
├── ai.js            — AI engine: 7-factor scoring, 3 difficulties (~560 lines)
├── audio.js         — Synthesized SFX + dynamic jazz music engine
├── stats.js         — Win/loss records, 13 achievements, XP, head-to-head
├── ui-helpers.js    — Avatars, themes, skins, tutorial, personalities, particles
├── game.js          — Main game controller with save/resume (~1800 lines)
├── game-fx.js       — Visual effects: deal animation, popups, shake, particles
├── sw.js            — Service worker for offline play
├── test.js          — Automated test suite (48 tests)
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
- **Avatars** — DiceBear Open Peeps (CC BY 4.0), with a local SVG fallback when offline
- **Typography** — System font stack (no webfont download)

## Running Tests

```bash
node test.js
# 48 tests covering: deck, cards, shuffle, sort, player rules,
# nil/blindNil properties, AI bidding, AI play, trick resolution
```

## Changelog

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

## Attribution

- Avatars by [DiceBear](https://dicebear.com) — CC BY 4.0

---
Made by Keith Adler
