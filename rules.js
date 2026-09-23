/**
 * @file rules.js — The rules of Spades as pure functions: who wins a trick,
 * what a round scores, and when the game is over. No DOM, no state — the
 * game controller, the AI and the test suite all call these, so the rules
 * live in exactly one place.
 * @author Keith Adler
 * @copyright 2026 Keith Adler. MIT License.
 *
 * @dependency card.js ({@link Card})
 */

const NIL_BONUS = 100;
const BLIND_NIL_BONUS = 200;
const BAG_LIMIT = 10;       // every 10 bags...
const BAG_PENALTY = 100;    // ...costs 100 points
const MERCY_SCORE = -200;   // a side that falls to -200 loses

/**
 * Index (into `cards`) of the card that wins the trick. `cards` are in play
 * order, so cards[0] is the lead. Highest spade wins; otherwise the highest
 * card of the led suit. Off-suit non-spades can never win.
 */
function trickWinnerIndex(cards) {
  if (cards.length === 0) return -1;
  const leadSuit = cards[0].suit;
  let best = 0;
  for (let i = 1; i < cards.length; i++) {
    const c = cards[i], b = cards[best];
    if (c.isSpade && !b.isSpade) best = i;
    else if (c.suit === b.suit && (c.isSpade || c.suit === leadSuit) && c.value > b.value) best = i;
  }
  return best;
}

/** Nil / Blind Nil result for one player: +bonus if they took no tricks, else -bonus. */
function nilScore(p) {
  const bonus = p.blindNil ? BLIND_NIL_BONUS : NIL_BONUS;
  return p.tricks === 0 ? bonus : -bonus;
}

/**
 * Apply `newBags` to a running bag count. Each time the count reaches 10 it
 * rolls over and costs 100 points.
 * @returns {{bags:number, penalty:number}} new bag count and the (positive) penalty
 */
function addBags(bagCount, newBags) {
  let bags = bagCount + newBags, penalty = 0;
  while (bags >= BAG_LIMIT) { bags -= BAG_LIMIT; penalty += BAG_PENALTY; }
  return { bags, penalty };
}

/**
 * Score one partnership for a round (standard partnership rules):
 * - Nil / Blind Nil bidders score on their own (±100 / ±200).
 * - The other bids combine into the contract. Tricks taken by a nil bidder
 *   do NOT count toward it...
 * - ...but they DO count as bags for the partnership.
 * - Made: +10 per bid trick, +1 per overtrick (bag). Set: -10 per bid trick.
 * @param {{bid:number, tricks:number, blindNil:boolean}[]} members
 * @param {number} bagCount team's bags carried in from earlier rounds
 */
function scoreTeamRound(members, bagCount) {
  let nil = 0;
  for (const p of members) if (p.bid === 0) nil += nilScore(p);

  const contract = members.filter(p => p.bid > 0).reduce((s, p) => s + p.bid, 0);
  const won = members.filter(p => p.bid > 0).reduce((s, p) => s + p.tricks, 0);
  const nilTricks = members.filter(p => p.bid === 0).reduce((s, p) => s + p.tricks, 0);

  let base = 0, newBags = nilTricks;
  const made = contract > 0 && won >= contract;
  const set = contract > 0 && won < contract;
  if (made) { base = contract * 10; newBags += won - contract; }
  else if (set) base = -contract * 10;

  const b = addBags(bagCount, newBags);
  const total = base + newBags + nil - b.penalty;
  return { contract, won, made, set, base, nil, newBags, bags: b.bags, penalty: b.penalty, total };
}

/** Score one cutthroat (every player for themselves) player for a round. */
function scoreSoloRound(p, bagCount) {
  if (p.bid === 0) {
    // A busted nil's tricks are still overtricks nobody bid for — bags.
    const b = addBags(bagCount, p.tricks);
    const nil = nilScore(p);
    return { contract: 0, won: 0, made: false, set: false, base: 0, nil, newBags: p.tricks, bags: b.bags, penalty: b.penalty, total: nil + p.tricks - b.penalty };
  }
  const made = p.tricks >= p.bid;
  const newBags = made ? p.tricks - p.bid : 0;
  const base = made ? p.bid * 10 : -p.bid * 10;
  const b = addBags(bagCount, newBags);
  return { contract: p.bid, won: p.tricks, made, set: !made, base, nil: 0, newBags, bags: b.bags, penalty: b.penalty, total: base + newBags - b.penalty };
}

/**
 * Is the game over, and who won? Sides are teams (partnership) or players
 * (cutthroat), given as an array of scores.
 * - The game ends when a side reaches the target, or falls to -200.
 * - The highest score wins. If two or more sides reach the target together,
 *   the higher score wins.
 * - A tie for first place is not a finish: play another hand.
 * @returns {{over:boolean, winner:number}} winner is the side index, -1 if not over
 */
function gameOutcome(scores, target) {
  const triggered = scores.some(s => s >= target || s <= MERCY_SCORE);
  if (!triggered) return { over: false, winner: -1 };
  const top = Math.max(...scores);
  const leaders = scores.map((s, i) => (s === top ? i : -1)).filter(i => i >= 0);
  if (leaders.length > 1) return { over: false, winner: -1 };
  return { over: true, winner: leaders[0] };
}

/**
 * House rules a table can switch on or off.
 * - nil / blindNil: whether those bids are allowed at all
 * - minTeamBid: the "board" — a partnership must bid at least this many
 *   tricks between them (0 = no minimum). Partnership mode only.
 * - jokers: Jokers & Deuces deck (see card.js createDeck)
 */
const DEFAULT_HOUSE_RULES = { nil: true, blindNil: true, minTeamBid: 0, jokers: false };

/**
 * What a player may bid, given the house rules and their partner's bid
 * (-1 if partner hasn't bid yet). The second partner to bid must bring the
 * team up to the board; Nil is only allowed if partner already covered it.
 * @returns {{minBid:number, allowNil:boolean}}
 */
function bidLimits(rules, teamMode, partnerBid) {
  const r = Object.assign({}, DEFAULT_HOUSE_RULES, rules);
  if (!teamMode || !r.minTeamBid || partnerBid < 0) return { minBid: 1, allowNil: r.nil };
  const need = r.minTeamBid - partnerBid;
  return { minBid: Math.max(1, need), allowNil: r.nil && need <= 0 };
}

if (typeof module !== 'undefined') {
  module.exports = { trickWinnerIndex, bidLimits, DEFAULT_HOUSE_RULES, nilScore, addBags, scoreTeamRound, scoreSoloRound, gameOutcome,
    NIL_BONUS, BLIND_NIL_BONUS, BAG_LIMIT, BAG_PENALTY, MERCY_SCORE };
}
