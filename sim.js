// Headless Spades simulator: plays thousands of complete AI-vs-AI games with
// the real rules (rules.js) and AI (ai.js), checks every rule invariant on
// every trick, and reports how the table plays — so the AI's bidding and play
// can be compared with real-world Spades.
// Run with: node sim.js [games] [easy|medium|hard|mixed] [teams|cutthroat]

const vm = require('vm');
const fs = require('fs');

const GAMES = parseInt(process.argv[2] || '2000');
const DIFF = process.argv[3] || 'hard';
const MODE = process.argv[4] || 'teams';
// House rules: comma list of jokers, board, nonil
const HR = (process.argv[5] || '').split(',');

const sandbox = { console, Math, document: undefined };
vm.createContext(sandbox);
for (const f of ['card.js', 'player.js', 'rules.js', 'ai.js']) {
  vm.runInContext(fs.readFileSync(__dirname + '/' + f, 'utf8'), sandbox, { filename: f });
}

const code = `
(function run(GAMES, DIFF, MODE, HR) {
  const teamMode = MODE === 'teams';
  const rules = Object.assign({}, DEFAULT_HOUSE_RULES, {
    jokers: HR.includes('jokers'), minTeamBid: HR.includes('board') ? 4 : 0,
    nil: !HR.includes('nonil'), blindNil: !HR.includes('nonil') });
  const S = { games: 0, hands: 0, violations: [], bidTotal: 0, bidHist: {}, sets: 0, contracts: 0,
    nils: 0, nilMade: 0, blindNils: 0, blindNilMade: 0, bags: 0, bagPenalties: 0, bostons: 0,
    exactMade: 0, handsPerGame: [], ties: 0, overtricks: 0, mercyEnds: 0 };
  const fail = (msg) => { if (S.violations.length < 20) S.violations.push(msg); };
  const diffs = ['easy', 'medium', 'hard'];

  for (let g = 0; g < GAMES; g++) {
    const players = [0, 1, 2, 3].map(i => {
      const p = new Player('P' + i, false, i);
      p.ai = new AI(DIFF === 'mixed' ? diffs[Math.floor(Math.random() * 3)] : DIFF);
      p.team = teamMode ? i % 2 : -1; p.score = 0; p.bags = 0;
      return p;
    });
    const teams = [{ score: 0, bags: 0 }, { score: 0, bags: 0 }];
    let dealer = Math.floor(Math.random() * 4), hands = 0;
    const scores = () => teamMode ? teams.map(t => t.score) : players.map(p => p.score);

    while (!gameOutcome(scores(), 500).over && hands < 200) {
      hands++; S.hands++;
      for (const p of players) p.resetRound();
      const deck = shuffle(createDeck(rules.jokers));
      for (let i = 0; i < 52; i++) players[(dealer + 1 + i) % 4].hand.push(deck[i]);

      // Bidding, clockwise from the dealer's left
      for (let k = 1; k <= 4; k++) {
        const p = players[(dealer + k) % 4];
        const partner = players[(p.index + 2) % 4];
        const mine = teamMode ? teams[p.team].score : p.score;
        const theirs = teamMode ? teams[1 - p.team].score : Math.max(...players.filter(q => q !== p).map(q => q.score));
        const lim = bidLimits(rules, teamMode, teamMode ? partner.bid : -1);
        const ctx = { teamBags: teamMode ? teams[p.team].bags : p.bags, teamMode,
          myScore: mine, oppScore: theirs, target: 500, jokers: rules.jokers,
          minBid: lim.minBid, allowNil: lim.allowNil, allowBlindNil: rules.blindNil && lim.allowNil };
        if (teamMode && p.ai.chooseBlindNil && p.ai.chooseBlindNil(partner.bid, ctx)) {
          p.bid = 0; p.blindNil = true;
        } else {
          p.bid = p.ai.chooseBid(p.hand, teamMode ? partner.bid : -1, ctx);
        }
        if (!(p.bid >= 0 && p.bid <= 13 && Number.isInteger(p.bid))) fail('bad bid ' + p.bid);
        if (p.bid === 0 && !lim.allowNil) fail('nil bid when not allowed');
        if (p.bid > 0 && p.bid < lim.minBid) fail('bid ' + p.bid + ' under board minimum ' + lim.minBid);
        S.bidHist[p.bid] = (S.bidHist[p.bid] || 0) + 1;
      }
      S.bidTotal += players.reduce((s, p) => s + p.bid, 0);

      // Play 13 tricks; left of dealer leads the first
      let leader = (dealer + 1) % 4, broken = false;
      const played = [];
      for (let t = 0; t < 13; t++) {
        const trick = [];
        for (let k = 0; k < 4; k++) {
          const p = players[(leader + k) % 4];
          const lead = trick.length ? trick[0].card.suit : null;
          const legal = p.getPlayableCards(lead, broken);
          const ctx = {
            myBid: p.bid, myTricks: p.tricks,
            partnerBid: players[(p.index + 2) % 4].bid, partnerTricks: players[(p.index + 2) % 4].tricks,
            opponentNils: players.filter(q => q !== p && (!teamMode || q.team !== p.team) && q.bid === 0 && q.tricks === 0).map(q => q.index),
            trickPlayers: trick.map(x => x.playerIndex), myIndex: p.index,
            allPlayers: players.map(q => ({ index: q.index, team: q.team, bid: q.bid, tricks: q.tricks })),
            myTeam: p.team, teamMode, played, jokers: rules.jokers,
          };
          const card = p.ai.chooseCard(p.hand, trick.map(x => x.card), lead, broken, ctx);
          if (!card || !legal.some(c => c.equals(card))) { fail('illegal play ' + card + ' lead=' + lead + ' broken=' + broken); }
          if (!lead && card.isSpade && !broken && !p.hand.every(c => c.isSpade)) fail('led spades before broken');
          p.hand = p.hand.filter(c => !c.equals(card));
          if (card.isSpade) broken = true;
          trick.push({ card, playerIndex: p.index });
        }
        played.push(...trick.map(x => x.card));
        const w = trick[trickWinnerIndex(trick.map(x => x.card))].playerIndex;
        players[w].tricks++; leader = w;
      }
      if (players.some(p => p.hand.length)) fail('cards left after 13 tricks');
      if (players.reduce((s, p) => s + p.tricks, 0) !== 13) fail('tricks != 13');

      // Score
      for (const p of players) if (p.bid === 0) {
        if (p.blindNil) { S.blindNils++; if (!p.tricks) S.blindNilMade++; }
        else { S.nils++; if (!p.tricks) S.nilMade++; }
      }
      if (teamMode) {
        for (let t = 0; t < 2; t++) {
          const m = players.filter(p => p.team === t);
          const r = scoreTeamRound(m, teams[t].bags);
          if (r.contract > 0) { S.contracts++; if (r.set) S.sets++; if (r.made && r.won === r.contract) S.exactMade++; if (r.made) S.overtricks += r.won - r.contract; }
          if (m.reduce((s, p) => s + p.tricks, 0) === 13) S.bostons++;
          S.bags += r.newBags; if (r.penalty) S.bagPenalties++;
          teams[t].bags = r.bags; teams[t].score += r.total;
        }
      } else {
        for (const p of players) {
          const r = scoreSoloRound(p, p.bags);
          if (r.contract > 0) { S.contracts++; if (r.set) S.sets++; if (r.made && r.won === r.contract) S.exactMade++; if (r.made) S.overtricks += r.won - r.contract; }
          S.bags += r.newBags; if (r.penalty) S.bagPenalties++;
          p.bags = r.bags; p.score += r.total;
        }
      }
      dealer = (dealer + 1) % 4;
      const sc = scores(), top = Math.max(...sc);
      if (sc.some(s => s >= 500 || s <= -200) && sc.filter(s => s === top).length > 1) S.ties++;
    }
    if (scores().some(s => s <= -200)) S.mercyEnds++;
    S.games++; S.handsPerGame.push(hands);
  }

  const pct = (a, b) => b ? (100 * a / b).toFixed(1) + '%' : '-';
  const sides = teamMode ? 2 : 4;
  console.log('Mode ' + MODE + ', AI ' + DIFF + (HR[0] ? ', rules ' + HR.join('+') : '') + ', ' + S.games + ' games, ' + S.hands + ' hands');
  console.log('  Rule violations:          ' + (S.violations.length ? S.violations.join('; ') : 'none'));
  console.log('  Avg table bid (of 13):    ' + (S.bidTotal / S.hands).toFixed(2));
  console.log('  Contracts set:            ' + pct(S.sets, S.contracts));
  console.log('  Made exactly (no bags):   ' + pct(S.exactMade, S.contracts));
  console.log('  Avg overtricks when made: ' + (S.overtricks / Math.max(1, S.contracts - S.sets)).toFixed(2));
  console.log('  Bags per side per hand:   ' + (S.bags / S.hands / sides).toFixed(2));
  console.log('  Nil bids per hand:        ' + (S.nils / S.hands).toFixed(3) + '  made ' + pct(S.nilMade, S.nils));
  console.log('  Blind nils per game:      ' + (S.blindNils / S.games).toFixed(3) + '  made ' + pct(S.blindNilMade, S.blindNils));
  console.log('  Bostons (13 tricks):      ' + S.bostons);
  console.log('  Hands per game:           ' + (S.handsPerGame.reduce((a, b) => a + b, 0) / S.games).toFixed(1));
  console.log('  Games ended by -200:      ' + pct(S.mercyEnds, S.games));
  console.log('  Tied finishes replayed:   ' + S.ties);
  console.log('  Bid histogram:            ' + JSON.stringify(S.bidHist));
  return S.violations.length;
})(${GAMES}, '${DIFF}', '${MODE}', ${JSON.stringify(HR)})`;

const violations = vm.runInContext(code, sandbox);
process.exit(violations ? 1 : 0);
