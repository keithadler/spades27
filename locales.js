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
    winsTrick: '{name} wins!', trickOf: 'Trick {n} of 13', noTricksYet: 'No tricks yet',
    bidBubble: 'Bid {n}', firstTrick: 'FIRST TRICK', points: 'points', back: '← Back',
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
    gameTitle: 'SPADES 27',
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
      'The cards believe in you even if you don\'t. 🃏',
      'Your partner is literally crying right now. 😢',
      'Quitting now? But you were SO close to... something. 🤷',
      'Your opponents are already practicing victory dances. 💃',
      'The spades are judging you. All of them. ♠♠♠',
    ],
    introHumanFirst: ['Let\'s go! 🎯', 'Deal me in 🃏', 'My table. 😎', 'Feeling lucky 🍀'],
    introAiFirst: ['Bring it on 💪', 'Easy tricks 😏', 'No mercy today 🔥', 'Hope you bid right 🎯', 'Watch your bags 🎒'],
    introHumanMid: ['New round 🎲', 'Focus up 🧠', 'Let\'s go 🃏'],
    introAiMid: ['Here we go 🎲', 'Ready 💪', 'My deal ✨', 'Shuffling up 🃏'],
    introAiCloseToWin: ['GG incoming 😎', 'Almost there 💀', 'Wrapping this up 🎁', 'Can you feel it? 🏆'],
    introAiTrailing: ['Not worried 😤', 'Comeback time 🔄', 'Watch me rally 🔥', 'Nil time? 🎯'],
    introAiLeading: ['Catch me if you can 🏃', 'Loving this lead 😏', 'Pressure\'s on you 👀', 'Keep bagging 🎒'],
    // UI strings used in game.js
    bidTracker: 'Bid / Tricks', bidsSoFar: 'Bids so far',
    teamDown: 'Your team is down by', beforeSeeing: 'before seeing your cards',
    noThanks: 'No thanks', goBlindNil: 'Go Blind Nil!',
    perfect: 'Perfect!', dealer: 'Dealer', leadsFirst: 'leads first',
    score: 'Score', vsYouRecord: 'vs you',
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

// SPANISH
LOCALES.es = {
  name: 'Español', flag: '🇪🇸', dir: 'ltr',
  names: [
    'Alejandro','Valentina','Santiago','Camila','Matías','Isabella','Sebastián','Lucía',
    'Emiliano','Sofía','Daniel','Mariana','Andrés','Gabriela','Nicolás','Fernanda',
    'Diego','Paula','Tomás','Catalina','Javier','Elena','Rafael','Carmen',
    'Miguel','Pilar','Roberto','Dolores','Enrique','Rosario','Pablo','Esperanza',
    'Fernando','Consuelo','Ramón','Guadalupe','Arturo','Mercedes','Héctor','Beatriz'
  ],
  cities: [
    'Ciudad de México','Buenos Aires','Madrid','Bogotá','Lima',
    'Santiago','Barcelona','Medellín','Guadalajara','Montevideo',
    'San Juan, PR','La Habana','Quito','Caracas','Santo Domingo',
    'Panamá','San José, CR','Cartagena','Sevilla','Córdoba'
  ],
  ui: Object.assign({}, (function(){ const b = {}; for (const k in LOCALES.en.ui) b[k] = LOCALES.en.ui[k]; return b; })(), {
    startGame: 'Iniciar Juego', resumeGame: '▶ Continuar Partida', rematch: 'Revancha',
    newGame: 'Nuevo Juego', copyLog: '📋 Copiar Registro', copied: '✅ Copiado!',
    gameMode: 'Modo de Juego', partnership: 'Equipos (2v2)', cutthroat: 'Todos contra Todos',
    playTo: 'Jugar Hasta', custom: 'Otro',
    aiDifficulty: 'Dificultad IA', easy: '😊 Fácil', mixed: '🎲 Mixto', hard: '🧠 Difícil',
    gameSpeed: 'Velocidad', fast: '🐇 Rápido', normal: '🎯 Normal', slow: '🐢 Lento',
    players: 'Jugadores', rules: '📖 Reglas', tutorial: '🎓 Tutorial',
    gameLog: '📋 Registro', stats: '📊 Estadísticas', prefs: '🎨 Preferencias',
    shortcuts: '❓ Atajos', rageQuit: '💀 Abandonar (cuenta como derrota)',
    yourTurn: 'TU TURNO', thinking: 'Pensando', turn: 'turno',
    scores: 'Puntos', round: 'Ronda', gameOver: 'FIN DEL JUEGO',
    youWin: '🏆 ¡Ganaste!', wins: 'Victorias', close: 'Cerrar', continue_: 'Continuar',
    theme: 'Tema', dark: '🌙 Oscuro', light: '☀️ Claro',
    tableTheme: 'Tema de Mesa', audio: 'Audio',
    music: '🎵 Música', sfx: '🔊 Efectos',
    trashTalk: 'Charla IA', off: 'No', low: 'Poco', max: 'Máx',
    colorblind: '♿ Modo Daltónico', language: 'Idioma',
    playerName: 'Jugador', accessibility: 'Accesibilidad',
    winsTrick: '¡{name} gana!', trickOf: 'Baza {n} de 13', noTricksYet: 'Aún no hay bazas',
    bidBubble: 'Apuesta {n}', firstTrick: 'PRIMERA BAZA', points: 'puntos', back: '← Atrás', of: 'de',
    pass: 'Pasar', hint: '💡 Pista', trickCount: 'bazas', bidLabel: 'apuesta',
    selectBid: 'Elige tu apuesta', confirmBid: 'Confirmar apuesta', teamScore: 'Puntos del equipo', opponentScore: 'Puntos del rival',
    trickSummary: 'Bazas ganadas', bagPenalty: '¡Penalización de bolsas! -100', nilBonus: '¡Bono de Nulo! +100', nilFailed: '¡Nulo fallido! -100',
    blindNilBonus: '¡Nulo Ciego! +200', blindNilFailed: '¡Nulo Ciego fallido! -200',
    overall: 'General', gamesPlayed: 'Partidas Jugadas', winsLosses: 'Victorias / Derrotas',
    winRate: 'Tasa de Victoria', bestStreak: 'Mejor Racha',
    totalScored: 'Puntos Totales', lifetime: 'Historial', achievements: 'Logros',
    playingTo: 'Jugando a', scoreboard: 'Puntos', pts: 'pts',
    yourTeam: 'Tu Equipo', opponentsTeam: 'Oponentes', vsYou: 'contra ti', teammate: 'COMPAÑERO',
    achievementUnlocked: 'Logro Desbloqueado',
    startPlaying: '¡A Jugar!', next: 'Siguiente →', stepOf: 'de', step: 'Paso', skip: 'Saltar',
    newcomer: 'Nuevo', rookie: 'Novato', spadeMaster: 'Maestro', veteran: 'Veterano',
    regular: 'Regular', apprentice: 'Aprendiz', beginner: 'Principiante',
    aggressive: 'Agresivo', defensive: 'Defensivo', chaotic: 'Caótico', calculated: 'Calculador', bully: 'Matón',
    bidPhase: 'Apuestas', bid: 'Apuesta', yourBid: 'Tu Apuesta', nil: 'Nulo', blindNil: 'Nulo Ciego',
    tricks: 'Bazas', bags: 'Bolsas', set: '¡FALLO!', made: '¡Hecho!',
    spadesBroken: '♠ ¡Espadas Rotas!', leadPlayer: 'abre', bidSummary: 'Apuestas',
    roundResults: 'Resultados de Ronda',
    gameTitle: 'ESPADAS 27', gameSubtitle: 'JUEGO DE CARTAS',
    rerollOpponent: 'Cambiar oponente',
    rageQuitLossNote: 'Esto cuenta como derrota.',
    darkTheme: '🌙 Oscuro', lightTheme: '☀️ Claro',
    tableRandom: 'Aleatorio', tableGreen: 'Verde Clásico', tableBlue: 'Azul Océano',
    tableRed: 'Rojo Casino', tablePurple: 'Púrpura Real', tableWood: 'Madera',
    resetStats: '🗑️ Borrar Estadísticas',
    resetConfirm: 'Esto borrará todas las estadísticas. ¿Estás seguro?',
    achFirstVictory: 'Primera Victoria', achFirstVictoryDesc: 'Gana tu primer juego',
    achOnFire: 'En Llamas', achOnFireDesc: 'Gana 3 juegos seguidos',
    achUnstoppable: 'Imparable', achUnstoppableDesc: 'Gana 5 juegos seguidos',
    achNilMaster: 'Maestro del Nulo', achNilMasterDesc: 'Haz un Nulo exitoso',
    achBlindNil: 'Fe Ciega', achBlindNilDesc: 'Haz un Nulo Ciego exitoso',
    achSetThem: '¡Fallo!', achSetThemDesc: 'Haz fallar al equipo rival',
    achRegular: 'Asiduo', achRegularDesc: 'Juega 10 partidas',
    achSpadeMaster: 'Maestro de Espadas', achSpadeMasterDesc: 'Juega 50 partidas',
    achPerfectBid: 'Apuesta Perfecta', achPerfectBidDesc: 'Gana exacto sin bolsas',
    achBoston: 'Boston', achBostonDesc: 'Gana las 13 bazas en una ronda',
    achCleanGame: 'Juego Limpio', achCleanGameDesc: 'Gana sin bolsas',
    achComebackKid: 'Remontada', achComebackKidDesc: 'Gana después de ir perdiendo por 100+',
    achLegendary: 'Legendario', achLegendaryDesc: 'Gana 10 juegos seguidos',
    rageQuitTaunts: [
      '¿En serio? ¿Te vas así? 🏃‍♂️', '¿Ya te rindes? Tu compañero está decepcionado. 😂',
      'Los ganadores nunca se rinden. 🤔', 'Abandonar es perder con pasos extra. 💀',
      'Dato curioso: el 100% de los que abandonan se arrepienten. 📊',
      'Giro de trama: estabas a punto de ganar. Probablemente. 🎬',
      'Las cartas creen en ti aunque tú no. 🃏', 'Tu compañero está llorando. 😢',
      '¿Te vas ahora? Pero estabas TAN cerca de... algo. 🤷',
      'Tus oponentes ya practican su baile de victoria. 💃',
      'Las espadas te están juzgando. Todas. ♠♠♠',
      'Tu avatar está decepcionado. No le hagas esto. 😢',
    ],
    introHumanFirst: ['¡Vamos! 🎯', 'A jugar 🃏', 'Mi mesa. 😎'],
    introAiFirst: ['Atrévete 💪', 'Juego fácil 😏', 'Sin piedad 🔥', 'Cuida tus bolsas 🎒'],
    introHumanMid: ['Nueva ronda 🎲', 'A enfocarse 🧠', '¡Vamos! 🃏'],
    introAiMid: ['Aquí vamos 🎲', 'Listo 💪', 'Mi turno ✨'],
    introAiCloseToWin: ['GG en camino 😎', '¿Lo sientes? 💀', 'Cerrando esto 🎁'],
    introAiTrailing: ['No me preocupo 😤', '¡Hora de remontar! 🔄', 'Racha de suerte viene'],
    introAiLeading: ['Atrápame si puedes 🏃', 'Me gusta esta ventaja 😏'],
    bidTracker: 'Apuesta / Bazas', bidsSoFar: 'Apuestas hasta ahora',
    teamDown: 'Tu equipo va perdiendo por', beforeSeeing: 'antes de ver tus cartas',
    noThanks: 'No gracias', goBlindNil: '¡Nulo Ciego!',
    perfect: '¡Perfecto!', dealer: 'Repartidor', leadsFirst: 'abre primero',
    score: 'Puntos', vsYouRecord: 'contra ti',
  }),
  p: {
    z: {
      o: [['¿eso fue tuyo? 💀','ni yo me la creo','qué random'],['eso estuvo limpio 🧹','quédate llorando','tu apuesta está muerta'],['están cocinados 💀','gg','built different fr']],
      t: [['somos equipo 💕','vamos bien'],['estamos comiendo 🔥','la sinergia'],['imbatibles 💀','nuestra era']],
      d: [['no las bolsas 😭','mala mano'],['pequeño error ngl','confía en el proceso'],['estratégico 🧠','todo según el plan']],
      w: [['¿¿GANAMOS?? 💀','no way'],['VAMOS 🔥','limpio 💅'],['los devoramos 💀','GOATED 🐐']]
    },
    m: {
      o: [['¿Eso pasó? 😂','Qué jugada','Giro de trama'],['Perdón no perdón 💅','Beso de chef 👨‍🍳💋','Tus bolsas se notan'],['Soy el capitán ahora 🚢','Adiós 👋','Deberías haber ido nulo']],
      t: [['¡Metas de equipo!','Somos los mejores'],['¡Equipo soñado! 💪','Nuestras apuestas están sincronizadas'],['Imparables 🔥','Icónicos']],
      d: [['Esto está bien 🔥🐕','Solo una bolsa'],['Manifestando buenas cartas ✨','Mindset de crecimiento'],['Todo parte del plan','Caos calculado']],
      w: [['¡NO PUEDO! 😭','¿Es real??'],['¡Hicimos la apuesta! 🎯','Mic drop 🎤'],['Los FALLARON 👑','Legendario']]
    },
    x: {
      o: [['Esa baza es mía.','Me lo quedo.','Espadas son triunfo, chico.'],['Así se juega ♠ 😎','Suave.','De manual.'],['Siéntate, chico.','Cuenta tus bolsas.','Clase en sesión 📚']],
      t: [['Buena cobertura.','Sólido.','Vamos bien.'],['Estamos cocinando 🍳','Apuestas sincronizadas.','Trabajo en equipo.'],['Imparables.','Se van a fallar.','Somos dueños de esta mesa.']],
      d: [['Una bolsa. Lo que sea.','Pasa.'],['Reagrupando.','Paciencia gana juegos.'],['¿Crees que me afecta?','He sobrevivido peores manos.']],
      w: [['¡Ganamos!','Nada mal.','Todavía tengo el toque.'],['Limpio 🧹','Eficiente.'],['La experiencia importa.','Clase terminada 📚']]
    },
    b: {
      o: [['¡Válgame!','¡Esa baza es mía!','¡Todavía puedo!'],['¡ESO es triunfar! 👆','Espadas de la vieja escuela.','Lo leí como un libro 📖'],['¡En mis tiempos a eso le decíamos fallo!','¡Respeta a tus mayores! 👴']],
      t: [['¡Buena jugada, compañero!','¡Buen equipo!'],['¡Como máquina!','¡Eso es trabajo en equipo!'],['¡Fuerza imparable!','¡Calibre de campeones!']],
      d: [['¡Caramba! Una bolsa.','Ni modo.'],['Solo un bache.','La paciencia es virtud.'],['¿Crees que me molesta? Crié adolescentes.','El juego largo es MI juego.']],
      w: [['¡Válgame, ganamos!','¡Todavía tengo el toque!'],['¡Así se hace! 🎯','¡Espadas de la vieja escuela!'],['¡Por ESO se respeta a los mayores! 👑','¡Clase magistral!']]
    }
  }
};

// ARABIC
LOCALES.ar = {
  name: 'العربية', flag: '🇸🇦', dir: 'rtl',
  names: [
    'أحمد','فاطمة','محمد','نورة','خالد','ليلى','عمر','سارة',
    'يوسف','مريم','علي','هند','حسن','دانة','طارق','ريم',
    'سعد','لمى','فيصل','جنى','ناصر','عبير','ماجد','أسماء',
    'بدر','شهد','سلطان','نوف','تركي','غادة','عبدالله','منال',
    'راشد','هيا','حمد','وفاء','سالم','رنا','زياد','ديمة'
  ],
  cities: [
    'الرياض','جدة','دبي','القاهرة','بيروت',
    'عمّان','الدوحة','الكويت','المنامة','مسقط',
    'أبوظبي','الدار البيضاء','تونس','الخرطوم','بغداد',
    'دمشق','الرباط','طرابلس','صنعاء','الجزائر'
  ],
  ui: Object.assign({}, (function(){ const b = {}; for (const k in LOCALES.en.ui) b[k] = LOCALES.en.ui[k]; return b; })(), {
    startGame: 'ابدأ اللعبة', rematch: 'إعادة المباراة', newGame: 'لعبة جديدة',
    gameMode: 'نوع اللعبة', partnership: 'فرق (٢ ضد ٢)', cutthroat: 'الكل ضد الكل',
    playTo: 'العب حتى', custom: 'مخصص',
    aiDifficulty: 'صعوبة الذكاء', easy: '😊 سهل', mixed: '🎲 متنوع', hard: '🧠 صعب',
    gameSpeed: 'السرعة', fast: '🐇 سريع', normal: '🎯 عادي', slow: '🐢 بطيء',
    players: 'اللاعبون', rules: '📖 القواعد', stats: '📊 الإحصائيات', prefs: '🎨 الإعدادات',
    shortcuts: '❓ الاختصارات', rageQuit: '💀 انسحاب (يحسب خسارة)',
    yourTurn: 'دورك', thinking: 'يفكر', turn: 'دور',
    scores: 'النقاط', round: 'الجولة', gameOver: 'انتهت اللعبة',
    youWin: '🏆 فزت!', wins: 'انتصارات', close: 'إغلاق', continue_: 'متابعة',
    theme: 'المظهر', dark: '🌙 داكن', light: '☀️ فاتح',
    tableTheme: 'لون الطاولة', audio: 'الصوت',
    music: '🎵 موسيقى', sfx: '🔊 مؤثرات',
    trashTalk: 'كلام اللاعبين', off: 'إيقاف', low: 'قليل', max: 'أقصى',
    playerName: 'لاعب', language: 'اللغة',
    winsTrick: '{name} يفوز!', trickOf: 'الأكلة {n} من 13', noTricksYet: 'لا أكلات بعد',
    bidBubble: 'مزايدة {n}', firstTrick: 'الأكلة الأولى', points: 'نقطة', back: 'رجوع', of: 'من',
    resumeGame: '▶ استئناف اللعبة المحفوظة', copyLog: '📋 نسخ سجل اللعبة', copied: '✅ تم النسخ!', tutorial: '🎓 الشرح التعليمي',
    gameLog: '📋 سجل اللعبة', pass: 'تمرير', hint: '💡 تلميح', colorblind: '♿ وضع عمى الألوان',
    accessibility: 'إمكانية الوصول', totalScored: 'مجموع النقاط المسجلة', lifetime: 'الإجمالي', scoreboard: 'النقاط',
    vsYou: 'ضدك', startPlaying: 'ابدأ اللعب!', next: 'التالي ←', step: 'خطوة',
    stepOf: 'من', skip: 'تخطي', aggressive: 'هجومي', defensive: 'دفاعي',
    chaotic: 'فوضوي', calculated: 'محسوب', bully: 'متنمر', trickCount: 'أكلات',
    bidLabel: 'مزايدة', leadPlayer: 'يبدأ', selectBid: 'اختر مزايدتك', confirmBid: 'تأكيد المزايدة',
    teamScore: 'نقاط الفريق', opponentScore: 'نقاط الخصم', trickSummary: 'الأكلات المكسوبة', bagPenalty: 'عقوبة الأكياس! -100',
    nilBonus: 'مكافأة الصفر! +100', nilFailed: 'فشل الصفر! -100', blindNilBonus: 'صفر أعمى! +200', blindNilFailed: 'فشل الصفر الأعمى! -200',
    achUnstoppable: 'لا يُوقف', achUnstoppableDesc: 'اربح 5 ألعاب متتالية', achSetThem: 'أسقطهم!', achSetThemDesc: 'أسقط الفريق الخصم',
    achPerfectBid: 'مزايدة مثالية', achPerfectBidDesc: 'اربح بالضبط عدد مزايدتك بدون أكياس', achBoston: 'بوسطن', achBostonDesc: 'اربح كل الأكلات الـ13 في جولة',
    achCleanGame: 'لعبة نظيفة', achCleanGameDesc: 'اربح لعبة بدون أي أكياس', achComebackKid: 'ملك العودة', achComebackKidDesc: 'اربح بعد تأخر بـ100+ نقطة',
    achLegendary: 'أسطوري', achLegendaryDesc: 'اربح 10 ألعاب متتالية', rageQuitLossNote: 'هذا يُحسب هزيمة في سجلك.',
    overall: 'عام', gamesPlayed: 'الألعاب', winsLosses: 'فوز / خسارة',
    winRate: 'نسبة الفوز', bestStreak: 'أفضل سلسلة', achievements: 'الإنجازات',
    playingTo: 'اللعب حتى', pts: 'نقاط',
    yourTeam: 'فريقك', opponentsTeam: 'الخصوم', teammate: 'زميل',
    achievementUnlocked: 'إنجاز جديد',
    newcomer: 'جديد', rookie: 'مبتدئ', spadeMaster: 'أستاذ', veteran: 'محترف',
    regular: 'منتظم', apprentice: 'متدرب', beginner: 'مبتدئ',
    bidPhase: 'المزايدة', bid: 'مزايدة', yourBid: 'مزايدتك', nil: 'صفر', blindNil: 'صفر أعمى',
    tricks: 'أكلات', bags: 'أكياس', set: 'فشل!', made: 'نجح!',
    spadesBroken: '♠ البستوني انكسر!', bidSummary: 'المزايدات', roundResults: 'نتائج الجولة',
    gameTitle: 'سبيدز ٢٧', gameSubtitle: 'لعبة ورق',
    rerollOpponent: 'تغيير الخصم',
    darkTheme: '🌙 داكن', lightTheme: '☀️ فاتح',
    tableRandom: 'عشوائي', tableGreen: 'أخضر', tableBlue: 'أزرق',
    tableRed: 'أحمر', tablePurple: 'بنفسجي', tableWood: 'خشبي',
    resetStats: '🗑️ مسح الإحصائيات', resetConfirm: 'سيتم مسح جميع البيانات. متأكد؟',
    achFirstVictory: 'أول فوز', achFirstVictoryDesc: 'فز بأول لعبة',
    achOnFire: 'مشتعل', achOnFireDesc: 'فز 3 مرات متتالية',
    achNilMaster: 'أستاذ الصفر', achNilMasterDesc: 'نجح في مزايدة صفر',
    achBlindNil: 'إيمان أعمى', achBlindNilDesc: 'نجح في صفر أعمى',
    achRegular: 'منتظم', achRegularDesc: 'العب 10 مباريات',
    achSpadeMaster: 'أستاذ البستوني', achSpadeMasterDesc: 'العب 50 مباراة',
    rageQuitTaunts: [
      'حقاً؟ ستمشي هكذا؟ 🏃‍♂️','تستسلم؟ زميلك محبط. 😂','الانسحاب خسارة بخطوات إضافية. 💀',
      'الفائزون لا يستسلمون. 🤔','خصومك سيخبرون الجميع. 📢',
      'حقيقة: ١٠٠٪ من المنسحبين يندمون. 📊','تطور مفاجئ: كنت على وشك الفوز. ربما. 🎬',
      'الأوراق تؤمن بك. 🃏','زميلك يبكي الآن. 😢',
      'تنسحب الآن؟ لكنك كنت قريباً من... شيء ما. 🤷',
      'خصومك يتدربون على رقصة النصر. 💃','البستوني يحكم عليك. ♠♠♠',
    ],
    introHumanFirst: ['يلا نبدأ! 🎯','جاهز 🃏','طاولتي 😎'],
    introAiFirst: ['تعال 💪','لعبة سهلة 😏','بدون رحمة 🔥'],
    introHumanMid: ['جولة جديدة 🎲','ركز 🧠'],
    introAiMid: ['يلا 🎲','جاهز 💪','دوري ✨'],
    introAiCloseToWin: ['GG جاية 😎','قربنا 💀'],
    introAiTrailing: ['مو قلقان 😤','وقت الرجعة 🔄'],
    introAiLeading: ['امسكني لو تقدر 🏃','الضغط عليك 👀'],
    bidTracker: 'مزايدة / أكلات', bidsSoFar: 'المزايدات حتى الآن',
    teamDown: 'فريقك متأخر بـ', beforeSeeing: 'قبل ما تشوف أوراقك',
    noThanks: 'لا شكراً', goBlindNil: 'صفر أعمى!',
    perfect: 'مثالي!', dealer: 'الموزع', leadsFirst: 'يبدأ أولاً',
    score: 'النقاط', vsYouRecord: 'ضدك',
  }),
  p: {
    z: {
      o: [['والله ما توقعت 💀','حظ بس'],['كلين 🧹','ما عندكم فرصة','أنا الماين كاراكتر'],['انتهيتوا 💀','جي جي','مختلف fr']],
      t: [['فريق أسطوري 💕','يلا نكمل'],['ناكلهم 🔥','السينرجي عالية'],['ما يقدرون علينا 💀','نحن الأبطال']],
      d: [['مو الأكياس 😭','يد سيئة'],['انتكاسة بسيطة','ثق بالعملية'],['استراتيجي 🧠','كل شي حسب الخطة']],
      w: [['فزنا؟؟ 💀','مو معقول'],['يلا 🔥','خلصنا 💅'],['التهمناهم 💀','أسطورة 🐐']]
    },
    m: {
      o: [['صار هالشي؟ 😂','ما صدقت'],['آسف مو آسف 💅','أكياسكم بانت'],['أنا القبطان 🚢','مع السلامة 👋']],
      t: [['أهداف فريق!','الأفضل'],['فريق الأحلام! 💪','متناغمين'],['ما يوقفنا 🔥','أيقونيين']],
      d: [['طبيعي 🔥🐕','بس كيس واحد'],['بلوت تويست 📖','عقلية نمو'],['كل شي حسب خطتي','فوضى محسوبة']],
      w: [['ما أقدر! 😭','حقيقي؟؟'],['نجحنا بالمزايدة! 🎯','مايك دروب 🎤'],['فشلوا 👑','أسطوري']]
    },
    x: {
      o: [['هذي أكلتي.','أخذها.','البستوني ترمب يا ولد.'],['هكذا تلعب ♠ 😎','سلس.','من الكتاب.'],['اقعد يا ولد.','احسب أكياسك.','الحصة بدأت 📚']],
      t: [['تغطية حلوة.','صلب.','ماشيين.'],['نطبخ الحين 🍳','المزايدات متناغمة.'],['ما يوقفنا.','بيفشلون.']],
      d: [['كيس واحد. عادي.','يصير.'],['صبر.','مريت بهالموقف.'],['تفتكر هذا يأثر؟','صبر استراتيجي.']],
      w: [['فزنا!','مو سيئ.','لسه عندي اللمسة.'],['نظيف 🧹','فعّال.'],['الخبرة مهمة.','الحصة انتهت 📚']]
    },
    b: {
      o: [['يا سلام!','أكلتي!','لسه فيني!'],['هذا ترمب! 👆','بستوني المدرسة القديمة.','قريتها مثل كتاب 📖'],['أيامنا كنا نسمي هذا فشل!','احترم كبارك! 👴']],
      t: [['لعبة حلوة يا شريك!','فريق ممتاز!'],['مثل الآلة!','شغل فريق!'],['قوة ما توقف!','مستوى بطولات!']],
      d: [['يا حسرة. كيس.','ما علينا.'],['بس مطب.','الصبر مفتاح.'],['ربيت مراهقين. هذا ولا شي.','اللعبة الطويلة لعبتي.']],
      w: [['يا سلام فزنا!','لسه عندي اللمسة!'],['هكذا تلعب! 🎯','بستوني المدرسة القديمة!'],['عشان كذا تحترم الكبار! 👑','درس في الإتقان!']]
    }
  }
};

// CHINESE
LOCALES.zh = {
  name: '中文', flag: '🇨🇳', dir: 'ltr',
  names: [
    '伟明','小红','建国','美玲','志强','丽华','浩然','雅琴',
    '天宇','思琪','俊杰','晓燕','子轩','婷婷','明辉','雪梅',
    '文博','佳怡','嘉豪','诗涵','宇航','欣怡','泽宇','梦瑶',
    '瑞祥','秀英','国强','玉兰','德明','桂花','福生','淑芬',
    '永康','凤英','金龙','翠花','大伟','春梅','海涛','月华'
  ],
  cities: [
    '北京','上海','广州','深圳','成都',
    '杭州','武汉','南京','重庆','西安',
    '苏州','天津','长沙','青岛','大连',
    '厦门','昆明','哈尔滨','台北','香港'
  ],
  ui: Object.assign({}, (function(){ const b = {}; for (const k in LOCALES.en.ui) b[k] = LOCALES.en.ui[k]; return b; })(), {
    startGame: '开始游戏', rematch: '再来一局', newGame: '新游戏',
    gameMode: '游戏模式', partnership: '组队 (2v2)', cutthroat: '自由对战',
    playTo: '目标分数', custom: '自定义',
    aiDifficulty: 'AI难度', easy: '😊 简单', mixed: '🎲 混合', hard: '🧠 困难',
    gameSpeed: '速度', fast: '🐇 快速', normal: '🎯 正常', slow: '🐢 慢速',
    players: '玩家', rules: '📖 规则', stats: '📊 统计', prefs: '🎨 设置',
    shortcuts: '❓ 快捷键', rageQuit: '💀 退出（算作失败）',
    yourTurn: '你的回合', thinking: '思考中', turn: '的回合',
    scores: '分数', round: '第', gameOver: '游戏结束',
    youWin: '🏆 你赢了！', wins: '胜', close: '关闭', continue_: '继续',
    theme: '主题', dark: '🌙 深色', light: '☀️ 浅色',
    tableTheme: '桌面主题', audio: '音频',
    music: '🎵 背景音乐', sfx: '🔊 音效',
    trashTalk: 'AI 垃圾话', off: '关', low: '少', max: '最多',
    playerName: '玩家', language: '语言',
    winsTrick: '{name} 获胜！', trickOf: '第 {n}/13 墩', noTricksYet: '还没有出牌记录',
    bidBubble: '叫牌 {n}', firstTrick: '首墩', points: '分', back: '← 返回', of: '/',
    resumeGame: '▶ 继续存档游戏', copyLog: '📋 复制游戏记录', copied: '✅ 已复制！', tutorial: '🎓 教程',
    gameLog: '📋 游戏记录', pass: '过', hint: '💡 提示', colorblind: '♿ 色盲模式',
    accessibility: '无障碍', totalScored: '总得分', lifetime: '生涯', scoreboard: '比分',
    vsYou: '对你', startPlaying: '开始游戏！', next: '下一步 →', step: '步骤',
    stepOf: '/', skip: '跳过', aggressive: '激进', defensive: '稳健',
    chaotic: '混乱', calculated: '精算', bully: '霸凌', trickCount: '墩',
    bidLabel: '叫牌', leadPlayer: '先出', selectBid: '选择你的叫牌', confirmBid: '确认叫牌',
    teamScore: '队伍得分', opponentScore: '对手得分', trickSummary: '赢得的墩数', bagPenalty: '袋子惩罚！-100',
    nilBonus: '零叫奖励！+100', nilFailed: '零叫失败！-100', blindNilBonus: '盲零成功！+200', blindNilFailed: '盲零失败！-200',
    achUnstoppable: '势不可挡', achUnstoppableDesc: '连胜5局', achSetThem: '击溃对手！', achSetThemDesc: '让对方队伍没完成叫牌',
    achPerfectBid: '完美叫牌', achPerfectBidDesc: '恰好赢得叫牌数且零袋', achBoston: '波士顿', achBostonDesc: '一回合赢下全部13墩',
    achCleanGame: '干净一局', achCleanGameDesc: '零袋赢下一局', achComebackKid: '逆转之王', achComebackKidDesc: '落后100+后获胜',
    achLegendary: '传奇', achLegendaryDesc: '连胜10局', rageQuitLossNote: '这会记为一场败绩。',
    overall: '总览', gamesPlayed: '游戏场次', winsLosses: '胜/负',
    winRate: '胜率', bestStreak: '最佳连胜', achievements: '成就',
    playingTo: '目标', pts: '分',
    yourTeam: '你的队伍', opponentsTeam: '对手队伍', teammate: '队友',
    achievementUnlocked: '成就解锁',
    newcomer: '新手', rookie: '菜鸟', spadeMaster: '大师', veteran: '老手',
    regular: '常客', apprentice: '学徒', beginner: '初学者',
    bidPhase: '叫牌', bid: '叫牌', yourBid: '你的叫牌', nil: '零', blindNil: '盲零',
    tricks: '墩', bags: '袋子', set: '失败！', made: '成功！',
    spadesBroken: '♠ 黑桃已破！', bidSummary: '叫牌', roundResults: '回合结果',
    gameTitle: '黑桃 27', gameSubtitle: '纸牌游戏',
    rerollOpponent: '换对手',
    darkTheme: '🌙 深色', lightTheme: '☀️ 浅色',
    tableRandom: '随机', tableGreen: '经典绿', tableBlue: '海洋蓝',
    tableRed: '赌场红', tablePurple: '皇家紫', tableWood: '木质',
    resetStats: '🗑️ 重置数据', resetConfirm: '将清除所有数据。确定吗？',
    achFirstVictory: '首胜', achFirstVictoryDesc: '赢得第一场',
    achOnFire: '火热', achOnFireDesc: '连赢3场',
    achNilMaster: '零墩大师', achNilMasterDesc: '成功叫零',
    achBlindNil: '盲目信仰', achBlindNilDesc: '成功盲零',
    achRegular: '常客', achRegularDesc: '玩10场',
    achSpadeMaster: '黑桃大师', achSpadeMasterDesc: '玩50场',
    rageQuitTaunts: [
      '真的？就这样走了？🏃‍♂️','已经放弃了？队友很失望。😂','退出只是多走几步的失败。💀',
      '赢家从不放弃。🤔','你的对手会告诉所有人。📢',
      '趣事：100%退出的人都后悔了。📊','剧情反转：你本来要赢了。大概。🎬',
      '牌相信你，即使你不相信自己。🃏','你的队友在哭。😢',
      '现在退出？但你离……某个东西很近了。🤷',
      '对手已经在练习胜利之舞了。💃','黑桃在审判你。所有的。♠♠♠',
    ],
    introHumanFirst: ['开始吧！🎯','准备好了 🃏','我的主场 😎'],
    introAiFirst: ['放马过来 💪','轻松局 😏','不留情 🔥'],
    introHumanMid: ['新一轮 🎲','集中精神 🧠'],
    introAiMid: ['开始了 🎲','准备好了 💪','轮到我 ✨'],
    introAiCloseToWin: ['GG在即 😎','快了 💀'],
    introAiTrailing: ['不担心 😤','逆转时刻 🔄'],
    introAiLeading: ['来追我啊 🏃','压力在你 👀'],
    bidTracker: '叫牌 / 墩', bidsSoFar: '已有叫牌',
    teamDown: '你的队伍落后', beforeSeeing: '在看牌之前',
    noThanks: '不了', goBlindNil: '盲零！',
    perfect: '完美！', dealer: '庄家', leadsFirst: '先出牌',
    score: '分数', vsYouRecord: '对你',
  }),
  p: {
    z: {
      o: [['不是吧💀','运气来了','什么情况'],['太干净了🧹','你们没机会','纯实力'],['你们完了💀','gg','天生不同']],
      t: [['我们太强了💕','冲冲冲'],['我们在吃🔥','默契拉满'],['无敌💀','我们的时代']],
      d: [['不是袋子😭','烂牌'],['小挫折','相信过程'],['战略性🧠','都在计划中']],
      w: [['我们赢了？？💀','不可能'],['冲🔥','结束了💅'],['吞噬了他们💀','传奇🐐']]
    },
    m: {
      o: [['这发生了？😂','小确幸'],['不好意思💅','你们的包在涨','厨师之吻👨‍🍳💋'],['我是船长了🚢','再见👋','该叫零的']],
      t: [['团队目标！','最棒'],['梦之队！💪','叫牌同步'],['势不可挡🔥','传奇组合']],
      d: [['没事🔥🐕','就一个包'],['剧情转折📖','成长心态'],['都在计划里','有计划的混乱']],
      w: [['不敢相信😭','真的吗？？'],['叫牌成功！🎯','话筒放下🎤'],['他们失败了👑','传奇表现']]
    },
    x: {
      o: [['这墩是我的。','收下了。','黑桃是王牌，小朋友。'],['就该这么打♠😎','稳。','教科书式。'],['坐下吧。','数数你的包。','上课了📚']],
      t: [['好配合。','稳。','在路上了。'],['开始发力🍳','叫牌到位。','团队精神。'],['无人能挡。','他们要失败了。','这桌子是我们的。']],
      d: [['一个包。无所谓。','正常。'],['调整一下。','耐心赢比赛。'],['你觉得这能影响我？','战略性耐心。']],
      w: [['赢了！','不错。','宝刀未老。'],['干净🧹','高效。'],['经验很重要。','下课了📚']]
    },
    b: {
      o: [['哎呀！','这墩是我的！','还能行！'],['这才叫王牌！👆','老派黑桃。','看得透透的📖'],['我们那时候管这叫失败！','数数你的包。','尊重长辈！👴']],
      t: [['好牌，搭档！','好搭档！'],['配合默契！','团队精神！'],['势不可挡！','冠军水平！']],
      d: [['哎。一个包。','算了。'],['小坎坷。','耐心是美德。'],['养过青春期的孩子。这不算什么。','持久战是我的强项。']],
      w: [['哎呀赢了！','宝刀未老！'],['就该这样！🎯','老派黑桃！'],['尊重长辈！👑','大师级表现！']]
    }
  }
};

// ---- Rules content per language ----
const RULES = {
  en: `<h3>🎯 The Goal</h3><p>Be the first team to reach the target score (usually 500). You play in partnerships — you and the player across from you vs. the other two.</p><h3>🃏 The Deal</h3><p>Standard 52-card deck. Each player gets <strong>13 cards</strong>. Spades are always trump.</p><h3>📢 Bidding</h3><p>Before play, each player bids how many tricks they think they'll win (1–13). Your team's bids are combined. You can also bid <strong>Nil</strong> (zero tricks) for a risky +100 bonus, or <strong>Blind Nil</strong> (+200) before seeing your cards when your team is down 100+.</p><h3>🎮 Playing Tricks</h3><p>The player left of the dealer leads first. You <strong>must follow the lead suit</strong> if you can. If you can't, you may play any card including spades (trump). Highest card of the lead suit wins, unless a spade was played — then highest spade wins.</p><h3>♠ Breaking Spades</h3><p>You can't lead with spades until someone has played a spade on a previous trick (or you only have spades left).</p><h3>💰 Scoring</h3><p>If your team makes its bid: <strong>bid × 10 points</strong> + 1 point per overtrick (bag). If you fail: <strong>−bid × 10 points</strong>.</p><h3>🎒 Bags</h3><p>Overtricks (bags) accumulate. Every <strong>10 bags = −100 penalty</strong>. Don't win too many extra tricks!</p><h3>🎯 Nil Bids</h3><p>Nil = promise to win zero tricks. Success: <strong>+100</strong>. Failure: <strong>−100</strong>. Blind Nil: <strong>+200/−200</strong>.</p><h3>💡 Tips</h3><p>🧮 Count tricks before bidding · ♠ Save spades for when you need them · 🤝 Watch your partner's plays · 🎒 Avoid bags near multiples of 10 · 🎯 Bust opponents' nil bids with low leads</p>`,
  es: `<h3>🎯 El Objetivo</h3><p>Sé el primer equipo en llegar al puntaje objetivo (normalmente 500). Juegas en parejas — tú y el jugador de enfrente contra los otros dos.</p><h3>🃏 El Reparto</h3><p>Baraja estándar de 52 cartas. Cada jugador recibe <strong>13 cartas</strong>. Las espadas siempre son triunfo.</p><h3>📢 Apuestas</h3><p>Antes de jugar, cada jugador apuesta cuántas bazas cree que ganará (1–13). Las apuestas del equipo se combinan. También puedes apostar <strong>Nulo</strong> (cero bazas) para un bono arriesgado de +100, o <strong>Nulo Ciego</strong> (+200) antes de ver tus cartas cuando tu equipo va perdiendo por 100+.</p><h3>🎮 Jugando Bazas</h3><p>El jugador a la izquierda del repartidor abre primero. <strong>Debes seguir el palo</strong> si puedes. Si no puedes, puedes jugar cualquier carta incluyendo espadas (triunfo).</p><h3>♠ Romper Espadas</h3><p>No puedes abrir con espadas hasta que alguien haya jugado una espada en una baza anterior.</p><h3>💰 Puntuación</h3><p>Si tu equipo cumple su apuesta: <strong>apuesta × 10 puntos</strong> + 1 punto por baza extra (bolsa). Si fallas: <strong>−apuesta × 10</strong>.</p><h3>🎒 Bolsas</h3><p>Las bazas extra se acumulan. Cada <strong>10 bolsas = −100 penalización</strong>.</p><h3>🎯 Apuestas Nulas</h3><p>Nulo = prometes ganar cero bazas. Éxito: <strong>+100</strong>. Fallo: <strong>−100</strong>. Nulo Ciego: <strong>+200/−200</strong>.</p>`,
  ar: `<h3>🎯 الهدف</h3><p>كن أول فريق يصل للنتيجة المطلوبة (عادة 500). تلعب في شراكة — أنت واللاعب المقابل ضد الآخرين.</p><h3>🃏 التوزيع</h3><p>مجموعة ورق عادية 52 ورقة. كل لاعب يحصل على <strong>13 ورقة</strong>. البستوني دائماً ترمب.</p><h3>📢 المزايدة</h3><p>قبل اللعب، كل لاعب يزايد كم أكلة يتوقع يفوز (1-13). مزايدات الفريق تُجمع. تقدر تزايد <strong>صفر</strong> (بدون أكلات) لبونص +100، أو <strong>صفر أعمى</strong> (+200) قبل ما تشوف أوراقك.</p><h3>🎮 لعب الأكلات</h3><p>اللاعب يسار الموزع يبدأ. <strong>لازم تتبع اللون</strong> لو عندك. لو ما عندك، تقدر تلعب أي ورقة بما فيها البستوني.</p><h3>♠ كسر البستوني</h3><p>ما تقدر تفتح ببستوني إلا لو أحد لعب بستوني قبل كذا.</p><h3>💰 النقاط</h3><p>لو فريقك نجح: <strong>مزايدة × 10 نقاط</strong> + 1 لكل أكلة زيادة (كيس). لو فشل: <strong>−مزايدة × 10</strong>.</p><h3>🎒 الأكياس</h3><p>الأكلات الزيادة تتراكم. كل <strong>10 أكياس = −100</strong>.</p><h3>🎯 مزايدة الصفر</h3><p>صفر = تعد ما تفوز بأي أكلة. نجاح: <strong>+100</strong>. فشل: <strong>−100</strong>. صفر أعمى: <strong>+200/−200</strong>.</p>`,
  zh: `<h3>🎯 目标</h3><p>率先达到目标分数（通常500分）。你和对面的玩家组队，对抗另外两人。</p><h3>🃏 发牌</h3><p>标准52张牌。每人<strong>13张</strong>。黑桃永远是王牌。</p><h3>📢 叫牌</h3><p>出牌前，每人预测自己能赢几墩（1-13）。队伍的叫牌合并计算。你也可以叫<strong>零</strong>（不赢任何墩）获得+100奖励，或在落后100+分时叫<strong>盲零</strong>（+200）。</p><h3>🎮 出牌</h3><p>庄家左边的玩家先出。你<strong>必须跟花色</strong>。如果没有该花色，可以出任何牌包括黑桃（王牌）。</p><h3>♠ 破黑桃</h3><p>在有人出过黑桃之前，不能用黑桃领出。</p><h3>💰 计分</h3><p>完成叫牌：<strong>叫牌数 × 10分</strong> + 每多赢1墩得1分（包）。失败：<strong>−叫牌数 × 10分</strong>。</p><h3>🎒 包</h3><p>多赢的墩数累积。每<strong>10个包 = −100分</strong>。</p><h3>🎯 零叫牌</h3><p>零 = 承诺不赢任何墩。成功：<strong>+100</strong>。失败：<strong>−100</strong>。盲零：<strong>+200/−200</strong>。</p>`
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

// Localized tutorial steps (EN lives in ui-helpers.js TUTORIAL_STEPS as the fallback)
LOCALES.es.tutSteps = [
  { title: '👋 ¡Bienvenido a Spades!', body: 'Un juego de bazas donde <strong>las espadas siempre son triunfo</strong>. Juega con un compañero contra dos rivales. El primer equipo en llegar a la puntuación objetivo gana.' },
  { title: '🃏 El Reparto', body: 'Cada jugador recibe <strong>13 cartas</strong> de una baraja estándar de 52. Las cartas van del 2 (la más baja) al As (la más alta).' },
  { title: '📢 Las Apuestas', body: 'Antes de jugar, cada jugador <strong>apuesta</strong> cuántas bazas espera ganar (1-13). Las apuestas de tu equipo se suman. Apuesta con cuidado: ¡pasarse sale caro!' },
  { title: '🎯 Nulo y Nulo Ciego', body: '<strong>Nulo</strong> = apostar cero bazas (+100 si lo logras, -100 si fallas). <strong>Nulo Ciego</strong> = apostar cero antes de ver tus cartas (+200/-200). Mucho riesgo, mucha recompensa.' },
  { title: '🎮 Jugando Bazas', body: 'El jugador a la izquierda del repartidor sale primero. <strong>Debes seguir el palo de salida</strong>. ¿No puedes? Juega cualquier carta, incluso espadas para <strong>fallar</strong>.' },
  { title: '♠ Romper Espadas', body: 'No puedes salir con espadas hasta que alguien haya jugado una espada en una baza anterior. Una vez rotas, puedes salir con espadas libremente.' },
  { title: '💰 Puntuación', body: 'Cumple tu apuesta: <strong>apuesta × 10 puntos</strong> + 1 por baza extra (bolsa). Falla: <strong>-apuesta × 10</strong>. ¡Cada <strong>10 bolsas = -100 de castigo</strong>!' },
  { title: '🤝 Trabajo en Equipo', body: 'Tu compañero se sienta enfrente. Observa sus jugadas y no le quites bazas ganadas. Si apuesta Nulo, cúbrelo ganando bazas.' },
  { title: '🚀 ¡Listo!', body: 'El primero en llegar a la <strong>puntuación objetivo</strong> gana. Usa el marcador de apuestas en la mesa. Pulsa <strong>?</strong> para los atajos de teclado. ¡Buena suerte!' },
];

LOCALES.ar.tutSteps = [
  { title: '👋 أهلاً بك في سبيدس!', body: 'لعبة أكلات حيث <strong>البستوني دائماً هو الرائج</strong>. العب مع شريك ضد خصمين. أول فريق يصل إلى النقاط المطلوبة يفوز.' },
  { title: '🃏 التوزيع', body: 'كل لاعب يأخذ <strong>13 ورقة</strong> من مجموعة 52 ورقة. الأوراق من 2 (الأدنى) إلى الآس (الأعلى).' },
  { title: '📢 المزايدة', body: 'قبل اللعب، كل لاعب <strong>يزايد</strong> بعدد الأكلات التي يتوقع كسبها (1-13). مزايدات فريقك تُجمع معاً. زايد بحذر، فالمبالغة مكلفة!' },
  { title: '🎯 الصفر والصفر الأعمى', body: '<strong>الصفر</strong> = تتعهد بعدم كسب أي أكلة (+100 عند النجاح، -100 عند الفشل). <strong>الصفر الأعمى</strong> = قبل رؤية أوراقك (+200/-200). مخاطرة كبيرة ومكافأة كبيرة.' },
  { title: '🎮 لعب الأكلات', body: 'اللاعب على يسار الموزع يبدأ. <strong>يجب أن تلعب نفس نوع ورقة البداية</strong>. لا تستطيع؟ العب أي ورقة، حتى البستوني <strong>لتقطع بها</strong>.' },
  { title: '♠ كسر البستوني', body: 'لا يمكنك البدء بالبستوني حتى يلعب أحد بستوني في أكلة سابقة. بعد الكسر، يمكنك البدء به بحرية.' },
  { title: '💰 التسجيل', body: 'حقق مزايدتك: <strong>المزايدة × 10 نقاط</strong> + 1 لكل أكلة زائدة (كيس). أخفقت: <strong>-المزايدة × 10</strong>. كل <strong>10 أكياس = -100 عقوبة</strong>!' },
  { title: '🤝 العمل الجماعي', body: 'شريكك يجلس مقابلك. راقب لعبه ولا تأخذ أكلاته الرابحة. إذا زايد بالصفر، احمه بكسب الأكلات.' },
  { title: '🚀 أنت جاهز!', body: 'أول من يصل إلى <strong>النقاط المطلوبة</strong> يفوز. استخدم متتبع المزايدات على الطاولة. اضغط <strong>?</strong> لاختصارات لوحة المفاتيح. حظاً موفقاً!' },
];

LOCALES.zh.tutSteps = [
  { title: '👋 欢迎来到黑桃王！', body: '一款吃墩类纸牌游戏，<strong>黑桃永远是王牌</strong>。与搭档组队对抗两名对手。先达到目标分数的队伍获胜。' },
  { title: '🃏 发牌', body: '每位玩家从标准52张牌中获得<strong>13张牌</strong>。牌面从2（最小）到A（最大）。' },
  { title: '📢 叫牌', body: '开局前，每位玩家<strong>叫牌</strong>预测自己能赢几墩（1-13）。你和队友的叫牌数相加。小心叫牌，叫多了代价很大！' },
  { title: '🎯 零叫与盲零', body: '<strong>零叫</strong>＝叫零墩（成功+100，失败-100）。<strong>盲零</strong>＝看牌前就叫零（+200/-200）。高风险高回报。' },
  { title: '🎮 出牌', body: '庄家左侧的玩家先出。<strong>必须跟随首出花色</strong>。跟不了？可出任意牌，包括用黑桃<strong>将吃</strong>。' },
  { title: '♠ 破黑桃', body: '在有人于之前的墩中打出黑桃之前，不能以黑桃领出。破了之后即可自由领出黑桃。' },
  { title: '💰 计分', body: '完成叫牌：<strong>叫牌数 × 10分</strong>，每多赢一墩（袋子）+1分。失败：<strong>-叫牌数 × 10</strong>。每<strong>10个袋子扣100分</strong>！' },
  { title: '🤝 团队配合', body: '你的搭档坐在对面。留意他的出牌，别抢他赢定的墩。他叫零时，帮他赢墩掩护。' },
  { title: '🚀 准备好了！', body: '先达到<strong>目标分数</strong>者获胜。用桌上的叫牌追踪器观察进度。按 <strong>?</strong> 查看快捷键。祝好运！' },
];
