/**
 * @file stats.js — Statistics, achievements, and XP for Spades.
 * @author Keith Adler
 * @copyright 2026 Keith Adler. MIT License.
 */

function getStats() {
  try { return JSON.parse(localStorage.getItem('spades_stats') || '{}'); } catch(e) { return {}; }
}
function saveStats(stats) { try { localStorage.setItem('spades_stats', JSON.stringify(stats)); } catch(e) {} }
function recordWin(name) { const s = getStats(); if (!s[name]) s[name] = {wins:0,losses:0}; s[name].wins++; saveStats(s); }
function recordLoss(name) { const s = getStats(); if (!s[name]) s[name] = {wins:0,losses:0}; s[name].losses++; saveStats(s); }
function getRecord(name) { return getStats()[name] || {wins:0,losses:0}; }

function getRank(name) {
  const r = getRecord(name);
  const total = r.wins + r.losses;
  if (total === 0) return _tUI('newcomer');
  const ratio = r.wins / total;
  if (total < 3) return _tUI('rookie');
  if (ratio >= 0.75) return _tUI('spadeMaster');
  if (ratio >= 0.6) return _tUI('veteran');
  if (ratio >= 0.45) return _tUI('regular');
  if (ratio >= 0.3) return _tUI('apprentice');
  return _tUI('beginner');
}

function seedAIRecord(name, difficulty) {
  const s = getStats(); if (s[name]) return;
  const total = 10 + Math.floor(Math.random() * 40);
  let winRate;
  if (difficulty === 'easy') winRate = 0.2 + Math.random() * 0.2;
  else if (difficulty === 'medium') winRate = 0.4 + Math.random() * 0.2;
  else winRate = 0.6 + Math.random() * 0.25;
  const wins = Math.round(total * winRate);
  s[name] = { wins, losses: total - wins }; saveStats(s);
}

function getPlayerName() { return localStorage.getItem('spades_player_name') || _tUI('playerName'); }
function setPlayerName(name) { try { localStorage.setItem('spades_player_name', name || _tUI('playerName')); } catch(e) {} }

function getGameStats() { try { return JSON.parse(localStorage.getItem('spades_game_stats') || '{}'); } catch(e) { return {}; } }
function saveGameStats(s) { try { localStorage.setItem('spades_game_stats', JSON.stringify(s)); } catch(e) {} }

function trackStat(key, value) {
  const s = getGameStats();
  if (key === 'gamesPlayed') s.gamesPlayed = (s.gamesPlayed || 0) + 1;
  else if (key === 'gamesWon') s.gamesWon = (s.gamesWon || 0) + 1;
  else if (key === 'totalScore') s.totalScore = (s.totalScore || 0) + value;
  else if (key === 'winStreak') { s.currentStreak = (s.currentStreak || 0) + 1; s.bestStreak = Math.max(s.bestStreak || 0, s.currentStreak); }
  else if (key === 'loseStreak') s.currentStreak = 0;
  else if (key === 'nilsAttempted') s.nilsAttempted = (s.nilsAttempted || 0) + 1;
  else if (key === 'nilsSucceeded') s.nilsSucceeded = (s.nilsSucceeded || 0) + 1;
  else if (key === 'totalTricks') s.totalTricks = (s.totalTricks || 0) + value;
  else if (key === 'totalBags') s.totalBags = (s.totalBags || 0) + value;
  else if (key === 'totalRounds') s.totalRounds = (s.totalRounds || 0) + 1;
  saveGameStats(s);
}

const ACHIEVEMENTS = [
  { id: 'first_win', icon: '🏆', name: 'achFirstVictory', desc: 'achFirstVictoryDesc' },
  { id: 'streak_3', icon: '🔥', name: 'achOnFire', desc: 'achOnFireDesc' },
  { id: 'streak_5', icon: '💎', name: 'achUnstoppable', desc: 'achUnstoppableDesc' },
  { id: 'nil_success', icon: '🎯', name: 'achNilMaster', desc: 'achNilMasterDesc' },
  { id: 'blind_nil', icon: '🙈', name: 'achBlindNil', desc: 'achBlindNilDesc' },
  { id: 'set_opponent', icon: '🚫', name: 'achSetThem', desc: 'achSetThemDesc' },
  { id: 'games_10', icon: '🎮', name: 'achRegular', desc: 'achRegularDesc' },
  { id: 'games_50', icon: '👑', name: 'achSpadeMaster', desc: 'achSpadeMasterDesc' },
  { id: 'perfect_bid', icon: '✨', name: 'achPerfectBid', desc: 'achPerfectBidDesc' },
  { id: 'boston', icon: '🌟', name: 'achBoston', desc: 'achBostonDesc' },
  { id: 'no_bags', icon: '🧹', name: 'achCleanGame', desc: 'achCleanGameDesc' },
  { id: 'comeback', icon: '🔄', name: 'achComebackKid', desc: 'achComebackKidDesc' },
  { id: 'streak_10', icon: '🌟', name: 'achLegendary', desc: 'achLegendaryDesc' },
];

function getUnlockedAchievements() {
  try { return JSON.parse(localStorage.getItem('spades_achievements') || '[]'); } catch(e) { return []; }
}
function unlockAchievement(id) {
  const unlocked = getUnlockedAchievements();
  if (unlocked.includes(id)) return false;
  unlocked.push(id); localStorage.setItem('spades_achievements', JSON.stringify(unlocked));
  addXP(25); return true;
}
function awardAchievement(id) {
  if (unlockAchievement(id)) showAchievementPopup(id);
}
function checkAchievements(game) {
  const s = getGameStats();
  const checks = [
    ['first_win', (s.gamesWon || 0) >= 1],
    ['streak_3', (s.bestStreak || 0) >= 3],
    ['streak_5', (s.bestStreak || 0) >= 5],
    ['streak_10', (s.bestStreak || 0) >= 10],
    ['games_10', (s.gamesPlayed || 0) >= 10],
    ['games_50', (s.gamesPlayed || 0) >= 50],
  ];
  for (const [id, cond] of checks) {
    if (cond && unlockAchievement(id)) showAchievementPopup(id);
  }
}
function showAchievementPopup(id) {
  const ach = ACHIEVEMENTS.find(a => a.id === id); if (!ach) return;
  const el = document.createElement('div');
  el.className = 'achievement-popup';
  el.innerHTML = `<span class="ach-icon">${ach.icon}</span><div><div class="ach-label">${_tUI('achievementUnlocked')}</div><div class="ach-text">${_tUI(ach.name)}</div></div>`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}

function getXP() { try { return JSON.parse(localStorage.getItem('spades_xp') || '{"xp":0,"level":1}'); } catch(e) { return {xp:0,level:1}; } }
function addXP(amount) {
  const data = getXP(); data.xp += amount;
  while (data.xp >= data.level * 100) { data.xp -= data.level * 100; data.level++; }
  localStorage.setItem('spades_xp', JSON.stringify(data)); return data;
}
function getXPProgress() {
  const data = getXP(); const needed = data.level * 100;
  return { level: data.level, xp: data.xp, needed, pct: Math.round(data.xp / needed * 100) };
}

function trackPlayTime(seconds) {
  const current = parseInt(localStorage.getItem('spades_play_time') || '0');
  localStorage.setItem('spades_play_time', String(current + seconds));
}
function getPlayTime() { return parseInt(localStorage.getItem('spades_play_time') || '0'); }


// Head-to-Head Records
function getHeadToHead(name) {
  const s = getGameStats();
  return (s.headToHead && s.headToHead[name]) || { w: 0, l: 0 };
}
function trackHeadToHead(name, won) {
  const s = getGameStats();
  if (!s.headToHead) s.headToHead = {};
  if (!s.headToHead[name]) s.headToHead[name] = { w: 0, l: 0 };
  if (won) s.headToHead[name].w++; else s.headToHead[name].l++;
  saveGameStats(s);
}
