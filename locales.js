/**
 * @file locales.js — Localization for Spades.
 * @author Keith Adler
 * @copyright 2026 Keith Adler. MIT License.
 */

const LOCALES = {};

LOCALES.en = {
  name: 'English', flag: '🇺🇸', dir: 'ltr',
  names: [
    'Carlos','Maria','James','Aisha','Yuki','Priya','Liam','Sofia','Omar','Elena',
    'Diego','Fatima','Kira','Amara','Raj','Lucia','Kofi','Ingrid','Mateo','Zara',
    'Dante','Mei','Nico','Isla','Tariq','Rosa','Sven','Leila','Idris','Anya',
    'Felix','Nadia','Hugo','Cleo','Ravi','Mila','Axel','Dina','Leo','Vera'
  ],
  cities: [
    'Miami, FL','Brooklyn, NY','Houston, TX','Chicago, IL','Atlanta, GA',
    'Phoenix, AZ','Denver, CO','Seattle, WA','Boston, MA','Nashville, TN',
    'Portland, OR','Austin, TX','Detroit, MI','Memphis, TN','Oakland, CA',
    'Philly, PA','New Orleans, LA','San Diego, CA','Dallas, TX','Baltimore, MD'
  ],
  ui: {
    startGame: 'Start Game', resumeGame: '▶ Resume Saved Game', rematch: 'Rematch',
    newGame: 'New Game', copyLog: '📋 Copy Game Log', copied: '✅ Copied!',
    gameMode: 'Game Mode', partnership: 'Partnership (2v2)', cutthroat: 'Cutthroat (FFA)',
    playTo: 'Play To', custom: 'Custom',
    aiDifficulty: 'AI Difficulty', easy: '😊 Easy', mixed: '🎲 Mixed', hard: '🧠 Hard',
    gameSpeed: 'Game Speed', fast: '🐇 Fast', normal: '🎯 Normal', slow: '🐢 Slow',
    players: 'Players', rules: '📖 Rules', tutorial: '🎓 Tutorial',
    gameLog: '📋 Game Log', stats: '📊 Stats & Achievements', prefs: '🎨 Preferences',
    shortcuts: '❓ Shortcuts', rageQuit: '💀 Rage Quit (counts as loss)',
    pass: 'Pass', hint: '💡 Hint',
    yourTurn: 'YOUR TURN', thinking: 'Thinking', turn: 'turn',
    scores: 'Scores', round: 'Round', gameOver: 'GAME OVER',
    youWin: '🏆 You Win!', wins: 'Wins', close: 'Close', continue_: 'Continue',
    theme: 'Theme', dark: '🌙 Dark', light: '☀️ Light',
    tableTheme: 'Table Theme', audio: 'Audio',
    music: '🎵 Background Music', sfx: '🔊 Sound Effects',
    trashTalk: 'AI Trash Talk', off: 'Off', low: 'Low', max: 'Max',
    colorblind: '♿ Colorblind Mode', language: 'Language',
    playerName: 'Player', accessibility: 'Accessibility',
    overall: 'Overall', gamesPlayed: 'Games Played', winsLosses: 'Wins / Losses',
    winRate: 'Win Rate', bestStreak: 'Best Win Streak',
    totalScored: 'Total Points Scored', lifetime: 'Lifetime',
    achievements: 'Achievements',
    playingTo: 'Playing to',
    scoreboard: 'Scores',
    pts: 'pts',
    yourTeam: 'Your Team', opponentsTeam: 'Opponents',
    vsYou: 'vs you', teammate: 'PARTNER',
    achievementUnlocked: 'Achievement Unlocked',
    startPlaying: 'Start Playing!', next: 'Next →', stepOf: 'of', step: 'Step', skip: 'Skip',
    newcomer: 'Newcomer', rookie: 'Rookie', spadeMaster: 'Spade Master',
    veteran: 'Veteran', regular: 'Regular', apprentice: 'Apprentice', beginner: 'Beginner',
    aggressive: 'Aggressive', defensive: 'Defensive', chaotic: 'Chaotic',
    calculated: 'Calculated', bully: 'Bully',
    // Spades-specific
    bidPhase: 'Bidding', bid: 'Bid', yourBid: 'Your Bid', nil: 'Nil', blindNil: 'Blind Nil',
    tricks: 'Tricks', bags: 'Bags', set: 'SET!', made: 'Made!',
    trickCount: 'tricks', bidLabel: 'bid', of: 'of',
    spadesBroken: '♠ Spades Broken!', leadPlayer: 'leads',
    selectBid: 'Select your bid', confirmBid: 'Confirm Bid',
    teamScore: 'Team Score', opponentScore: 'Opponent Score',
    bidSummary: 'Bids', trickSummary: 'Tricks Won',
    roundResults: 'Round Results', bagPenalty: 'Bag Penalty! -100',
    nilBonus: 'Nil Bonus! +100', nilFailed: 'Nil Failed! -100',
    blindNilBonus: 'Blind Nil! +200', blindNilFailed: 'Blind Nil Failed! -200',
    // Achievements
    achFirstVictory: 'First Victory', achFirstVictoryDesc: 'Win your first game',
    achOnFire: 'On Fire', achOnFireDesc: 'Win 3 games in a row',
    achUnstoppable: 'Unstoppable', achUnstoppableDesc: 'Win 5 games in a row',
    achNilMaster: 'Nil Master', achNilMasterDesc: 'Successfully bid and make Nil',
    achBlindNil: 'Blind Faith', achBlindNilDesc: 'Successfully make a Blind Nil',
    achSetThem: 'Set Them!', achSetThemDesc: 'Set the opposing team',
    achRegular: 'Regular', achRegularDesc: 'Play 10 games',
    achSpadeMaster: 'Spade Master', achSpadeMasterDesc: 'Play 50 games',
    achPerfectBid: 'Perfect Bid', achPerfectBidDesc: 'Win exactly your bid with 0 bags',
    achBoston: 'Boston', achBostonDesc: 'Win all 13 tricks in a round',
    achCleanGame: 'Clean Game', achCleanGameDesc: 'Win a game with 0 total bags',
    achComebackKid: 'Comeback Kid', achComebackKidDesc: 'Win after trailing by 100+',
    achLegendary: 'Legendary', achLegendaryDesc: 'Win 10 games in a row',
    // Table themes
    tableRandom: 'Random', tableGreen: 'Classic Green', tableBlue: 'Ocean Blue',
    tableRed: 'Casino Red', tablePurple: 'Royal Purple', tableWood: 'Wooden',
    darkTheme: '🌙 Dark', lightTheme: '☀️ Light',
    resetStats: '🗑️ Reset All Stats',
    resetConfirm: 'This will erase all stats, achievements, and XP. Are you sure?',
    gameTitle: 'SPADES',
    gameSubtitle: 'CARD GAME',
    rerollOpponent: 'Re-roll opponent',
    rageQuitLossNote: 'This counts as a loss on your record.',
    rageQuitTaunts: [
      'Really? Walking away from the table? 🏃‍♂️',
      'Quitting already? Your partner is disappointed. 😂',
      'Winners never quit. Quitters never win. 🤔',
      'Your opponents will tell EVERYONE about this. 📢',
      'Rage quitting is just losing with extra steps. 💀',
      'Fun fact: 100% of rage quitters regret it. 📊',
      'Plot twist: you were about to win. Probably. 🎬',
    ],
    introHumanFirst: ['Let\'s go! 🎯', 'Deal me in 🃏', 'My table. 😎', 'Feeling lucky 🍀'],
    introAiFirst: ['Bring it on 💪', 'Easy tricks 😏', 'No mercy today 🔥', 'Hope you bid right 🎯', 'Watch your bags 🎒'],
    introHumanMid: ['New round 🎲', 'Focus up 🧠', 'Let\'s go 🃏'],
    introAiMid: ['Here we go 🎲', 'Ready 💪', 'My deal ✨', 'Shuffling up 🃏'],
    introAiCloseToWin: ['GG incoming 😎', 'Almost there 💀', 'Wrapping this up 🎁', 'Can you feel it? 🏆'],
    introAiTrailing: ['Not worried 😤', 'Comeback time 🔄', 'Watch me rally 🔥', 'Nil time? 🎯'],
    introAiLeading: ['Catch me if you can 🏃', 'Loving this lead 😏', 'Pressure\'s on you 👀', 'Keep bagging 🎒'],
  },
  p: {
    z: {
      o: [
        ['wait you took that? 💀','no way that trick was yours','lowkey didn\'t see that coming','slay i guess?','not me losing tricks rn'],
        ['that trump was clean 🧹','stay mad about my spades','main character energy ♠','ate that trick up ngl','your bid is cooked'],
        ['you\'re getting set 💀','gg your bags are full','built different at spades fr','cope with these trumps','ratio + you overbid']
      ],
      t: [['we got this partner 💕','team slay!','our bids are perfect'],['we\'re eating tricks 🔥','partner diff','the synergy tho'],['literally unbeatable 💀','they\'re getting set','our era fr']],
      d: [['not the bags 😭','down bad on tricks','this hand is cursed'],['slight overbid ngl','loading new strategy...','trust the bid'],['strategic bag 🧠','all part of the plan','setting up next round']],
      w: [['WAIT WE WON?? 💀','no way no way','shaking rn'],['let\'s gooo 🔥','cleared the table 💅','gg ez'],['devoured them 💀','they were never ready','GOATED at spades 🐐']]
    },
    m: {
      o: [
        ['Did you just overbid? 😂','Hashtag set','Plot twist — bags!','That trump tho ♠'],
        ['That\'s the tea ☕','Sorry about your nil 💅','Chef\'s kiss on that trick 👨‍🍳💋','Your bags are showing'],
        ['I\'m running this table 🚢','Bye Felicia and your bid 👋','This is my TED talk on trumping.','Should\'ve bid nil 🎯']
      ],
      t: [['Squad goals!','Best partner ever ✨','We read each other'],['Dream team! 💪','Our bids are synced','Covering your nil like a pro'],['Unstoppable 🔥','They can\'t touch our bids','Iconic partnership']],
      d: [['This is fine 🔥🐕','Need a drink after that bag 🍷','Mercury must be in retrograde'],['Just a bag, not a set 📖','Manifesting no more bags ✨','Growth mindset on bids'],['All part of my five-round plan','I\'ve survived worse sets','Calculated overbid']],
      w: [['I CAN\'T EVEN 😭','Is this real??','Screenshot the score!'],['Made our bid! 🎯','Mic drop 🎤','Living my best Spades life'],['They got SET 👑','Legendary performance','Peak Spades right here']]
    },
    x: {
      o: [['That trick\'s mine.','I\'ll take it.','Not bad.','Spades are trump, kid.'],['That\'s how you play ♠ 😎','Smooth trump.','Experience wins tricks.','Textbook.'],['Sit down, kid.','Been trumping since before you were born.','Class is in session 📚','Count your bags.']],
      t: [['Good cover, partner.','Solid play.','We\'re on track.'],['Now we\'re cooking 🍳','Bids are dialed in.','That\'s teamwork.'],['Unstoppable.','They\'re getting set.','We own this table.']],
      d: [['Whatever. One bag.','It happens.','Not ideal.'],['Just regrouping.','Patience wins games.','I\'ve been set before.'],['Think bags rattle me?','I\'ve survived worse hands.','Strategic patience.']],
      w: [['Hey, we won!','Not bad for an old hand.','Still got the touch.'],['Clean game 🧹','Job done. No bags.','Efficient.'],['That\'s why experience matters.','Class dismissed 📚','Another day at the table.']]
    },
    b: {
      o: [['Well I\'ll be!','That trick\'s mine!','Still got it!','Lady luck and a spade!'],['THAT\'S how you trump! 👆','Old school Spades right there.','Read your hand like a book 📖','The classics never fail.'],['Back in MY day, we called that getting set!','Son, count your bags.','Respect your elders at the table! 👴','Hall of fame trumping.']],
      t: [['Good play, partner!','That\'s the spirit!','Fine team we make!'],['Like a well-oiled machine!','Just like the old days!','That\'s real partnership!'],['Unstoppable force!','They\'ll tell stories about us!','Championship caliber!']],
      d: [['Oh fiddlesticks. A bag.','Well, darn.','These cards aren\'t cooperating.'],['Just a bump in the road.','I\'ve weathered worse sets.','Patience is a virtue.'],['Think this bothers me? I raised teenagers.','More patience than you\'ve got years.','The long game is MY game.']],
      w: [['Well I\'ll be darned! We won!','Still got it after all these years!','Wait till I tell the grandkids!'],['THAT\'S how it\'s done! 🎯','Clean as a whistle!','Old school Spades!'],['And THAT is why you respect your elders! 👑','Decades of card playing!','Absolute masterclass!']]
    }
  }
};

LOCALES.es = {
  name: 'Español', flag: '🇪🇸', dir: 'ltr',
  names: ['Alejandro','Valentina','Santiago','Camila','Matías','Isabella','Sebastián','Lucía','Emiliano','Sofía','Daniel','Mariana','Andrés','Gabriela','Nicolás','Fernanda','Diego','Paula','Tomás','Catalina'],
  cities: ['Ciudad de México','Buenos Aires','Madrid','Bogotá','Lima','Santiago','Barcelona','Medellín','Guadalajara','Montevideo'],
  ui: Object.assign({}, (function(){ const base = {}; for (const k in LOCALES.en.ui) base[k] = LOCALES.en.ui[k]; return base; })(), {
    startGame: 'Iniciar Juego', gameTitle: 'ESPADAS', gameSubtitle: 'JUEGO DE CARTAS',
    bidPhase: 'Apuestas', bid: 'Apuesta', yourBid: 'Tu Apuesta', nil: 'Nulo',
    tricks: 'Bazas', bags: 'Bolsas', spadesBroken: '♠ ¡Espadas Rotas!',
    playerName: 'Jugador', yourTurn: 'TU TURNO', thinking: 'Pensando',
  }),
  p: LOCALES.en.p
};

LOCALES.ar = {
  name: 'العربية', flag: '🇸🇦', dir: 'rtl',
  names: ['أحمد','فاطمة','محمد','نورة','خالد','ليلى','عمر','سارة','يوسف','مريم','علي','هند','حسن','دانة','طارق','ريم','سعد','لمى','فيصل','جنى'],
  cities: ['الرياض','جدة','دبي','القاهرة','بيروت','عمّان','الدوحة','الكويت','المنامة','مسقط'],
  ui: Object.assign({}, (function(){ const base = {}; for (const k in LOCALES.en.ui) base[k] = LOCALES.en.ui[k]; return base; })(), {
    startGame: 'ابدأ اللعبة', gameTitle: 'سبيدز', gameSubtitle: 'لعبة ورق',
    bidPhase: 'المزايدة', bid: 'مزايدة', yourBid: 'مزايدتك', nil: 'صفر',
    tricks: 'حيل', bags: 'أكياس', playerName: 'لاعب', yourTurn: 'دورك', thinking: 'يفكر',
  }),
  p: LOCALES.en.p
};

LOCALES.zh = {
  name: '中文', flag: '🇨🇳', dir: 'ltr',
  names: ['伟明','小红','建国','美玲','志强','丽华','浩然','雅琴','天宇','思琪','俊杰','晓燕','子轩','婷婷','明辉','雪梅','文博','佳怡','嘉豪','诗涵'],
  cities: ['北京','上海','广州','深圳','成都','杭州','武汉','南京','重庆','西安'],
  ui: Object.assign({}, (function(){ const base = {}; for (const k in LOCALES.en.ui) base[k] = LOCALES.en.ui[k]; return base; })(), {
    startGame: '开始游戏', gameTitle: '黑桃', gameSubtitle: '纸牌游戏',
    bidPhase: '叫牌', bid: '叫牌', yourBid: '你的叫牌', nil: '零',
    tricks: '墩', bags: '包', playerName: '玩家', yourTurn: '你的回合', thinking: '思考中',
  }),
  p: LOCALES.en.p
};

function getLocale(lang) { return LOCALES[lang] || LOCALES.en; }

const PHRASE_GENS = ['gen_z', 'millennial', 'gen_x', 'boomer'];

function getLocalePhrase(lang, gen, category, tier) {
  const loc = getLocale(lang);
  const catMap = { opponent: 'o', teammate: 't', draw: 'd', domino: 'w', win: 'w' };
  const genMap = { gen_z: 'z', millennial: 'm', gen_x: 'x', boomer: 'b' };
  const tierIdx = tier === 'low' ? 0 : tier === 'mid' ? 1 : 2;
  const c = catMap[category] || category;
  const g = genMap[gen] || gen;
  const pool = loc.p && loc.p[g] && loc.p[g][c] && loc.p[g][c][tierIdx];
  if (pool && pool.length > 0) return pool[Math.floor(Math.random() * pool.length)];
  const enPool = LOCALES.en.p[g] && LOCALES.en.p[g][c] && LOCALES.en.p[g][c][tierIdx];
  if (enPool && enPool.length > 0) return enPool[Math.floor(Math.random() * enPool.length)];
  return '';
}

function _tUI(key) {
  const lang = localStorage.getItem('spades_lang') || detectBrowserLang();
  const loc = getLocale(lang);
  return (loc.ui && loc.ui[key]) || (LOCALES.en.ui && LOCALES.en.ui[key]) || key;
}

function detectBrowserLang() {
  const supported = Object.keys(LOCALES);
  const langs = navigator.languages || [navigator.language || 'en'];
  for (const raw of langs) {
    const code = raw.toLowerCase().split('-')[0];
    if (supported.includes(code)) return code;
  }
  return 'en';
}
