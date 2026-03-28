/**
 * @file ai.js — AI opponent logic for Spades.
 * @author Keith Adler
 * @copyright 2026 Keith Adler. MIT License.
 *
 * THREE DIFFICULTY LEVELS:
 *
 *   EASY   — Bids by counting aces + high spades. Plays like a beginner:
 *            leads highest cards (wastes winners), 30% random. No strategy.
 *
 *   MEDIUM — Full bidding/play heuristics. Picks from top 3 scored cards
 *            with weighted randomness (5:3:1). Good but makes mistakes.
 *
 *   HARD   — Optimal heuristic play. Always picks the best-scored card.
 *            Full partner awareness, nil protection/busting, bag warfare.
 *
 * BIDDING: Conservative trick counting with Math.floor (prefers underbid).
 *   Aces=0.85, Kings need 3+ length, Queens need 4+ with AK support.
 *   Bag-aware (bids -1 at 7+ bags), team cap at 10, nil at ≤0.5 tricks.
 *
 * CARD PLAY: 7-factor scoring system:
 *   F1: Leading — nil-protect / aggressive / hard-duck / bag-avoid
 *   F2: Following (can win) — nil-protect / win cheaply / hard-duck
 *   F3: Following (can't win) — dump high when done, save high when not
 *   F4: Partner awareness — don't overtake partner, save nil partner
 *   F5: Nil protection — always win when partner bid nil
 *   F6: Nil busting — lead low, duck under winning nil bidder
 *   F7: Bag warfare — force bags on opponents, avoid own bags
 *
 * FFA/CUTTHROAT: All partner/team logic disabled. Pure individual play.
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

    // ----- MEDIUM / HARD: Conservative trick counting -----
    let tricks = 0;

    // Spade tricks — top-down, only count sure winners
    const spadesSorted = [...spades].sort((a, b) => b.value - a.value);
    for (let i = 0; i < spadesSorted.length && i < 5; i++) {
      if (spadesSorted[i].value >= 14 - i) {
        tricks += 1;       // A, K+A, Q+AK, etc.
      } else if (spadesSorted[i].value >= 11 && i < 2) {
        tricks += 0.4;     // J or Q without full support
      }
    }

    // Side suit winners
    for (const suit of ['hearts', 'diamonds', 'clubs']) {
      const suited = hand.filter(c => c.suit === suit).sort((a, b) => b.value - a.value);

      if (suited.length === 0) {
        // Void — ruffing potential with spare spades
        const spareSpades = Math.max(0, spades.length - Math.ceil(tricks));
        if (spareSpades > 0) tricks += 0.5;
        continue;
      }

      // Ace: 0.85 (might get ruffed in a 4-player game)
      if (suited[0].value === 14) tricks += 0.85;

      // King: needs ace gone AND 3+ length for protection
      const hasAce = suited[0].value === 14;
      const hasKing = suited.some(c => c.value === 13);
      if (hasKing && suited.length >= 3) tricks += hasAce ? 0.6 : 0.35;

      // Queen: needs AK gone AND 4+ length
      const hasQueen = suited.some(c => c.value === 12);
      if (hasQueen && suited.length >= 4 && hasAce && hasKing) tricks += 0.3;

      // Singleton ruffing (not doubleton — too slow)
      if (suited.length === 1 && spades.length > Math.ceil(tricks)) tricks += 0.3;
    }

    // FLOOR — always prefer underbidding
    let bid = Math.floor(tricks);

    // Medium: 30% chance to underbid by 1
    if (this.difficulty === 'medium') {
      if (Math.random() > 0.7) bid -= 1;
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
        } else if (iNeedTricks) {
          // Aggressive — lead winners
          if (!card.isSpade) {
            score += card.value * 0.5;
            if (card.value === 14) score += 8;
            if (card.value === 13) score += 3;
            if (hand.filter(c => c.suit === card.suit).length >= 4) score += 3;
          } else {
            const n = hand.filter(c => c.isSpade).length;
            score += (n >= 4 && card.value >= 12) ? 5 : -4;
          }
        } else if (iMadeBid) {
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
        } else if (iNeedTricks) {
          score += 10;
          score -= card.value * 0.3; // Win cheaply
          if (card.isSpade && leadSuit !== 'spades') score -= 4;
        } else if (iMadeBid) {
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
        if (iMadeBid && !partnerIsNil) {
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

