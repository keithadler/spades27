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
 * The AI estimates its expected tricks and bids the nearest whole number
 * (Math.round). It used to floor the estimate "to be safe", but shaving a
 * trick off every hand meant the table bid ~7 of 13 tricks: nobody ever
 * got set, bags piled up, and the human's partner bid 1 and then coasted.
 * Underbidding is not free in a partnership — it just moves the work
 * onto your partner.
 *
 * The AI counts expected tricks from three sources:
 *
 *   1. SPADE TRICKS (trump cards)
 *      Spades beat everything, so high spades are near-guaranteed wins.
 *      The AI sorts its spades highest-first and counts top-down:
 *
 *        A♠ → 1.0 tricks (always wins, it's the best card)
 *        K♠ → 1.0 with A♠ (your ace draws theirs out first), 0.8 alone
 *        Q♠ → 0.95 with A♠+K♠, 0.7 with one of them, 0.45 alone
 *        J♠ → 0.6 with 4+ spades, 0.3 otherwise
 *
 *      LOW SPADES win tricks too, in two ways: LENGTH (with 4+ spades the
 *      opponents run out of trumps and your small ones win late) and
 *      RUFFING (see 3). The same low spade can't do both, so the AI
 *      credits the larger of the two and only 30% of the smaller.
 *
 *   2. SIDE SUIT WINNERS (non-spade high cards)
 *      Aces and kings of hearts/diamonds/clubs can win tricks too, but
 *      they're less reliable because opponents might be void and trump.
 *
 *        A♥ = 0.9 tricks (usually wins; 0.6 in a 6+ card suit where
 *            someone is void early and ruffs it)
 *        K♥ with A♥ = 0.8 tricks (ace clears the way)
 *        K♥ without ace, 2+ hearts = 0.55 tricks (risky — ace is out)
 *        K♥ singleton = 0.3 tricks
 *        Q♥ with 3+ hearts = 0.4 with A or K above it, 0.2 alone
 *
 *      Why does SUIT LENGTH matter? If you have K♥ but only 1 heart,
 *      you must play it on the first heart trick — and the A♥ is
 *      probably still out there, beating your king. With 4 hearts,
 *      the ace gets played on an earlier trick, so your king survives.
 *
 *   3. RUFFING POTENTIAL (void suits)
 *      If you have ZERO cards in a suit, you can play a spade when
 *      that suit is led — this is called "ruffing" or "trumping."
 *      A void is worth 1.0, a singleton 0.5 and a doubleton 0.2 — but
 *      only up to 0.9 per LOW spade you actually hold to ruff with.
 *
 * TEAM AWARENESS IN BIDDING:
 *   If your partner already bid, the AI caps the team total at 11 (Hard)
 *   or 10 (Medium). Above that you need almost every trick — too risky.
 *
 * BAG-AWARE BIDDING:
 *   If the team has 7+ bags (close to the -100 penalty at 10), the AI
 *   bids 1 less as a safety buffer.
 *
 * NIL BIDS (Hard only):
 *   If the hand is genuinely weak (≤1.2 expected tricks, no aces, at most
 *   one king, no more than 3 spades and none above 9) and partner didn't
 *   already bid Nil, bidding Nil (+100) beats bidding 1 about 2/3 of the
 *   time the hand qualifies.
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
 *   THE BID IS SHARED (team mode)
 *   ─────────────────────────────
 *   "Do I need tricks?" is answered for the TEAM, not the individual.
 *   A partner who bid 1, won it on trick 2 and then ducked for the rest
 *   of the hand — while you still needed 4 — was the single biggest
 *   reason 2v2 felt like playing alone. Now an AI keeps fighting for
 *   tricks until the combined team bid is made, and only then ducks.
 *   (Tricks won by a nil bidder don't count toward the partner's bid.)
 *
 *   FACTOR 4: PARTNER AWARENESS (Hard only, team mode)
 *   ──────────────────────────────────────────────────
 *   Uses actual trick position (not assumed index) to find partner's card.
 *
 *   - Partner winning + partner bid nil → MUST overtake (+20). Save nil.
 *   - Partner winning + I don't need tricks → Play lowest (1.2x low pref)
 *   - Partner winning + I need tricks → Still play low (0.5x), save cards
 *
 *   FACTOR 4b: DON'T CUT YOUR PARTNER (Medium + Hard, team mode)
 *   ────────────────────────────────────────────────────────────
 *   If partner is currently winning the trick (and isn't nil):
 *   - I'm the last player → never take it from them (-40)
 *   - Trumping partner's winner with a spade → never (-25)
 *   - Partner's card is an ace, a spade or Q+ → leave it (-15)
 *   - We don't need the trick anyway → leave it (-10)
 *   Overtaking a partner's LOW card in third seat when the team still
 *   needs tricks is allowed — the fourth player might beat it otherwise.
 *   Easy AIs get only the last-player rule: even a beginner doesn't
 *   take a trick their partner has already won.
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
 *   FACTOR 7: BAG WARFARE + SETTING (team mode)
 *   ────────────────────────────────────────────
 *   - Opponents made their bid → Force bags. Lead high (+6), win tricks (+4).
 *   - Opponents still need (almost) every remaining trick → one more trick
 *     for us SETS them (-bid×10 for them). Stop ducking: win (+20), lead
 *     high (+8). A set is worth far more than the bag it costs.
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
      // Beginners still know a long spade suit wins tricks
      bid += Math.max(0, spades.length - 3);
      bid += Math.floor(Math.random() * 2);
      return Math.max(1, Math.min(bid, 7));
    }

    // ----- MEDIUM / HARD: Balanced trick counting -----
    let tricks = 0;
    const hasSpade = (v) => spades.some(c => c.value === v);
    const spadeCount = spades.length;

    // High spade tricks — the top of the trump suit is close to guaranteed
    if (hasSpade(14)) tricks += 1;
    if (hasSpade(13)) tricks += hasSpade(14) ? 1 : 0.8;
    if (hasSpade(12)) tricks += (hasSpade(14) && hasSpade(13)) ? 0.95 : (hasSpade(14) || hasSpade(13)) ? 0.7 : 0.45;
    if (hasSpade(11)) tricks += spadeCount >= 4 ? 0.6 : 0.3;
    if (hasSpade(10) && spadeCount >= 5) tricks += 0.3;

    // Low spades win tricks two ways: length (opponents run out of trumps
    // and the small ones win late) and ruffing (voids/singletons in side
    // suits). The same low spade can't do both, so credit the larger of the
    // two and only a fraction of the smaller.
    const lowSpades = spades.filter(c => c.value <= 10).length;
    const lengthCredit = Math.max(0, spadeCount - 3) * 0.7;
    let ruffCredit = 0;
    for (const suit of ['hearts', 'diamonds', 'clubs']) {
      const n = hand.filter(c => c.suit === suit).length;
      if (n === 0) ruffCredit += 1.0;
      else if (n === 1) ruffCredit += 0.5;
      else if (n === 2) ruffCredit += 0.2;
    }
    ruffCredit = Math.min(ruffCredit, lowSpades * 0.9);
    tricks += Math.max(lengthCredit, ruffCredit) + 0.3 * Math.min(lengthCredit, ruffCredit);

    // Side suit winners
    for (const suit of ['hearts', 'diamonds', 'clubs']) {
      const suited = hand.filter(c => c.suit === suit).sort((a, b) => b.value - a.value);
      if (suited.length === 0) continue;
      const hasAce = suited[0].value === 14;
      const hasKing = suited.some(c => c.value === 13);
      const hasQueen = suited.some(c => c.value === 12);
      // Ace: reliable unless the suit is so long that someone is void early
      if (hasAce) tricks += suited.length >= 6 ? 0.6 : 0.9;
      // King: needs the ace to clear or some length to survive the first round
      if (hasKing) {
        if (hasAce) tricks += suited.length >= 5 ? 0.6 : 0.8;
        else tricks += suited.length >= 2 ? 0.55 : 0.3;
      }
      // Queen: needs support above and some length
      if (hasQueen && suited.length >= 3) tricks += (hasAce || hasKing) ? 0.4 : 0.2;
    }

    // Round to the nearest trick. Underbidding by a whole trick every hand
    // just piles up bags and leaves the partner to carry the team bid.
    let bid = Math.round(tricks);

    // Medium: occasionally shades the bid down by one
    if (this.difficulty === 'medium' && Math.random() > 0.8) bid -= 1;

    // Bag-aware: if the team already carries 7+ bags, bid 1 less
    if (ctx && ctx.teamBags >= 7 && bid > 2) bid -= 1;

    // Team overbid cap: an 11+ combined bid needs nearly every trick
    if (partnerBid >= 0) {
      const cap = this.difficulty === 'hard' ? 11 : 10;
      if (partnerBid + bid > cap) bid = Math.max(1, cap - partnerBid);
    }

    // Nil consideration (Hard only): a genuinely weak hand with no high
    // spades and no aces is worth more as a Nil (+100) than as a bid of 1.
    if (this.difficulty === 'hard' && partnerBid !== 0 && tricks <= 1.2) {
      const noAces = !hand.some(c => c.value === 14);
      const safeSpades = spadeCount <= 3 && spades.every(c => c.value <= 9);
      const fewKings = hand.filter(c => c.value === 13).length <= 1;
      if (noAces && safeSpades && fewKings && Math.random() > 0.35) return 0;
    }

    return Math.max(1, Math.min(bid, 9));
  }

  // =========================================================================
  // CARD PLAY
  // =========================================================================

  chooseCard(hand, trick, leadSuit, spadesBroken, ctx) {
    const playable = this._getPlayable(hand, leadSuit, spadesBroken);
    if (playable.length === 0) return null;
    if (playable.length === 1) return playable[0];

    // ===== FACTOR 0: I BID NIL — never try to win (all difficulties) =====
    // A nil bidder trying to win tricks makes no sense at any skill level.
    if (ctx && ctx.myBid === 0) {
      if (!leadSuit) {
        // Leading: lead the absolute lowest card
        return playable.reduce((lo, c) => (c.value < lo.value ? c : lo));
      }
      const losers = playable.filter(c => !this._wouldWin(c, trick, leadSuit));
      if (losers.length > 0) {
        // Slough the highest card that still loses — sheds future liabilities
        return losers.reduce((hi, c) => (c.value > hi.value ? c : hi));
      }
      // Every card wins (forced) — take it as cheaply as possible
      return playable.reduce((lo, c) => (c.value < lo.value ? c : lo));
    }

    const partnerNil = ctx && ctx.teamMode && ctx.partnerBid === 0;

    // ----- EASY: Not random — plays "badly but legally" -----
    // Follows suit, prefers high cards (wastes winners), doesn't
    // think about bags or partner. Feels like a beginner.
    // Exception: covering a nil partner is table stakes even for beginners,
    // so the random "whoops" picks are disabled while partner's nil is live.
    if (this.difficulty === 'easy') {
      const coverNil = partnerNil && ctx.partnerTricks === 0;
      if (!leadSuit) {
        // Leading: pick highest non-spade, or highest spade
        const nonSpades = playable.filter(c => !c.isSpade);
        const pool = nonSpades.length > 0 ? nonSpades : playable;
        pool.sort((a, b) => b.value - a.value);
        // 70% play highest, 30% random
        return (coverNil || Math.random() > 0.3) ? pool[0] : pool[Math.floor(Math.random() * pool.length)];
      }
      // Following: play highest of suit (wastes winners), or random off-suit
      playable.sort((a, b) => b.value - a.value);
      // Even a beginner won't take a trick their partner has already won:
      // as the last player, if partner is winning and isn't nil, play a loser.
      if (ctx && ctx.teamMode && !partnerNil && trick.length === 3 && ctx.trickPlayers && ctx.myIndex !== undefined) {
        const pIdx = ctx.trickPlayers.indexOf((ctx.myIndex + 2) % 4);
        if (pIdx >= 0 && this._isWinning(trick[pIdx], trick, leadSuit)) {
          const losers = playable.filter(c => !this._wouldWin(c, trick, leadSuit));
          if (losers.length > 0) return losers[losers.length - 1];
        }
      }
      return (coverNil || Math.random() > 0.2) ? playable[0] : playable[Math.floor(Math.random() * playable.length)];
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
    let partnerIsNil = false;
    let teamMadeBid = false;
    let tricksLeft = 13;

    if (ctx) {
      iNeedTricks = ctx.myBid > 0 && ctx.myTricks < ctx.myBid;
      iMadeBid = ctx.myBid > 0 && ctx.myTricks >= ctx.myBid;

      if (!isFFA) {
        partnerIsNil = ctx.partnerBid === 0;
      }

      if (ctx.allPlayers) {
        const total = ctx.allPlayers.reduce((s, p) => s + p.tricks, 0);
        tricksLeft = 13 - total;
        if (!isFFA) {
          const myTeam = ctx.allPlayers.filter(p => p.team === ctx.myTeam);
          const tBid = myTeam.filter(p => p.bid > 0).reduce((s, p) => s + p.bid, 0);
          // Tricks taken by a nil bidder don't count toward the partner's bid
          const tTricks = myTeam.filter(p => p.bid > 0).reduce((s, p) => s + p.tricks, 0);
          teamMadeBid = tBid > 0 && tTricks >= tBid;
          // PARTNERSHIP: the bid is shared. My personal share being in means
          // nothing while my partner still needs tricks — keep fighting until
          // the TEAM has made its combined bid, and only then start ducking.
          if (ctx.myBid > 0) {
            iNeedTricks = !teamMadeBid;
            iMadeBid = teamMadeBid;
          }
        } else {
          teamMadeBid = iMadeBid;
        }
      }
    }

    // Nil partner already played and someone else's card beats theirs: they
    // are safe in THIS trick, so there's no need to burn a winner on it.
    const nilPartnerSafe = partnerIsNil && partnerPlayed && partnerTrickIdx >= 0 &&
      !this._isWinning(trick[partnerTrickIdx], trick, leadSuit);
    const nilPartnerAtRisk = partnerIsNil && !nilPartnerSafe;

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
        if (nilPartnerAtRisk && !isFFA) {
          score += 14; // Win to protect nil partner (they haven't played, or they're winning)
          score -= card.value * 0.2;
        } else if (iNeedTricks && !teamMadeBid) {
          // Team still needs tricks — take it, with the cheapest card that wins.
          // Must outscore the "dump a low loser" option in Factor 3 (max +8),
          // otherwise the AI ducks tricks it needs.
          score += 12;
          score -= card.value * 0.3; // Win cheaply
          if (card.isSpade && leadSuit !== 'spades') score -= 4;
          if (isLast) score += 6;   // Nobody left to overtake — a sure trick
        } else if (shouldDuck) {
          // HARD DUCK — almost never win (team bid is already made)
          score -= 15;
          if (card.isSpade) score -= 10;
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
      if (!isFFA && nilPartnerAtRisk && wouldWin) {
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

      // ===== FACTOR 4b: DON'T CUT YOUR PARTNER (Medium + Hard, team only) =====
      // Partner is currently winning this trick (and isn't nil). Taking it
      // away from them wastes a winner and gains the team nothing.
      if (!isFFA && partnerPlayed && partnerTrickIdx >= 0 && !partnerIsNil && wouldWin) {
        const pCard = trick[partnerTrickIdx];
        if (pCard && this._isWinning(pCard, trick, leadSuit)) {
          if (isLast) {
            score -= 40;                                      // Partner has it — never take it
          } else if (card.isSpade && leadSuit !== 'spades') {
            score -= 25;                                      // Never trump partner's winner
          } else if (pCard.value === 14 || pCard.isSpade || pCard.value >= 12) {
            score -= 15;                                      // Partner's card is probably good
          } else if (!iNeedTricks) {
            score -= 10;                                      // We don't need it anyway
          }
        }
      }

      // ===== FACTOR 7: BAG WARFARE + SETTING (team only) =====
      if (!isFFA && ctx && ctx.allPlayers) {
        const oppTricks = ctx.allPlayers.filter(p => p.team !== ctx.myTeam && p.bid > 0).reduce((s, p) => s + p.tricks, 0);
        const oppBid = ctx.allPlayers.filter(p => p.team !== ctx.myTeam && p.bid > 0).reduce((s, p) => s + p.bid, 0);
        const oppNeeds = oppBid - oppTricks;
        if (oppBid > 0 && oppNeeds <= 0) {
          // Opponents made bid — force bags
          if (isLeading && card.value >= 12) score += 6;
          if (wouldWin && !teamMadeBid) score += 4;
        } else if (oppBid > 0 && oppNeeds >= tricksLeft - 1) {
          // Opponents still need (almost) every remaining trick — one more
          // trick for us SETS them. Worth far more than a bag. Stop ducking.
          if (wouldWin) score += 20;
          if (isLeading && card.value >= 12) score += 8;
        }
        if (teamMadeBid && wouldWin) score -= 5;
      }

      return { card, score };
    });

    scored.sort((a, b) => b.score - a.score);

    // MEDIUM: pick from top 3 with weighted randomness — but only among
    // near-equivalent plays. Without the margin filter, medium would gamble
    // on clearly terrible cards (e.g. ducking under a nil partner when the
    // best play out-scores the duck by 30+ points).
    if (this.difficulty === 'medium') {
      const top = scored.filter(s => scored[0].score - s.score <= 5).slice(0, 3);
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

