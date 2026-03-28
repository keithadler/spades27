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
 *
 *   - Lead ACES first (+8 points). An ace of a side suit is a guaranteed
 *     winner when you lead it — no one can beat it unless they're void
 *     and trump. Get your sure tricks early.
 *
 *   - Prefer LONG SUITS (+3 points for 4+ cards). If you have 5 hearts,
 *     leading hearts repeatedly forces opponents to run out of hearts,
 *     letting your lower hearts win later.
 *
 *   - Prefer HIGH CARDS in general (+0.5 × card value). A King lead is
 *     better than a 3 lead.
 *
 *   - AVOID leading spades (-3 points) unless you have 4+ spades and
 *     they're high (+5 points). Leading spades "draws trump" — good if
 *     you have more spades than everyone else, bad if you're wasting
 *     your trump cards.
 *
 *   FACTOR 2: FOLLOWING — CAN WIN (+10 or -3 points)
 *   ─────────────────────────────────────────────────────
 *   If your card would win the current trick:
 *
 *   - NEED TRICKS? (+10 points, win it!) If you haven't met your bid
 *     yet, winning is valuable. But prefer winning CHEAPLY (-0.3 per
 *     card value) — don't waste the A♠ when the 3♠ would do.
 *
 *   - ALREADY MET BID? (-3 points, avoid it!) Extra tricks are BAGS.
 *     Every 10 bags = -100 penalty. If you've already made your bid,
 *     actively try to LOSE tricks. Spades are especially bad to waste
 *     here (-5 points).
 *
 *   - DON'T TRUMP UNNECESSARILY (-5 points). If you're void in the
 *     lead suit and could play a spade to win, but you've already met
 *     your bid, don't. Throw off a low card from another suit instead.
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
    const highSpades = spades.filter(c => c.value >= 12).length; // Q, K, A of spades
    const aces = hand.filter(c => c.value === 14).length;        // All aces
    const kings = hand.filter(c => c.value === 13 && !c.isSpade).length; // Non-spade kings

    // ----- EASY: Simple counting with randomness -----
    // Just count obvious winners: aces + high spades + half the kings.
    // Add 0 or 1 randomly. Cap at 7 to avoid crazy overbids.
    if (this.difficulty === 'easy') {
      let bid = aces + highSpades + Math.floor(kings * 0.5);
      bid += Math.floor(Math.random() * 2);
      return Math.max(1, Math.min(bid, 7));
    }

    // ----- MEDIUM / HARD: Sophisticated trick counting -----
    let tricks = 0;

    // --- Source 1: Spade tricks ---
    // Sort spades highest-first and count from the top.
    // A♠ (value 14) at position 0 → guaranteed winner (14 >= 14-0)
    // K♠ (value 13) at position 1 → winner if we have A♠ too (13 >= 14-1)
    // Q♠ (value 12) at position 2 → winner if we have A♠ and K♠ (12 >= 14-2)
    // Lower spades get partial credit — they MIGHT win depending on
    // what opponents hold.
    const spadesSorted = spades.sort((a, b) => b.value - a.value);
    for (let i = 0; i < spadesSorted.length && i < 4; i++) {
      if (spadesSorted[i].value >= 14 - i) {
        tricks += 1;       // Sure winner (top of the spade hierarchy)
      } else if (spadesSorted[i].value >= 12 && i < 2) {
        tricks += 0.7;     // Probable winner (Q♠ or J♠ near the top)
      }
    }

    // --- Source 2: Side suit winners ---
    // For each non-spade suit, count how many tricks our high cards
    // are likely to win based on their rank AND how many cards we
    // hold in that suit (length).
    for (const suit of ['hearts', 'diamonds', 'clubs']) {
      const suited = hand.filter(c => c.suit === suit).sort((a, b) => b.value - a.value);

      if (suited.length === 0) {
        // VOID in this suit! We can RUFF (play a spade) when this
        // suit is led. Each void is worth ~1 extra trick if we have
        // spades to spare beyond what we already counted.
        tricks += Math.min(1, Math.max(0, spades.length - tricks));
        continue;
      }

      // Ace = 1 trick (almost always wins when led, unless someone ruffs)
      if (suited[0].value === 14) tricks += 1;

      // King with 2+ cards in suit = 0.7 tricks
      // (The ace probably gets played on an earlier trick, so our
      // king survives. With only 1 card, we play the king immediately
      // and the ace is still out there.)
      if (suited.length >= 2 && suited[1].value === 13) tricks += 0.7;

      // Queen with 3+ cards = 0.4 tricks (needs both A and K gone first)
      if (suited.length >= 3 && suited[2].value === 12) tricks += 0.4;

      // Short suits (1-2 cards) = ruffing potential
      // After 1-2 tricks in this suit, we'll be void and can trump.
      if (suited.length <= 2 && spades.length > 0) tricks += 0.3;
    }

    let bid = Math.round(tricks);

    // --- Medium adds randomness: ±1 from the calculated bid ---
    // This makes medium AI good but not perfect — it occasionally
    // overbids or underbids by 1, which feels more human.
    if (this.difficulty === 'medium') {
      bid += Math.random() > 0.5 ? 0 : (Math.random() > 0.5 ? 1 : -1);
    }

    // --- Team overbid protection ---
    // If partner already bid and our combined total exceeds 11 (out of
    // 13 possible tricks), scale back. Bidding 12+ as a team means
    // you need to win almost every trick — very risky.
    if (partnerBid >= 0) {
      const teamTotal = partnerBid + bid;
      if (teamTotal > 11 && this.difficulty !== 'easy') {
        bid = Math.max(1, 11 - partnerBid);
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

    // Step 3: Score every legal card
    const scored = playable.map(card => {
      let score = 0;
      const wouldWin = this._wouldWin(card, trick, leadSuit);

      // ===== FACTOR 1: LEADING STRATEGY =====
      // When we lead, we choose the battlefield. Pick wisely.
      if (isLeading) {
        if (!card.isSpade) {
          // --- Lead non-spades ---
          // Base score: higher cards are better leads (+0.5 per rank)
          score += card.value * 0.5;

          // Lead ACES immediately (+8). They're guaranteed winners
          // when you lead them — get your sure tricks banked early.
          if (card.value === 14) score += 8;

          // Prefer LONG SUITS (+3 for 4+ cards). If you have 5 hearts,
          // leading hearts repeatedly exhausts opponents' hearts,
          // making your lower hearts winners later.
          const suitCount = hand.filter(c => c.suit === card.suit).length;
          if (suitCount >= 4) score += 3;
        } else {
          // --- Lead spades (drawing trump) ---
          // Only good if you have MORE spades than opponents.
          // With 4+ high spades, leading them strips opponents' trump.
          const mySpades = hand.filter(c => c.isSpade).length;
          if (mySpades >= 4 && card.value >= 12) score += 5;
          else score -= 3; // Don't waste spades leading with few
        }
      }

      // ===== FACTOR 2: FOLLOWING — WE CAN WIN =====
      // We're not leading, and this card would take the trick.
      else if (wouldWin) {
        if (ctx && ctx.myTricks < ctx.myBid) {
          // NEED MORE TRICKS to make our bid — winning is valuable!
          score += 10;

          // But win CHEAPLY. Don't play the A♠ when the 5♠ would do.
          // (-0.3 per rank value = prefer lower winning cards)
          score -= card.value * 0.3;

          // Don't TRUMP (play a spade on a non-spade lead) unless
          // we really need the trick. Trumping wastes a spade that
          // could win a future trick.
          if (card.isSpade && leadSuit !== 'spades') score -= 5;
        } else {
          // ALREADY MET OUR BID — extra tricks are BAGS.
          // 10 bags = -100 penalty. Actively try to lose!
          score -= 3;
          if (card.isSpade) score -= 5; // Especially don't waste spades
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
      // If our partner already played and is currently winning,
      // DON'T overtake them. Play low and save your high cards.
      //
      // Example: Partner played K♥ and is winning. We have A♥.
      // Bad play: A♥ (wastes our ace on a trick partner already won)
      // Good play: 3♥ (save the ace for a trick where it matters)
      if (this.difficulty === 'hard' && partnerPlayed) {
        const partnerCard = trick[1]; // Partner is 2 positions back
        if (partnerCard && this._isWinning(partnerCard, trick, leadSuit)) {
          score += (14 - card.value) * 0.8; // Play low when partner's winning
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
      // Two sides of the same coin:
      //
      // A) OWN TEAM MADE BID → avoid winning more tricks (bags)
      //    If our team (me + partner) has already won enough tricks
      //    to make our combined bid, every extra trick is a bag.
      //    10 bags = -100 penalty. Actively try to LOSE.
      //
      // B) OPPONENTS MADE BID → force them to win extra tricks
      //    If the opposing team has made their bid, every trick we
      //    force on them is a bag. Lead into them, play high cards
      //    that force them to overtake.
      if (ctx && ctx.allPlayers && ctx.teamMode) {
        // Calculate team trick totals
        const myTeamTricks = ctx.allPlayers.filter(p => p.team === ctx.myTeam)
          .reduce((s, p) => s + p.tricks, 0);
        const myTeamBid = ctx.allPlayers.filter(p => p.team === ctx.myTeam && p.bid > 0)
          .reduce((s, p) => s + p.bid, 0);
        const oppTeamTricks = ctx.allPlayers.filter(p => p.team !== ctx.myTeam)
          .reduce((s, p) => s + p.tricks, 0);
        const oppTeamBid = ctx.allPlayers.filter(p => p.team !== ctx.myTeam && p.bid > 0)
          .reduce((s, p) => s + p.bid, 0);

        const myTeamMade = myTeamTricks >= myTeamBid && myTeamBid > 0;
        const oppTeamMade = oppTeamTricks >= oppTeamBid && oppTeamBid > 0;

        // A) Our team made bid — AVOID bags
        if (myTeamMade) {
          if (wouldWin) {
            score -= 8;  // Don't win tricks we don't need
            if (card.isSpade) score -= 5; // Especially don't trump
          } else {
            score += 3;  // Good — we're not winning
          }
        }

        // B) Opponents made bid — FORCE bags on them
        if (oppTeamMade) {
          if (isLeading) {
            // Lead HIGH cards to force opponents to play over us
            // or take the trick themselves
            if (card.value >= 12) score += 5;
            if (card.value === 14) score += 3; // Aces force responses
          }
          if (wouldWin && !myTeamMade) {
            // Win tricks to deny opponents the chance to duck
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
