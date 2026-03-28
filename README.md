# ♠ Spades 27

A feature-rich, zero-dependency browser Spades card game. Pure HTML/CSS/JS — no build step, no server, no frameworks.

## ▶ [Play Now](https://keithadler.github.io/spades27/)

No install needed. Just click the link above or open `index.html` in any browser.

```bash
# Or serve locally:
python3 -m http.server 8080
# → http://localhost:8080
```

## Features

**Gameplay** — Full Spades rules with 2v2 partnership or cutthroat (FFA) modes, bidding with Nil support, trick-taking with spades as trump, "breaking spades" rule, bag tracking with 10-bag penalty, 3 AI difficulty levels, 5 AI personality types, and keyboard shortcuts.

**AI** — Each opponent gets a random generation (Gen Z, Millennial, Gen X, Boomer) that determines how they trash-talk. Personalities affect play style: Aggressive, Defensive, Chaotic, Calculated, Bully. Three difficulty levels from random play (Easy) to heuristic-optimized bidding and card counting (Hard).

**Visuals** — Card animations, particle effects, score popups, thinking indicators, speech bubbles, avatar pulse on active turn, and victory confetti.

**i18n** — English, Spanish, Arabic (RTL), Chinese. Auto-detects browser language.

**Progression** — XP leveling, 13 achievements, lifetime stats (games, tricks, bags, nils, win streaks, play time).

**Quality of Life** — Dark/light theme, 6 table felt themes, game speed control (Fast/Normal/Slow), AI trash talk frequency slider, colorblind mode, prefers-reduced-motion support.

**Mobile** — Responsive across phones, tablets, and desktop. PWA installable. Touch support, safe area support for notched devices.

## Game Modes

| Mode | Players | Scoring |
|------|---------|---------|
| **2v2 Teams** | You + partner vs 2 opponents | Team bids combined, shared score & bags |
| **Cutthroat** | 4-player free-for-all | Individual bids, individual scoring |

## How Spades Works

1. **Deal** — 13 cards each from a standard 52-card deck
2. **Bid** — Each player bids how many tricks they'll win (1–13, or Nil for zero)
3. **Play** — 13 tricks. Must follow lead suit. Spades are trump. Can't lead spades until broken.
4. **Score** — Make your bid: `bid × 10` + 1/bag. Miss it: `-bid × 10`. Nil success: +100. Nil fail: -100.
5. **Bags** — Every 10 overtricks = -100 penalty. Don't win too many extras.
6. **Win** — First to target score (default 500) wins.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `1`–`9` | Select card by position |
| `M` | Open menu |
| `Esc` | Close any overlay |

## Project Structure

```
├── index.html       — Single-page app shell
├── styles.css       — Styles, animations, responsive breakpoints
├── locales.js       — i18n: 4 languages, phrases, names, UI strings
├── card.js          — Card class, deck creation, shuffle, sort
├── player.js        — Player model (human + AI)
├── ai.js            — AI engine: 3 difficulties, bidding + play heuristics
├── audio.js         — Synthesized SFX + dynamic music engine
├── stats.js         — Win/loss records, achievements, XP
├── ui-helpers.js    — Avatars, themes, personalities, particles
├── game.js          — Main game controller
├── test.js          — Automated test suite (40 tests)
├── manifest.json    — PWA manifest
└── README.md
```

## Tech Stack

- **Rendering** — DOM-based card rendering with CSS animations
- **Audio** — Web Audio API oscillator synthesis (no audio files)
- **Persistence** — localStorage for stats, achievements, settings
- **Avatars** — DiceBear Open Peeps (CC BY 4.0)
- **Font** — Inter (SIL Open Font License 1.1)

## Running Tests

```bash
node test.js
# 40 tests covering: deck, cards, shuffle, sort, player rules,
# AI bidding, AI play, trick resolution
```

## License

MIT

## Attribution

- Avatars by [DiceBear](https://dicebear.com) — CC BY 4.0
- Inter typeface by Rasmus Andersson — SIL OFL 1.1

---
Made by Keith Adler
