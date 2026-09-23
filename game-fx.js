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

  /** Current card width in px: the --cw token (a clamp()), resolved by layout. */
  _cardWidth() {
    const gs = document.getElementById('game-screen');
    if (!gs) return 80;
    if (!this._cwProbe) {
      this._cwProbe = document.createElement('div');
      this._cwProbe.style.cssText = 'position:absolute;visibility:hidden;pointer-events:none;height:0;width:var(--cw)';
      gs.appendChild(this._cwProbe);
    }
    return this._cwProbe.offsetWidth || 80;
  },

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
    const cardW = this._cardWidth() * 0.8;
    const cardH = cardW * 1.4;
    const pileEls = [];
    const scatter = isSmall ? 0.5 : 1;
    const back = cardBackSVG();

    // Phase 1: Show 52 cards in a messy pile at center
    for (let i = 0; i < 52; i++) {
      const el = document.createElement('div');
      el.className = 'fly-card';
      el.style.cssText = `
        position:fixed; z-index:${55 + i}; pointer-events:none;
        width:${cardW}px; height:${cardH}px;
        filter:drop-shadow(0 2px 4px rgba(0,0,0,0.45));
        transition:all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
      `;
      el.innerHTML = back;
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
    }, this._speedMs(220));

    // Phase 3: Deal cards to player positions (honors the game speed setting)
    const dealStart = this._speedMs(1100);
    const perCard = this._speedMs(50);
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
        const delay = dealStart + dealt * perCard;
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

    const totalTime = dealStart + dealt * perCard + this._speedMs(500);
    this._gameTimeout(callback, totalTime);
  },

  // =========================================================================
  // ROUND ANNOUNCEMENT — Cinematic "Round N" with avatars
  // =========================================================================

  _showRoundAnnouncement(callback) {
    const dealerName = escHTML(this.players[this.dealer].name);
    const leaderIdx = (this.dealer + 1) % 4;
    const leaderName = escHTML(this.players[leaderIdx].name);

    // Float directly over the board — no overlay, no background
    const el = document.createElement('div');
    el.style.cssText = 'position:fixed;inset:0;z-index:50;display:flex;align-items:center;justify-content:center;pointer-events:none;';
    el.innerHTML = `
      <div style="text-align:center;animation:announceIn 0.5s ease-out forwards;">
        <div style="font-size:1.2rem;font-weight:700;letter-spacing:12px;color:rgba(255,255,255,0.5);text-transform:uppercase;text-shadow:0 2px 8px rgba(0,0,0,0.6);opacity:0;animation:raSlideDown 0.5s ease-out 0.1s forwards;">${this._t('round')}</div>
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:8rem;font-weight:900;line-height:1;background:linear-gradient(180deg,#fff 10%,#e8c170 40%,#b8862e 70%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;filter:drop-shadow(0 0 40px rgba(232,193,112,0.5)) drop-shadow(0 4px 12px rgba(0,0,0,0.8));opacity:0;animation:raNumberPop 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.3s forwards;">${this._roundNum}</div>
        <div style="width:120px;height:2px;margin:12px auto 20px;background:linear-gradient(90deg,transparent,#e8c170,transparent);opacity:0;animation:raFadeIn 0.4s ease-out 0.7s forwards;"></div>
        <div style="display:flex;align-items:center;justify-content:center;gap:16px;opacity:0;animation:raSlideUp 0.5s ease-out 0.8s forwards;">
          <img src="${this.players[this.dealer].avatar}" style="width:64px;height:64px;object-fit:cover;border-radius:50%;border:3px solid rgba(232,193,112,0.5);box-shadow:0 4px 16px rgba(0,0,0,0.5);" alt="">
          <div style="text-align:left;text-shadow:0 2px 8px rgba(0,0,0,0.7);">
            <div style="font-size:0.8rem;opacity:0.6;">${this._t("dealer")}</div>
            <div style="font-weight:800;font-size:1.1rem;">${dealerName}</div>
          </div>
        </div>
        <div style="margin-top:12px;font-size:0.9rem;opacity:0;animation:raFadeIn 0.4s ease-out 1.2s forwards;color:rgba(255,255,255,0.7);text-shadow:0 2px 6px rgba(0,0,0,0.6);">${leaderName} ${this._t("leadsFirst")}</div>
      </div>
    `;
    document.body.appendChild(el);

    setTimeout(() => spawnParticles(window.innerWidth / 2, window.innerHeight * 0.35, 20, 'particle-gold'), 400);

    if (this.sfx) {
      this.sfx._play(440, 0.15, 'sine', 0.08);
      setTimeout(() => this.sfx._play(660, 0.2, 'sine', 0.1), 200);
      setTimeout(() => this.sfx._play(880, 0.3, 'sine', 0.12), 400);
    }

    const raMs = this._speedMs(2800);
    setTimeout(() => el.remove(), raMs);
    this._gameTimeout(callback, raMs);
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
      overlay.innerHTML = `<div class="countdown-num${isGo ? ' go' : ''}">${step.text}</div>`;
      if (this.sfx) this.sfx._play(step.freq, 0.15, 'sine', 0.12);
      this._haptic(30);
      i++;
      this._gameTimeout(next, i === steps.length ? this._speedMs(500) : this._speedMs(700));
    };
    next();
  },

  // =========================================================================
  // CARD PLAY ANIMATION — Card flies from player position to trick area
  // =========================================================================

  /**
   * Fly a played card from its owner to its slot in the trick. The slot is
   * already drawn (hidden) by _renderTrickArea, so the card lands exactly
   * where it will stay, at the same tilt.
   *   normal — dealt onto the felt in a low arc
   *   break  — lifted and dropped (first spade of the hand)
   *   slam   — thrown high and slammed down (big plays)
   * @param {'normal'|'break'|'slam'} impact
   */
  _animateCardPlay(playerIndex, card, impact, callback) {
    const slot = document.querySelector('#trick-area .trick-card.incoming');
    const done = () => { if (callback) callback(); };
    if (!slot || !slot.animate) { done(); return; }
    const end = slot.getBoundingClientRect();
    const ex = end.left + end.width / 2, ey = end.top + end.height / 2;

    // Start: the actual card in your hand, or the opponent's fanned hand
    let sx = window.innerWidth / 2, sy = window.innerHeight, startScale = 0.9;
    if (playerIndex === 0) {
      const mine = [...document.querySelectorAll('#player-hand .hand-card')]
        .find(el => el.getAttribute('aria-label') && el.getAttribute('aria-label').startsWith(`${card.rank} of ${card.suit}`));
      if (mine) { const r = mine.getBoundingClientRect(); sx = r.left + r.width / 2; sy = r.top + r.height / 2; }
    } else {
      const fan = document.querySelector(`#opponent-${this._getPlayerPosition(playerIndex)} .seat-fan`)
        || document.getElementById('opponent-' + this._getPlayerPosition(playerIndex));
      if (fan) { const r = fan.getBoundingClientRect(); sx = r.left + r.width / 2; sy = r.top + r.height / 2; }
      startScale = 0.45;
    }

    const w = slot.offsetWidth, h = slot.offsetHeight;
    const tilt = parseFloat(slot.style.getPropertyValue('--tilt')) || 0;
    const el = document.createElement('div');
    el.className = 'fly-card';
    el.style.cssText = `position:fixed;z-index:60;pointer-events:none;width:${w}px;height:${h}px;left:${ex - w / 2}px;top:${ey - h / 2}px;`;
    el.innerHTML = cardFaceSVG(card);
    document.body.appendChild(el);

    const dx = sx - ex, dy = sy - ey;
    const from = { transform: `translate(${dx}px, ${dy}px) rotate(${tilt - 14}deg) scale(${startScale})`, filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))' };
    const land = { transform: `translate(0, 0) rotate(${tilt}deg) scale(1)`, filter: 'drop-shadow(0 3px 4px rgba(0,0,0,0.55))' };
    let frames, ms;
    if (impact === 'normal') {
      frames = [from, land];
      ms = Math.max(220, this._speedMs(360));
    } else {
      // Rise above the slot (shadow spreads out: the card is "high"), hang,
      // then drop hard onto the felt
      const big = impact === 'slam';
      const lift = h * (big ? 0.95 : 0.55);
      const top = { offset: big ? 0.52 : 0.5, transform: `translate(0, ${-lift}px) rotate(${tilt + (big ? -10 : -6)}deg) scale(${big ? 1.85 : 1.35})`,
        filter: `drop-shadow(0 ${big ? 60 : 34}px ${big ? 26 : 16}px rgba(0,0,0,0.35))`, easing: 'cubic-bezier(.55,0,1,.45)' };
      const hang = { offset: big ? 0.66 : 0.6, transform: `translate(0, ${-lift * 1.04}px) rotate(${tilt + (big ? -7 : -4)}deg) scale(${big ? 1.9 : 1.37})`,
        filter: top.filter, easing: 'cubic-bezier(.6,0,1,.6)' };
      frames = [Object.assign({ easing: 'cubic-bezier(.2,.8,.3,1)' }, from), top, hang, land];
      ms = Math.max(big ? 520 : 400, this._speedMs(big ? 820 : 600));
      if (this.sfx && this.sfx.whoosh) this.sfx.whoosh(big);
    }
    el.animate(frames, { duration: ms, fill: 'forwards' }).onfinish = () => { el.remove(); done(); };
  },

  /**
   * The moment a slammed or dropped card hits the felt: a shockwave ring,
   * dust kicked up around it, the table jolts and the other cards in the
   * trick hop, a thud — and for big plays a stamp naming the play.
   */
  _impactFX(kind, labelKey, playerIndex) {
    const card = document.querySelector(`#trick-area .trick-card[data-slot="${playerIndex}"]`);
    if (!card) return;
    const r = card.getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
    const slam = kind === 'slam';
    const add = (cls, css) => { const d = document.createElement('div'); d.className = cls; d.style.cssText = css; document.body.appendChild(d); return d; };
    const later = (el, ms) => setTimeout(() => el.remove(), ms);

    // Shockwave ring(s) on the felt
    const size = r.width * (slam ? 1.3 : 1.0);
    const ring = add('impact-ring', `left:${cx}px;top:${cy + r.height * 0.3}px;width:${size}px;height:${size * 0.45}px;--ring-scale:${slam ? 3.4 : 2.2}`);
    later(ring, 800);
    if (slam) { const ring2 = add('impact-ring thin', `left:${cx}px;top:${cy + r.height * 0.3}px;width:${size}px;height:${size * 0.45}px;--ring-scale:5;animation-delay:70ms`); later(ring2, 900); }

    // Light flash under the card
    if (slam) later(add('impact-flash', `left:${cx}px;top:${cy}px;width:${r.width * 4}px;height:${r.width * 3}px`), 500);

    // Dust / felt fibres kicked out sideways
    const n = slam ? 22 : 10;
    for (let i = 0; i < n; i++) {
      const a = Math.PI * (i / n) * 2 + Math.random() * 0.4;
      const dist = r.width * (slam ? 0.9 + Math.random() * 1.1 : 0.5 + Math.random() * 0.6);
      const d = add('impact-dust', `left:${cx + Math.cos(a) * r.width * 0.35}px;top:${cy + r.height * 0.35 + Math.sin(a) * r.width * 0.15}px`);
      if (d.animate) d.animate([
        { transform: 'translate(0,0) scale(1)', opacity: 0.9 },
        { transform: `translate(${Math.cos(a) * dist}px, ${Math.sin(a) * dist * 0.45 - (slam ? 18 : 8)}px) scale(0.3)`, opacity: 0 },
      ], { duration: 420 + Math.random() * 260, easing: 'cubic-bezier(.1,.7,.3,1)' });
      later(d, 750);
    }

    // The table jolts; the other cards in the trick hop off the felt
    const table = document.getElementById('game-layout');
    if (table) {
      const cls = slam ? 'table-slam' : 'table-bump';
      table.classList.remove('table-slam', 'table-bump'); void table.offsetWidth;
      table.classList.add(cls);
      setTimeout(() => table.classList.remove(cls), 600);
    }
    document.querySelectorAll('#trick-area .trick-card').forEach(other => {
      if (other === card || !other.animate) return;
      other.animate([{ translate: '0 0' }, { translate: `0 ${slam ? -12 : -5}px` }, { translate: '0 0' }],
        { duration: slam ? 380 : 260, easing: 'cubic-bezier(.3,1.6,.5,1)' });
    });
    // The card itself squashes a touch on contact
    if (card.animate) card.animate([{ scale: '1.06 0.94' }, { scale: '1' }], { duration: 220, easing: 'ease-out' });

    // Name the play, centred above the trick
    if (slam && labelKey) {
      const area = document.getElementById('trick-area');
      const a = area ? area.getBoundingClientRect() : r;
      const stamp = add('impact-label', `left:${a.left + a.width / 2}px;top:${a.top - 4}px`);
      stamp.textContent = this._t(labelKey);
      later(stamp, 1400);
    }

    if (this.sfx) slam ? this.sfx.slam() : this.sfx.thud();
    this._haptic(slam ? [40, 30, 90] : [25, 20, 40]);
  },

  // =========================================================================
  // SCORE POPUP — Big floating "+N" when a team/player scores
  // =========================================================================

  _showScorePopup(text, x, y, color) {
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.style.cssText = `
      position:fixed; pointer-events:none; z-index:50;
      font-family:Georgia,'Times New Roman',serif; font-size:3.8rem; font-weight:900; letter-spacing:2px;
      color:${color || '#fff'};
      text-shadow:0 0 15px ${color || '#e8c170'}, 0 0 30px ${color || '#e8c170'}, 0 6px 12px rgba(0,0,0,0.7);
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
    // The winner's seat plate glows as the trick sweeps over to it
    const plate = winner.isHuman
      ? document.querySelector('#human-info .seat-plate')
      : document.querySelector(`#opponent-${this._getPlayerPosition(winner.index)} .seat-plate`);
    if (plate) {
      plate.classList.remove('took-trick'); void plate.offsetWidth;
      plate.classList.add('took-trick');
      setTimeout(() => plate.classList.remove('took-trick'), 900);
    }
    this._haptic(12);
  },

  // =========================================================================
  // COMBO COUNTER — Consecutive trick wins
  // =========================================================================

  _showComboPopup(count) {
    const popup = document.createElement('div');
    popup.className = 'combo-popup';
    popup.textContent = `×${count} ${this._t('fxStreak')}`;
    document.body.appendChild(popup);
    this._haptic([20, 40, 20]);
    setTimeout(() => popup.remove(), 1000);
  },

  // =========================================================================
  // SPADES BROKEN — Enhanced banner with particles
  // =========================================================================

  /** "Spades broken" stamp over the table (the drop itself is _impactFX). */
  _showSpadesBrokenFX() {
    const el = document.createElement('div');
    el.className = 'spades-broken-banner';
    el.innerHTML = `<span class="sbb-suit">♠</span>${escHTML(this._t('spadesBroken').replace(/^♠\s*/, ''))}`;
    el.style.animationDelay = '0ms, 1700ms';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2300);
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
      bubble.textContent = player.blindNil ? '🙈 BLIND NIL!' : bid === 0 ? '🎯 NIL!' : this._t('bidBubble').replace('{n}', bid);
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

    this._gameTimeout(callback, this._speedMs(2000));
  },

  // =========================================================================
  // FIRST BLOOD — First trick of the round
  // =========================================================================

  _showFirstBlood(winner) {
    const el = document.createElement('div');
    el.className = 'first-blood-banner';
    el.textContent = this._t('firstTrick');
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
      ? `🙈 ${player.name}'s BLIND NIL BUSTED!`
      : `🎯 ${player.name}'s NIL BUSTED!`;
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
      background:radial-gradient(ellipse at center, transparent 50%, ${type === 'good' ? 'rgba(232,193,112,0.3)' : 'rgba(224,74,58,0.3)'} 100%);
      animation:vignetteFlash 0.6s ease-out forwards;
    `;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 700);
  },

});
