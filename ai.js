/**
 * @file ai.js — AI opponent logic for Spades 27.
 * @author Keith Adler
 * @copyright 2026 Keith Adler. MIT License.
 *
 * HOW THE AI WORKS (plain English)
 * ================================
 *
 * The AI has two jobs: BIDDING (predicting how many tricks it will
 * win before the round starts) and PLAYING (choosing which card to
 * play on each of the 13 tricks). Both get smarter with difficulty.
 *
 *
 * DIFFICULTY LEVELS
 * -----------------
 *
 *   EASY — Bids by counting aces and high spades, adds some randomness.
 *          Plays like a real beginner: always leads their highest card
 *          (wasting winners early), follows with the highest card of
 *          the lead suit, and 30% of the time picks randomly. No
 *          awareness of bags, partner, or strategy. Feels like playing
 *          against someone who just learned the rules.
 *
 *   MEDIUM — Uses the full bidding algorithm but occasionally underbids
 *            by 1 (30% chance). Scores every legal play with the full
 *            7-factor heuristic system, then picks from the top 3
 *            scored cards with weighted randomness (5:3:1 odds). This
 *            means it usually makes the right play but sometimes picks
 *            the 2nd or 3rd best option. Good enough to be competitive
 *            but makes enough mistakes to feel beatable.
 *
 *   HARD — Full bidding algorithm with zero randomness. Always picks
 *          the single highest-scoring card. Full partner awareness,
 *          nil protection, nil busting, bag avoidance, and bag warfare.
 *          Plays like an experienced Spades player.
 *
 *
 * =========================================================================
 * BIDDING — "How many tricks will I win this round?"
 * =========================================================================
 *
 * Bidding is the most important decision in Spades. The consequences:
 *   - Make your bid → +bid×10 points (great!)
 *   - Miss your bid → -bid×10 points (disaster!)
 *   - Win extra tricks → +1 each, but they're "bags" (10 bags = -100)
 *
 * Because missing your bid is 10x worse than getting a bag, the AI
 * deliberately UNDERCOUNTS its expected tricks. It uses Math.floor()
 * instead of Math.round(), so 3.8 expected tricks becomes a bid of 3,
 * not 4. One extra bag (+1 point) is far better than getting set (-30).
 *
 * The AI counts expected tricks from three sources:
 *
 *   1. SPADE TRICKS (trump cards)
 *      Spades beat everything, so high spades are near-guaranteed wins.
 *      The AI sorts its spades highest-first and counts top-down:
 *
 *        A♠ at position 0 → 1.0 tricks (always wins, it's the best card)
 *        K♠ at position 1 → 1.0 tricks (wins because A♠ draws out
 *            opponents' aces first, so K♠ is safe)
 *        Q♠ at position 2 → 1.0 tricks (A♠ and K♠ clear the way)
 *        J♠ or Q♠ without full support → 0.4 tricks (might win, risky)
 *
 *      Key insight: K♠ is worth 1.0 if you ALSO have A♠ (because your
 *      ace draws out their ace first). But K♠ alone is only worth ~0.4
 *      because someone else might have A♠.
 *
 *   2. SIDE SUIT WINNERS (non-spade high cards)
 *      Aces and kings of hearts/diamonds/clubs can win tricks too, but
 *      they're less reliable because opponents might be void and trump.
 *
 *        A♥ = 0.85 tricks (usually wins, but ~15% chance someone ruffs)
 *        K♥ with A♥ and 3+ hearts = 0.6 tricks (ace clears the way,
 *            length protects the king from being played too early)
 *        K♥ without ace, 3+ hearts = 0.35 tricks (risky — ace is out)
 *        Q♥ with A♥, K♥, and 4+ hearts = 0.3 tricks (needs both gone)
 *
 *      Why does SUIT LENGTH matter? If you have K♥ but only 1 heart,
 *      you must play it on the first heart trick — and the A♥ is
 *      probably still out there, beating your king. With 4 hearts,
 *      the ace gets played on an earlier trick, so your king survives.
 *
 *   3. RUFFING POTENTIAL (void suits)
 *      If you have ZERO cards in a suit, you can play a spade when
 *      that suit is led — this is called "ruffing" or "trumping."
 *      Each void is worth ~0.5 extra tricks IF you have spare spades
 *      (spades beyond what you already counted as spade tricks).
 *
 *      Singletons (1 card in a suit) get 0.3 credit because after
 *      one trick in that suit, you'll be void and can ruff.
 *
 * TEAM AWARENESS IN BIDDING:
 *   If your partner already bid, the AI caps the team total at 10.
 *   Bidding 11+ as a team means you need almost every trick — too risky.
 *
 * BAG-AWARE BIDDING:
 *   If the team has 7+ bags (close to the -100 penalty at 10), the AI
 *   bids 1 less as a safety buffer.
 *
 * NIL BIDS (Hard only):
 *   If the hand is truly terrible (≤0.5 expected tricks, at most 1
 *   spade, no card above 9), bidding Nil is better than bidding 1.
 *   Nil success = +100, failure = -100. Worth the gamble with garbage.
 *
 *
 * =========================================================================
 * CARD PLAY — "Which card should I play?"
 * =========================================================================
 *
 * Every legal card gets a SCORE. Higher = better play. The AI picks
 * the highest-scoring card (Hard) or weighted-random from top 3 (Medium).
 *
 * The score comes from 7 STRATEGY FACTORS:
 *
 *   FACTOR 1: LEADING (starting a new trick)
 *   ─────────────────────────────────────────
 *   You choose the suit everyone must follow. Four modes:
 *
 *   a) PARTNER BID NIL → Lead HIGH (+14 for aces, +10 for kings).
 *      Win the trick yourself so partner doesn't accidentally win.
 *      Prefer long suits for sustained control.
 *
 *   b) I NEED TRICKS → Lead aggressively. Aces first (+8), kings (+3),
 *      long suits (+3). Draw trump with high spades if you have 4+.
 *
 *   c) I MADE MY BID → HARD DUCK. Lead absolute lowest cards (2.0x
 *      low preference). Never lead aces (-15), kings (-15), face
 *      cards (-6), or spades (-12). Every trick is now a bag.
 *
 *   d) (Same as c but for team-made-bid in team mode)
 *
 *   FACTOR 2: FOLLOWING — I CAN WIN THIS TRICK
 *   ────────────────────────────────────────────
 *   a) PARTNER BID NIL → Always win (+14). Protect partner.
 *
 *   b) I NEED TRICKS → Win it (+10), but cheaply. Prefer lower
 *      winning cards (-0.3 per rank). Don't trump unnecessarily (-4).
 *
 *   c) I MADE MY BID → HARD DUCK (-15 for winning, -10 for spades).
 *      Only exception: you're the last player, partner already played
 *      and is losing, partner needs tricks, and there aren't enough
 *      tricks left. Then reluctantly help (+18 override).
 *
 *   FACTOR 3: FOLLOWING — I CAN'T WIN THIS TRICK
 *   ──────────────────────────────────────────────
 *   Nothing you play will take this trick. What to throw away?
 *
 *   a) I MADE MY BID → Dump HIGH cards (+0.6 per rank) and spades (+4).
 *      Get rid of future winners so you can't accidentally win later.
 *
 *   b) I NEED TRICKS → Dump LOW cards (+0.5 per low rank). Save high
 *      cards and spades (+2) for tricks where they matter.
 *
 *   FACTOR 4: PARTNER AWARENESS (Hard only, team mode)
 *   ──────────────────────────────────────────────────
 *   Uses actual trick position (not assumed index) to find partner's card.
 *
 *   - Partner winning + partner bid nil → MUST overtake (+20). Save nil.
 *   - Partner winning + I don't need tricks → Play lowest (1.2x low pref)
 *   - Partner winning + I need tricks → Still play low (0.5x), save cards
 *
 *   FACTOR 5: NIL PROTECTION (team mode)
 *   ─────────────────────────────────────
 *   If partner bid Nil, prefer winning (+10) to take tricks away from them.
 *
 *   FACTOR 6: NIL BUSTING
 *   ──────────────────────
 *   If an OPPONENT bid Nil and hasn't busted:
 *   - Leading: Lead LOW (1.2x) in short suits (+5/+4). Avoid aces (-8).
 *     Low spades (+6) can catch nil bidders with high spades.
 *   - Following: If nil bidder is winning, duck UNDER them (+15 for not
 *     winning, -12 for winning). Let them take the trick = bust!
 *
 *   FACTOR 7: BAG WARFARE (team mode)
 *   ──────────────────────────────────
 *   - Opponents made their bid → Force bags. Lead high (+6), win tricks (+4).
 *   - Our team made bid → Extra bag avoidance (-5 for winning).
 *
 *
 * FFA / CUTTHROAT MODE
 * ────────────────────
 * All partner logic (Factors 4, 5, 7) is disabled. No nil protection,
 * no partner awareness, no team bag tracking. Pure individual play:
 * win your bid, avoid your own bags, bust opponent nils.
 *
 *
 * TRICK WINNER RULES
 * ──────────────────
 * 1. If any SPADE was played → highest spade wins (trump).
 * 2. If no spades → highest card of the LEAD SUIT wins.
 * 3. Off-suit non-spade cards can NEVER win.
 *
 * Example: Lead 7♥. Cards: 7♥, K♦, 3♠, A♥
 *   K♦ can't win (wrong suit, not spade)
 *   A♥ would win (highest heart) BUT 3♠ trumps it.
 *   Winner: 3♠ — even the lowest spade beats the highest non-spade.
 *
 * @dependency card.js ({@link Card})
 */

class AI {
  constructor(difficulty) {
    this.difficulty = difficulty;
  }

  // =========================================================================
  // BIDDING
  // =========================================================================

  chooseBid(hand, partnerBid, ctx) {
    const spades = hand.filter(c => c.isSpade);

    // ----- EASY: Simple heuristic + randomness -----
    if (this.difficulty === 'easy') {
      const aces = hand.filter(c => c.value === 14).length;
      const highSpades = spades.filter(c => c.value >= 12).length;
      const kings = hand.filter(c => c.value === 13 && !c.isSpade).length;
      let bid = aces + highSpades + Math.floor(kings * 0.5);
      bid += Math.floor(Math.random() * 2);
      return Math.max(1, Math.min(bid, 7));
    }

    // ----- MEDIUM / HARD: Balanced trick counting -----
    let tricks = 0;

    // Spade tricks — top-down
    const spadesSorted = [...spades].sort((a, b) => b.value - a.value);
    for (let i = 0; i < spadesSorted.length && i < 5; i++) {
      if (spadesSorted[i].value >= 14 - i) {
        tricks += 1;       // A, K+A, Q+AK — sure winners
      } else if (spadesSorted[i].value >= 11 && i < 2) {
        tricks += 0.5;     // J or Q near top — probable winner
      }
    }

    // Side suit winners
    for (const suit of ['hearts', 'diamonds', 'clubs']) {
      const suited = hand.filter(c => c.suit === suit).sort((a, b) => b.value - a.value);

      if (suited.length === 0) {
        // Void — ruffing potential with spare spades
        const spareSpades = Math.max(0, spades.length - Math.ceil(tricks));
        if (spareSpades > 0) tricks += 0.6;
        continue;
      }

      // Ace: 0.95 (very reliable, ruffing is rare in early tricks)
      if (suited[0].value === 14) tricks += 0.95;

      // King: depends on ace support and length
      const hasAce = suited[0].value === 14;
      const hasKing = suited.some(c => c.value === 13);
      if (hasKing && suited.length >= 2) tricks += hasAce ? 0.7 : 0.45;

      // Queen: needs some support
      const hasQueen = suited.some(c => c.value === 12);
      if (hasQueen && suited.length >= 3) tricks += (hasAce || hasKing) ? 0.4 : 0.2;

      // Singleton ruffing
      if (suited.length === 1 && spades.length > Math.ceil(tricks)) tricks += 0.35;
      // Doubleton: slight ruffing potential
      if (suited.length === 2 && spades.length > Math.ceil(tricks) + 1) tricks += 0.15;
    }

    // FLOOR — prefer underbidding by a fraction, not a whole trick
    let bid = Math.floor(tricks);

    // Medium: 20% chance to underbid by 1 (was 30% — too aggressive)
    if (this.difficulty === 'medium') {
      if (Math.random() > 0.8) bid -= 1;
    }

    // Bag-aware: if team has 7+ bags, bid 1 less
    if (ctx && ctx.teamBags >= 7 && bid > 2) bid -= 1;

    // Team overbid cap at 10
    if (partnerBid >= 0) {
      const teamTotal = partnerBid + bid;
      if (teamTotal > 10 && this.difficulty !== 'easy') {
        bid = Math.max(1, 10 - partnerBid);
      }
    }

    // Nil consideration (Hard only)
    if (this.difficulty === 'hard' && tricks <= 0.5 && spades.length <= 1) {
      if (hand.every(c => c.value <= 9) && Math.random() > 0.5) return 0;
    }

    return Math.max(1, Math.min(bid, 8));
  }

  // =========================================================================
  // CARD PLAY
  // =========================================================================

  chooseCard(hand, trick, leadSuit, spadesBroken, ctx) {
    const playable = this._getPlayable(hand, leadSuit, spadesBroken);
    if (playable.length === 0) return null;
    if (playable.length === 1) return playable[0];

    // ----- EASY: Not random — plays "badly but legally" -----
    // Follows suit, prefers high cards (wastes winners), doesn't
    // think about bags or partner. Feels like a beginner.
    if (this.difficulty === 'easy') {
      if (!leadSuit) {
        // Leading: pick highest non-spade, or highest spade
        const nonSpades = playable.filter(c => !c.isSpade);
        const pool = nonSpades.length > 0 ? nonSpades : playable;
        pool.sort((a, b) => b.value - a.value);
        // 70% play highest, 30% random
        return Math.random() > 0.3 ? pool[0] : pool[Math.floor(Math.random() * pool.length)];
      }
      // Following: play highest of suit (wastes winners), or random off-suit
      playable.sort((a, b) => b.value - a.value);
      return Math.random() > 0.2 ? playable[0] : playable[Math.floor(Math.random() * playable.length)];
    }

    // ----- MEDIUM / HARD: Full heuristic scoring -----
    const isLeading = trick.length === 0;
    const isLast = trick.length === 3;
    const isFFA = !ctx || !ctx.teamMode;

    // Figure out if partner has played (team mode only)
    // Partner is (myIndex + 2) % 4. In the trick array, find their position.
    let partnerPlayed = false;
    let partnerTrickIdx = -1;
    if (!isFFA && ctx && ctx.trickPlayers && ctx.myIndex !== undefined) {
      const partnerIndex = (ctx.myIndex + 2) % 4;
      partnerTrickIdx = ctx.trickPlayers.indexOf(partnerIndex);
      partnerPlayed = partnerTrickIdx >= 0;
    }

    // Bid progress
    let iNeedTricks = true;
    let iMadeBid = false;
    let partnerNeedsTricks = false;
    let partnerIsNil = false;
    let teamMadeBid = false;
    let tricksLeft = 13;

    if (ctx) {
      iNeedTricks = ctx.myBid > 0 && ctx.myTricks < ctx.myBid;
      iMadeBid = ctx.myBid > 0 && ctx.myTricks >= ctx.myBid;

      if (!isFFA) {
        partnerNeedsTricks = ctx.partnerBid > 0 && ctx.partnerTricks < ctx.partnerBid;
        partnerIsNil = ctx.partnerBid === 0;
      }

      if (ctx.allPlayers) {
        const total = ctx.allPlayers.reduce((s, p) => s + p.tricks, 0);
        tricksLeft = 13 - total;
        if (!isFFA) {
          const myTeam = ctx.allPlayers.filter(p => p.team === ctx.myTeam);
          const tBid = myTeam.filter(p => p.bid > 0).reduce((s, p) => s + p.bid, 0);
          const tTricks = myTeam.reduce((s, p) => s + p.tricks, 0);
          teamMadeBid = tBid > 0 && tTricks >= tBid;
        } else {
          teamMadeBid = iMadeBid;
        }
      }
    }

    const scored = playable.map(card => {
      let score = 0;
      const wouldWin = this._wouldWin(card, trick, leadSuit);

      // Determine if we should be in duck mode:
      // Duck when I've made MY bid OR when the TEAM has made the combined bid
      // EXCEPTION: NEVER duck when partner bid nil — nil protection is #1 priority
      const shouldDuck = (iMadeBid || teamMadeBid) && !partnerIsNil;

      // ===== FACTOR 1: LEADING =====
      if (isLeading) {
        if (partnerIsNil && !isFFA) {
          // Protect nil partner — lead high to win ourselves
          if (!card.isSpade) {
            if (card.value === 14) score += 14;
            else if (card.value === 13) score += 10;
            else if (card.value >= 10) score += 3;
            else score -= 3;
            if (hand.filter(c => c.suit === card.suit).length >= 4) score += 4;
          } else {
            score += card.value >= 12 ? 4 : -5;
          }
        } else if (iNeedTricks && !teamMadeBid) {
          // Aggressive — lead winners (but not if team already done)
          if (!card.isSpade) {
            score += card.value * 0.5;
            if (card.value === 14) score += 8;
            if (card.value === 13) score += 3;
            if (hand.filter(c => c.suit === card.suit).length >= 4) score += 3;
          } else {
            const n = hand.filter(c => c.isSpade).length;
            score += (n >= 4 && card.value >= 12) ? 5 : -4;
          }
        } else if (shouldDuck) {
          // DUCK MODE — lead absolute lowest
          score += (14 - card.value) * 2.0;
          if (card.value >= 13) score -= 15;
          if (card.value >= 10) score -= 6;
          if (card.isSpade) score -= 12;
        }
      }

      // ===== FACTOR 2: FOLLOWING — CAN WIN =====
      else if (wouldWin) {
        if (partnerIsNil && !isFFA) {
          score += 14; // Always win to protect nil partner
          score -= card.value * 0.2;
        } else if (iNeedTricks && !teamMadeBid) {
          score += 10;
          score -= card.value * 0.3; // Win cheaply
          if (card.isSpade && leadSuit !== 'spades') score -= 4;
        } else if (shouldDuck) {
          // HARD DUCK — almost never win
          score -= 15;
          if (card.isSpade) score -= 10;
          // Only exception: last player and partner is losing badly
          if (isLast && !isFFA && partnerPlayed) {
            const pCard = partnerTrickIdx >= 0 ? trick[partnerTrickIdx] : null;
            if (pCard && !this._isWinning(pCard, trick, leadSuit) && partnerNeedsTricks && tricksLeft <= (ctx.partnerBid - ctx.partnerTricks)) {
              score += 18; // Override duck — desperate help
            }
          }
        }
      }

      // ===== FACTOR 3: FOLLOWING — CAN'T WIN =====
      else {
        if (shouldDuck && !partnerIsNil) {
          // Dump HIGH cards and spades to avoid future wins
          score += card.value * 0.6;
          if (card.isSpade) score += 4;
        } else {
          // Save high cards, dump low
          score += (14 - card.value) * 0.5;
          if (!card.isSpade) score += 2;
        }
      }

      // ===== FACTOR 4: PARTNER AWARENESS (Hard, team only) =====
      if (this.difficulty === 'hard' && !isFFA && partnerPlayed && partnerTrickIdx >= 0) {
        const pCard = trick[partnerTrickIdx];
        if (pCard && this._isWinning(pCard, trick, leadSuit)) {
          if (partnerIsNil) {
            // Partner nil and winning — MUST overtake!
            if (wouldWin) score += 20;
            else score -= 5;
          } else if (!iNeedTricks) {
            // Partner winning, I don't need tricks — play lowest
            score += (14 - card.value) * 1.2;
          } else {
            // Partner winning, I need tricks — still play low (save for later)
            score += (14 - card.value) * 0.5;
          }
        }
      }

      // ===== FACTOR 5: NIL PROTECTION (team only) =====
      if (!isFFA && ctx && ctx.partnerBid === 0 && wouldWin) {
        score += 10;
      }

      // ===== FACTOR 6: NIL BUSTING =====
      if (ctx && ctx.opponentNils && ctx.opponentNils.length > 0) {
        if (isLeading) {
          if (!card.isSpade) {
            score += (14 - card.value) * 1.2; // Lead LOW
            const sc = hand.filter(c => c.suit === card.suit).length;
            if (sc <= 2) score += 5;
            if (sc === 1) score += 4;
            if (card.value >= 13) score -= 8;
          } else {
            score += card.value <= 8 ? 6 : -3;
          }
        }
        if (!isLeading && ctx.trickPlayers) {
          let nilCard = null;
          for (let ti = 0; ti < trick.length; ti++) {
            if (ctx.opponentNils.includes(ctx.trickPlayers[ti])) {
              nilCard = trick[ti]; break;
            }
          }
          if (nilCard && this._isWinning(nilCard, trick, leadSuit)) {
            // Nil bidder winning — duck under them!
            if (!wouldWin) score += 15;
            else score -= 12;
          }
        }
      }

      // ===== FACTOR 7: BAG WARFARE (team only) =====
      if (!isFFA && ctx && ctx.allPlayers) {
        const oppTricks = ctx.allPlayers.filter(p => p.team !== ctx.myTeam).reduce((s, p) => s + p.tricks, 0);
        const oppBid = ctx.allPlayers.filter(p => p.team !== ctx.myTeam && p.bid > 0).reduce((s, p) => s + p.bid, 0);
        if (oppTricks >= oppBid && oppBid > 0) {
          // Opponents made bid — force bags
          if (isLeading && card.value >= 12) score += 6;
          if (wouldWin && !teamMadeBid) score += 4;
        }
        if (teamMadeBid && wouldWin) score -= 5;
      }

      return { card, score };
    });

    scored.sort((a, b) => b.score - a.score);

    // MEDIUM: pick from top 3 with weighted randomness
    if (this.difficulty === 'medium') {
      const top = scored.slice(0, Math.min(3, scored.length));
      const weights = [5, 3, 1];
      const totalW = weights.slice(0, top.length).reduce((a, b) => a + b, 0);
      let r = Math.random() * totalW;
      for (let i = 0; i < top.length; i++) {
        r -= weights[i];
        if (r <= 0) return top[i].card;
      }
      return top[0].card;
    }

    return scored[0].card;
  }

  // =========================================================================
  // HELPERS
  // =========================================================================

  _getPlayable(hand, leadSuit, spadesBroken) {
    if (!leadSuit) {
      if (spadesBroken || hand.every(c => c.isSpade)) return [...hand];
      return hand.filter(c => !c.isSpade);
    }
    const suited = hand.filter(c => c.suit === leadSuit);
    return suited.length > 0 ? suited : [...hand];
  }

  _trickWinner(trick) {
    if (trick.length === 0) return null;
    let best = trick[0];
    const leadSuit = trick[0].suit;
    for (let i = 1; i < trick.length; i++) {
      const c = trick[i];
      if (c.isSpade && !best.isSpade) best = c;
      else if (c.isSpade && best.isSpade && c.value > best.value) best = c;
      else if (c.suit === leadSuit && best.suit === leadSuit && c.value > best.value) best = c;
    }
    return best;
  }

  _wouldWin(card, trick, leadSuit) {
    const sim = [...trick, card];
    const winner = this._trickWinner(sim);
    return winner && winner.equals(card);
  }

  _isWinning(card, trick, leadSuit) {
    const winner = this._trickWinner(trick);
    return winner && winner.equals(card);
  }
}

