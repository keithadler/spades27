// Quick automated test for core Spades logic
// Run with: node test.js

const vm = require('vm');
const fs = require('fs');

// Simulate browser globals
const sandbox = {
  localStorage: { _data: {}, getItem(k) { return this._data[k] || null; }, setItem(k,v) { this._data[k] = v; }, removeItem(k) { delete this._data[k]; }, get length() { return Object.keys(this._data).length; }, key(i) { return Object.keys(this._data)[i]; } },
  navigator: { languages: ['en'], language: 'en', vibrate: () => {} },
  window: { AudioContext: null, webkitAudioContext: null, matchMedia: () => ({ matches: false }) },
  document: {
    createElement: () => ({ textContent: '', innerHTML: '', className: '', style: {}, appendChild: () => {}, addEventListener: () => {}, classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false }, querySelector: () => null, querySelectorAll: () => [], getBoundingClientRect: () => ({left:0,top:0,width:100,height:100}), insertBefore: () => {}, get firstChild() { return null; } }),
    getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
    addEventListener: () => {},
    body: { appendChild: () => {}, style: { setProperty: () => {} }, classList: { add: () => {}, remove: () => {}, toggle: () => {} }, setAttribute: () => {} },
    head: { appendChild: () => {} },
    documentElement: { dir: 'ltr', lang: 'en' }
  },
  performance: { now: () => Date.now() },
  requestAnimationFrame: (cb) => 0,
  setInterval: () => 0,
  setTimeout: (cb, ms) => 0,
  console: console,
  passed: 0,
  failed: 0,
};

vm.createContext(sandbox);

// Load source files
for (const f of ['locales.js','card.js','player.js','ai.js','stats.js']) {
  vm.runInContext(fs.readFileSync(f, 'utf8'), sandbox, { filename: f });
}

// Run tests inside the sandbox
const testCode = `
function assert(cond, msg) {
  if (cond) { passed++; console.log('  ✅ ' + msg); }
  else { failed++; console.log('  ❌ ' + msg); }
}

// Test 1: Deck
console.log('\\n🃏 Deck Tests');
const deck = createDeck();
assert(deck.length === 52, 'Deck has 52 cards');
assert(deck.filter(c => c.isSpade).length === 13, '13 spades');
assert(deck.filter(c => c.suit === 'hearts').length === 13, '13 hearts');
const uniq = new Set(deck.map(c => c.suit + c.rank));
assert(uniq.size === 52, 'All unique');

// Test 2: Card
console.log('\\n🎴 Card Tests');
const as = new Card('spades', 'A');
assert(as.value === 14, 'Ace value 14');
assert(as.isSpade === true, 'Ace isSpade');
assert(as.displayName === 'A♠', 'Display name');
const th = new Card('hearts', '2');
assert(th.value === 2, '2 value');
assert(!th.isSpade, '2h not spade');
assert(as.equals(new Card('spades', 'A')), 'Equality');
assert(!as.equals(th), 'Inequality');

// Test 3: Shuffle
console.log('\\n🔀 Shuffle Tests');
const d1 = createDeck();
const d2 = [...d1];
shuffle(d2);
assert(d2.length === 52, 'Still 52');
let same = true;
for (let i = 0; i < 52; i++) { if (!d1[i].equals(d2[i])) { same = false; break; } }
assert(!same, 'Order changed');

// Test 4: Sort
console.log('\\n📋 Sort Tests');
const hand = [new Card('hearts','A'), new Card('spades','2'), new Card('clubs','K'), new Card('spades','A')];
sortHand(hand);
assert(hand[0].suit === 'spades' && hand[0].rank === 'A', 'A♠ first');
assert(hand[1].suit === 'spades' && hand[1].rank === '2', '2♠ second');
assert(hand[2].suit === 'hearts', 'Hearts after spades');
assert(hand[3].suit === 'clubs', 'Clubs last');

// Test 5: Player
console.log('\\n👤 Player Tests');
const p = new Player('Test', true, 0);
assert(p.bid === -1, 'Initial bid -1');
assert(!p.hasBid, 'hasBid false');
p.bid = 3;
assert(p.hasBid, 'hasBid true');
p.hand = [new Card('spades','A'), new Card('hearts','K'), new Card('hearts','2')];
const pl1 = p.getPlayableCards(null, false);
assert(pl1.length === 2, 'No spade lead when unbroken');
assert(pl1.every(c => !c.isSpade), 'All non-spade');
const pl2 = p.getPlayableCards(null, true);
assert(pl2.length === 3, 'All cards when broken');
const pl3 = p.getPlayableCards('hearts', false);
assert(pl3.length === 2, 'Follow hearts');
assert(pl3.every(c => c.suit === 'hearts'), 'All hearts');
const pl4 = p.getPlayableCards('diamonds', false);
assert(pl4.length === 3, 'Anything when void');

// Only spades left
const p2 = new Player('T2', true, 0);
p2.hand = [new Card('spades','A'), new Card('spades','K')];
assert(p2.getPlayableCards(null, false).length === 2, 'Lead spades when only spades');

// Nil/Blind Nil properties
const p3 = new Player('NilTest', false, 1);
assert(!p3.isNil, 'Not nil before bidding');
assert(!p3.nilBusted, 'Not busted before bidding');
p3.bid = 0;
assert(p3.isNil, 'isNil after bidding 0');
assert(!p3.nilBusted, 'Not busted with 0 tricks');
p3.tricks = 1;
assert(p3.nilBusted, 'Busted after winning a trick');
p3.blindNil = true;
assert(p3.blindNil, 'blindNil flag set');
p3.resetRound();
assert(!p3.isNil, 'Not nil after reset');
assert(!p3.blindNil, 'blindNil cleared after reset');

// Test 6: AI bidding
console.log('\\n🤖 AI Bid Tests');
const aiE = new AI('easy');
const aiH = new AI('hard');
const strongHand = [
  new Card('spades','A'), new Card('spades','K'), new Card('spades','Q'),
  new Card('hearts','A'), new Card('hearts','K'), new Card('hearts','5'),
  new Card('diamonds','A'), new Card('diamonds','7'), new Card('diamonds','3'),
  new Card('clubs','10'), new Card('clubs','8'), new Card('clubs','4'), new Card('clubs','2')
];
const bE = aiE.chooseBid(strongHand, -1, {});
assert(bE >= 1 && bE <= 13, 'Easy bid valid: ' + bE);
const bH = aiH.chooseBid(strongHand, -1, {});
assert(bH >= 1 && bH <= 13, 'Hard bid valid: ' + bH);
assert(bH >= 4, 'Hard bids 4+ with strong hand: ' + bH);

// Weak hand
const weakHand = [
  new Card('hearts','2'), new Card('hearts','3'), new Card('hearts','4'),
  new Card('diamonds','2'), new Card('diamonds','3'), new Card('diamonds','4'),
  new Card('clubs','2'), new Card('clubs','3'), new Card('clubs','4'),
  new Card('clubs','5'), new Card('clubs','6'), new Card('clubs','7'), new Card('clubs','8')
];
const bW = aiH.chooseBid(weakHand, -1, {});
assert(bW <= 3, 'Hard bids low with weak hand: ' + bW);

// Test 7: AI play
console.log('\\n🎯 AI Play Tests');
const ctx = { myBid: 3, myTricks: 1, partnerBid: 3, partnerTricks: 1 };
const ph = [new Card('hearts','A'), new Card('hearts','5'), new Card('spades','3')];
const c1 = aiH.chooseCard(ph, [new Card('hearts','K')], 'hearts', false, ctx);
assert(c1 !== null, 'AI chose card');
assert(c1.suit === 'hearts', 'AI follows suit');

const ph2 = [new Card('diamonds','2'), new Card('spades','A')];
const c2 = aiH.chooseCard(ph2, [new Card('diamonds','K')], 'diamonds', false, ctx);
assert(c2.suit === 'diamonds', 'AI follows diamond');

const ph3 = [new Card('spades','2'), new Card('clubs','3')];
const c3 = aiH.chooseCard(ph3, [new Card('hearts','A')], 'hearts', false, ctx);
assert(c3 !== null, 'AI plays when void');

// Test 8: Trick winner
console.log('\\n🏆 Trick Winner Tests');
const ai = new AI('hard');
const t1 = [new Card('hearts','K'), new Card('hearts','A'), new Card('hearts','3'), new Card('hearts','7')];
assert(ai._trickWinner(t1).equals(new Card('hearts','A')), 'Highest lead suit wins');

const t2 = [new Card('hearts','A'), new Card('diamonds','K'), new Card('spades','2'), new Card('hearts','3')];
assert(ai._trickWinner(t2).equals(new Card('spades','2')), 'Low spade beats ace');

const t3 = [new Card('hearts','K'), new Card('spades','5'), new Card('spades','A'), new Card('hearts','A')];
assert(ai._trickWinner(t3).equals(new Card('spades','A')), 'Highest spade wins');

const t4 = [new Card('clubs','3'), new Card('diamonds','A'), new Card('hearts','K'), new Card('clubs','2')];
assert(ai._trickWinner(t4).equals(new Card('clubs','3')), 'Lead suit wins when no spades');

// Off-suit doesn't beat lead
const t5 = [new Card('clubs','5'), new Card('hearts','A'), new Card('diamonds','A'), new Card('clubs','2')];
assert(ai._trickWinner(t5).equals(new Card('clubs','5')), 'Off-suit aces dont beat lead');

console.log('\\n' + '='.repeat(40));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
`;

vm.runInContext(testCode, sandbox);
process.exit(sandbox.failed > 0 ? 1 : 0);
