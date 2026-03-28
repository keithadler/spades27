/**
 * @file ai.js — AI opponent logic for Spades.
 * @author Keith Adler
 * @copyright 2026 Keith Adler. MIT License.
 *
 * HOW THE AI WORKS (plain English)
 * ================================
 *
 * The AI has two jobs: BIDDING (predicting how many tricks it will win)
 * and PLAYING (choosing which card to play each trick). Both get harder
 * with difficulty level.
 *
 * DIFFICULTY LEVELS
 * -----------------
 *
 *   EASY   — Bids by counting aces and high spades, adds some randomness.
 *            Plays a random legal card. No strategy at all.
 *
 *   MEDIUM — Uses the full bidding algorithm but adds ±1 randomness.
 *            Scores every legal play with heuristics, then picks randomly
 *            from the top 2 (weighted toward #1). Good but imperfect.
 *
 *   HARD   — Full bidding algorithm with no randomness. Scores every
 *            legal play and always picks the highest-scoring card.
 *            Considers partner's position, nil protection, and bag
 *            avoidance.
 *
 * =========================================================================
 * BIDDING — "How many tricks will I win?"
 * =========================================================================
 *
 * Bidding is the most important decision in Spades. Overbid and you get
 * set (-bid×10). Underbid and you accumulate bags (10 bags = -100).
 *
 * The AI counts "expected tricks" from three sources:
 *
 *   1. SPADE TRICKS — Your spades are trump, so high spades are almost
 *      guaranteed winners. The AI counts them top-down:
 *        - A♠ = 1 trick (always wins)
 *        - K♠ = 1 trick (wins unless someone has A♠ and plays it)
 *        - Q♠ = 1 trick (wins if A♠ and K♠ are gone)
 *        - Lower spades get partial credit (0.7) because they MIGHT win
 *
 *      The key insight: A♠ is worth 1.0, K♠ is worth 1.0 if you also
 *      have A♠ (because A♠ draws out the opponents' high spades first),
 *      but only 0.7 if you don't.
 *
 *   2. SIDE SUIT WINNERS — Non-spade aces and kings can win tricks too:
 *        - A♥ = 1 trick (wins unless someone is void and trumps)
 *        - K♥ with 2+ hearts = 0.7 tricks (wins if A♥ is played first)
 *        - Q♥ with 3+ hearts = 0.4 tricks (needs A♥ and K♥ gone)
 *
 *      Why does "length" matter? If you have K♥ but only 1 heart, you
 *      play it on the first heart trick — but the A♥ is probably still
 *      out there. With 3 hearts, the A♥ likely gets played on an earlier
 *      trick, so your K♥ survives.
 *
 *   3. RUFFING POTENTIAL — If you're VOID in a suit (zero cards), you
 *      can play a spade when that suit is led. Each void is worth ~1
 *      extra trick if you have spades to spare.
 *
 *      Short suits (1-2 cards) also get partial credit because you'll
 *      become void after 1-2 tricks in that suit.
 *
 * TEAM AWARENESS IN BIDDING:
 *   If your partner already bid, the AI checks the combined team total.
 *   If the team would bid more than 11 (out of 13 tricks), it scales
 *   back — overbidding as a team is a recipe for getting set.
 *
 * NIL BIDS:
 *   Hard AI only. If the hand is truly terrible (≤0.5 expected tricks,
 *   at most 1 spade, no card above 9), the AI considers bidding Nil.
 *   This is risky (+100 if you win zero tricks, -100 if you win any)
 *   but correct with a weak enough hand.
 *
 * =========================================================================
 * CARD PLAY — "Which card should I play?"
 * =========================================================================
 *
 * Every legal card gets a SCORE. Higher score = better play. The AI
 * picks the highest-scoring card (Hard) or randomly from the top 2
 * (Medium).
 *
 * The score is built from these STRATEGY FACTORS:
 *
 *   FACTOR 1: LEADING (it's your turn to start a trick)
 *   ─────────────────────────────────────────────────────
 *   When you lead, you choose the suit everyone must follow.
 *   THREE MODES based on team bid progress:
 *
 *   a) I NEED TRICKS → lead aggressively. Aces first (+8), long
 *      suits (+3), high cards (+0.5 per rank).
 *
 *   b) I'M DONE BUT PARTNER NEEDS TRICKS → lead LOW (+0.8 per low).
 *      Don't lead aces (-8) or kings (-4) — those steal tricks your
 *      partner needs. Don't lead spades (-5). Give partner chances
 *      to win with their own cards.
 *
 *   c) TEAM MADE BID → lead low to avoid bags. Every trick is a bag.
 *
 *   FACTOR 2: FOLLOWING — CAN WIN
 *   ─────────────────────────────────────────────────────
 *   THREE MODES matching the leading logic:
 *
 *   a) I NEED TRICKS → win it (+10), but cheaply (-0.3 per rank).
 *
 *   b) I'M DONE BUT PARTNER NEEDS TRICKS → usually DON'T win (-5).
 *      Let partner take their own tricks. Exception: if there aren't
 *      enough tricks left in the round for partner to make their bid,
 *      help them (+6). Also help if partner already played and is
 *      losing (+3).
 *
 *   c) TEAM MADE BID → avoid winning (-8). Bags are poison.
 *
 *   FACTOR 3: FOLLOWING — CAN'T WIN (dump low cards)
 *   ─────────────────────────────────────────────────────
 *   If nothing you play can win this trick, dump your worst cards:
 *
 *   - Prefer LOW cards (+0.5 × (14 - value)). Get rid of your 2s and
 *     3s when they can't win anyway.
 *
 *   - SAVE SPADES (+2 points for non-spades). Spades are trump — they
 *     can win future tricks. Don't throw them away when you're losing.
 *
 *   FACTOR 4: PARTNER AWARENESS (Hard only)
 *   ─────────────────────────────────────────────────────
 *   In partnership Spades, your partner sits across from you. If your
 *   partner played 2 cards ago and is currently WINNING the trick:
 *
 *   - PLAY LOW (+0.8 × (14 - value)). Don't "overtake" your partner.
 *     If they played the K♥ and are winning, don't waste your A♥ on
 *     top of it. Save it for a trick where it matters.
 *
 *   This is one of the biggest differences between good and bad Spades
 *   players. Beginners waste high cards on tricks their partner already
 *   won.
 *
 *   FACTOR 5: NIL PROTECTION (+8 points)
 *   ─────────────────────────────────────────────────────
 *   If your PARTNER bid Nil (promised to win zero tricks), you need to
 *   protect them by winning tricks they might accidentally take.
 *
 *   - If you CAN win the trick and your partner bid Nil, strongly prefer
 *     winning (+8 points). You're "covering" for your partner — taking
 *     the trick so they don't have to.
 *
 *   FACTOR 6: NIL BUSTING (+12 points, Medium/Hard)
 *   ─────────────────────────────────────────────────────
 *   If an OPPONENT bid Nil and hasn't busted yet, actively try to
 *   FORCE them to win a trick. Busting their nil costs them 100 points.
 *
 *   LEADING against nil:
 *   - Lead LOW cards (+1.0 × (14 - value)). A 2♥ lead forces the nil
 *     bidder to play their high hearts — they can't duck under a 2.
 *   - Lead SHORT suits (+4 to +7). If you only have 1-2 cards in a
 *     suit, the nil bidder likely has more and can't avoid high cards.
 *   - AVOID aces/kings (-6). They just win — they don't trap anyone.
 *   - Low spades (+5) can catch nil bidders holding high spades.
 *
 *   FOLLOWING when nil bidder played:
 *   - If nil bidder is WINNING the trick, play UNDER them (+12).
 *     Let them take it — that busts their nil!
 *   - If nil bidder is losing, play low and save ammo (+0.3 per low).
 *
 *   FACTOR 7: BAG WARFARE (Medium/Hard)
 *   ─────────────────────────────────────────────────────
 *   Bags (overtricks) accumulate. Every 10 bags = -100 penalty.
 *
 *   A) OWN TEAM MADE BID → stop winning tricks (-8 for winning).
 *      Once your team has enough tricks, every extra one is a bag.
 *      Actively try to lose. Don't trump. Play low.
 *
 *   B) OPPONENTS MADE BID → force bags on them (+5 for high leads).
 *      Lead aces and kings to force opponents to play over you or
 *      take unwanted tricks. Every bag you force on them brings
 *      them closer to the -100 penalty.
 *
 * =========================================================================
 * TRICK WINNER DETERMINATION
 * =========================================================================
 *
 * After all 4 players play a card, who wins? Simple rules:
 *
 *   1. If anyone played a SPADE, the highest spade wins.
 *      (Spades are trump — they beat everything else.)
 *
 *   2. If no spades were played, the highest card of the LEAD SUIT wins.
 *      (The suit that was led first.)
 *
 *   3. Cards that are neither spades nor the lead suit CANNOT win.
 *      (Playing off-suit is just dumping a card.)
 *
 * Example: Lead is 7♥. Cards played: 7♥, K♦, 3♠, A♥.
 *   - K♦ can't win (off-suit, not spade)
 *   - A♥ would normally win (highest heart) BUT...
 *   - 3♠ wins! Even the lowest spade beats the highest non-spade.
 *
 * @dependency card.js ({@link Card})
 */

class AI {
  /**
   * Create an AI player.
   * @param {'easy'|'medium'|'hard'} difficulty
   */
  constructor(difficulty) {
    this.difficulty = difficulty;
  }

  // =========================================================================
  // BIDDING — Predict how many tricks this hand will win
  // =========================================================================

  /**
   * Choose a bid for the given hand.
   *
   * The bid is the number of tricks (0–13) the AI promises to win.
   * Getting it right is critical:
   *   - Make your bid → +bid×10 points (good!)
   *   - Miss your bid → -bid×10 points (bad!)
   *   - Win extra tricks → +1 each but they're "bags" (10 bags = -100)
   *
   * @param {Card[]}  hand       - The 13 cards in the AI's hand.
   * @param {number}  partnerBid - Partner's bid (-1 if they haven't bid yet).
   * @param {object}  ctx        - Game context (unused for now, reserved for future).
   * @returns {number} Bid from 0 (Nil) to 13.
   */
  chooseBid(hand, partnerBid, ctx) {
    const spades = hand.filter(c => c.isSpade);
    const highSpades = spades.filter(c => c.value >= 12).length;
    const aces = hand.filter(c => c.value === 14).length;
    const kings = hand.filter(c => c.value === 13 && !c.isSpade).length;

    if (this.difficulty === 'easy') {
      let bid = aces + highSpades + Math.floor(kings * 0.5);
      bid += Math.floor(Math.random() * 2);
      return Math.max(1, Math.min(bid, 7));
    }

    // ----- MEDIUM / HARD: Conservative trick counting -----
    // KEY INSIGHT: Underbidding by 1 costs 1 bag (+1 point).
    // Overbidding by 1 costs -bid*10 points (getting set).
    // So we UNDERCOUNT slightly — far better to win 1 extra
    // trick (bag) than to miss your bid entirely.
    let tricks = 0;

    // --- Source 1: Spade tricks ---
    // Only count spades we're CONFIDENT will win.
    const spadesSorted = spades.sort((a, b) => b.value - a.value);
    for (let i = 0; i < spadesSorted.length && i < 4; i++) {
      if (spadesSorted[i].value >= 14 - i) {
        tricks += 1;       // A, K with A, Q with AK — sure winners
      } else if (spadesSorted[i].value >= 12 && i < 2) {
        tricks += 0.5;     // Reduced from 0.7 — uncertain
      }
    }

    // --- Source 2: Side suit winners ---
    for (const suit of ['hearts', 'diamonds', 'clubs']) {
      const suited = hand.filter(c => c.suit === suit).sort((a, b) => b.value - a.value);

      if (suited.length === 0) {
        // Void — ruffing, but only with SPARE spades
        const spareSpades = Math.max(0, spades.length - Math.ceil(tricks));
        if (spareSpades > 0) tricks += 0.5;
        continue;
      }

      // Ace = 0.9 (not 1.0 — might get ruffed)
      if (suited[0].value === 14) tricks += 0.9;

      // King needs 3+ length to be safe (was 2+)
      if (suited.length >= 3 && suited[1].value === 13) tricks += 0.5;

      // Queen needs 4+ length (was 3+)
      if (suited.length >= 4 && suited[2].value === 12) tricks += 0.3;

      // Only singleton ruffing potential (not doubleton)
      if (suited.length === 1 && spades.length > Math.ceil(tricks)) tricks += 0.3;
    }

    // FLOOR not ROUND — prefer underbidding
    let bid = Math.floor(tricks);

    // Medium: occasionally underbid, never randomly overbid
    if (this.difficulty === 'medium') {
      if (Math.random() > 0.7) bid -= 1;
    }

    // --- Bag-aware bidding ---
    // Close to 10-bag penalty? Bid 1 less as a buffer.
    if (ctx && ctx.teamBags >= 7 && bid > 2) {
      bid -= 1;
    }

    // --- Team overbid protection (tighter: cap at 10) ---
    if (partnerBid >= 0) {
      const teamTotal = partnerBid + bid;
      if (teamTotal > 10 && this.difficulty !== 'easy') {
        bid = Math.max(1, 10 - partnerBid);
      }
    }

    // --- Nil bid consideration (Hard only) ---
    // If the hand is truly terrible:
    //   - Expected tricks ≤ 0.5 (basically nothing wins)
    //   - At most 1 spade (can't accidentally trump)
    //   - No card above 9 (nothing that could accidentally win)
    // Then bidding Nil (+100 if successful) is better than bidding 1
    // and probably getting set (-10).
    if (this.difficulty === 'hard' && tricks <= 0.5 && spades.length <= 1) {
      const hasNoHighCards = hand.every(c => c.value <= 9);
      if (hasNoHighCards && Math.random() > 0.6) return 0; // Nil!
    }

    return Math.max(1, Math.min(bid, 8));
  }

  // =========================================================================
  // CARD PLAY — Choose the best card for this trick
  // =========================================================================

  /**
   * Choose which card to play from the given hand.
   *
   * Evaluates every legal card with a scoring formula and picks the best.
   * The score combines situational awareness (leading vs following),
   * bid progress (need tricks vs avoiding bags), and partner awareness.
   *
   * @param {Card[]}  hand         - Cards in the AI's hand.
   * @param {Card[]}  trick        - Cards already played this trick (0–3).
   * @param {string|null} leadSuit - Suit of the first card played, or null if leading.
   * @param {boolean} spadesBroken - Whether spades have been played in a previous trick.
   * @param {object}  ctx          - Game context: myBid, myTricks, partnerBid, partnerTricks.
   * @returns {Card|null} The chosen card, or null if no legal play exists.
   */
  chooseCard(hand, trick, leadSuit, spadesBroken, ctx) {
    // Step 1: Find every legal card we can play
    const playable = this._getPlayable(hand, leadSuit, spadesBroken);
    if (playable.length === 0) return null;
    if (playable.length === 1) return playable[0]; // Only one option, skip analysis

    // EASY: just pick one at random. No strategy.
    if (this.difficulty === 'easy') {
      return playable[Math.floor(Math.random() * playable.length)];
    }

    // Step 2: Determine the tactical situation
    const winningCard = this._trickWinner(trick);
    const isLeading = trick.length === 0;     // We're starting a new trick
    const isLast = trick.length === 3;         // We're the 4th (last) to play
    const partnerPlayed = trick.length === 2;  // Partner played 2 cards ago

    // Step 2b: Calculate bid progress — TEAM-AWARE
    // This is the key insight: in partnership Spades, what matters is
    // whether the TEAM has made its combined bid, not just whether
    // I personally have enough tricks.
    //
    // Example: Team bid is 7 (I bid 4, partner bid 3).
    //   - I have 5 tricks, partner has 1 → team has 6, needs 1 more
    //   - Even though I'VE made my bid (5 >= 4), the TEAM hasn't (6 < 7)
    //   - But I should back off and let partner get their tricks
    //
    // Three states:
    //   iNeedTricks:  I personally haven't made my individual bid yet
    //   teamNeedsTricks: The team hasn't made the combined bid yet
    //   teamMadeBid: The team has made it — every trick is now a bag
    let iNeedTricks = true;
    let teamNeedsTricks = true;
    let teamMadeBid = false;
    let partnerNeedsTricks = true;
    let partnerIsNil = false;
    let tricksLeftInRound = 13;

    if (ctx) {
      iNeedTricks = ctx.myBid > 0 && ctx.myTricks < ctx.myBid;
      partnerNeedsTricks = ctx.partnerBid > 0 && ctx.partnerTricks < ctx.partnerBid;
      partnerIsNil = ctx.partnerBid === 0;

      // KEY CHANGE: "made my bid" is purely individual.
      // Once I've won enough tricks for MY bid, I stop trying to win.
      // I trust my partner to get their own tricks.
      // teamMadeBid is only used for the opponent-bagging strategy.
      const iMadeMyBid = ctx.myBid > 0 && ctx.myTricks >= ctx.myBid;

      if (ctx.allPlayers && ctx.teamMode) {
        const myTeamPlayers = ctx.allPlayers.filter(p => p.team === ctx.myTeam);
        const teamTricks = myTeamPlayers.reduce((s, p) => s + p.tricks, 0);
        const teamBid = myTeamPlayers.filter(p => p.bid > 0).reduce((s, p) => s + p.bid, 0);
        teamNeedsTricks = teamBid > 0 && teamTricks < teamBid;
        teamMadeBid = teamBid > 0 && teamTricks >= teamBid;
        const totalTricks = ctx.allPlayers.reduce((s, p) => s + p.tricks, 0);
        tricksLeftInRound = 13 - totalTricks;
      } else {
        teamNeedsTricks = iNeedTricks;
        teamMadeBid = iMadeMyBid;
      }
    }

    // Step 3: Score every legal card
    const scored = playable.map(card => {
      let score = 0;
      const wouldWin = this._wouldWin(card, trick, leadSuit);

      // ===== FACTOR 1: LEADING STRATEGY =====
      // KEY: Adapt based on team state AND partner nil status.
      if (isLeading) {
        if (partnerIsNil) {
          // PARTNER BID NIL — lead HIGH to win tricks ourselves and
          // protect partner. Lead aces/kings so WE take the trick
          // before partner has to play something dangerous.
          // Also prefer leading suits where we're LONG (we can keep
          // winning in that suit, keeping partner safe).
          if (!card.isSpade) {
            if (card.value === 14) score += 12; // Lead aces — we win, partner safe
            else if (card.value === 13) score += 8; // Kings too
            else if (card.value >= 10) score += 3;
            else score -= 2; // Low leads are DANGEROUS — partner might have to win
            const suitCount = hand.filter(c => c.suit === card.suit).length;
            if (suitCount >= 4) score += 4; // Long suits = more control
          } else {
            // Leading spades when partner is nil: risky but OK if we
            // have high spades (we win, partner plays low spade under us)
            if (card.value >= 12) score += 4;
            else score -= 4; // Low spade lead could force partner's high spade
          }
        } else if (iNeedTricks) {
          // I still need tricks — lead aggressively
          if (!card.isSpade) {
            score += card.value * 0.5;
            if (card.value === 14) score += 8;
            const suitCount = hand.filter(c => c.suit === card.suit).length;
            if (suitCount >= 4) score += 3;
          } else {
            const mySpades = hand.filter(c => c.isSpade).length;
            if (mySpades >= 4 && card.value >= 12) score += 5;
            else score -= 3;
          }
        } else if (partnerNeedsTricks && teamNeedsTricks) {
          // I've made MY bid but partner still needs tricks.
          // Lead LOW non-spades to give partner winning opportunities.
          // Don't lead aces — those steal tricks partner needs.
          if (!card.isSpade) {
            score += (14 - card.value) * 0.8; // Prefer low cards
            if (card.value === 14) score -= 8; // DON'T lead aces
            if (card.value === 13) score -= 4; // Avoid kings too
          } else {
            score -= 5; // Don't lead spades — partner can't win those easily
          }
        } else {
          // Team made bid — lead LOW to avoid bags, never lead winners
          score += (14 - card.value) * 1.2;
          if (card.value >= 13) score -= 10; // Never lead aces/kings
          if (card.isSpade) score -= 8;
        }
      }

      // ===== FACTOR 2: FOLLOWING — WE CAN WIN =====
      else if (wouldWin) {
        if (partnerIsNil) {
          // PARTNER BID NIL — always try to win! Every trick we take
          // is one our partner doesn't have to worry about.
          score += 12;
          score -= card.value * 0.2; // Still prefer winning cheaply
        } else if (iNeedTricks) {
          // I personally need more tricks — win it!
          score += 10;
          score -= card.value * 0.3; // Win cheaply
          if (card.isSpade && leadSuit !== 'spades') score -= 5;
        } else if (partnerNeedsTricks && teamNeedsTricks) {
          // I've made my bid but PARTNER still needs tricks.
          // Only win if partner CAN'T win this trick, or if there
          // aren't enough tricks left for partner to make their bid.
          const partnerTricksNeeded = ctx ? (ctx.partnerBid - ctx.partnerTricks) : 0;
          if (partnerTricksNeeded > tricksLeftInRound) {
            // Not enough tricks left — we need to help
            score += 6;
          } else if (partnerPlayed) {
            // Partner already played — if they're losing, we might
            // need to win to prevent opponents from taking it
            const partnerCard = trick.length >= 2 ? trick[trick.length - 2] : null;
            if (partnerCard && !this._isWinning(partnerCard, trick, leadSuit)) {
              score += 3; // Partner is losing, maybe help
            } else {
              score -= 6; // Partner is winning — don't overtake!
            }
          } else {
            // Partner hasn't played yet — play low, let them win
            score -= 5;
          }
        } else {
          // TEAM MADE BID — extra tricks are BAGS. Avoid winning!
          score -= 15;
          if (card.isSpade) score -= 8;
        }
      }

      // ===== FACTOR 3: FOLLOWING — WE CAN'T WIN =====
      // Nothing we play will take this trick. Dump our worst cards.
      else {
        // Prefer LOW cards — get rid of 2s and 3s when they're useless
        // (+0.5 × (14 - value), so a 2 gets +6, an Ace gets +0)
        score += (14 - card.value) * 0.5;

        // SAVE SPADES for future tricks where they can actually win
        if (!card.isSpade) score += 2;
      }

      // ===== FACTOR 4: PARTNER AWARENESS (Hard only) =====
      if (this.difficulty === 'hard' && partnerPlayed) {
        const partnerCard = trick[1]; // Partner is 2 positions back
        if (partnerCard && this._isWinning(partnerCard, trick, leadSuit)) {
          if (partnerIsNil) {
            // Partner bid nil and is WINNING — we MUST overtake them!
            // This is critical: if we don't take this trick, partner's
            // nil is busted.
            if (wouldWin) score += 15; // Strongly prefer winning to save nil
            else score -= 5;
          } else {
            score += (14 - card.value) * 0.8; // Normal: play low when partner's winning
          }
        }
      }

      // ===== FACTOR 5: NIL PROTECTION =====
      // If our partner bid Nil (zero tricks), we need to COVER them
      // by winning tricks they might accidentally take.
      //
      // Example: Partner bid Nil. Opponent leads 3♣. Partner must
      // follow with their only club, the K♣, which would win.
      // If we can win with A♣ instead, we save our partner.
      if (ctx && ctx.partnerBid === 0 && wouldWin) {
        score += 8; // Strongly prefer winning to protect nil partner
      }

      // ===== FACTOR 6: NIL BUSTING (Medium/Hard) =====
      // If an OPPONENT bid Nil and hasn't busted yet, we want to
      // FORCE them to win a trick. This is worth +100 points to us
      // (their team loses 100), so it's a huge strategic priority.
      //
      // LEADING against a nil bidder:
      //   - Lead LOW cards in suits where the nil bidder might have
      //     high cards. If we lead 2♥ and they have K♥, they're
      //     forced to play it and might win the trick.
      //   - Lead SHORT suits — the nil bidder is more likely to be
      //     stuck with high cards they can't duck under.
      //   - AVOID leading aces/kings — those win immediately and
      //     don't force the nil bidder to take the trick.
      //
      // FOLLOWING when nil bidder is in the trick:
      //   - If the nil bidder played a high card and is WINNING,
      //     DON'T overtake them — let them take the trick!
      //   - If the nil bidder is losing, play low and save ammo.
      if (ctx && ctx.opponentNils && ctx.opponentNils.length > 0) {

        if (isLeading) {
          // LEADING: try to trap the nil bidder
          if (!card.isSpade) {
            // Lead LOW cards to force nil bidder's high cards out
            score += (14 - card.value) * 1.0;
            // Prefer SHORT suits — more likely to force nil bidder
            const suitCount = hand.filter(c => c.suit === card.suit).length;
            if (suitCount <= 2) score += 4;
            if (suitCount === 1) score += 3;
            // AVOID leading aces/kings — they just win, don't bust nil
            if (card.value >= 13) score -= 6;
          } else {
            // Low spades can bust a nil bidder who holds high spades
            if (card.value <= 8) score += 5;
            else score -= 2;
          }
        }

        if (!isLeading && ctx.trickPlayers) {
          // FOLLOWING: check if a nil bidder played in this trick
          let nilCard = null;
          for (let ti = 0; ti < trick.length; ti++) {
            if (ctx.opponentNils.includes(ctx.trickPlayers[ti])) {
              nilCard = trick[ti];
              break;
            }
          }

          if (nilCard) {
            const nilIsWinning = this._isWinning(nilCard, trick, leadSuit);
            if (nilIsWinning) {
              // Nil bidder is WINNING — play UNDER them!
              // Let them take the trick to bust their nil.
              if (!wouldWin) score += 12;  // We're not overtaking — perfect
              else score -= 10;            // We'd save them by winning — bad
            } else {
              // Nil bidder is losing — play low, save ammo for later
              score += (14 - card.value) * 0.3;
            }
          }
        }
      }

      // ===== FACTOR 7: BAG WARFARE (Medium/Hard) =====
      // Uses the team-aware state computed in Step 2b.
      if (ctx && ctx.allPlayers && ctx.teamMode) {
        const oppTeamTricks = ctx.allPlayers.filter(p => p.team !== ctx.myTeam)
          .reduce((s, p) => s + p.tricks, 0);
        const oppTeamBid = ctx.allPlayers.filter(p => p.team !== ctx.myTeam && p.bid > 0)
          .reduce((s, p) => s + p.bid, 0);
        const oppTeamMade = oppTeamTricks >= oppTeamBid && oppTeamBid > 0;

        // Our team made bid — reinforced bag avoidance (stacks with Factor 2)
        if (teamMadeBid) {
          if (wouldWin) score -= 4;
        }

        // Opponents made bid — force bags on them
        if (oppTeamMade) {
          if (isLeading) {
            if (card.value >= 12) score += 5;
            if (card.value === 14) score += 3;
          }
          if (wouldWin && !teamMadeBid) {
            score += 4;
          }
        }
      }

      return { card, score };
    });

    // Step 4: Pick the best card
    scored.sort((a, b) => b.score - a.score);

    // MEDIUM: Pick from top 2 with weighted randomness
    // #1 gets chosen ~70% of the time, #2 gets ~30%.
    // This makes medium AI good but occasionally suboptimal.
    if (this.difficulty === 'medium') {
      const top = scored.slice(0, Math.min(2, scored.length));
      return top[Math.random() > 0.3 ? 0 : Math.min(1, top.length - 1)].card;
    }

    // HARD: Always pick the single best card. No randomness.
    return scored[0].card;
  }

  // =========================================================================
  // LEGAL PLAY RULES — What cards can we play?
  // =========================================================================

  /**
   * Get all legal cards from the hand for the current trick.
   *
   * Spades has strict rules about what you can play:
   *
   *   LEADING (no lead suit yet):
   *     - Can play any non-spade card
   *     - Can play spades ONLY if:
   *       a) Spades have been "broken" (someone played a spade earlier), OR
   *       b) You have NOTHING BUT spades in your hand
   *
   *   FOLLOWING (someone already led a suit):
   *     - MUST play a card of the lead suit if you have one
   *     - If you have NO cards of the lead suit, you can play ANYTHING
   *       (including spades — this is called "trumping" or "ruffing")
   *
   * @param {Card[]}      hand         - All cards in hand.
   * @param {string|null}  leadSuit     - The suit that was led, or null if leading.
   * @param {boolean}      spadesBroken - Whether spades have been played previously.
   * @returns {Card[]} Array of legal cards to play.
   * @private
   */
  _getPlayable(hand, leadSuit, spadesBroken) {
    if (!leadSuit) {
      // LEADING: can play anything except spades (unless broken or forced)
      if (spadesBroken || hand.every(c => c.isSpade)) return [...hand];
      return hand.filter(c => !c.isSpade);
    }
    // FOLLOWING: must follow suit if possible
    const suited = hand.filter(c => c.suit === leadSuit);
    return suited.length > 0 ? suited : [...hand];
  }

  // =========================================================================
  // TRICK WINNER — Who takes this trick?
  // =========================================================================

  /**
   * Determine which card is currently winning a trick.
   *
   * The winner is determined by two simple rules:
   *   1. If any SPADE was played, the HIGHEST spade wins.
   *      (Spades are trump — they beat everything.)
   *   2. Otherwise, the HIGHEST card of the LEAD SUIT wins.
   *      (Off-suit non-spade cards can never win.)
   *
   * Example: Lead 7♥ → played K♦, 3♠, A♥
   *   - K♦ can't win (off-suit, not spade)
   *   - A♥ is highest heart, but...
   *   - 3♠ wins! Lowest spade beats highest non-spade.
   *
   * @param {Card[]} trick - Cards played so far (1–4).
   * @returns {Card|null} The currently winning card, or null if empty.
   * @private
   */
  _trickWinner(trick) {
    if (trick.length === 0) return null;
    let best = trick[0];
    const leadSuit = trick[0].suit;
    for (let i = 1; i < trick.length; i++) {
      const c = trick[i];
      // Spade beats non-spade (trump)
      if (c.isSpade && !best.isSpade) best = c;
      // Higher spade beats lower spade
      else if (c.isSpade && best.isSpade && c.value > best.value) best = c;
      // Higher lead-suit card beats lower lead-suit card
      else if (c.suit === leadSuit && best.suit === leadSuit && c.value > best.value) best = c;
      // Off-suit non-spade cards can NEVER win — they're just discards
    }
    return best;
  }

  /**
   * Check if playing this card would win the current trick.
   * Simulates adding the card to the trick and checking the winner.
   *
   * @param {Card}   card     - The card we're considering playing.
   * @param {Card[]} trick    - Cards already played (0–3).
   * @param {string} leadSuit - The lead suit.
   * @returns {boolean} True if this card would be the winner.
   * @private
   */
  _wouldWin(card, trick, leadSuit) {
    const simTrick = [...trick, card];
    const winner = this._trickWinner(simTrick);
    return winner && winner.equals(card);
  }

  /**
   * Check if a specific card is currently winning the trick.
   *
   * @param {Card}   card     - The card to check.
   * @param {Card[]} trick    - Cards played so far.
   * @param {string} leadSuit - The lead suit.
   * @returns {boolean} True if this card is the current winner.
   * @private
   */
  _isWinning(card, trick, leadSuit) {
    const winner = this._trickWinner(trick);
    return winner && winner.equals(card);
  }
}
