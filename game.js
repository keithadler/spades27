/**
 * @file game.js — Main game controller for Spades.
 * @author Keith Adler
 * @copyright 2026 Keith Adler. MIT License.
 */

function escHTML(str) {
  const el = document.createElement('span');
  el.textContent = str;
  return el.innerHTML;
}

class Game {
  constructor() {
    this.players = [];
    this.currentPlayer = 0;
    this.dealer = 0;
    this.targetScore = 500;
    this.teamMode = true;
    this.teams = [{ score: 0, bags: 0 }, { score: 0, bags: 0 }];
    this.trick = []; // {card, playerIndex}[]
    this.trickLeader = 0;
    this.spadesBroken = false;
    this.roundOver = false;
    this.gameOver = false;
    this.gameLog = [];
    this._roundNum = 0;
    this._gameSpeed = localStorage.getItem('spades_speed') || 'normal';
    this._theme = localStorage.getItem('spades_theme') || 'dark';
    document.body.setAttribute('data-theme', this._theme);
    this._trashTalkFreq = parseInt(localStorage.getItem('spades_trash_talk') || '2');
    this._soundMuted = localStorage.getItem('spades_muted') === '1';
    this._colorblindMode = localStorage.getItem('spades_colorblind') === '1';
    if (this._colorblindMode) document.body.classList.add('colorblind');
    this._playLock = false;
    this._trickNum = 0;
    this._gameEpoch = 0;
    this.rules = getHouseRules();

    this._playTimeInterval = setInterval(() => {
      if (!this.gameOver && this.players.length > 0 && document.visibilityState === 'visible') trackPlayTime(60);
    }, 60000);

    this._initUI();
  }

  _speedMs(ms) {
    const mult = { fast: 0.4, normal: 1, slow: 1.6 };
    return Math.round(ms * (mult[this._gameSpeed] || 1));
  }

  // Game-flow timer that dies if a new game starts (or the game ends)
  // before it fires. Without this, a pending "AI is thinking" timeout
  // from an abandoned game plays cards into the next one, spawning a
  // second turn loop that corrupts tricks and deadlocks the round.
  _gameTimeout(fn, ms) {
    const epoch = this._gameEpoch;
    return setTimeout(() => { if (epoch === this._gameEpoch) fn(); }, ms);
  }

  _haptic(pattern) { try { if (navigator.vibrate) navigator.vibrate(pattern || 15); } catch(e) {} }
  _getLang() { return localStorage.getItem('spades_lang') || detectBrowserLang(); }
  _t(key) {
    const loc = getLocale(this._getLang());
    return (loc.ui && loc.ui[key]) || (LOCALES.en.ui && LOCALES.en.ui[key]) || key;
  }

  showScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (id === 'menu-screen') {
      const resumeBtn = document.getElementById('resume-game');
      if (resumeBtn) resumeBtn.style.display = localStorage.getItem('spades_saved_game') ? '' : 'none';
    }
  }

  _initUI() {
    document.querySelectorAll('.btn-group').forEach(group => {
      group.querySelectorAll('.btn-option').forEach(btn => {
        btn.addEventListener('click', () => {
          group.querySelectorAll('.btn-option').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this._onMenuChange();
        });
      });
    });

    document.getElementById('start-game').addEventListener('click', () => this.startGame(false));
    document.getElementById('resume-game').addEventListener('click', () => this._resumeGame());
    // Show resume button if saved game exists
    const resumeBtn = document.getElementById('resume-game');
    if (resumeBtn && localStorage.getItem('spades_saved_game')) resumeBtn.style.display = '';
    document.getElementById('play-again').addEventListener('click', () => this.showScreen('menu-screen'));
    document.getElementById('rematch-btn').addEventListener('click', () => this.startGame(true));

    document.getElementById('menu-btn').addEventListener('click', () => {
      document.getElementById('game-dropdown').classList.toggle('hidden');
    });

    document.getElementById('ragequit-btn').addEventListener('click', () => {
      document.getElementById('game-dropdown').classList.add('hidden');
      const taunts = getLocale(this._getLang()).ui.rageQuitTaunts || LOCALES.en.ui.rageQuitTaunts;
      document.getElementById('ragequit-phrase').innerHTML = taunts[Math.floor(Math.random() * taunts.length)].replace(/\n/g, '<br>');
      document.getElementById('ragequit-overlay').classList.remove('hidden');
    });
    document.getElementById('ragequit-yes').addEventListener('click', () => {
      document.getElementById('ragequit-overlay').classList.add('hidden');
      recordLoss(getPlayerName());
      this.gameOver = true;
      this._gameEpoch++; // kill in-flight AI turn timers
      this._clearSavedGame();
      this._hideThinking();
      document.body.classList.remove('bidding');
      for (const id of ['message-overlay', 'bid-overlay']) {
        const el = document.getElementById(id);
        if (el) { el.classList.add('hidden'); el.innerHTML = ''; }
      }
      this.showScreen('menu-screen');
    });
    document.getElementById('ragequit-no').addEventListener('click', () => {
      document.getElementById('ragequit-overlay').classList.add('hidden');
    });

    document.getElementById('stats-btn').addEventListener('click', () => {
      document.getElementById('game-dropdown').classList.add('hidden');
      this._renderStats();
      document.getElementById('stats-overlay').classList.remove('hidden');
    });
    document.getElementById('stats-close-btn').addEventListener('click', () => {
      document.getElementById('stats-overlay').classList.add('hidden');
    });
    document.getElementById('prefs-btn').addEventListener('click', () => {
      document.getElementById('game-dropdown').classList.add('hidden');
      this._renderPrefs();
      document.getElementById('prefs-overlay').classList.remove('hidden');
    });
    document.getElementById('prefs-close-btn').addEventListener('click', () => {
      document.getElementById('prefs-overlay').classList.add('hidden');
    });
    document.getElementById('rules-btn').addEventListener('click', () => {
      document.getElementById('game-dropdown').classList.add('hidden');
      document.getElementById('rules-overlay').classList.remove('hidden');
    });
    document.getElementById('rules-close-btn').addEventListener('click', () => {
      document.getElementById('rules-overlay').classList.add('hidden');
    });
    document.getElementById('tutorial-btn').addEventListener('click', () => {
      document.getElementById('game-dropdown').classList.add('hidden');
      showTutorial();
    });
    document.getElementById('shortcuts-btn').addEventListener('click', () => {
      document.getElementById('game-dropdown').classList.add('hidden');
      document.getElementById('shortcuts-overlay').classList.toggle('hidden');
    });
    document.getElementById('shortcuts-close-btn').addEventListener('click', () => {
      document.getElementById('shortcuts-overlay').classList.add('hidden');
    });
    document.getElementById('log-btn').addEventListener('click', () => {
      document.getElementById('game-dropdown').classList.add('hidden');
      this._renderLog();
      document.getElementById('log-overlay').classList.remove('hidden');
    });
    document.getElementById('log-close-btn').addEventListener('click', () => {
      document.getElementById('log-overlay').classList.add('hidden');
    });

    // House rule toggles on the menu (take effect at the next new game)
    document.querySelectorAll('#house-rules .rule-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const r = getHouseRules(), k = btn.dataset.rule;
        if (k === 'minTeamBid') r.minTeamBid = r.minTeamBid ? 0 : 4;
        else r[k] = !r[k];
        if (k === 'nil' && !r.nil) r.blindNil = false;       // no Blind Nil without Nil
        if (k === 'blindNil' && r.blindNil) r.nil = true;
        setHouseRules(r);
        this._renderHouseRules();
      });
    });
    this._renderHouseRules();

    document.getElementById('last-trick-btn').addEventListener('click', () => this._toggleLastTrick());
    document.getElementById('last-trick-pop').addEventListener('click', () => this._hideLastTrick());

    const nameInput = document.getElementById('player-name-input');
    if (nameInput) {
      nameInput.value = getPlayerName();
      nameInput.addEventListener('change', () => {
        const name = nameInput.value.trim().slice(0, 12) || _tUI('playerName');
        setPlayerName(name); nameInput.value = name;
        this._updateRoster();
      });
    }

    document.addEventListener('keydown', (e) => {
      const key = e.key.toLowerCase();
      const gameScreen = document.getElementById('game-screen');
      if (!gameScreen.classList.contains('active')) return;

      // Ignore shortcuts while typing in a text field (e.g. in-game name edit)
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;

      // Escape: close overlays/dropdown
      if (key === 'escape') {
        const dd = document.getElementById('game-dropdown');
        if (dd && !dd.classList.contains('hidden')) { dd.classList.add('hidden'); return; }
        for (const id of ['rules-overlay','log-overlay','shortcuts-overlay','stats-overlay','prefs-overlay','ragequit-overlay']) {
          const el = document.getElementById(id);
          if (el && !el.classList.contains('hidden')) { el.classList.add('hidden'); return; }
        }
        return;
      }

      // Don't process shortcuts if an overlay is open (except Esc above)
      const anyOverlay = ['rules-overlay','log-overlay','shortcuts-overlay','stats-overlay','prefs-overlay','bid-overlay','message-overlay']
        .some(id => { const el = document.getElementById(id); return el && !el.classList.contains('hidden'); });
      if (anyOverlay && key !== '?') return;

      // ? = Toggle shortcuts
      if (key === '?' || key === '/') {
        document.getElementById('shortcuts-overlay').classList.toggle('hidden');
        return;
      }

      // M = Menu dropdown
      if (key === 'm') { document.getElementById('game-dropdown').classList.toggle('hidden'); return; }

      // Close dropdown if open for other keys
      const dd = document.getElementById('game-dropdown');
      if (dd && !dd.classList.contains('hidden')) dd.classList.add('hidden');

      // R = Rules
      if (key === 'r') { document.getElementById('rules-overlay').classList.remove('hidden'); return; }
      // G = Game log
      if (key === 'l') { this._toggleLastTrick(); return; }
      if (key === 'g') { this._renderLog(); document.getElementById('log-overlay').classList.remove('hidden'); return; }
      // A = Stats & Achievements
      if (key === 'a') { this._renderStats(); document.getElementById('stats-overlay').classList.remove('hidden'); return; }
      // E = Preferences
      if (key === 'e') { this._renderPrefs(); document.getElementById('prefs-overlay').classList.remove('hidden'); return; }

      // 1-9 = Select card by position (during human turn)
      if (key >= '1' && key <= '9' && this.currentPlayer === 0 && !this._playLock) {
        const idx = parseInt(key) - 1;
        const cards = document.querySelectorAll('.hand-card.playable');
        if (cards[idx]) cards[idx].click();
        return;
      }
    });

    // Re-fan the hand when the window changes size (only during trick play,
    // so a resize can never reveal the cards before a Blind Nil decision)
    let resizeQueued = false;
    window.addEventListener('resize', () => {
      if (resizeQueued) return;
      resizeQueued = true;
      requestAnimationFrame(() => {
        resizeQueued = false;
        if (this.players[0] && this._trickNum >= 1 && !this.roundOver && !this.gameOver) this._updateUI();
      });
    });

    this.music = new MusicEngine();
    this.sfx = new SFX();
    this._updateRoster();
    this._applyLocale();

    // First-visit language picker (like dominoes)
    if (!localStorage.getItem('spades_lang_chosen')) {
      this._showFirstVisitLangPicker();
    } else if (!localStorage.getItem('spades_tutorial_done')) {
      showTutorial();
    }
  }

  _getOption(groupId) {
    const el = document.getElementById(groupId);
    if (!el) return null;
    const active = el.querySelector('.active');
    return active ? active.dataset.value : null;
  }

  _onMenuChange() {
    const scoreVal = this._getOption('target-score');
    const customInput = document.getElementById('custom-score-input');
    if (customInput) customInput.style.display = scoreVal === 'custom' ? '' : 'none';
    const speed = this._getOption('game-speed');
    if (speed) { this._gameSpeed = speed; localStorage.setItem('spades_speed', speed); }
    this._updateRoster();
  }

  startGame(rematch) {
    this._gameEpoch++; // invalidate any pending timers from a previous game
    document.body.classList.remove('bidding');
    const scoreOpt = this._getOption('target-score') || '500';
    if (scoreOpt === 'custom') {
      const ci = document.getElementById('custom-score-input');
      this.targetScore = Math.max(100, Math.min(1000, parseInt(ci && ci.value) || 500));
    } else this.targetScore = parseInt(scoreOpt);

    const modeSetting = this._getOption('game-mode') || 'teams';
    this.teamMode = modeSetting === 'teams';
    const diffSetting = this._getOption('ai-difficulty') || 'mixed';
    const difficulties = ['easy', 'medium', 'hard'];

    if (rematch && this.players.length === 4) {
      if (this.teamMode) {
        this.teams = [{ score: 0, bags: 0 }, { score: 0, bags: 0 }];
      } else {
        this.teams = null;
        for (const p of this.players) p.score = 0;
        for (const p of this.players) p.bags = 0;
      }
      for (const p of this.players) p.resetRound();
      this.gameOver = false; this.gameLog = []; this._roundNum = 0;
      this._wasDown100 = false; this._gameBagsAccrued = 0;
      this.dealer = 0;
      this.showScreen('game-screen');
      if (this.music) { this.music.init(); this.music.start(); }
      this.startRound();
      return;
    }

    if (!this._previewNames) {
      const picked = pickCast(3, [getHumanPortrait()]);
      this._previewNames = picked.map(p => p.name);
      this._previewCities = picked.map(p => p.city);
      this._previewPortraits = picked.map(p => p.portrait);
      this._previewDiffs = this._previewNames.map(() => difficulties[Math.floor(Math.random() * 3)]);
      this._previewPersonalities = this._previewNames.map(() => AI_PERSONALITIES[Math.floor(Math.random() * AI_PERSONALITIES.length)]);
      this._previewNames.forEach((n, i) => seedAIRecord(n, this._previewDiffs[i]));
    }

    const resolvedDiffs = this._previewDiffs.map(d => {
      if (diffSetting === 'easy') return 'easy';
      if (diffSetting === 'hard') return 'hard';
      return d;
    });

    this.players = [];
    const you = new Player(getPlayerName(), true, 0);
    you.avatar = portraitURL(getHumanPortrait());
    you.team = this.teamMode ? 0 : -1;
    you.score = 0; you.bags = 0;
    this.players.push(you);

    for (let i = 0; i < 3; i++) {
      const p = new Player(this._previewNames[i], false, i + 1);
      p.ai = new AI(resolvedDiffs[i]);
      p.team = this.teamMode ? (i === 1 ? 0 : 1) : -1; // index 0&2 = team 0, 1&3 = team 1
      p.avatar = portraitURL(this._previewPortraits[i]);
      p.personality = this._previewPersonalities[i];
      p.generation = PHRASE_GENS[Math.floor(Math.random() * PHRASE_GENS.length)];
      p.city = this._previewCities[i];
      p.score = 0; p.bags = 0;
      this.players.push(p);
    }

    // Fix team assignments for partnership: 0&2 vs 1&3
    if (this.teamMode) {
      this.players[0].team = 0;
      this.players[1].team = 1;
      this.players[2].team = 0;
      this.players[3].team = 1;
      this.teams = [{ score: 0, bags: 0 }, { score: 0, bags: 0 }];
    } else {
      this.teams = null;
    }

    this.gameOver = false; this.gameLog = []; this._roundNum = 0;
    this._wasDown100 = false; this._gameBagsAccrued = 0;
    this.dealer = Math.floor(Math.random() * 4);
    this.rules = getHouseRules();

    this.showScreen('game-screen');
    if (this.music) { this.music.init(); this.music.start(); }
    this._updateXPBar();
    this.startRound();
  }

  _saveGameState() {
    if (!this.players || this.players.length === 0 || this.gameOver) return;
    const state = {
      players: this.players.map(p => ({
        name: p.name, isHuman: p.isHuman, index: p.index, score: p.score || 0,
        team: p.team, avatar: p.avatar, city: p.city, bags: p.bags || 0,
        hand: p.hand.map(c => [c.suit, c.rank]),
        bid: p.bid, blindNil: p.blindNil, tricks: p.tricks,
        aiDiff: p.ai ? p.ai.difficulty : null,
        personality: p.personality, generation: p.generation
      })),
      teams: this.teams,
      currentPlayer: this.currentPlayer, dealer: this.dealer,
      targetScore: this.targetScore, teamMode: this.teamMode, rules: this.rules,
      spadesBroken: this.spadesBroken, roundNum: this._roundNum,
      trickNum: this._trickNum, trickLeader: this.trickLeader,
      trick: this.trick.map(t => ({ suit: t.card.suit, rank: t.card.rank, playerIndex: t.playerIndex })),
      gameLog: this.gameLog,
      wasDown100: this._wasDown100 || false,
      gameBagsAccrued: this._gameBagsAccrued || 0,
      lastTrickWinner: this._lastTrickWinner ?? -1,
      played: (this._played || []).map(c => [c.suit, c.rank]),
      trickCombo: this._trickCombo || 0
    };
    localStorage.setItem('spades_saved_game', JSON.stringify(state));
  }

  _loadGameState() {
    const raw = localStorage.getItem('spades_saved_game');
    if (!raw) return false;
    try {
      const s = JSON.parse(raw);
      this.players = s.players.map(p => {
        const pl = new Player(p.name, p.isHuman, p.index);
        pl.score = p.score; pl.team = p.team; pl.avatar = p.avatar;
        pl.city = p.city; pl.bags = p.bags || 0;
        pl.hand = p.hand.map(c => new Card(c[0], c[1]));
        pl.bid = p.bid; pl.blindNil = p.blindNil; pl.tricks = p.tricks;
        if (p.aiDiff) { pl.ai = new AI(p.aiDiff); pl.personality = p.personality; pl.generation = p.generation; }
        return pl;
      });
      this.teams = s.teams;
      this.currentPlayer = s.currentPlayer; this.dealer = s.dealer;
      this.targetScore = s.targetScore; this.teamMode = s.teamMode;
      this.rules = Object.assign({}, DEFAULT_HOUSE_RULES, s.rules);
      this.spadesBroken = s.spadesBroken; this._roundNum = s.roundNum;
      this._trickNum = s.trickNum; this.trickLeader = s.trickLeader;
      this.trick = s.trick.map(t => ({ card: new Card(t.suit, t.rank), playerIndex: t.playerIndex }));
      this.gameLog = s.gameLog || [];
      this._wasDown100 = s.wasDown100 || false;
      this._gameBagsAccrued = s.gameBagsAccrued || 0;
      this._lastTrickWinner = s.lastTrickWinner ?? -1;
      this._played = (s.played || []).map(c => new Card(c[0], c[1]));
      this._trickCombo = s.trickCombo || 0;
      this.roundOver = false; this.gameOver = false; this._playLock = false;
      localStorage.removeItem('spades_saved_game');
      return true;
    } catch(e) { localStorage.removeItem('spades_saved_game'); return false; }
  }

  _resumeGame() {
    if (!this._loadGameState()) return;
    this._gameEpoch++;
    if (!this.sfx) this.sfx = new SFX();
    if (this.music) { this.music.init(); this.music.start(); }
    this.showScreen('game-screen');
    this._updateXPBar();
    this._updateUI();
    this._renderTrickArea();
    // Saved during the deal or the bidding: carry on bidding
    if (this._trickNum < 1) { this._renderHumanHand(this.players[0], []); this._startBidPhase(true); return; }
    this._doTurn();
  }

  _clearSavedGame() { localStorage.removeItem('spades_saved_game'); }

  startRound() {
    this._roundNum++;
    this.roundOver = false;
    this.spadesBroken = false;
    this.trick = [];
    this._trickNum = 0;
    this._playLock = false;
    this._lastTrickWinner = -1;
    this._trickCombo = 0;
    this._lastTrick = null;
    this._played = [];
    this._hideLastTrick();

    for (const p of this.players) p.resetRound();

    const deck = shuffle(createDeck(this.rules && this.rules.jokers));
    for (let i = 0; i < 52; i++) {
      this.players[i % 4].hand.push(deck[i]);
    }
    for (const p of this.players) sortHand(p.hand);
    // Save the deal right away: reloading must never be a free re-deal
    this._saveGameState();

    if (this.sfx) this.sfx.shuffle();

    // DON'T show human hand yet — blind nil decision comes first
    this._updateScoreBar();
    this._renderAllHands();

    if (this._roundNum === 1) {
      this._showCountdown(() => {
        this._preRoundComments(() => {}); // Fire comments during deal
        this._animateDeal(() => {
          this._showRoundAnnouncement(() => {
            this._startBidPhase();
          });
        });
      });
    } else {
      this._preRoundComments(() => {}); // Fire comments during deal
      this._animateDeal(() => {
        this._showRoundAnnouncement(() => {
          this._startBidPhase();
        });
      });
    }
  }

  _startBidPhase(resumed) {
    this._bidOrder = [];
    for (let i = 1; i <= 4; i++) this._bidOrder.push((this.dealer + i) % 4);
    // Resuming a saved game mid-bidding picks up with the next bidder
    this._currentBidIdx = this._bidOrder.filter(i => this.players[i].hasBid).length;
    // Blind nil: only in team mode, only when your team is down 100+
    const canBlind = this.teamMode && this.teams && this.rules.blindNil && this.teams[0].score <= this.teams[1].score - 100;
    this._humanCanBlindNil = canBlind;
    // After a resume your cards are already on screen, so Blind Nil (a bid
    // made without looking) is off the table for this hand
    this._humanBlindNilAsked = !!resumed;
    this._doBid();
  }

  _doBid() {
    if (this._currentBidIdx > 0) this._saveGameState(); // every bid is final once made
    if (this._currentBidIdx >= 4) {
      // All bids placed — go straight to play (bid tracker is on the table)
      this._renderHumanHand(this.players[0], []);
      this.trickLeader = (this.dealer + 1) % 4;
      this.currentPlayer = this.trickLeader;
      this._trickNum = 1;
      this._doTurn();
      return;
    }

    const playerIdx = this._bidOrder[this._currentBidIdx];
    const player = this.players[playerIdx];

    if (player.isHuman) {
      // Blind nil: ask BEFORE showing cards, only once
      // (and only if Nil is open to you right now — the board may forbid it)
      if (this._humanCanBlindNil && !this._humanBlindNilAsked && this._bidLimitsFor(player).allowNil) {
        this._humanBlindNilAsked = true;
        this._askBlindNil(player, (accepted) => {
          if (accepted) {
            player.bid = 0;
            player.blindNil = true;
            trackStat('nilsAttempted');
            if (this.sfx) this.sfx.nilBid();
            this._renderHumanHand(player, []);
            this._currentBidIdx++;
            this._doBid();
          } else {
            this._renderHumanHand(player, []);
            this._showHumanBidUI(player);
          }
        });
      } else {
        this._renderHumanHand(player, []);
        this._showHumanBidUI(player);
      }
    } else {
      this._showThinking(player);
      this._gameTimeout(() => {
        this._hideThinking();
        const partnerIdx = (playerIdx + 2) % 4;
        const partnerBid = this.teamMode ? this.players[partnerIdx].bid : -1;
        const teamBags = this.teamMode && this.teams ? this.teams[player.team].bags : 0;
        const myScore = this.teamMode ? this.teams[player.team].score : (player.score || 0);
        const oppScore = this.teamMode ? this.teams[1 - player.team].score
          : Math.max(...this.players.filter(p => p !== player).map(p => p.score || 0));
        const lim = this._bidLimitsFor(player);
        const ctx = { teamBags, teamMode: this.teamMode, myScore, oppScore, target: this.targetScore,
          jokers: this.rules.jokers, minBid: lim.minBid, allowNil: lim.allowNil, allowBlindNil: this.rules.blindNil && lim.allowNil };
        // Blind Nil is called before looking at the cards, so it comes first
        const blind = player.ai.chooseBlindNil(partnerBid, ctx);
        const bid = blind ? 0 : player.ai.chooseBid(player.hand, partnerBid, ctx);
        player.bid = bid;
        player.blindNil = blind;
        if (this.sfx) { bid === 0 ? this.sfx.nilBid() : this.sfx.bid(); }
        this._showBidAnnouncementFX(player, bid, () => {
          this._currentBidIdx++;
          this._doBid();
        });
      }, this._speedMs(1200 + Math.random() * 800));
    }
  }

  _renderHouseRules() {
    const r = getHouseRules();
    const labels = { nil: 'hrNil', blindNil: 'hrBlindNil', minTeamBid: 'hrBoard', jokers: 'hrJokers' };
    document.querySelectorAll('#house-rules .rule-toggle').forEach(btn => {
      const k = btn.dataset.rule;
      const on = k === 'minTeamBid' ? !!r.minTeamBid : !!r[k];
      btn.classList.toggle('on', on);
      btn.setAttribute('aria-pressed', on);
      btn.textContent = this._t(labels[k]);
    });
  }

  /** Bid limits for `player` under the house rules (board minimum, Nil allowed). */
  _bidLimitsFor(player) {
    const partnerBid = this.teamMode ? this.players[(player.index + 2) % 4].bid : -1;
    return bidLimits(this.rules, this.teamMode, partnerBid);
  }

  _askBlindNil(player, callback) {
    const overlay = document.getElementById('bid-overlay');
    overlay.classList.remove('hidden');
    const gap = Math.abs(this.teams[0].score - this.teams[1].score);
    let bidsHtml = this._buildBidsSoFar();
    overlay.innerHTML = `<div class="bid-panel">
      <h2>🙈 ${this._t('blindNil')}?</h2>
      <p style="opacity:0.7;margin-bottom:12px;line-height:1.6;">${this._t('teamDown')} ${gap} ${this._t('points')}.<br>
      ${this._t('blindNil')} <strong>${this._t('beforeSeeing')}</strong>: +200 / -200</p>
      ${bidsHtml}
      <div style="display:flex;gap:12px;justify-content:center;margin-top:20px;">
        <button id="blind-nil-yes" class="btn-start" style="background:linear-gradient(145deg,#a855f7,#7c3aed);padding:14px 28px;">🙈 ${this._t('goBlindNil')}</button>
        <button id="blind-nil-no" class="btn-start" style="background:linear-gradient(145deg,rgba(255,255,255,0.15),rgba(255,255,255,0.05));color:#fff;box-shadow:none;padding:14px 28px;">${this._t('noThanks')}</button>
      </div>
    </div>`;
    let answered = false;
    const answer = (accepted) => {
      if (answered) return;
      answered = true;
      overlay.classList.add('hidden'); overlay.innerHTML = '';
      callback(accepted);
    };
    document.getElementById('blind-nil-yes').addEventListener('click', () => answer(true));
    document.getElementById('blind-nil-no').addEventListener('click', () => answer(false));
  }

  _buildBidsSoFar() {
    // Compact score strip
    let html = '<div class="bid-score-strip">';
    if (this.teamMode && this.teams) {
      html += `<span class="bss-side"><i class="tdot us"></i>${this._t('yourTeam')} <b class="bss-green">${this.teams[0].score}</b></span>
        <span class="bss-vs">vs</span>
        <span class="bss-side"><i class="tdot them"></i>${this._t('opponentsTeam')} <b class="bss-red">${this.teams[1].score}</b></span>`;
    } else {
      for (const p of this.players) {
        html += `<span class="bss-side">${escHTML(p.name)} <b class="bss-blue">${p.score || 0}</b></span>`;
      }
    }
    html += `<span class="bss-target">${this._t('playingTo')} ${this.targetScore}</span></div>`;

    // Bids placed so far, as chips
    const bidsMade = this.players.filter(p => p.hasBid);
    if (bidsMade.length > 0) {
      html += `<div class="bids-so-far"><span class="bsf-label">${this._t('bidsSoFar')}</span>`;
      for (const p of bidsMade) {
        const icon = this.teamMode ? (p.team === 0 ? '<i class="tdot us"></i>' : '<i class="tdot them"></i>') : '';
        const bidText = p.blindNil ? '🙈 BN' : p.bid === 0 ? '🎯 Nil' : p.bid;
        html += `<span class="bsf-chip">${icon} ${escHTML(p.name)} <b>${bidText}</b></span>`;
      }
      html += '</div>';
    }
    return html;
  }

  _showHumanBidUI(player) {
    const overlay = document.getElementById('bid-overlay');
    overlay.classList.remove('hidden');
    document.body.classList.add('bidding');
    let bidsHtml = this._buildBidsSoFar();
    let html = `<div class="bid-panel">
      <h2>${this._t('yourBid')}</h2>
      ${bidsHtml}
      <div class="bid-hand-preview">`;
    // Group the hand by suit — reads like a real hand evaluation
    for (const suit of SUITS) {
      const cards = player.hand.filter(c => c.suit === suit);
      const sample = new Card(suit, 'A');
      html += `<div class="bid-suit-row"><span class="bid-suit-icon" data-suit="${suit}">${sample.symbol}</span><span class="bid-suit-cards">`;
      if (cards.length === 0) {
        html += `<span class="bid-void">-</span>`;
      } else {
        html += cards.map(c => `<span class="bid-card" style="color:${c.color}">${c.rank}</span>`).join('');
      }
      html += `</span></div>`;
    }
    // House rules: the board may set a minimum, and Nil may be off
    const lim = this._bidLimitsFor(player);
    // A suggested bid from the same hand evaluation the Hard AI uses
    const est = bidFromEstimate(new AI('hard').estimateTricks(player.hand, this.rules.jokers), this.rules.jokers);
    const suggested = Math.max(lim.minBid, Math.min(13, est));
    const boardBinds = lim.minBid > 1 || (this.rules.nil && !lim.allowNil);
    const boardNote = boardBinds ? ` · ${escHTML(this._t('boardNote').replace('{n}', this.rules.minTeamBid))}` : '';
    html += `</div><div class="bid-suggest">${escHTML(this._t('suggested'))}: <b>${suggested}</b>${boardNote}</div><div class="bid-buttons">`;
    if (this.rules.nil) html += `<button class="bid-btn bid-nil" data-bid="0"${lim.allowNil ? '' : ' disabled'}>${this._t('nil')}</button>`;
    for (let i = 1; i <= 13; i++) {
      html += `<button class="bid-btn${i === suggested ? ' suggested' : ''}" data-bid="${i}"${i < lim.minBid ? ' disabled' : ''}>${i}</button>`;
    }
    html += `</div></div>`;
    overlay.innerHTML = html;
    let bidPlaced = false;
    overlay.querySelectorAll('.bid-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (bidPlaced || btn.disabled) return;
        bidPlaced = true;
        player.bid = parseInt(btn.dataset.bid);
        player.blindNil = false;
        if (player.bid === 0) trackStat('nilsAttempted');
        overlay.classList.add('hidden'); overlay.innerHTML = '';
        document.body.classList.remove('bidding');
        if (this.sfx) { player.bid === 0 ? this.sfx.nilBid() : this.sfx.bid(); }
        this._currentBidIdx++;
        this._doBid();
      });
    });
  }

  _showBidSummary(callback) {
    const overlay = document.getElementById('message-overlay');
    overlay.classList.remove('hidden');
    let html = `<div class="message-box"><h2 style="margin-bottom:16px;background:linear-gradient(180deg,#fff 20%,#e8c170);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;">${this._t('bidSummary')}</h2>`;
    for (const p of this.players) {
      const teamLabel = this.teamMode ? (p.team === 0 ? '<i class="tdot us"></i>' : '<i class="tdot them"></i>') : '';
      html += `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
        <span>${teamLabel} ${escHTML(p.name)}</span>
        <span style="font-weight:800;color:#e8c170;">${p.blindNil ? '🙈 BLIND NIL' : p.bid === 0 ? 'NIL' : p.bid}</span>
      </div>`;
    }
    if (this.teamMode) {
      const t0Bid = this.players[0].bid + this.players[2].bid;
      const t1Bid = this.players[1].bid + this.players[3].bid;
      html += `<div style="margin-top:12px;font-weight:700;">Team bids: <i class="tdot us"></i>${t0Bid} | <i class="tdot them"></i>${t1Bid}</div>`;
    }
    html += `<button id="bid-summary-ok" class="btn-start" style="margin-top:16px;">${this._t('continue_')}</button></div>`;
    overlay.innerHTML = html;
    document.getElementById('bid-summary-ok').addEventListener('click', () => {
      if (overlay.classList.contains('hidden')) return;
      overlay.classList.add('hidden'); overlay.innerHTML = '';
      callback();
    }, { once: true });
  }

  // === PRE-ROUND COMMENTS ===
  _preRoundComments(callback) {
    if (this._trashTalkFreq === 0) { callback(); return; }
    const comments = this._buildPreRoundComments();
    let shown = 0;
    const showNext = () => {
      if (shown >= comments.length) { callback(); return; }
      const { player, text } = comments[shown];
      if (text && !player.isHuman) this._showSpeechBubble(player, text);
      shown++;
      setTimeout(showNext, this._speedMs(800));
    };
    showNext();
  }

  _buildPreRoundComments() {
    const comments = [];
    const t0 = this.teamMode && this.teams ? this.teams[0].score : 0;
    const t1 = this.teamMode && this.teams ? this.teams[1].score : 0;
    const target = this.targetScore;
    const pick = (arr) => arr && arr.length > 0 ? arr[Math.floor(Math.random() * arr.length)] : '';
    const loc = getLocale(this._getLang());
    const ui = loc.ui || {};

    for (const p of this.players) {
      const myScore = this.teamMode ? (p.team === 0 ? t0 : t1) : (p.score || 0);
      const oppScore = this.teamMode ? (p.team === 0 ? t1 : t0) : Math.max(...this.players.filter(q => q !== p).map(q => q.score || 0));
      const leading = myScore > oppScore && myScore > 0;
      const trailing = myScore < oppScore && oppScore > 0;
      const closeToWin = myScore >= target * 0.7;
      const farBehind = oppScore - myScore > 100;

      let text = '';
      if (this._roundNum === 1) {
        text = p.isHuman ? pick(ui.introHumanFirst) : pick(ui.introAiFirst);
      } else if (closeToWin && leading) {
        text = p.isHuman ? '' : pick(ui.introAiCloseToWin || ui.introAiMid);
      } else if (farBehind) {
        text = p.isHuman ? '' : pick(ui.introAiTrailing || ui.introAiMid);
      } else if (leading) {
        text = p.isHuman ? '' : pick(ui.introAiLeading || ui.introAiMid);
      } else {
        text = p.isHuman ? '' : pick(ui.introAiMid);
      }
      comments.push({ player: p, text });
    }
    return comments;
  }

  // === TRICK PLAY ===

  _doTurn() {
    if (this.roundOver || this.gameOver) return;
    const player = this.players[this.currentPlayer];
    this._updateUI();

    if (!player.isHuman) {
      this._showThinking(player);
      this._gameTimeout(() => {
        this._hideThinking();
        this._aiPlay(player);
      }, this._speedMs(800 + Math.random() * 1000));
    } else {
      this._hideThinking();
      this._enableHumanPlay(player);
    }
  }

  _aiPlay(player) {
    if (this.roundOver || this.gameOver) return;
    const leadSuit = this.trick.length > 0 ? this.trick[0].card.suit : null;
    const trickCards = this.trick.map(t => t.card);
    const partnerIdx = (player.index + 2) % 4;
    // Build opponent nil info: which opponents bid nil and haven't busted yet?
    // In cutthroat every team is -1, so compare players, not teams.
    const oppNils = this.players.filter(p =>
      p !== player && (!this.teamMode || p.team !== player.team) && p.bid === 0 && p.tricks === 0
    ).map(p => p.index);
    // Track which player index played which card in the trick
    const trickPlayers = this.trick.map(t => t.playerIndex);
    const ctx = {
      myBid: player.bid,
      myTricks: player.tricks,
      partnerBid: this.players[partnerIdx].bid,
      partnerTricks: this.players[partnerIdx].tricks,
      opponentNils: oppNils,       // opponent indices who bid nil and haven't busted
      trickPlayers: trickPlayers,  // who played each card in the current trick
      myIndex: player.index,
      // Bag awareness: all players' bids and tricks
      allPlayers: this.players.map(p => ({
        index: p.index, team: p.team, bid: p.bid, tricks: p.tricks
      })),
      myTeam: player.team,
      teamMode: this.teamMode,
      played: this._played || [],  // cards from earlier tricks this hand
      jokers: this.rules.jokers,
    };
    const card = player.ai.chooseCard(player.hand, trickCards, leadSuit, this.spadesBroken, ctx);
    if (card) this._playCard(player, card);
  }

  _enableHumanPlay(player) {
    const leadSuit = this.trick.length > 0 ? this.trick[0].card.suit : null;
    const playable = player.getPlayableCards(leadSuit, this.spadesBroken);
    this._renderHumanHand(player, playable);
  }

  _playCard(player, card) {
    if (this._playLock) return;
    // Refuse anything the rules don't allow: out of turn, not in hand,
    // failing to follow suit, or leading spades before they're broken.
    if (player.index !== this.currentPlayer) return;
    const leadSuit = this.trick.length > 0 ? this.trick[0].card.suit : null;
    if (!player.getPlayableCards(leadSuit, this.spadesBroken).some(c => c.equals(card))) return;
    this._playLock = true;

    // Remove from hand
    player.hand = player.hand.filter(c => !c.equals(card));

    // Track spades broken — use enhanced FX
    if (card.isSpade && !this.spadesBroken) {
      this.spadesBroken = true;
      this._showSpadesBrokenFX();
    }

    // Add to trick
    this.trick.push({ card, playerIndex: player.index });

    if (this.sfx) this.sfx.playCard();
    this._haptic(15);

    // Avatar particles on the player who just played
    this._spawnAvatarParticles(player);

    // Animate card flying to center, then render trick area
    this._animateCardPlay(player.index, card, () => {
      this._renderTrickArea();
    });
    this._updateUI();

    // Highlight human info when it's their turn
    const humanInfo = document.getElementById('human-info');
    if (humanInfo) humanInfo.classList.toggle('my-turn', this.currentPlayer === 0);

    // Trash talk
    if (!player.isHuman && this._trashTalkFreq > 0) {
      const chance = this._trashTalkFreq === 1 ? 0.15 : this._trashTalkFreq === 2 ? 0.3 : 0.5;
      if (Math.random() < chance) {
        const phrase = getPhrase(player, 'opponent');
        if (phrase) this._showSpeechBubble(player, phrase);
      }
    }

    if (this.trick.length === 4) {
      // Trick complete — determine winner
      this._gameTimeout(() => {
        this._resolveTrick();
      }, this._speedMs(1200));
    } else {
      this._gameTimeout(() => {
        this._playLock = false;
        this.currentPlayer = (this.currentPlayer + 1) % 4;
        this._doTurn();
      }, this._speedMs(500));
    }
  }

  _resolveTrick() {
    const winnerIdx = trickWinnerIndex(this.trick.map(t => t.card));

    const winner = this.players[this.trick[winnerIdx].playerIndex];
    winner.tricks++;
    if (winner.isHuman) trackStat('totalTricks', 1);

    // === NIL BUST DETECTION ===
    // If the winner bid Nil or Blind Nil, they just busted!
    if (winner.isNil && winner.tricks === 1) {
      // First trick they've won — their nil is busted
      this._showNilBusted(winner);
    }

    // Track consecutive wins for combo counter
    if (this._lastTrickWinner === undefined) this._lastTrickWinner = -1;
    if (winner.index === this._lastTrickWinner || (this.teamMode && winner.team === this.players[this._lastTrickWinner]?.team)) {
      this._trickCombo = (this._trickCombo || 0) + 1;
      if (this._trickCombo >= 2 && (winner.isHuman || (this.teamMode && winner.team === 0))) {
        this._showComboPopup(this._trickCombo);
      }
    } else {
      this._trickCombo = 1;
    }
    this._lastTrickWinner = winner.index;

    // First trick of the round
    if (this._trickNum === 1) {
      this._showFirstBlood(winner);
    }

    this._lastTrick = { plays: this.trick.map(t => ({ card: t.card, playerIndex: t.playerIndex })), winner: winner.index };
    this._played = (this._played || []).concat(this.trick.map(t => t.card));

    this.gameLog.push({
      round: this._roundNum, trick: this._trickNum,
      cards: this.trick.map(t => ({ player: this.players[t.playerIndex].name, card: t.card.toString() })),
      winner: winner.name
    });

    if (this.sfx) this.sfx.trickWin();

    // Enhanced trick win effects
    this._showTrickWinFX(winner);

    // Score vignette for human team wins
    if (winner.isHuman || (this.teamMode && winner.team === 0)) {
      this._showScoreVignette('good');
    }

    // Show trick winner briefly
    this._showTrickWinner(winner, () => {
      this.trick = [];
      this._trickNum++;
      this._playLock = false;
      this._renderTrickArea();

      if (this._trickNum > 13) {
        this._endRound();
      } else {
        this.trickLeader = winner.index;
        this.currentPlayer = winner.index;
        this._saveGameState();
        this._doTurn();
      }
    });
  }

  _endRound() {
    this.roundOver = true;
    trackStat('totalRounds');

    let humanRoundScore = 0;
    const setTeams = [];

    this._roundScores = null;
    if (this.teamMode) {
      // === TEAM SCORING === (rules.js)
      this._roundScores = [];
      for (let t = 0; t < 2; t++) {
        const members = this.players.filter(p => p.team === t);
        const r = scoreTeamRound(members, this.teams[t].bags);
        this._roundScores.push(r);
        if (r.set) setTeams.push(t);
        if (r.newBags > 0) trackStat('totalBags', r.newBags);
        if (this.sfx && t === 0) {
          for (const p of members) if (p.bid === 0) p.tricks === 0 ? this.sfx.nilSuccess() : this.sfx.nilFail();
          if (r.penalty > 0) this.sfx.bagPenalty();
        }
        this.teams[t].bags = r.bags;
        this.teams[t].score += r.total;
        if (t === 0) humanRoundScore = r.total;
      }
    } else {
      // === CUTTHROAT (INDIVIDUAL) SCORING === (rules.js)
      for (const p of this.players) {
        const r = scoreSoloRound(p, p.bags || 0);
        p.roundScore = r;
        if (r.newBags > 0) trackStat('totalBags', r.newBags);
        if (this.sfx && p.isHuman) {
          if (p.bid === 0) p.tricks === 0 ? this.sfx.nilSuccess() : this.sfx.nilFail();
          if (r.penalty > 0) this.sfx.bagPenalty();
        }
        p.bags = r.bags;
        p.score = (p.score || 0) + r.total;
        if (p.isHuman) humanRoundScore = r.total;
      }
    }

    this._checkRoundAchievements();

    this._updateScoreBar();

    // Round-end FX: floating score popup (+ SET! banner when a team got set),
    // then the results overlay after a beat so the FX are visible under it.
    this._showScorePopup(
      (humanRoundScore >= 0 ? '+' : '') + humanRoundScore,
      undefined, undefined,
      humanRoundScore >= 0 ? '#4aaf6c' : '#e04a3a'
    );
    if (setTeams.length > 0) {
      const name = setTeams.includes(0) ? this._t('yourTeam') : this._t('opponentsTeam');
      setTimeout(() => this._showSetBanner(name), this._speedMs(400));
    }

    this._gameTimeout(() => {
      this._showRoundResults(() => {
        if (this._isGameWon()) { this._endGame(); }
        else { this.dealer = (this.dealer + 1) % 4; this.startRound(); }
      });
    }, this._speedMs(1600));
  }

  _checkRoundAchievements() {
    const human = this.players[0];

    // Nil outcomes
    if (human.bid === 0 && human.tricks === 0) {
      trackStat('nilsSucceeded');
      awardAchievement(human.blindNil ? 'blind_nil' : 'nil_success');
    }

    // Perfect bid: exactly your bid, zero personal bags
    if (human.bid > 0 && human.tricks === human.bid) awardAchievement('perfect_bid');

    // Boston: all 13 tricks in a round
    const humanSideTricks = this.teamMode
      ? this.players.filter(p => p.team === 0).reduce((s, p) => s + p.tricks, 0)
      : human.tricks;
    if (humanSideTricks === 13) awardAchievement('boston');

    // Set the opposing team
    if (this.teamMode) {
      const opp = this.players.filter(p => p.team === 1 && p.bid > 0);
      const oppBid = opp.reduce((s, p) => s + p.bid, 0);
      const oppTricks = opp.reduce((s, p) => s + p.tricks, 0);
      if (oppBid > 0 && oppTricks < oppBid) awardAchievement('set_opponent');
    }

    // Track bags accrued by the human side this game (for Clean Game)
    let sideBags = 0;
    if (this.teamMode) {
      const mates = this.players.filter(p => p.team === 0);
      const nonNilBid = mates.filter(p => p.bid > 0).reduce((s, p) => s + p.bid, 0);
      const nonNilTricks = mates.filter(p => p.bid > 0).reduce((s, p) => s + p.tricks, 0);
      if (nonNilBid > 0 && nonNilTricks > nonNilBid) sideBags = nonNilTricks - nonNilBid;
    } else if (human.bid > 0 && human.tricks > human.bid) {
      sideBags = human.tricks - human.bid;
    }
    this._gameBagsAccrued = (this._gameBagsAccrued || 0) + sideBags;

    // Track trailing by 100+ at any round end (for Comeback Kid)
    const trailing = this.teamMode
      ? this.teams[0].score <= this.teams[1].score - 100
      : (human.score || 0) <= Math.max(...this.players.slice(1).map(p => p.score || 0)) - 100;
    if (trailing) this._wasDown100 = true;

    this._updateXPBar(); // achievements grant XP
  }

  _sideScores() {
    return this.teamMode ? this.teams.map(t => t.score) : this.players.map(p => p.score || 0);
  }

  // Target reached or a side down to -200, with a clear leader. A tie for
  // first keeps the game going for another hand (rules.js gameOutcome).
  _isGameWon() {
    return gameOutcome(this._sideScores(), this.targetScore).over;
  }

  _endGame() {
    this.gameOver = true;
    this._gameEpoch++;
    this._clearSavedGame();
    let humanWon;

    if (this.teamMode) {
      humanWon = gameOutcome(this._sideScores(), this.targetScore).winner === 0;
      for (const p of this.players) {
        if (p.team === (humanWon ? 0 : 1)) recordWin(p.name);
        else recordLoss(p.name);
      }
    } else {
      // Cutthroat: highest score wins
      const winner = this.players[gameOutcome(this._sideScores(), this.targetScore).winner];
      humanWon = winner && winner.isHuman;
      for (const p of this.players) {
        if (p === winner) recordWin(p.name);
        else recordLoss(p.name);
      }
    }

    trackStat('gamesPlayed');
    if (humanWon) {
      trackStat('gamesWon'); trackStat('winStreak'); addXP(50);
      // Victory celebration scales with margin
      let margin;
      if (this.teamMode && this.teams) {
        margin = this.teams[0].score - this.teams[1].score;
      } else {
        const scores = this.players.map(p => p.score || 0).sort((a, b) => b - a);
        margin = scores[0] - (scores[1] || 0);
      }
      if (margin > 200) {
        // Blowout — double confetti + extra particles
        spawnConfetti(); spawnConfetti();
        spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 30, 'particle-gold');
      } else if (margin < 50) {
        // Close game — subtle gold particles only
        spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 20, 'particle-gold');
      } else {
        spawnConfetti();
      }
    }
    else { trackStat('loseStreak'); addXP(10); }
    if (humanWon && this._wasDown100) awardAchievement('comeback');
    if (humanWon && !this._gameBagsAccrued) awardAchievement('no_bags');
    // Track head-to-head vs each AI
    for (const p of this.players) {
      if (!p.isHuman) trackHeadToHead(p.name, humanWon);
    }
    checkAchievements(this);
    this._updateXPBar();

    const container = document.getElementById('final-scores');
    container.innerHTML = '';

    if (this.teamMode) {
      for (let t = 0; t < 2; t++) {
        const isWin = (t === 0) === humanWon;
        const members = this.players.filter(p => p.team === t).map(p => escHTML(p.name)).join(' & ');
        const row = document.createElement('div');
        row.className = 'final-score-row' + (isWin ? ' winner' : '');
        row.innerHTML = `<span>${isWin ? '👑 ' : ''}${t === 0 ? '<i class="tdot us"></i>' : '<i class="tdot them"></i>'}${members}</span><span>${this.teams[t].score} ${this._t('pts')}</span>`;
        container.appendChild(row);
      }
    } else {
      const sorted = [...this.players].sort((a, b) => (b.score || 0) - (a.score || 0));
      for (const p of sorted) {
        const isWin = p === sorted[0];
        const row = document.createElement('div');
        row.className = 'final-score-row' + (isWin ? ' winner' : '');
        row.innerHTML = `<span>${isWin ? '👑 ' : ''}${escHTML(p.name)}</span><span>${p.score || 0} ${this._t('pts')}</span>`;
        container.appendChild(row);
      }
    }

    // Headline: the four aces for a win, greyed out for a loss
    const goScreen = document.getElementById('gameover-screen');
    goScreen.classList.toggle('lost', !humanWon);
    document.getElementById('gameover-eyebrow').textContent = this._t('gameOver');
    document.getElementById('gameover-title').textContent = humanWon
      ? this._t('youWin').replace(/^\W+\s*/u, '')
      : this._t('youLose');
    const hero = document.getElementById('gameover-hero');
    if (hero) hero.innerHTML = ['clubs', 'diamonds', 'hearts', 'spades'].map((su, i) =>
      `<div class="hero-card" style="--i:${i}">${cardFaceSVG(new Card(su, 'A'))}</div>`).join('');

    if (this.sfx) { humanWon ? this.sfx.win() : this.sfx.lose(); }
    this.showScreen('gameover-screen');
  }

  // === UI RENDERING ===
  _getPlayerPosition(idx) {
    // 0=bottom(human), 1=left, 2=top(partner), 3=right
    return ['bottom', 'left', 'top', 'right'][idx];
  }

  _updateUI() {
    this._updateScoreBar();
    this._renderAllHands();
    this._renderTrickInfo();
    this._updateFloatingArrow();
    this._renderBidTracker();
    // Always render human hand — even when empty (clears the last card from DOM).
    // Compute real playability so mid-turn re-renders (name edit, skin change,
    // colorblind toggle) don't strip the click handlers and softlock the turn.
    if (this.players[0]) {
      const p0 = this.players[0];
      const canAct = this.currentPlayer === 0 && !this._playLock && this._trickNum >= 1
        && !this.roundOver && !this.gameOver;
      const playable = canAct
        ? p0.getPlayableCards(this.trick.length ? this.trick[0].card.suit : null, this.spadesBroken)
        : [];
      this._renderHumanHand(p0, playable);
    }
  }

  _updateScoreBar() {
    const bar = document.getElementById('score-bar-content');
    if (!bar) return;
    const roundLabel = this._roundNum ? `<div class="sb-round"><small>${escHTML(this._t('round')).toUpperCase()}</small><b>${this._roundNum}</b></div>` : '';
    const target = `<div class="sb-target">${this._t('playingTo')}<b>${this.targetScore}</b></div>`;

    if (this.teamMode && this.teams) {
      const t0 = this.teams[0], t1 = this.teams[1];
      const side = (t, cls, name, lead) => `
        <div class="sb-team ${cls}${lead ? ' leading' : ''}">
          <div class="sb-names"><span class="sb-team-name">${name}</span><span class="sb-bags">${t.bags} ${escHTML(this._t('bags'))}</span></div>
          <span class="sb-team-score">${t.score}</span>
        </div>`;
      bar.innerHTML = roundLabel
        + side(t0, 'us', this._t('yourTeam'), t0.score > t1.score)
        + `<span class="sb-vs">VS</span>`
        + side(t1, 'them', this._t('opponentsTeam'), t1.score > t0.score)
        + target;
    } else {
      // Cutthroat: show all 4 players individually
      const top = Math.max(...this.players.map(p => p.score || 0));
      let html = roundLabel;
      for (const p of this.players) {
        const cls = (p.isHuman ? ' us' : '') + (p.index === this.currentPlayer ? ' current' : '') + ((p.score || 0) === top && top > 0 ? ' leading' : '');
        html += `<div class="sb-player-score${cls}">
          <div class="sb-names"><span class="sb-ps-name">${escHTML(p.name)}</span><span class="sb-bags">${p.bags || 0} ${escHTML(this._t('bags'))}</span></div>
          <span class="sb-team-score">${p.score || 0}</span>
        </div>`;
      }
      bar.innerHTML = html + target;
    }
  }

  /** Bid / tricks chip for a seat plate. */
  _seatBidChip(p) {
    if (!p.hasBid) return `<div class="seat-bid pending"><b>–</b></div>`;
    if (p.bid === 0) {
      const label = p.blindNil ? 'BLIND NIL' : 'NIL';
      return `<div class="seat-bid nil${p.nilBusted ? ' busted' : ''}"><b>${label}</b>${p.nilBusted ? `<span>&nbsp;${p.tricks}</span>` : ''}</div>`;
    }
    return `<div class="seat-bid${p.tricks >= p.bid ? ' made' : ''}"><b>${p.tricks}</b><span>/${p.bid}</span><small>${escHTML(this._t('bid'))}</small></div>`;
  }

  _seatClass(p) {
    if (!this.teamMode) return p.isHuman ? 'us' : 'ffa';
    return p.team === 0 ? 'partner' : 'opp';
  }

  _renderAllHands() {
    // Dirty check: only rebuild opponent panels if state changed
    const stateKey = this.players.map(p => `${p.index}:${p.tricks}:${p.bid}:${p.hand.length}:${this.currentPlayer}`).join('|') + '|d' + this.dealer;
    if (this._lastHandState === stateKey) return;
    this._lastHandState = stateKey;

    // Render opponent seats (fanned backs + plate) and the human's plate
    if (!this._backSVG) this._backSVG = cardBackSVG();
    for (let i = 1; i <= 3; i++) {
      const pos = this._getPlayerPosition(i);
      const el = document.getElementById('opponent-' + pos);
      if (!el || !this.players[i]) continue;
      const p = this.players[i];
      const isTurn = i === this.currentPlayer;
      const rec = getRecord(p.name);

      const n = p.hand.length;
      el.innerHTML = `
        <div class="seat ${this._seatClass(p)}${isTurn ? ' active' : ''}">
          <div class="seat-fan" aria-hidden="true">${p.hand.map((_, k) => `<div class="mini-card" style="--i:${k};--n:${n}">${this._backSVG}</div>`).join('')}</div>
          <div class="seat-plate">
            <div class="seat-avatar"><img src="${p.avatar}" alt="${escHTML(p.name)}">${p.index === this.dealer ? `<span class="dealer-chip" title="${escHTML(this._t('dealerChip'))}">D</span>` : ''}</div>
            <div class="seat-meta">
              <span class="seat-name">${escHTML(p.name)}</span>
              <span class="seat-sub">${rec.wins}W · ${rec.losses}L</span>
            </div>
            ${this._seatBidChip(p)}
          </div>
        </div>
      `;
    }

    // Human info (preserve XP bar)
    if (this.players[0]) {
      const human = this.players[0];
      const humanInfo = document.getElementById('human-info');
      if (humanInfo) {
        const rec = getRecord(human.name);
        let infoSection = humanInfo.querySelector('.human-info-section');
        if (!infoSection) {
          infoSection = document.createElement('div');
          infoSection.className = 'human-info-section';
          humanInfo.insertBefore(infoSection, humanInfo.firstChild);
        }
        infoSection.innerHTML = `
          <div class="seat ${this._seatClass(human)}${this.currentPlayer === 0 && this._trickNum >= 1 ? ' active' : ''}">
            <div class="seat-plate">
              <div class="seat-avatar"><img class="human-avatar" src="${human.avatar}" alt="${escHTML(human.name)}">${human.index === this.dealer ? `<span class="dealer-chip" title="${escHTML(this._t('dealerChip'))}">D</span>` : ''}</div>
              <div class="seat-meta">
                <span class="seat-name" id="human-name-label" style="cursor:pointer;" title="Double-click to edit">${escHTML(human.name)}</span>
                <span class="seat-sub">${rec.wins}W · ${rec.losses}L</span>
              </div>
              ${this._seatBidChip(human)}
            </div>
          </div>
        `;

        // Double-click to edit name in-game
        const nameLabel = humanInfo.querySelector('#human-name-label');
        if (nameLabel && !nameLabel._dblBound) {
          nameLabel._dblBound = true;
          nameLabel.addEventListener('dblclick', () => {
            const current = getPlayerName();
            const input = document.createElement('input');
            input.type = 'text'; input.className = 'name-edit';
            input.value = current; input.maxLength = 12;
            input.style.cssText = 'width:100px;font-size:0.85rem;padding:2px 6px;';
            nameLabel.replaceWith(input);
            input.focus(); input.select();
            const finish = () => {
              const newName = input.value.trim() || _tUI('playerName');
              setPlayerName(newName);
              if (this.players && this.players[0]) this.players[0].name = newName;
              this._updateUI();
            };
            input.addEventListener('blur', finish);
            input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); finish(); } });
          });
        }
      }
    }
  }

  _renderHumanHand(player, playable) {
    const container = document.getElementById('player-hand');
    container.innerHTML = '';
    const isMyTurn = this.currentPlayer === 0;
    const canAct = isMyTurn && playable.length > 0;
    container.classList.toggle('my-turn', canAct);
    container.dataset.turn = this._t('yourTurn');

    // Fan: overlap so the hand fits the screen, with a gentle arc
    const n = player.hand.length;
    const cw = this._cardWidth();
    const avail = Math.min(window.innerWidth - 32 - cw * 0.6, cw * 9); // leave room for the arc's tilt
    const step = n > 1 ? Math.min(cw * 0.62, (avail - cw) / (n - 1)) : cw;
    container.style.setProperty('--overlap', (step - cw) + 'px');

    // Only cards that just arrived (a fresh deal) animate in; re-renders
    // during play must not replay the entrance, or the hand flickers.
    const shown = this._shownHand || new Set();
    const now = new Set(player.hand.map(c => c.suit + c.rank));
    this._shownHand = now;

    for (let i = 0; i < n; i++) {
      const card = player.hand[i];
      const canPlay = isMyTurn && playable.some(c => c.equals(card));
      const el = document.createElement('div');
      // When not my turn, show all cards normally (no dim). When my turn, dim unplayable ones.
      el.className = 'hand-card' + (canAct ? (canPlay ? ' playable' : ' not-playable') : '')
        + (shown.has(card.suit + card.rank) ? '' : ' dealt-in');
      const off = i - (n - 1) / 2;
      el.style.setProperty('--rot', (off * 2.2) + 'deg');
      el.style.setProperty('--lift', (off * off * 0.6) + 'px');
      el.innerHTML = cardFaceSVG(card);
      el.setAttribute('role', 'button');
      el.setAttribute('aria-label', `${card.rank} of ${card.suit}${canPlay ? ' - playable' : ''}`);
      el.setAttribute('tabindex', canPlay ? '0' : '-1');
      el.style.animationDelay = `${i * 0.025}s`;
      if (canPlay) {
        const play = () => {
          if (this._playLock) return;
          this._playCard(player, card);
        };
        // On touch screens a stray tap shouldn't throw a card away: the first
        // tap lifts it, a second tap on the same card plays it.
        const touch = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
        el.addEventListener('click', () => {
          if (!touch || el.classList.contains('selected')) { play(); return; }
          container.querySelectorAll('.hand-card.selected').forEach(c => c.classList.remove('selected'));
          el.classList.add('selected');
        });
        el.addEventListener('keydown', (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(); }
        });
      }
      container.appendChild(el);
    }
  }

  _renderTrickArea() {
    const area = document.getElementById('trick-area');
    if (!area) return;
    area.innerHTML = '';
    const from = ['from-bottom', 'from-left', 'from-top', 'from-right'];
    const winIdx = this.trick.length ? trickWinnerIndex(this.trick.map(t => t.card)) : -1;
    this.trick.forEach((t, k) => {
      const el = document.createElement('div');
      el.className = 'trick-card ' + from[t.playerIndex] + (k === winIdx && this.trick.length > 1 ? ' winning' : '');
      // A little tilt, stable per card so re-renders don't jitter
      const tilt = ((t.card.value * 7 + SUITS.indexOf(t.card.suit) * 13) % 11) - 5;
      el.style.setProperty('--tilt', tilt + 'deg');
      el.style.zIndex = k + 1;
      el.innerHTML = cardFaceSVG(t.card);
      area.appendChild(el);
    });
  }

  /** Review the previous trick: who played what, and who took it. */
  _toggleLastTrick() {
    const pop = document.getElementById('last-trick-pop');
    if (!pop || !this._lastTrick) return;
    if (!pop.hidden) { this._hideLastTrick(); return; }
    const pos = ['bottom', 'left', 'top', 'right'];
    pop.innerHTML = `<div class="lt-title">${escHTML(this._t('lastTrick'))}</div><div class="lt-grid">` +
      this._lastTrick.plays.map(pl => {
        const p = this.players[pl.playerIndex];
        const won = pl.playerIndex === this._lastTrick.winner;
        return `<div class="lt-play lt-${pos[pl.playerIndex]}${won ? ' won' : ''}">
          <div class="lt-card">${cardFaceSVG(pl.card)}</div>
          <div class="lt-name">${escHTML(p.name)}${won ? ' ✓' : ''}</div>
        </div>`;
      }).join('') + `</div>`;
    pop.hidden = false;
    clearTimeout(this._lastTrickTimer);
    this._lastTrickTimer = setTimeout(() => this._hideLastTrick(), 4000);
  }

  _hideLastTrick() {
    const pop = document.getElementById('last-trick-pop');
    if (pop) pop.hidden = true;
    clearTimeout(this._lastTrickTimer);
  }

  _renderTrickInfo() {
    const ltBtn = document.getElementById('last-trick-btn');
    if (ltBtn) {
      ltBtn.hidden = !this._lastTrick || this.roundOver || this.gameOver;
      ltBtn.textContent = this._t('lastTrick');
    }
    const info = document.getElementById('trick-info');
    if (!info) return;
    if (this._trickNum > 0 && this._trickNum <= 13) {
      info.textContent = this._t('trickOf').replace('{n}', this._trickNum);
    } else {
      info.textContent = '';
    }
  }

  _renderBidTracker() {
    const el = document.getElementById('bid-tracker');
    if (!el) return;
    // Only show during trick play
    if (!this.players || this.players.length === 0 || this._trickNum < 1) {
      el.innerHTML = ''; return;
    }

    let html = '<div class="bt-title">' + this._t('bidTracker') + '</div>';

    // Show each player: name, bid, tricks won (color-coded)
    for (const p of this.players) {
      if (!p.hasBid) continue;
      const icon = this.teamMode ? `<i class="tdot ${p.team === 0 ? 'us' : 'them'}"></i>` : '';
      const bidLabel = p.blindNil ? 'BN' : p.bid === 0 ? 'NIL' : p.bid;
      const isCurrent = p.index === this.currentPlayer;

      // Color the tricks count: green if made, red if over, dim if under
      let trickClass = 'under';
      if (p.bid === 0) {
        trickClass = p.tricks > 0 ? 'over' : 'made'; // nil: 0 tricks = good, any = bad
      } else if (p.tricks >= p.bid) {
        trickClass = p.tricks > p.bid ? 'over' : 'made';
      }

      html += `<div class="bt-row${isCurrent ? ' current' : ''}">
        <span class="bt-name">${icon}${escHTML(p.name)}</span>
        <span class="bt-bid">${bidLabel}</span>
        <span class="bt-tricks ${trickClass}">${p.tricks}</span>
      </div>`;
    }

    // Team totals
    if (this.teamMode) {
      const t0Bid = this.players.filter(p => p.team === 0 && p.bid > 0).reduce((s, p) => s + p.bid, 0);
      const t1Bid = this.players.filter(p => p.team === 1 && p.bid > 0).reduce((s, p) => s + p.bid, 0);
      const t0Tricks = this.players.filter(p => p.team === 0).reduce((s, p) => s + p.tricks, 0);
      const t1Tricks = this.players.filter(p => p.team === 1).reduce((s, p) => s + p.tricks, 0);
      html += '<div class="bt-divider"></div>';
      html += `<div class="bt-team-row"><span><i class="tdot us"></i>${t0Tricks}/${t0Bid}</span><span><i class="tdot them"></i>${t1Tricks}/${t1Bid}</span></div>`;
    }

    el.innerHTML = html;
  }

  _updateFloatingArrow() {
    const arrow = document.getElementById('floating-arrow');
    if (!arrow || !this.players || this.players.length === 0) return;
    // Only show during trick play (trickNum 1-13), not during deal/bidding/round-end
    if (this.roundOver || this.gameOver || this._trickNum < 1 || this._trickNum > 13) {
      arrow.style.display = 'none'; return;
    }
    arrow.style.display = '';

    const idx = this.currentPlayer;
    const pos = this._getPlayerPosition(idx);
    const aw = arrow.offsetWidth || 40;
    const ah = arrow.offsetHeight || 40;

    arrow.classList.remove('point-up', 'point-left', 'point-right');

    switch (pos) {
      case 'bottom': {
        const el = document.getElementById('player-hand');
        if (el) { const r = el.getBoundingClientRect(); arrow.style.left = (r.left + r.width / 2 - aw / 2) + 'px'; arrow.style.top = (r.top - ah - 4) + 'px'; }
        break;
      }
      case 'top': {
        arrow.classList.add('point-up');
        const el = document.getElementById('opponent-top');
        if (el) { const r = el.getBoundingClientRect(); arrow.style.left = (r.left + r.width / 2 - aw / 2) + 'px'; arrow.style.top = (r.bottom + 4) + 'px'; }
        break;
      }
      case 'left': {
        arrow.classList.add('point-left');
        const el = document.getElementById('opponent-left');
        if (el) { const r = el.getBoundingClientRect(); arrow.style.left = (r.right + 4) + 'px'; arrow.style.top = (r.top + r.height / 2 - ah / 2) + 'px'; }
        break;
      }
      case 'right': {
        arrow.classList.add('point-right');
        const el = document.getElementById('opponent-right');
        if (el) { const r = el.getBoundingClientRect(); arrow.style.left = (r.left - aw - 4) + 'px'; arrow.style.top = (r.top + r.height / 2 - ah / 2) + 'px'; }
        break;
      }
    }
  }

  // _showSpadesBroken moved to game-fx.js as _showSpadesBrokenFX

  _showTrickWinner(winner, callback) {
    const el = document.createElement('div');
    el.className = 'trick-winner-popup';
    el.innerHTML = `<img src="${winner.avatar}" style="width:40px;height:40px;border-radius:50%;" alt=""> ${this._t('winsTrick').replace('{name}', escHTML(winner.name))}`;
    document.body.appendChild(el);
    spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 10, 'particle-gold');
    const ms = this._speedMs(1200);
    setTimeout(() => el.remove(), ms);
    this._gameTimeout(callback, ms);
  }

  _showRoundResults(callback) {
    const overlay = document.getElementById('message-overlay');
    overlay.classList.remove('hidden');

    const pick = (arr) => arr && arr.length ? arr[Math.floor(Math.random() * arr.length)] : '';

    let html = `<div class="message-box results-box">
      <div class="rr-eyebrow">${this._t('round')} ${this._roundNum}</div>
      <h2 class="rr-title">${this._t('roundResults')}</h2>`;

    if (this.teamMode && this.teams) {
      html += `<div class="rr-teams">`;
      for (let t = 0; t < 2; t++) {
        const teamPlayers = this.players.filter(p => p.team === t);
        // Same numbers the score came from: nil tricks don't count toward
        // the contract, but they are bags.
        const r = this._roundScores ? this._roundScores[t] : scoreTeamRound(teamPlayers, 0);
        const made = r.contract > 0 ? r.made : r.nil >= 0; // double-nil teams live on their nils
        const bags = r.newBags;
        const isMyTeam = t === 0;
        const resultText = made ? (bags === 0 ? this._t('perfect') : this._t('made')) : this._t('set');

        html += `<div class="rr-team ${isMyTeam ? 'us' : 'them'} ${made ? 'made' : 'set'}">
          <div class="rr-team-head">
            <div class="rr-avatars">${teamPlayers.map(p => `<img src="${p.avatar}" alt="">`).join('')}</div>
            <div class="rr-team-name">${isMyTeam ? this._t('yourTeam') : this._t('opponentsTeam')}</div>
            <div class="rr-delta">${r.total >= 0 ? '+' : ''}${r.total}</div>
          </div>
          <div class="rr-grid">
            <span class="rr-h"></span><span class="rr-h">${this._t('bid')}</span><span class="rr-h">${this._t('tricks')}</span>`;
        for (const p of teamPlayers) {
          const bidLabel = p.blindNil ? 'BLIND NIL' : p.bid === 0 ? 'NIL' : p.bid;
          const cls = p.bid === 0 ? (p.tricks === 0 ? 'good' : 'bad') : (p.tricks >= p.bid ? 'good' : '');
          html += `<span class="rr-name">${escHTML(p.name)}</span><span class="rr-bid">${bidLabel}</span><span class="rr-tricks ${cls}">${p.tricks}</span>`;
        }
        html += `</div>
          <div class="rr-foot">
            <span class="rr-badge">${resultText}</span>
            <span class="rr-detail">${r.contract > 0 ? `${r.won}/${r.contract}` : ''}${bags ? ` · +${bags} ${this._t('bags')}` : ''}${r.penalty ? ` · <b>−${r.penalty}</b>` : ''}</span>
          </div>`;

        // Trash talk from AI players on this team
        const aiOnTeam = teamPlayers.filter(p => !p.isHuman);
        if (aiOnTeam.length > 0 && this._trashTalkFreq > 0) {
          const talker = aiOnTeam[Math.floor(Math.random() * aiOnTeam.length)];
          let phrase = '';
          if (made && isMyTeam) phrase = getPhrase(talker, 'teammate');
          else if (made && !isMyTeam) phrase = getPhrase(talker, 'opponent');
          else if (!made && isMyTeam) phrase = getPhrase(talker, 'draw');
          else if (!made && !isMyTeam) phrase = getPhrase(talker, 'win');
          if (phrase) html += `<div class="rr-quote"><img src="${talker.avatar}" alt=""><span>“${escHTML(phrase)}”</span></div>`;
        }
        html += `</div>`;
      }
      html += `</div>`;

      // Race to the target
      const s0 = this.teams[0].score, s1 = this.teams[1].score;
      const pct = (v) => Math.max(0, Math.min(100, Math.round((v / this.targetScore) * 100)));
      html += `<div class="rr-race">
        <div class="rr-lane us"><span class="rr-lane-label">${this._t('yourTeam')}</span><div class="rr-bar"><i style="width:${pct(s0)}%"></i></div><b>${s0}</b></div>
        <div class="rr-lane them"><span class="rr-lane-label">${this._t('opponentsTeam')}</span><div class="rr-bar"><i style="width:${pct(s1)}%"></i></div><b>${s1}</b></div>
        <div class="rr-target">${this._t('playingTo')} ${this.targetScore}</div>
      </div>`;

    } else {
      // Cutthroat
      const sorted = [...this.players].sort((a, b) => (b.score || 0) - (a.score || 0));
      html += `<div class="rr-standings"><span class="rr-h"></span><span class="rr-h"></span><span class="rr-h">${this._t('bid')}</span><span class="rr-h">${this._t('tricks')}</span><span class="rr-h">+/−</span><span class="rr-h">${this._t('pts')}</span>`;
      sorted.forEach((p, rank) => {
        const r = p.roundScore || { total: 0 };
        const made = p.bid === 0 ? p.tricks === 0 : p.tricks >= p.bid;
        const bidLabel = p.blindNil ? 'BLIND NIL' : p.bid === 0 ? 'NIL' : p.bid;
        html += `<span class="rr-rank">${rank + 1}</span>
          <span class="rr-name"><img src="${p.avatar}" alt="">${escHTML(p.name)}</span>
          <span class="rr-bid">${bidLabel}</span>
          <span class="rr-tricks ${made ? 'good' : 'bad'}">${p.tricks}</span>
          <span class="rr-delta-sm ${r.total >= 0 ? 'good' : 'bad'}">${r.total >= 0 ? '+' : ''}${r.total}</span>
          <span class="rr-score">${p.score || 0}</span>`;
      });
      html += `</div>`;
    }

    html += `<button id="round-results-ok" class="btn-start" style="margin-top:18px;">${this._t('continue_')}</button></div>`;
    overlay.innerHTML = html;

    // Particles for winning team
    if (this.teamMode && this.teams) {
      const myMade = this.teams[0].score > 0;
      if (myMade) spawnParticles(window.innerWidth / 2, window.innerHeight * 0.3, 12, 'particle-gold');
    }

    document.getElementById('round-results-ok').addEventListener('click', () => {
      if (overlay.classList.contains('hidden')) return;
      overlay.classList.add('hidden');
      overlay.innerHTML = '';
      callback();
    }, { once: true });
  }

  _showThinking(player) {
    // Clear speech bubbles so they don't overlap
    document.querySelectorAll('.speech-bubble').forEach(el => el.remove());
    const el = document.getElementById('thinking-overlay');
    if (!el) return;
    el.classList.remove('hidden');
    el.innerHTML = `<div class="think-card">
      <img class="think-avatar" src="${player.avatar}" style="width:36px;height:36px;border-radius:50%;border:2px solid rgba(232,193,112,0.4);" alt="">
      <div class="think-info">
        <div class="think-name">${escHTML(player.name)}</div>
        <div class="think-label">${this._t('thinking')} <span class="thinking-dots-lg"><span></span><span></span><span></span></span></div>
      </div>
    </div>`;
    const pos = this._getPlayerPosition(player.index);
    const panel = document.getElementById('opponent-' + pos);
    if (panel) {
      const r = panel.getBoundingClientRect();
      if (pos === 'top') { el.style.left = (r.left + r.width/2) + 'px'; el.style.top = (r.bottom + 4) + 'px'; el.style.transform = 'translateX(-50%)'; }
      else if (pos === 'left') { el.style.left = (r.right + 4) + 'px'; el.style.top = (r.top + r.height/2) + 'px'; el.style.transform = 'translateY(-50%)'; }
      else { el.style.left = (r.left - 4) + 'px'; el.style.top = (r.top + r.height/2) + 'px'; el.style.transform = 'translate(-100%, -50%)'; }
    }
  }

  _hideThinking() {
    const el = document.getElementById('thinking-overlay');
    if (el) el.classList.add('hidden');
  }

  _showSpeechBubble(player, text) {
    // Clear old speech bubbles and hide thinking to prevent overlap
    document.querySelectorAll('.speech-bubble').forEach(el => el.remove());
    this._hideThinking();

    const pos = this._getPlayerPosition(player.index);
    const panel = document.getElementById('opponent-' + pos);
    if (!panel) return;
    const r = panel.getBoundingClientRect();
    const bubble = document.createElement('div');
    bubble.className = 'speech-bubble';
    bubble.textContent = text;

    // Position ABOVE the panel center so it doesn't overlap thinking indicator
    if (pos === 'left') {
      bubble.style.left = (r.right + 8) + 'px';
      bubble.style.top = (r.top) + 'px';
    } else if (pos === 'right') {
      bubble.style.right = (window.innerWidth - r.left + 8) + 'px';
      bubble.style.top = (r.top) + 'px';
    } else {
      // Top player — show above panel
      bubble.style.left = (r.left + r.width / 2 - 80) + 'px';
      bubble.style.top = Math.max(4, r.top - 56) + 'px';
    }

    document.body.appendChild(bubble);
    requestAnimationFrame(() => {
      const br = bubble.getBoundingClientRect();
      if (br.left < 4) bubble.style.left = '4px';
      if (br.right > window.innerWidth - 4) { bubble.style.left = ''; bubble.style.right = '4px'; }
      if (br.top < 4) bubble.style.top = '4px';
    });

    setTimeout(() => bubble.remove(), 4200);
  }

  _updateXPBar() {
    const wrap = document.getElementById('xp-bar-wrap');
    if (!wrap) return;
    const xp = getXPProgress();
    wrap.innerHTML = `<span class="xp-level">Lv.${xp.level}</span><div class="xp-bar"><div class="xp-fill" style="width:${xp.pct}%"></div></div>`;
  }

  _renderStats() {
    const container = document.getElementById('stats-content');
    if (!container) return;
    const s = getGameStats();
    const rec = getRecord(getPlayerName());
    const total = rec.wins + rec.losses;
    const winRate = total > 0 ? Math.round(rec.wins / total * 100) : 0;
    const unlocked = getUnlockedAchievements();
    container.innerHTML = `
      <div class="stat-section"><div class="stat-section-title">${this._t('overall')}</div>
        <div class="stat-row"><span class="stat-label">${this._t('gamesPlayed')}</span><span class="stat-value">${s.gamesPlayed || 0}</span></div>
        <div class="stat-row"><span class="stat-label">${this._t('winsLosses')}</span><span class="stat-value">${rec.wins}W ${rec.losses}L</span></div>
        <div class="stat-row"><span class="stat-label">${this._t('winRate')}</span><span class="stat-value">${winRate}%</span></div>
        <div class="stat-row"><span class="stat-label">${this._t('bestStreak')}</span><span class="stat-value">${s.bestStreak || 0}</span></div>
        <div class="stat-row"><span class="stat-label">Total Tricks</span><span class="stat-value">${s.totalTricks || 0}</span></div>
        <div class="stat-row"><span class="stat-label">Total Bags</span><span class="stat-value">${s.totalBags || 0}</span></div>
        <div class="stat-row"><span class="stat-label">Nils Attempted</span><span class="stat-value">${s.nilsAttempted || 0}</span></div>
        <div class="stat-row"><span class="stat-label">Nils Succeeded</span><span class="stat-value">${s.nilsSucceeded || 0}</span></div>
        <div class="stat-row"><span class="stat-label">Time Played</span><span class="stat-value">${Math.floor(getPlayTime()/3600)}h ${Math.floor((getPlayTime()%3600)/60)}m</span></div>
      </div>
      <div class="stat-section"><div class="stat-section-title">${this._t('achievements')} (${unlocked.length}/${ACHIEVEMENTS.length})</div>
        ${ACHIEVEMENTS.map(a => {
          const isU = unlocked.includes(a.id);
          return `<div class="achievement-row ${isU ? 'unlocked' : 'locked'}"><span class="achievement-icon">${a.icon}</span><div class="achievement-info"><div class="achievement-name">${_tUI(a.name)}</div><div class="achievement-desc">${_tUI(a.desc)}</div></div></div>`;
        }).join('')}
      </div>
      <button id="reset-stats-btn" class="gm-btn" style="width:100%;background:rgba(224,74,58,0.15);border:1px solid rgba(224,74,58,0.3);color:#e04a3a;margin-top:16px;">${this._t('resetStats')}</button>
    `;
    document.getElementById('reset-stats-btn')?.addEventListener('click', () => {
      if (confirm(this._t('resetConfirm'))) {
        ['spades_stats','spades_game_stats','spades_achievements','spades_xp','spades_play_time'].forEach(k => localStorage.removeItem(k));
        this._renderStats();
      }
    });
  }

  _renderPrefs() {
    const container = document.getElementById('prefs-content');
    if (!container) return;
    const currentTheme = this._theme || 'dark';
    const musicOn = this.music && this.music.enabled;
    const sfxOn = !this._soundMuted;
    container.innerHTML = `
      <div class="pref-group"><div class="pref-label">${this._t('playerName') || 'Player Name'}</div>
        <input type="text" id="pref-name-input" class="name-edit" maxlength="12" value="${getPlayerName()}" style="width:100%;"></div>
      <div class="pref-group"><div class="pref-label">${this._t('language') || 'Language'}</div>
        <div class="skin-options" style="grid-template-columns:repeat(4,1fr);" id="pref-lang-options">
          ${Object.entries(LOCALES).map(([code, loc]) => `
            <div class="skin-option ${code === this._getLang() ? 'active' : ''}" data-lang="${code}">
              <span style="font-size:1.2rem;">${loc.flag}</span><span>${loc.name}</span>
            </div>
          `).join('')}
        </div></div>
      <div class="pref-group"><div class="pref-label">${this._t('theme')}</div>
        <div class="skin-options" style="grid-template-columns:repeat(2,1fr);">
          <div class="skin-option ${currentTheme==='dark'?'active':''}" data-theme-val="dark"><div class="skin-preview" style="background:linear-gradient(135deg,#1a4a7a,#0a2a4a);"></div><span>${this._t('darkTheme')}</span></div>
          <div class="skin-option ${currentTheme==='light'?'active':''}" data-theme-val="light"><div class="skin-preview" style="background:linear-gradient(135deg,#e8f5e9,#a5d6a7);"></div><span>${this._t('lightTheme')}</span></div>
        </div></div>
      <div class="pref-group"><div class="pref-label">${this._t('tableTheme')}</div>
        <div class="skin-options" id="table-theme-options"></div></div>
      <div class="pref-group"><div class="pref-label">Card Skin</div>
        <div class="skin-options" id="card-skin-options">
          ${CARD_SKINS.map(s => `<div class="skin-option ${s.id === getCardSkin() ? 'active' : ''}" data-skin="${s.id}"><div class="skin-preview" style="background:linear-gradient(135deg,${s.face},${s.faceDark});border:1.5px solid rgba(0,0,0,0.2);"></div><span>${s.name}</span></div>`).join('')}
        </div></div>
      <div class="pref-group"><div class="pref-label">${this._t('accessibility')}</div>
        <div class="toggle-row"><span>${this._t('colorblind')}</span><label class="toggle-switch"><input type="checkbox" id="colorblind-toggle-cb" ${this._colorblindMode?'checked':''}><span class="toggle-slider"></span></label></div></div>
      <div class="pref-group"><div class="pref-label">${this._t('audio')}</div>
        <div class="toggle-row"><span>${this._t('music')}</span><label class="toggle-switch"><input type="checkbox" id="music-toggle-cb" ${musicOn?'checked':''}><span class="toggle-slider"></span></label></div>
        <div class="toggle-row"><span>${this._t('sfx')}</span><label class="toggle-switch"><input type="checkbox" id="sfx-toggle-cb" ${sfxOn?'checked':''}><span class="toggle-slider"></span></label></div></div>
      <div class="pref-group"><div class="pref-label">${this._t('trashTalk')}</div>
        <div class="skin-options" style="grid-template-columns:repeat(4,1fr);" id="pref-trash-talk">
          <div class="skin-option ${this._trashTalkFreq===0?'active':''}" data-trash="0"><span>🔇</span><span>${this._t('off')}</span></div>
          <div class="skin-option ${this._trashTalkFreq===1?'active':''}" data-trash="1"><span>🤫</span><span>${this._t('low')}</span></div>
          <div class="skin-option ${this._trashTalkFreq===2?'active':''}" data-trash="2"><span>💬</span><span>Normal</span></div>
          <div class="skin-option ${this._trashTalkFreq===3?'active':''}" data-trash="3"><span>🗣️</span><span>${this._t('max')}</span></div>
        </div></div>
      <div class="pref-group"><div class="pref-label">${this._t('gameSpeed')}</div>
        <div class="skin-options" style="grid-template-columns:repeat(3,1fr);" id="pref-speed-options">
          <div class="skin-option ${this._gameSpeed==='fast'?'active':''}" data-speed="fast"><span>🐇</span><span>Fast</span></div>
          <div class="skin-option ${this._gameSpeed==='normal'?'active':''}" data-speed="normal"><span>🎯</span><span>Normal</span></div>
          <div class="skin-option ${this._gameSpeed==='slow'?'active':''}" data-speed="slow"><span>🐢</span><span>Slow</span></div>
        </div></div>
    `;
    document.getElementById('pref-name-input')?.addEventListener('change', (e) => {
      const name = e.target.value.trim().slice(0,12) || _tUI('playerName');
      setPlayerName(name); if (this.players[0]) this.players[0].name = name; this._updateUI();
    });
    container.querySelectorAll('[data-theme-val]').forEach(el => {
      el.addEventListener('click', () => {
        this._theme = el.dataset.themeVal; localStorage.setItem('spades_theme', this._theme);
        document.body.setAttribute('data-theme', this._theme); this._renderPrefs();
      });
    });
    const tableOpts = document.getElementById('table-theme-options');
    if (tableOpts) {
      tableOpts.innerHTML = TABLE_THEMES.map(t => `<div class="skin-option ${t.id===getTableTheme()?'active':''}" data-table="${t.id}"><div class="skin-preview" style="background:linear-gradient(135deg,${t.felt||'#333'},${t.dark||'#111'});"></div><span>${this._t('table'+t.id.charAt(0).toUpperCase()+t.id.slice(1))}</span></div>`).join('');
      tableOpts.querySelectorAll('.skin-option').forEach(el => el.addEventListener('click', () => { setTableTheme(el.dataset.table); this._renderPrefs(); }));
    }
    const skinOpts = document.getElementById('card-skin-options');
    if (skinOpts) {
      skinOpts.querySelectorAll('.skin-option').forEach(el => {
        el.addEventListener('click', () => { setCardSkin(el.dataset.skin); this._renderPrefs(); this._updateUI(); });
      });
    }
    document.getElementById('music-toggle-cb')?.addEventListener('change', () => { if (this.music) { this.music.init(); this.music.toggle(); } });
    document.getElementById('sfx-toggle-cb')?.addEventListener('change', (e) => { this._soundMuted = !e.target.checked; localStorage.setItem('spades_muted', this._soundMuted ? '1' : '0'); });
    document.getElementById('colorblind-toggle-cb')?.addEventListener('change', (e) => {
      this._colorblindMode = e.target.checked;
      localStorage.setItem('spades_colorblind', this._colorblindMode ? '1' : '0');
      document.body.classList.toggle('colorblind', this._colorblindMode);
      this._lastHandState = null; // force card re-render with new colors
      this._updateUI();
      this._renderTrickArea();
    });
    const trashOpts = document.getElementById('pref-trash-talk');
    if (trashOpts) {
      trashOpts.querySelectorAll('.skin-option').forEach(el => {
        el.addEventListener('click', () => {
          this._trashTalkFreq = parseInt(el.dataset.trash);
          localStorage.setItem('spades_trash_talk', String(this._trashTalkFreq));
          this._renderPrefs();
        });
      });
    }
    const speedOpts = document.getElementById('pref-speed-options');
    if (speedOpts) {
      speedOpts.querySelectorAll('.skin-option').forEach(el => {
        el.addEventListener('click', () => {
          this._gameSpeed = el.dataset.speed;
          localStorage.setItem('spades_speed', this._gameSpeed);
          this._renderPrefs();
        });
      });
    }
    const langOpts = document.getElementById('pref-lang-options');
    if (langOpts) {
      langOpts.querySelectorAll('.skin-option').forEach(el => {
        el.addEventListener('click', () => {
          const lang = el.dataset.lang;
          localStorage.setItem('spades_lang', lang);
          PHRASES = _buildPhrases(lang);
          this._previewNames = null;
          this._applyLocale();
          this._updateRoster();
          this._renderPrefs();
        });
      });
    }
  }

  _renderLog() {
    const container = document.getElementById('log-entries');
    if (!container) return;
    container.innerHTML = '';
    if (!this.gameLog || this.gameLog.length === 0) {
      container.innerHTML = `<div style="opacity:0.4;text-align:center;padding:20px;">${this._t('noTricksYet')}</div>`;
      return;
    }
    for (let i = this.gameLog.length - 1; i >= 0; i--) {
      const e = this.gameLog[i];
      const div = document.createElement('div');
      div.className = 'log-entry';
      div.innerHTML = `<span class="log-num">R${e.round} T${e.trick}</span>
        <div>${e.cards.map(c => `<span style="margin-right:8px;">${escHTML(c.player)}: <span style="font-weight:700;">${c.card}</span></span>`).join('')}
        <span style="color:#e8c170;font-weight:700;">→ ${escHTML(e.winner)}</span></div>`;
      container.appendChild(div);
    }
  }

  _updateRoster() {
    const roster = document.getElementById('player-roster');
    if (!roster) return;
    const difficulties = ['easy','medium','hard'];
    const mode = this._getOption('game-mode') || 'teams';
    if (!this._previewNames) {
      const picked = pickCast(3, [getHumanPortrait()]);
      this._previewNames = picked.map(p => p.name);
      this._previewCities = picked.map(p => p.city);
      this._previewPortraits = picked.map(p => p.portrait);
      this._previewDiffs = this._previewNames.map(() => difficulties[Math.floor(Math.random()*3)]);
      this._previewPersonalities = this._previewNames.map(() => AI_PERSONALITIES[Math.floor(Math.random()*AI_PERSONALITIES.length)]);
      this._previewNames.forEach((n,i) => seedAIRecord(n, this._previewDiffs[i]));
    }
    const pName = getPlayerName();
    const teamLabels = mode === 'teams'
      ? ['You', 'Opponent', 'Partner', 'Opponent']
      : ['You', 'Rival', 'Rival', 'Rival'];
    const players = [
      { name: pName, avatar: portraitURL(getHumanPortrait()), isHuman: true, record: getRecord(pName), rank: getRank(pName), team: teamLabels[0] },
      { name: this._previewNames[0], avatar: portraitURL(this._previewPortraits[0]), record: getRecord(this._previewNames[0]), rank: getRank(this._previewNames[0]), team: teamLabels[1], personality: this._previewPersonalities[0], h2h: getHeadToHead(this._previewNames[0]) },
      { name: this._previewNames[1], avatar: portraitURL(this._previewPortraits[1]), record: getRecord(this._previewNames[1]), rank: getRank(this._previewNames[1]), team: teamLabels[2], personality: this._previewPersonalities[1], h2h: getHeadToHead(this._previewNames[1]) },
      { name: this._previewNames[2], avatar: portraitURL(this._previewPortraits[2]), record: getRecord(this._previewNames[2]), rank: getRank(this._previewNames[2]), team: teamLabels[3], personality: this._previewPersonalities[2], h2h: getHeadToHead(this._previewNames[2]) },
    ];
    roster.innerHTML = `<div class="roster-title">${this._t('players')}</div>`;
    players.forEach((p, pi) => {
      const card = document.createElement('div');
      card.className = 'roster-card' + (p.isHuman ? ' human' : '');
      const role = { Partner: 'partner', Opponent: 'opp', Rival: 'rival' }[p.team];
      const roleTag = role ? `<span class="roster-role ${role}">${escHTML(this._t(role === 'partner' ? 'rolePartner' : role === 'opp' ? 'roleOpponent' : 'roleRival'))}</span>` : '';
      if (role) card.classList.add('role-' + role);
      card.innerHTML = `<img class="roster-avatar" src="${p.avatar}" alt=""><div class="roster-info"><div class="roster-name">${escHTML(p.name)}</div>${roleTag}<div class="roster-rank">${escHTML(p.rank)}</div><div class="roster-record">${p.record.wins}W - ${p.record.losses}L${p.h2h ? ' · vs you: ' + p.h2h.w + 'W-' + p.h2h.l + 'L' : ''}</div></div>`;
      if (p.isHuman) {
        // Click your portrait to try the next one; whoever at the table had it
        // gets swapped for someone new, so faces never repeat.
        const img = card.querySelector('.roster-avatar');
        img.classList.add('pickable');
        img.title = this._t('changePortrait');
        img.addEventListener('click', () => {
          setHumanPortrait(getHumanPortrait() + 1);
          const clash = this._previewPortraits.indexOf(getHumanPortrait());
          if (clash >= 0) {
            const np = pickCast(1, [getHumanPortrait(), ...this._previewPortraits])[0];
            this._previewNames[clash] = np.name; this._previewCities[clash] = np.city;
            this._previewPortraits[clash] = np.portrait;
            seedAIRecord(np.name, this._previewDiffs[clash]);
          }
          this._updateRoster();
        });
      }
      if (!p.isHuman) {
        const btn = document.createElement('button');
        btn.className = 'roster-reroll'; btn.textContent = '🎲'; btn.title = this._t('rerollOpponent');
        const idx = pi - 1;
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          // A cast member who isn't already at the table (or the one leaving)
          const np = pickCast(1, [getHumanPortrait(), ...this._previewPortraits])[0];
          this._previewNames[idx] = np.name; this._previewCities[idx] = np.city;
          this._previewPortraits[idx] = np.portrait;
          this._previewPersonalities[idx] = AI_PERSONALITIES[Math.floor(Math.random()*AI_PERSONALITIES.length)];
          seedAIRecord(np.name, this._previewDiffs[idx]);
          this._updateRoster();
        });
        card.appendChild(btn);
      }
      roster.appendChild(card);
    });
  }

  _showFirstVisitLangPicker() {
    const overlay = document.getElementById('message-overlay');
    if (!overlay) return;
    overlay.classList.remove('hidden');
    const detected = detectBrowserLang();
    overlay.innerHTML = `
      <div class="message-box" style="max-width:400px;padding:32px;">
        <div style="font-size:2.5rem;margin-bottom:12px;">🌍</div>
        <div style="font-size:1.4rem;font-weight:800;margin-bottom:6px;">Choose Your Language</div>
        <div style="font-size:0.85rem;opacity:0.5;margin-bottom:20px;">Elige tu idioma · اختر لغتك · 选择语言</div>
        <div id="first-lang-grid" style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;">
          ${Object.entries(LOCALES).map(([code, loc]) => `
            <button class="btn-option${code === detected ? ' active' : ''}" data-lang="${code}" style="display:flex;align-items:center;gap:10px;padding:14px 16px;font-size:1rem;">
              <span style="font-size:1.6rem;">${loc.flag}</span>
              <span>${loc.name}</span>
              ${code === detected ? '<span style="margin-left:auto;font-size:0.65rem;opacity:0.5;background:rgba(232,193,112,0.2);padding:2px 6px;border-radius:4px;">auto</span>' : ''}
            </button>
          `).join('')}
        </div>
      </div>`;
    overlay.querySelectorAll('#first-lang-grid .btn-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const lang = btn.dataset.lang;
        localStorage.setItem('spades_lang', lang);
        localStorage.setItem('spades_lang_chosen', '1');
        PHRASES = _buildPhrases(lang);
        this._previewNames = null;
        this._applyLocale();
        this._updateRoster();
        overlay.classList.add('hidden');
        // Show tutorial after language selection
        if (!localStorage.getItem('spades_tutorial_done')) showTutorial();
      });
    });
  }

  _applyLocale() {
    const lang = this._getLang();
    const u = getLocale(lang).ui || LOCALES.en.ui;
    const setTxt = (sel, txt) => { const el = document.querySelector(sel); if (el) el.textContent = txt; };

    document.documentElement.dir = getLocale(lang).dir || 'ltr';
    document.documentElement.lang = lang;

    setTxt('#menu-title', u.gameTitle || 'SPADES 27');
    setTxt('#menu-subtitle', u.gameSubtitle || 'CARD GAME');
    setTxt('#start-game', u.startGame);
    setTxt('#rematch-btn', u.rematch);
    setTxt('#play-again', u.newGame);
    setTxt('#ragequit-loss-note', u.rageQuitLossNote);
    setTxt('#tut-prev', u.back);
    setTxt('#rules-close-btn', u.back);
    if (document.getElementById('house-rules')) this._renderHouseRules();

    // Menu labels
    const labels = document.querySelectorAll('.option-group label');
    const labelKeys = ['gameMode', 'playTo', 'aiDifficulty', 'gameSpeed', 'houseRules'];
    labels.forEach((lbl, i) => { if (labelKeys[i] && u[labelKeys[i]]) lbl.textContent = u[labelKeys[i]]; });

    // Game mode buttons
    const modeGroup = document.getElementById('game-mode');
    if (modeGroup) {
      const btns = modeGroup.querySelectorAll('.btn-option');
      if (btns[0]) btns[0].textContent = u.partnership || '2v2 Teams';
      if (btns[1]) btns[1].textContent = u.cutthroat || 'Cutthroat (FFA)';
    }

    // Difficulty buttons
    const diffGroup = document.getElementById('ai-difficulty');
    if (diffGroup) {
      const btns = diffGroup.querySelectorAll('.btn-option');
      if (btns[0]) btns[0].textContent = u.easy;
      if (btns[1]) btns[1].textContent = u.mixed;
      if (btns[2]) btns[2].textContent = u.hard;
    }

    // Speed buttons
    const speedGroup = document.getElementById('game-speed');
    if (speedGroup) {
      const btns = speedGroup.querySelectorAll('.btn-option');
      if (btns[0]) btns[0].textContent = u.fast;
      if (btns[1]) btns[1].textContent = u.normal;
      if (btns[2]) btns[2].textContent = u.slow;
    }

    // Score custom button
    const scoreGroup = document.getElementById('target-score');
    if (scoreGroup) {
      const customBtn = scoreGroup.querySelector('[data-value="custom"]');
      if (customBtn) customBtn.textContent = u.custom || 'Custom';
    }

    // Rules content
    const rulesContent = document.querySelector('.rules-content');
    if (rulesContent && RULES[lang]) rulesContent.innerHTML = RULES[lang];

    // Menu language selector
    const langSel = document.getElementById('menu-lang-selector');
    if (langSel) {
      langSel.innerHTML = Object.entries(LOCALES).map(([code, loc]) =>
        `<button class="btn-option${code === lang ? ' active' : ''}" data-lang="${code}" style="flex:0;padding:8px 12px;min-width:auto;font-size:1.3rem;">${loc.flag}</button>`
      ).join('');
      langSel.querySelectorAll('.btn-option').forEach(btn => {
        btn.addEventListener('click', () => {
          localStorage.setItem('spades_lang', btn.dataset.lang);
          PHRASES = _buildPhrases(btn.dataset.lang);
          this._previewNames = null;
          this._applyLocale();
          this._updateRoster();
        });
      });
    }
  }
}

// Start
window.game = new Game();
