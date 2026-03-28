/**
 * @file game-fx.js — Visual effects, animations, and haptics for Spades.
 * @author Keith Adler
 * @copyright 2026 Keith Adler. MIT License.
 *
 * Adds cinematic polish: deal animations, score popups, screen shake,
 * combo counters, round announcements, ambient effects, and more.
 * @author Keith Adler
 * @copyright 2026 Keith Adler. MIT License.
 */

Object.assign(Game.prototype, {

  // =========================================================================
  // DEAL ANIMATION — Cards fly from center pile to each player
  // =========================================================================

  /**
   * Animate dealing 52 cards from a center pile to each player's position.
   * Shows a shuffle phase first, then cards fly out one by one.
   * @param {Function} callback - Called when dealing is complete.
   */
  _animateDeal(callback) {
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const isSmall = window.innerWidth < 500;
    const cardW = isSmall ? 36 : 52;
    const cardH = isSmall ? 52 : 76;
    const pileEls = [];
    const scatter = isSmall ? 0.5 : 1;

    // Phase 1: Show 52 cards in a messy pile at center
    for (let i = 0; i < 52; i++) {
      const el = document.createElement('div');
      el.style.cssText = `
        position:fixed; z-index:${55 + i}; pointer-events:none;
        width:${cardW}px; height:${cardH}px; border-radius:6px;
        background:linear-gradient(160deg, #4a6a9a, #2a4a7a);
        border:1.5px solid rgba(100,140,200,0.4);
        box-shadow:0 2px 6px rgba(0,0,0,0.4);
        transition:all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        display:flex;align-items:center;justify-content:center;
        font-size:${isSmall ? '10px' : '14px'};color:rgba(255,255,255,0.2);
      `;
      el.textContent = '♠';
      const ox = (Math.random() - 0.5) * 120 * scatter;
      const oy = (Math.random() - 0.5) * 80 * scatter;
      const rot = (Math.random() - 0.5) * 90;
      el.style.left = (cx - cardW / 2 + ox) + 'px';
      el.style.top = (cy - cardH / 2 + oy) + 'px';
      el.style.transform = `rotate(${rot}deg)`;
      document.body.appendChild(el);
      pileEls.push(el);
    }

    // Phase 2: Shuffle — scramble positions with sound
    let shuffleCount = 0;
    const shuffleInterval = setInterval(() => {
      for (const el of pileEls) {
        const ox = (Math.random() - 0.5) * 100 * scatter;
        const oy = (Math.random() - 0.5) * 60 * scatter;
        el.style.left = (cx - cardW / 2 + ox) + 'px';
        el.style.top = (cy - cardH / 2 + oy) + 'px';
        el.style.transform = `rotate(${(Math.random() - 0.5) * 80}deg)`;
      }
      if (this.sfx) this.sfx.shuffle();
      shuffleCount++;
      if (shuffleCount >= 4) clearInterval(shuffleInterval);
    }, 220);

    // Phase 3: Deal cards to player positions
    const dealStart = 1100;
    const positions = {
      bottom: { x: cx, y: window.innerHeight - 100 },
      top: { x: cx, y: 80 },
      left: { x: 60, y: cy },
      right: { x: window.innerWidth - 60, y: cy }
    };

    let dealt = 0;
    for (let round = 0; round < 13; round++) {
      for (let pi = 0; pi < 4; pi++) {
        const idx = dealt;
        if (idx >= pileEls.length) continue;
        const delay = dealStart + dealt * 50;
        dealt++;
        setTimeout(() => {
          const pos = this._getPlayerPosition(pi);
          const target = positions[pos] || positions.bottom;
          const el = pileEls[idx];
          if (!el) return;
          el.style.left = (target.x - cardW / 2) + 'px';
          el.style.top = (target.y - cardH / 2) + 'px';
          el.style.transform = `rotate(${(Math.random() - 0.5) * 15}deg) scale(0.6)`;
          el.style.opacity = '0.3';
          if (this.sfx) this.sfx._play(350 + Math.random() * 200, 0.03, 'sine', 0.03);
          setTimeout(() => el.remove(), 400);
        }, delay);
      }
    }

    const totalTime = dealStart + dealt * 50 + 500;
    setTimeout(callback, totalTime);
  },

  // =========================================================================
  // ROUND ANNOUNCEMENT — Cinematic "Round N" with avatars
  // =========================================================================

  _showRoundAnnouncement(callback) {
    const overlay = document.getElementById('message-overlay');
    if (!overlay) { callback(); return; }
    overlay.classList.remove('hidden');
    overlay.style.background = 'rgba(0,0,0,0.3)'; // Transparent — show table behind

    const dealerName = escHTML(this.players[this.dealer].name);
    const leaderIdx = (this.dealer + 1) % 4;
    const leaderName = escHTML(this.players[leaderIdx].name);

    overlay.innerHTML = `
      <div style="text-align:center;animation:announceIn 0.5s ease-out forwards;">
        <div style="font-size:1.2rem;font-weight:700;letter-spacing:12px;color:rgba(255,255,255,0.4);text-transform:uppercase;opacity:0;animation:raSlideDown 0.5s ease-out 0.1s forwards;">ROUND</div>
        <div style="font-size:8rem;font-weight:900;line-height:1;background:linear-gradient(180deg,#fff 10%,#4a90d9 40%,#2a60a0 70%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 0 40px rgba(74,144,217,0.5));opacity:0;animation:raNumberPop 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.3s forwards;">${this._roundNum}</div>
        <div style="width:120px;height:2px;margin:12px auto 20px;background:linear-gradient(90deg,transparent,#4a90d9,transparent);opacity:0;animation:raFadeIn 0.4s ease-out 0.7s forwards;"></div>
        <div style="display:flex;align-items:center;justify-content:center;gap:16px;opacity:0;animation:raSlideUp 0.5s ease-out 0.8s forwards;">
          <img src="${this.players[this.dealer].avatar}" style="width:56px;height:56px;border-radius:50%;border:3px solid rgba(74,144,217,0.5);box-shadow:0 4px 16px rgba(0,0,0,0.5);">
          <div style="text-align:left;">
            <div style="font-size:0.8rem;opacity:0.5;">Dealer</div>
            <div style="font-weight:800;font-size:1.1rem;">${dealerName}</div>
          </div>
        </div>
        <div style="margin-top:12px;font-size:0.9rem;opacity:0;animation:raFadeIn 0.4s ease-out 1.2s forwards;color:rgba(255,255,255,0.6);">${leaderName} leads first</div>
      </div>
    `;

    // Particles behind the number
    setTimeout(() => spawnParticles(window.innerWidth / 2, window.innerHeight * 0.35, 20, 'particle-gold'), 400);

    if (this.sfx) {
      this.sfx._play(440, 0.15, 'sine', 0.08);
      setTimeout(() => this.sfx._play(660, 0.2, 'sine', 0.1), 200);
      setTimeout(() => this.sfx._play(880, 0.3, 'sine', 0.12), 400);
    }

    setTimeout(() => {
      overlay.classList.add('hidden');
      overlay.innerHTML = '';
      overlay.style.background = ''; // Reset to default
      callback();
    }, this._speedMs(2800));
  },

  // =========================================================================
  // COUNTDOWN — "3, 2, 1, GO!" before first round
  // =========================================================================

  _showCountdown(callback) {
    const overlay = document.getElementById('message-overlay');
    if (!overlay) { callback(); return; }
    overlay.classList.remove('hidden');

    const steps = [
      { text: '3', freq: 440 },
      { text: '2', freq: 520 },
      { text: '1', freq: 620 },
      { text: 'DEAL!', freq: 880 }
    ];

    let i = 0;
    const next = () => {
      if (i >= steps.length) {
        overlay.classList.add('hidden');
        overlay.innerHTML = '';
        callback();
        return;
      }
      const step = steps[i];
      const isGo = i === steps.length - 1;
      overlay.innerHTML = `<div style="font-size:${isGo ? '5rem' : '10rem'};font-weight:900;color:#fff;text-shadow:0 0 30px #4a90d9,0 0 60px rgba(74,144,217,0.4),0 8px 16px rgba(0,0,0,0.6);animation:countPop 0.8s ease-out forwards;${isGo ? 'letter-spacing:8px;background:linear-gradient(180deg,#fff 20%,#4a90d9);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 0 20px rgba(74,144,217,0.5));' : ''}">${step.text}</div>`;
      if (this.sfx) this.sfx._play(step.freq, 0.15, 'sine', 0.12);
      this._haptic(30);
      i++;
      setTimeout(next, i === steps.length ? this._speedMs(500) : this._speedMs(700));
    };
    next();
  },

  // =========================================================================
  // CARD PLAY ANIMATION — Card flies from player position to trick area
  // =========================================================================

  _animateCardPlay(playerIndex, card, callback) {
    const pos = this._getPlayerPosition(playerIndex);
    let startX, startY;

    // Get start position from the player's panel
    if (pos === 'bottom') {
      startX = window.innerWidth / 2;
      startY = window.innerHeight - 60;
    } else {
      const panel = document.getElementById('opponent-' + pos);
      if (panel) {
        const r = panel.getBoundingClientRect();
        startX = r.left + r.width / 2;
        startY = r.top + r.height / 2;
      } else {
        startX = window.innerWidth / 2;
        startY = window.innerHeight / 2;
      }
    }

    // Get end position (center of trick area)
    const trickArea = document.getElementById('trick-area');
    const trickRect = trickArea ? trickArea.getBoundingClientRect() : { left: window.innerWidth / 2 - 50, top: window.innerHeight / 2 - 50, width: 100, height: 100 };
    const endX = trickRect.left + trickRect.width / 2;
    const endY = trickRect.top + trickRect.height / 2;

    // Create flying card
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed; z-index:60; pointer-events:none;
      width:52px; height:76px; border-radius:8px;
      background:linear-gradient(160deg, #fff, #f0f0f0);
      border:2px solid rgba(0,0,0,0.15);
      box-shadow:0 4px 16px rgba(0,0,0,0.4);
      display:flex; flex-direction:column; align-items:center; justify-content:center;
      font-weight:800; font-size:1.1rem;
      left:${startX - 26}px; top:${startY - 38}px;
      transition:all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
      transform:scale(0.5) rotate(${(Math.random() - 0.5) * 20}deg);
    `;
    el.innerHTML = `<span style="color:${card.color}">${card.rank}</span><span style="color:${card.color}">${card.symbol}</span>`;
    document.body.appendChild(el);

    requestAnimationFrame(() => {
      el.style.left = (endX - 26) + 'px';
      el.style.top = (endY - 38) + 'px';
      el.style.transform = 'scale(1) rotate(0deg)';
    });

    setTimeout(() => {
      el.remove();
      if (callback) callback();
    }, 420);
  },

  // =========================================================================
  // SCORE POPUP — Big floating "+N" when a team/player scores
  // =========================================================================

  _showScorePopup(text, x, y, color) {
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.style.cssText = `
      position:fixed; pointer-events:none; z-index:50;
      font-size:3.5rem; font-weight:900; letter-spacing:3px;
      color:${color || '#fff'};
      text-shadow:0 0 15px ${color || '#4a90d9'}, 0 0 30px ${color || '#4a90d9'}, 0 6px 12px rgba(0,0,0,0.7);
      left:${x || '50%'}; top:${y || '40%'};
      transform:translate(-50%,-50%) scale(0.2);
      animation:scoreBlast 2.5s ease-out forwards;
    `;
    popup.textContent = text;
    document.body.appendChild(popup);
    setTimeout(() => popup.remove(), 2600);
  },

  // =========================================================================
  // TRICK WIN EFFECTS — Enhanced trick winner with particles & shake
  // =========================================================================

  _showTrickWinFX(winner) {
    // Particles burst from center
    spawnParticles(window.innerWidth / 2, window.innerHeight / 2, 15, 'particle-gold');

    // Screen shake on spade tricks
    const boardArea = document.getElementById('board-area');
    if (boardArea) {
      boardArea.classList.remove('board-shake');
      void boardArea.offsetWidth;
      boardArea.classList.add('board-shake');
      setTimeout(() => boardArea.classList.remove('board-shake'), 500);
    }

    // Haptic feedback
    this._haptic([15, 30, 15]);
  },

  // =========================================================================
  // COMBO COUNTER — Consecutive trick wins
  // =========================================================================

  _showComboPopup(count) {
    const popup = document.createElement('div');
    popup.className = 'combo-popup';
    popup.textContent = `×${count} STREAK`;
    document.body.appendChild(popup);
    this._haptic([20, 40, 20]);
    setTimeout(() => popup.remove(), 1000);
  },

  // =========================================================================
  // SPADES BROKEN — Enhanced banner with particles
  // =========================================================================

  _showSpadesBrokenFX() {
    const el = document.createElement('div');
    el.className = 'spades-broken-banner';
    el.textContent = this._t('spadesBroken');
    document.body.appendChild(el);

    // Blue particle burst
    spawnParticles(window.innerWidth / 2, window.innerHeight * 0.3, 25, 'particle-gold');

    // Screen shake
    const boardArea = document.getElementById('board-area');
    if (boardArea) {
      boardArea.classList.remove('board-shake-heavy');
      void boardArea.offsetWidth;
      boardArea.classList.add('board-shake-heavy');
      setTimeout(() => boardArea.classList.remove('board-shake-heavy'), 600);
    }

    this._haptic([30, 50, 60]);
    setTimeout(() => el.remove(), 2500);
  },

  // =========================================================================
  // BID ANNOUNCEMENT — Enhanced with particles for nil bids
  // =========================================================================

  _showBidAnnouncementFX(player, bid, callback) {
    const pos = this._getPlayerPosition(player.index);
    const panel = document.getElementById('opponent-' + pos);

    if (panel) {
      const bubble = document.createElement('div');
      bubble.className = 'speech-bubble bid-bubble';
      bubble.textContent = player.blindNil ? '🙈 BLIND NIL!' : bid === 0 ? '🎯 NIL!' : `Bid ${bid}`;
      const r = panel.getBoundingClientRect();

      // Position based on player side
      if (pos === 'left') {
        bubble.style.left = (r.right + 8) + 'px';
        bubble.style.top = (r.top + r.height / 2 - 24) + 'px';
      } else if (pos === 'right') {
        bubble.style.right = (window.innerWidth - r.left + 8) + 'px';
        bubble.style.top = (r.top + r.height / 2 - 24) + 'px';
      } else {
        bubble.style.left = (r.left + r.width / 2 - 60) + 'px';
        bubble.style.top = Math.max(4, r.top - 60) + 'px';
      }

      document.body.appendChild(bubble);
      setTimeout(() => bubble.remove(), 3000);

      if (bid === 0) {
        spawnParticles(r.left + r.width / 2, r.top + r.height / 2, 20, 'particle-gold');
        this._haptic([20, 40, 60]);
      }
    }

    setTimeout(callback, this._speedMs(2000));
  },

  // =========================================================================
  // FIRST BLOOD — First trick of the round
  // =========================================================================

  _showFirstBlood(winner) {
    const el = document.createElement('div');
    el.className = 'first-blood-banner';
    el.textContent = `FIRST TRICK 🃏`;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 1500);
  },

  // =========================================================================
  // SET BANNER — When a team fails their bid
  // =========================================================================

  _showSetBanner(teamName) {
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed; top:35%; left:50%; transform:translate(-50%,-50%) scale(0.5);
      font-size:2.5rem; font-weight:900; color:#e04a3a;
      text-shadow:0 0 20px rgba(224,74,58,0.8), 0 4px 12px rgba(0,0,0,0.5);
      z-index:80; pointer-events:none; opacity:0; letter-spacing:3px;
      animation:firstBloodIn 1.5s ease-out forwards;
    `;
    el.textContent = `SET! 🚫`;
    document.body.appendChild(el);
    if (this.sfx) this.sfx.bagPenalty();
    this._haptic([50, 30, 50, 30, 50]);
    setTimeout(() => el.remove(), 2000);
  },

  // =========================================================================
  // NIL BUSTED — Dramatic announcement when a nil bidder wins a trick
  // =========================================================================

  _showNilBusted(player) {
    const isBlind = player.blindNil;
    const isHumanTeam = this.teamMode && player.team === 0;
    const isHuman = player.isHuman;

    // Big banner
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed; top:32%; left:50%; transform:translate(-50%,-50%) scale(0.5);
      font-size:2.2rem; font-weight:900; letter-spacing:3px; white-space:nowrap;
      color:${(isHuman || isHumanTeam) ? '#e04a3a' : '#4aaf6c'};
      text-shadow:0 0 20px ${(isHuman || isHumanTeam) ? 'rgba(224,74,58,0.8)' : 'rgba(74,175,108,0.8)'}, 0 4px 12px rgba(0,0,0,0.5);
      z-index:80; pointer-events:none; opacity:0;
      animation:firstBloodIn 2s ease-out forwards;
    `;
    el.textContent = isBlind
      ? `🙈 ${escHTML(player.name)}'s BLIND NIL BUSTED!`
      : `🎯 ${escHTML(player.name)}'s NIL BUSTED!`;
    document.body.appendChild(el);

    // Particles — red for your team's bust, green for opponent's
    const color = (isHuman || isHumanTeam) ? '#e04a3a' : '#4aaf6c';
    for (let i = 0; i < 20; i++) {
      const p = document.createElement('div');
      p.className = 'particle';
      const size = 5 + Math.random() * 7;
      p.style.width = size + 'px'; p.style.height = size + 'px';
      p.style.left = (window.innerWidth / 2) + 'px';
      p.style.top = (window.innerHeight * 0.32) + 'px';
      p.style.opacity = '1';
      p.style.background = color;
      p.style.boxShadow = `0 0 8px ${color}`;
      p.style.borderRadius = '50%';
      document.body.appendChild(p);
      const angle = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * 100;
      const dx = Math.cos(angle) * dist, dy = Math.sin(angle) * dist;
      const dur = 0.8 + Math.random() * 0.6;
      requestAnimationFrame(() => requestAnimationFrame(() => {
        p.style.transition = `left ${dur}s ease-out, top ${dur}s ease-out, opacity ${dur}s ease-out`;
        p.style.left = (window.innerWidth / 2 + dx) + 'px';
        p.style.top = (window.innerHeight * 0.32 + dy) + 'px';
        p.style.opacity = '0';
      }));
      setTimeout(() => { if (p.parentNode) p.remove(); }, (dur + 0.5) * 1000);
    }

    // Screen shake
    const boardArea = document.getElementById('board-area');
    if (boardArea) {
      boardArea.classList.remove('board-shake-heavy');
      void boardArea.offsetWidth;
      boardArea.classList.add('board-shake-heavy');
      setTimeout(() => boardArea.classList.remove('board-shake-heavy'), 600);
    }

    this._haptic([40, 60, 40, 60, 40]);
    if (this.sfx) this.sfx.nilFail();

    // Opponents mock the nil bidder
    if (!player.isHuman && this._trashTalkFreq > 0) {
      const opponents = this.players.filter(p => p.team !== player.team && !p.isHuman);
      if (opponents.length > 0) {
        const mocker = opponents[Math.floor(Math.random() * opponents.length)];
        const phrase = getPhrase(mocker, 'opponent');
        if (phrase) setTimeout(() => this._showSpeechBubble(mocker, phrase), 500);
      }
    }

    setTimeout(() => el.remove(), 2200);
  },

  // =========================================================================
  // AVATAR PARTICLES — Spawn particles around active player
  // =========================================================================

  _spawnAvatarParticles(player) {
    const pos = this._getPlayerPosition(player.index);
    const panelId = pos === 'bottom' ? 'human-info' : 'opponent-' + pos;
    const panel = document.getElementById(panelId);
    if (!panel) return;
    const avatar = panel.querySelector('.opp-avatar') || panel.querySelector('.human-avatar');
    if (!avatar) return;
    const r = avatar.getBoundingClientRect();
    spawnParticles(r.left + r.width / 2, r.top + r.height / 2, 6, 'particle-gold');
  },

  // =========================================================================
  // SCORE VIGNETTE — Golden/red edge flash on scoring events
  // =========================================================================

  _showScoreVignette(type) {
    const el = document.createElement('div');
    el.style.cssText = `
      position:fixed; inset:0; pointer-events:none; z-index:49;
      background:radial-gradient(ellipse at center, transparent 50%, ${type === 'good' ? 'rgba(74,144,217,0.3)' : 'rgba(224,74,58,0.3)'} 100%);
      animation:vignetteFlash 0.6s ease-out forwards;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 700);
  },

});
