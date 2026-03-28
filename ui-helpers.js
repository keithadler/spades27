/**
 * @file ui-helpers.js — UI utilities for Spades.
 * @author Keith Adler
 * @copyright 2026 Keith Adler. MIT License.
 */

function avatarURL(seed) {
  return `https://api.dicebear.com/9.x/open-peeps/svg?seed=${encodeURIComponent(seed)}&radius=50&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`;
}

function _buildPhrases(lang) {
  const loc = getLocale(lang || 'en');
  const catMap = { o: 'opponent', t: 'teammate', d: 'draw', w: 'win' };
  const tierMap = ['low', 'mid', 'high'];
  const phrases = {};
  for (const [ck, cv] of Object.entries(catMap)) {
    phrases[cv] = { low: [], mid: [], high: [] };
    for (const gen of ['z', 'm', 'x', 'b']) {
      if (loc.p && loc.p[gen] && loc.p[gen][ck]) {
        for (let ti = 0; ti < 3; ti++) {
          phrases[cv][tierMap[ti]].push(...(loc.p[gen][ck][ti] || []));
        }
      }
    }
  }
  return phrases;
}
let PHRASES = _buildPhrases(localStorage.getItem('spades_lang') || detectBrowserLang());

function getPhrase(player, category) {
  const rec = getRecord(player.name);
  const total = rec.wins + rec.losses;
  const ratio = total > 0 ? rec.wins / total : 0.5;
  let tier = ratio >= 0.6 ? 'high' : ratio >= 0.35 ? 'mid' : 'low';
  const lang = localStorage.getItem('spades_lang') || detectBrowserLang();
  if (player.generation) {
    const phrase = getLocalePhrase(lang, player.generation, category, tier);
    if (phrase) return phrase;
  }
  const pool = PHRASES[category] && PHRASES[category][tier];
  if (!pool || pool.length === 0) return '';
  return pool[Math.floor(Math.random() * pool.length)];
}

function getHumanAvatarSeed() {
  let seed = localStorage.getItem('spades_human_avatar');
  if (!seed) { seed = 'human-' + Math.random().toString(36).slice(2, 10); localStorage.setItem('spades_human_avatar', seed); }
  return seed;
}

function pickRandomNames(count) {
  const lang = localStorage.getItem('spades_lang') || detectBrowserLang();
  const loc = getLocale(lang);
  const names = [...(loc.names || LOCALES.en.names)].sort(() => Math.random() - 0.5);
  const cities = [...(loc.cities || LOCALES.en.cities)].sort(() => Math.random() - 0.5);
  return names.slice(0, count).map((name, i) => ({ name, city: cities[i % cities.length] }));
}

const TABLE_THEMES = [
  { id: 'random', name: 'Random', felt: '', dark: '' },
  { id: 'green', name: 'Classic Green', felt: '#1e7a35', dark: '#0d3a18' },
  { id: 'blue', name: 'Ocean Blue', felt: '#1a4a7a', dark: '#0a2a4a' },
  { id: 'red', name: 'Casino Red', felt: '#7a1a2a', dark: '#3a0a14' },
  { id: 'purple', name: 'Royal Purple', felt: '#4a1a6a', dark: '#2a0a3a' },
  { id: 'wood', name: 'Wooden', felt: '#6a4a2a', dark: '#3a2a14' },
];
function getTableTheme() { return localStorage.getItem('spades_table_theme') || 'blue'; }
function setTableTheme(id) { localStorage.setItem('spades_table_theme', id); applyTableTheme(); }
function applyTableTheme() {
  const id = getTableTheme();
  let t;
  if (id === 'random') { const real = TABLE_THEMES.filter(t => t.id !== 'random'); t = real[Math.floor(Math.random() * real.length)]; }
  else t = TABLE_THEMES.find(t => t.id === id) || TABLE_THEMES[2];
  document.body.style.setProperty('--felt', t.felt);
  document.body.style.setProperty('--dark', t.dark);
  let style = document.getElementById('theme-style');
  if (!style) { style = document.createElement('style'); style.id = 'theme-style'; document.head.appendChild(style); }
  style.textContent = `body::before { background: radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,0,0,0.5) 100%), radial-gradient(ellipse at 50% 50%, ${t.felt} 0%, ${t.dark} 80%) !important; }`;
}
applyTableTheme();

const AI_PERSONALITIES = [
  { id: 'aggressive', name: 'aggressive', desc: 'Bids high, plays to win', icon: '🔥', tweaks: {} },
  { id: 'defensive', name: 'defensive', desc: 'Conservative bids, safe play', icon: '🛡️', tweaks: {} },
  { id: 'chaotic', name: 'chaotic', desc: 'Unpredictable bids and plays', icon: '🎲', tweaks: {} },
  { id: 'calculated', name: 'calculated', desc: 'Precise bidding, optimal play', icon: '🧠', tweaks: {} },
  { id: 'bully', name: 'bully', desc: 'Targets opponents, aggressive trumping', icon: '😈', tweaks: {} },
];

function spawnParticles(x, y, count, type) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement('div');
    p.className = 'particle ' + (type || 'particle-gold');
    const size = 4 + Math.random() * 6;
    p.style.width = size + 'px';
    p.style.height = size + 'px';
    p.style.left = x + 'px';
    p.style.top = y + 'px';
    p.style.opacity = '1';

    const angle = Math.random() * Math.PI * 2;
    const dist = 40 + Math.random() * 80;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist;
    const duration = 0.6 + Math.random() * 0.6;

    if (type === 'particle-confetti') {
      p.style.background = ['#4a90d9','#e04a3a','#4aaf6c','#f0b840','#a855f7','#ff6b9d'][Math.floor(Math.random()*6)];
      p.style.width = (6 + Math.random() * 8) + 'px';
      p.style.height = (6 + Math.random() * 8) + 'px';
      p.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    }

    document.body.appendChild(p);

    // Double-rAF: first frame paints the element at (x,y),
    // second frame starts the transition to (x+dx, y+dy).
    // Without this, the browser batches both into one frame
    // and the transition never fires.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        p.style.transition = `left ${duration}s ease-out, top ${duration}s ease-out, opacity ${duration}s ease-out`;
        p.style.left = (x + dx) + 'px';
        p.style.top = (y + dy) + 'px';
        p.style.opacity = '0';
      });
    });

    // Guaranteed cleanup
    setTimeout(() => { if (p.parentNode) p.remove(); }, (duration + 0.5) * 1000);
  }
}

function spawnConfetti() {
  for (let i = 0; i < 60; i++) {
    setTimeout(() => {
      const x = Math.random() * window.innerWidth;
      const p = document.createElement('div');
      p.className = 'particle';
      const size = 6 + Math.random() * 8;
      p.style.width = size + 'px';
      p.style.height = size + 'px';
      p.style.left = x + 'px';
      p.style.top = '-10px';
      p.style.opacity = '1';
      p.style.background = ['#4a90d9','#e04a3a','#4aaf6c','#f0b840','#a855f7','#ff6b9d'][Math.floor(Math.random()*6)];
      p.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
      document.body.appendChild(p);

      const drift = (Math.random() - 0.5) * 200;
      const duration = 1.5 + Math.random() * 1.5;
      const spin = (Math.random() - 0.5) * 720;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          p.style.transition = `left ${duration}s ease-in, top ${duration}s ease-in, opacity ${duration}s ease-in, transform ${duration}s linear`;
          p.style.left = (x + drift) + 'px';
          p.style.top = (window.innerHeight + 20) + 'px';
          p.style.opacity = '0';
          p.style.transform = `rotate(${spin}deg)`;
        });
      });

      setTimeout(() => { if (p.parentNode) p.remove(); }, (duration + 0.5) * 1000);
    }, i * 50);
  }
}


// ---------------------------------------------------------------------------
// Ambient Time-of-Day Lighting
// ---------------------------------------------------------------------------

function applyTimeOfDayFX() {
  const hour = new Date().getHours();
  let ambientColor;
  if (hour >= 6 && hour < 10) ambientColor = 'rgba(255, 180, 60, 0.1)';
  else if (hour >= 10 && hour < 17) ambientColor = 'rgba(200, 220, 255, 0.06)';
  else if (hour >= 17 && hour < 20) ambientColor = 'rgba(255, 100, 30, 0.12)';
  else ambientColor = 'rgba(40, 60, 200, 0.12)';

  let fx = document.getElementById('time-fx');
  if (!fx) {
    fx = document.createElement('div');
    fx.id = 'time-fx';
    fx.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:0;transition:background 60s linear;';
    document.body.appendChild(fx);
  }
  fx.style.background = `radial-gradient(ellipse at 50% 20%, ${ambientColor}, transparent 60%)`;
}
applyTimeOfDayFX();
setInterval(applyTimeOfDayFX, 300000);

// ---------------------------------------------------------------------------
// Ambient Dust Motes
// ---------------------------------------------------------------------------

function initAmbientDust() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.id = 'dust-canvas';
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:1;opacity:0.3;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const motes = [];

  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  for (let i = 0; i < 15; i++) {
    motes.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: 1 + Math.random() * 2,
      speedX: (Math.random() - 0.5) * 0.25,
      speedY: -0.08 - Math.random() * 0.15,
      opacity: 0.2 + Math.random() * 0.3,
      phase: Math.random() * Math.PI * 2
    });
  }

  function animate() {
    const gameScreen = document.getElementById('game-screen');
    if (!gameScreen || !gameScreen.classList.contains('active')) {
      requestAnimationFrame(animate);
      return;
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const t = performance.now() * 0.001;
    for (const m of motes) {
      m.x += m.speedX + Math.sin(t + m.phase) * 0.12;
      m.y += m.speedY;
      if (m.y < -10) { m.y = canvas.height + 10; m.x = Math.random() * canvas.width; }
      if (m.x < -10) m.x = canvas.width + 10;
      if (m.x > canvas.width + 10) m.x = -10;
      const flicker = 0.7 + 0.3 * Math.sin(t * 2 + m.phase);
      ctx.beginPath();
      ctx.arc(m.x, m.y, m.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(180, 200, 255, ${m.opacity * flicker})`;
      ctx.fill();
    }
    requestAnimationFrame(animate);
  }
  animate();
}
initAmbientDust();
