/**
 * @file card-art.js — Vector card faces and backs, drawn like a real deck:
 * corner indices, the standard pip layouts for 2–10, framed double-headed
 * court cards, an ornamental Ace of Spades, and a lattice-pattern back.
 * Everything is inline SVG using one shared sprite of suit shapes, so cards
 * stay crisp at any size and cost almost nothing to render.
 * @author Keith Adler
 * @copyright 2026 Keith Adler. MIT License.
 *
 * @dependency card.js ({@link Card})
 */

// Suit shapes, drawn in a 100×100 box
const SUIT_PATHS = {
  hearts: 'M50 92C22 70 3 52 3 30 3 13 15 3 29 3c9 0 16 5 21 13 5-8 12-13 21-13 14 0 26 10 26 27 0 22-19 40-47 62z',
  diamonds: 'M50 2 88 50 50 98 12 50z',
  spades: 'M50 2c9 18 47 36 47 60 0 15-11 24-23 24-9 0-16-4-20-10 1 11 6 17 14 22H32c8-5 13-11 14-22-4 6-11 10-20 10C14 86 3 77 3 62 3 38 41 20 50 2z',
  clubs: 'M50 4a21 21 0 0 1 17 33 21 21 0 1 1-12 34c1 11 5 18 13 25H32c8-7 12-14 13-25a21 21 0 1 1-12-34A21 21 0 0 1 50 4z',
};

// Card box is 200×280. Pip centers for 2–10 (x, y); pips below the middle
// are drawn upside down, as on a printed card.
const PIP_LAYOUTS = (() => {
  const L = 64, C = 100, R = 136;
  const r1 = 62, r2 = 104, r3 = 140, r4 = 176, r5 = 218;
  const r25 = 83, r45 = 197, r2b = 116, r4b = 164;
  return {
    2: [[C, r1], [C, r5]],
    3: [[C, r1], [C, r3], [C, r5]],
    4: [[L, r1], [R, r1], [L, r5], [R, r5]],
    5: [[L, r1], [R, r1], [C, r3], [L, r5], [R, r5]],
    6: [[L, r1], [R, r1], [L, r3], [R, r3], [L, r5], [R, r5]],
    7: [[L, r1], [R, r1], [C, 101], [L, r3], [R, r3], [L, r5], [R, r5]],
    8: [[L, r1], [R, r1], [C, 101], [L, r3], [R, r3], [C, 179], [L, r5], [R, r5]],
    9: [[L, r1], [R, r1], [L, r2b], [R, r2b], [C, r3], [L, r4b], [R, r4b], [L, r5], [R, r5]],
    10: [[L, r1], [R, r1], [C, r25], [L, r2b], [R, r2b], [L, r4b], [R, r4b], [C, r45], [L, r5], [R, r5]],
  };
})();

const CARD_RED = new Set(['hearts', 'diamonds']);

/** Inject the shared <symbol> sprite once. */
function ensureCardSprite() {
  if (typeof document === 'undefined' || document.getElementById('card-sprite')) return;
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('id', 'card-sprite');
  svg.setAttribute('aria-hidden', 'true');
  svg.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden';
  svg.innerHTML = `<defs>
    ${Object.entries(SUIT_PATHS).map(([s, d]) => `<symbol id="suit-${s}" viewBox="0 0 100 100"><path d="${d}"/></symbol>`).join('')}
    <linearGradient id="cf-sheen" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="cf-gold" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f7dc8a"/><stop offset=".5" stop-color="#d4a53c"/><stop offset="1" stop-color="#9c7020"/>
    </linearGradient>
    <pattern id="cb-lattice" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="14" height="14" class="cb-fill"/>
      <path d="M0 7h14M7 0v14" class="cb-line" stroke-width="1.6"/>
      <circle cx="7" cy="7" r="2.2" class="cb-dot"/>
    </pattern>
  </defs>`;
  document.body.prepend(svg);
}

function _pip(suit, x, y, size, flip) {
  const h = size / 2;
  const t = flip ? ` transform="rotate(180 ${x} ${y})"` : '';
  return `<use href="#suit-${suit}" x="${x - h}" y="${y - h}" width="${size}" height="${size}"${t}/>`;
}

// Crowns and ornaments for the court cards, drawn around (0,0)
const COURT_ORNAMENT = {
  K: '<path d="M-26 10-30-18-14-4 0-24 14-4 30-18 26 10z" fill="url(#cf-gold)" stroke="#5a3a0a" stroke-width="2.2" stroke-linejoin="round"/><rect x="-27" y="10" width="54" height="8" rx="2" fill="url(#cf-gold)" stroke="#5a3a0a" stroke-width="2"/><circle cx="0" cy="-26" r="4" fill="#c0392b" stroke="#5a3a0a" stroke-width="1.5"/>',
  Q: '<path d="M-24 12c2-14 8-22 24-30 16 8 22 16 24 30z" fill="url(#cf-gold)" stroke="#5a3a0a" stroke-width="2.2" stroke-linejoin="round"/><circle cx="-12" cy="-2" r="3.2" fill="#2e6fb8"/><circle cx="0" cy="-9" r="3.6" fill="#c0392b"/><circle cx="12" cy="-2" r="3.2" fill="#2e6fb8"/><rect x="-25" y="12" width="50" height="6" rx="2" fill="url(#cf-gold)" stroke="#5a3a0a" stroke-width="1.8"/>',
  J: '<path d="M-22 16c0-18 10-30 22-32 12 2 22 14 22 32z" fill="url(#cf-gold)" stroke="#5a3a0a" stroke-width="2.2"/><path d="M10-14c14-10 24-6 30-14-2 12-12 20-26 20" fill="#c0392b" stroke="#5a3a0a" stroke-width="1.6"/><rect x="-24" y="14" width="48" height="6" rx="2" fill="url(#cf-gold)" stroke="#5a3a0a" stroke-width="1.8"/>',
};

function _courtHalf(card, colorClass) {
  // One head of a double-headed court card, occupying the top half
  return `<g transform="translate(100 72)">${COURT_ORNAMENT[card.rank]}</g>
    <text x="94" y="134" text-anchor="middle" class="cf-court-letter ${colorClass}">${card.rank}</text>
    ${_pip(card.suit, 134, 116, 24, false)}`;
}

/**
 * Full SVG card face.
 * @param {Card} card
 * @returns {string} SVG markup
 */
function cardFaceSVG(card) {
  ensureCardSprite();
  const colorClass = `${CARD_RED.has(card.suit) ? 'cf-red' : 'cf-black'} cf-${card.suit}`;
  const idx = (flip) => `<g${flip ? ' transform="rotate(180 100 140)"' : ''}>
      <text x="24" y="46" text-anchor="middle" class="cf-index ${colorClass}">${card.rank}</text>
      <g class="${colorClass}">${_pip(card.suit, 24, 66, 26, false)}</g>
    </g>`;

  let body;
  if (card.rank === 'A') {
    const big = card.suit === 'spades' ? 104 : 70;
    body = `<g class="${colorClass}">${_pip(card.suit, 100, 140, big, false)}</g>`;
    if (card.suit === 'spades') {
      body = `<ellipse cx="100" cy="140" rx="66" ry="80" class="cf-ace-ring"/>
        <ellipse cx="100" cy="140" rx="58" ry="72" class="cf-ace-ring thin"/>${body}
        <text x="100" y="232" text-anchor="middle" class="cf-ace-mark">SPADES 27</text>`;
    }
  } else if (COURT_ORNAMENT[card.rank]) {
    body = `<rect x="44" y="30" width="112" height="220" rx="8" class="cf-court-frame ${colorClass}"/>
      <clipPath id="clip-${card.suit}-${card.rank}"><rect x="44" y="30" width="112" height="220" rx="8"/></clipPath>
      <g clip-path="url(#clip-${card.suit}-${card.rank})">
        <rect x="44" y="30" width="112" height="110" class="cf-court-tint ${CARD_RED.has(card.suit) ? 'red' : 'black'}"/>
        <rect x="44" y="140" width="112" height="110" class="cf-court-tint alt ${CARD_RED.has(card.suit) ? 'red' : 'black'}"/>
        <g class="${colorClass}">${_courtHalf(card, colorClass)}</g>
        <g class="${colorClass}" transform="rotate(180 100 140)">${_courtHalf(card, colorClass)}</g>
        <line x1="44" y1="140" x2="156" y2="140" class="cf-court-divider"/>
      </g>`;
  } else {
    const n = parseInt(card.rank, 10);
    body = `<g class="${colorClass}">${PIP_LAYOUTS[n].map(([x, y]) => _pip(card.suit, x, y, n >= 9 ? 34 : 38, y > 140)).join('')}</g>`;
  }

  return `<svg class="card-svg" viewBox="0 0 200 280" role="img" aria-label="${card.rank} of ${card.suit}">
    <rect x="1.5" y="1.5" width="197" height="277" rx="14" class="cf-bg"/>
    ${body}${idx(false)}${idx(true)}
    <rect x="1.5" y="1.5" width="197" height="277" rx="14" fill="url(#cf-sheen)" class="cf-sheen"/>
    <rect x="1.5" y="1.5" width="197" height="277" rx="14" class="cf-edge"/>
  </svg>`;
}

/** SVG card back: lattice field inside a framed border with a center medallion. */
function cardBackSVG() {
  ensureCardSprite();
  return `<svg class="card-svg" viewBox="0 0 200 280" aria-hidden="true">
    <rect x="1.5" y="1.5" width="197" height="277" rx="14" class="cb-border"/>
    <rect x="14" y="14" width="172" height="252" rx="8" fill="url(#cb-lattice)" class="cb-field"/>
    <rect x="14" y="14" width="172" height="252" rx="8" class="cb-frame"/>
    <circle cx="100" cy="140" r="34" class="cb-medal"/>
    <use href="#suit-spades" x="78" y="116" width="44" height="44" class="cb-medal-suit"/>
    <rect x="1.5" y="1.5" width="197" height="277" rx="14" fill="url(#cf-sheen)" opacity=".5"/>
  </svg>`;
}

/**
 * Push the selected card skin (ui-helpers.js CARD_SKINS) into CSS variables
 * the SVG classes read.
 */
function applyCardSkinVars(skin) {
  if (typeof document === 'undefined' || !document.body) return;
  const s = document.body.style;
  s.setProperty('--card-face', skin.face);
  s.setProperty('--card-face-dark', skin.faceDark);
  s.setProperty('--card-back', skin.back);
  s.setProperty('--card-back-dark', skin.backDark);
  s.setProperty('--card-black', skin.pip || '#15151f');
  s.setProperty('--card-red', skin.pip ? (skin.id === 'neon' ? '#ff3fa4' : '#e05a4a') : '#c42a2a');
}

/** Menu hero: the four aces, fanned. */
function renderMenuHero() {
  const el = typeof document !== 'undefined' && document.getElementById('menu-hero');
  if (!el) return;
  el.innerHTML = ['clubs', 'diamonds', 'hearts', 'spades'].map((s, i) =>
    `<div class="hero-card" style="--i:${i}">${cardFaceSVG(new Card(s, 'A'))}</div>`).join('');
}
if (typeof document !== 'undefined') renderMenuHero();
