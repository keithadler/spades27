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
for (const f of ['locales.js','card.js','player.js','rules.js','ai.js','stats.js']) {
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

// Test 9: Rules — trick winner (rules.js)
console.log('\\n📜 Rules: Trick Winner');
const C = (r, su) => new Card(su, r);
assert(trickWinnerIndex([C('7','hearts'), C('K','diamonds'), C('3','spades'), C('A','hearts')]) === 2, 'Any spade trumps the led suit');
assert(trickWinnerIndex([C('2','clubs'), C('A','hearts'), C('A','diamonds'), C('3','clubs')]) === 3, 'Off-suit aces never win');
assert(trickWinnerIndex([C('Q','spades'), C('K','spades'), C('2','spades'), C('A','hearts')]) === 1, 'Spade lead: highest spade');
assert(trickWinnerIndex([C('5','diamonds')]) === 0, 'Single card leads and wins');

// Test 10: Rules — partnership scoring
console.log('\\n🧮 Rules: Partnership Scoring');
const P = (bid, tricks, blindNil) => ({ bid, tricks, blindNil: !!blindNil });
let r = scoreTeamRound([P(4,4), P(3,3)], 0);
assert(r.total === 70 && r.made && r.newBags === 0, 'Made 7 exactly: +70');
r = scoreTeamRound([P(4,6), P(3,3)], 0);
assert(r.total === 72 && r.newBags === 2, 'Made 7 with 9 tricks: +72, 2 bags');
r = scoreTeamRound([P(4,5), P(3,1)], 0);
assert(r.total === -70 && r.set, 'Team 6 of 7 is set: -70');
r = scoreTeamRound([P(4,6), P(3,1)], 0);
assert(r.total === 70 && r.made, 'Partner carries the shared contract: 6+1 = 7, +70');
r = scoreTeamRound([P(0,0), P(4,5)], 0);
assert(r.total === 100 + 40 + 1, 'Nil made + partner makes 4 with a bag: +141');
r = scoreTeamRound([P(0,2), P(4,3)], 0);
assert(r.set && r.total === -100 - 40 + 2, 'Busted nil tricks do not count toward the bid, but are bags: -138');
r = scoreTeamRound([P(0,0,true), P(3,3)], 0);
assert(r.total === 230, 'Blind nil made: +200 on top of the contract');
r = scoreTeamRound([P(0,1,true), P(3,3)], 0);
assert(r.total === -200 + 30 + 1, 'Blind nil busted: -200');
r = scoreTeamRound([P(0,0), P(0,13)], 0);
assert(r.total === 100 - 100 + 13 - 100 && r.contract === 0 && r.bags === 3, 'Double nil, one busted: nils cancel, 13 bags trigger the penalty');
r = scoreTeamRound([P(3,5), P(3,3)], 8);
assert(r.bags === 0 && r.penalty === 100 && r.total === 60 + 2 - 100, 'Reaching 10 bags costs 100 and rolls over');
r = scoreTeamRound([P(3,8), P(3,5)], 5);
assert(r.bags === 2 && r.penalty === 100, '5 + 7 bags = 12 -> one penalty, 2 carried');

// Test 11: Rules — cutthroat scoring
console.log('\\n🔪 Rules: Cutthroat Scoring');
assert(scoreSoloRound(P(3,4), 0).total === 31, 'Solo made with a bag: +31');
assert(scoreSoloRound(P(3,2), 0).total === -30, 'Solo set: -30');
assert(scoreSoloRound(P(0,0), 0).total === 100, 'Solo nil made: +100');
const sn = scoreSoloRound(P(0,2), 0);
assert(sn.total === -98 && sn.newBags === 2, 'Solo busted nil: -100, tricks are bags');

// Test 12: Rules — game end
console.log('\\n🏁 Rules: Game End');
assert(!gameOutcome([480, 300], 500).over, 'Nobody at target: keep playing');
assert(gameOutcome([510, 300], 500).winner === 0, 'Reach 500 first: win');
assert(gameOutcome([520, 540], 500).winner === 1, 'Both past 500: higher score wins');
assert(!gameOutcome([530, 530], 500).over, 'Tied past 500: play another hand');
assert(gameOutcome([-200, 150], 500).winner === 1, 'Falling to -200 loses');
assert(gameOutcome([100, 510, 90, -20], 500).winner === 1, 'Cutthroat: first to target wins');
assert(!gameOutcome([510, 510, 0, 0], 500).over, 'Cutthroat tie for first: play on');

// Test 13: AI bidding rules
console.log('\\n🙈 AI Nil & Blind Nil');
const aiM = new AI('medium');
assert(!aiH.chooseBlindNil(5, { teamMode: true, myScore: 200, oppScore: 250, target: 500 }), 'No blind nil when down < 100');
let blindWeakPartner = 0;
for (let i = 0; i < 500; i++) if (aiH.chooseBlindNil(2, { teamMode: true, myScore: 0, oppScore: 450, target: 500 })) blindWeakPartner++;
assert(blindWeakPartner === 0, 'No blind nil unless partner bid 4+');
assert(!aiH.chooseBlindNil(0, { teamMode: true, myScore: 0, oppScore: 450, target: 500 }), 'No blind nil next to a partner nil');
assert(!aiE.chooseBlindNil(-1, { teamMode: true, myScore: 0, oppScore: 450, target: 500 }), 'Easy AI never goes blind');
assert(!aiH.chooseBlindNil(-1, { teamMode: false, myScore: 0, oppScore: 450, target: 500 }), 'No blind nil in cutthroat');
let blinds = 0;
for (let i = 0; i < 2000; i++) if (aiH.chooseBlindNil(5, { teamMode: true, myScore: 0, oppScore: 450, target: 500 })) blinds++;
assert(blinds > 0 && blinds < 400, 'Hard AI sometimes goes blind when far behind: ' + blinds + '/2000');
let nilWithPartnerNil = 0;
for (let i = 0; i < 200; i++) if (aiH.chooseBid(weakHand, 0, { teamMode: true }) === 0) nilWithPartnerNil++;
assert(nilWithPartnerNil === 0, 'Never nil when partner already bid nil');
let medNils = 0;
for (let i = 0; i < 400; i++) if (aiM.chooseBid(weakHand, -1, { teamMode: true }) === 0) medNils++;
assert(medNils > 0, 'Medium AI bids nil on a hopeless hand sometimes: ' + medNils + '/400');
const monster = ['A','K','Q','J','10','9','8','7'].map(rk => C(rk,'spades')).concat([C('A','hearts'), C('K','hearts'), C('A','diamonds'), C('A','clubs'), C('K','clubs')]);
const mb = aiH.chooseBid(monster, -1, { teamMode: false });
assert(mb >= 10 && mb <= 13, 'Monster hand can bid 10+: ' + mb);

// Test 14: House rules — Jokers & Deuces
console.log('\\n🃏 House Rules: Jokers & Deuces');
const jd = createDeck(true);
assert(jd.length === 52, 'Jokers deck still has 52 cards');
assert(jd.filter(c => c.isSpade).length === 16, '16 trumps: 13 spades - 2♠ + 2♠/2♦ promoted + 2 jokers');
assert(!jd.some(c => c.suit === 'clubs' && c.rank === '2') && !jd.some(c => c.suit === 'hearts' && c.rank === '2'), '2♣ and 2♥ are out');
assert(jd.filter(c => c.suit === 'diamonds').length === 12, 'Diamonds: 12 (the 2♦ plays as a spade)');
const BJ = new Card('spades','BJ'), LJ = new Card('spades','LJ'), D2 = new Card('spades','2D'), S2 = new Card('spades','2S');
assert(trickWinnerIndex([C('A','spades'), S2, D2, LJ]) === 3, 'Little Joker beats 2♦, 2♠, A♠');
assert(trickWinnerIndex([LJ, BJ, D2, S2]) === 1, 'Big Joker is the top trump');
assert(trickWinnerIndex([C('A','diamonds'), D2, C('K','diamonds'), C('3','diamonds')]) === 1, 'The 2♦ trumps a diamond lead');
const pj = new Player('J', true, 0);
pj.hand = [D2, C('9','clubs')];
assert(pj.getPlayableCards('diamonds', false).length === 2, 'Holding only the 2♦, you are void in diamonds');
assert(pj.getPlayableCards('spades', true).length === 1 && pj.getPlayableCards('spades', true)[0].rank === '2D', 'The 2♦ must follow a spade lead');
assert(D2.faceSuit === 'diamonds' && D2.faceRank === '2' && D2.displayName === '2♦', '2♦ still looks like a diamond');

// Test 15: House rules — board and Nil switches
console.log('\\n📏 House Rules: Board & Nil');
const board = { minTeamBid: 4 };
let lim = bidLimits(board, true, -1);
assert(lim.minBid === 1 && lim.allowNil, 'First partner: no minimum yet');
lim = bidLimits(board, true, 1);
assert(lim.minBid === 3 && !lim.allowNil, 'Partner bid 1: you must bid 3+, no Nil');
lim = bidLimits(board, true, 0);
assert(lim.minBid === 4 && !lim.allowNil, 'Partner bid Nil: you must carry the board alone');
lim = bidLimits(board, true, 5);
assert(lim.minBid === 1 && lim.allowNil, 'Partner covered the board: Nil is fine');
assert(bidLimits(board, false, -1).minBid === 1, 'No board in cutthroat');
assert(!bidLimits({ nil: false }, true, -1).allowNil, 'Nil switched off');
let okBoard = true, noNil = true;
for (let i = 0; i < 300; i++) {
  if (aiH.chooseBid(weakHand, 1, { teamMode: true, minBid: 3, allowNil: false }) < 3) okBoard = false;
  if (aiH.chooseBid(weakHand, -1, { teamMode: true, allowNil: false }) === 0) noNil = false;
}
assert(okBoard, 'AI meets the board minimum');
assert(noNil, 'AI never bids Nil when it is off');
let blindOff = 0;
for (let i = 0; i < 500; i++) if (aiH.chooseBlindNil(-1, { teamMode: true, myScore: 0, oppScore: 450, target: 500, allowBlindNil: false })) blindOff++;
assert(blindOff === 0, 'AI never goes Blind Nil when it is off');

// Test 16: House rules — losing floor
console.log('\\n🧱 House Rules: Losing Floor');
assert(gameOutcome([-200, 100], 500).over, 'Default floor: -200 loses');
assert(!gameOutcome([-300, 100], 500, -500).over, 'Floor -500: -300 plays on');
assert(gameOutcome([-510, 100], 500, -500).winner === 1, 'Floor -500: -510 loses');
assert(!gameOutcome([-900, 100], 500, null).over, 'No floor: play on to the target');

console.log('\\n' + '='.repeat(40));
console.log('Results: ' + passed + ' passed, ' + failed + ' failed');
`;

vm.runInContext(testCode, sandbox);
process.exit(sandbox.failed > 0 ? 1 : 0);
