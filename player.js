/**
 * @file player.js — Player model for Spades.
 * @author Keith Adler
 * @copyright 2026 Keith Adler. MIT License.
 */

class Player {
  constructor(name, isHuman, index) {
    this.name = name;
    this.isHuman = isHuman;
    this.index = index;
    /** @type {Card[]} */
    this.hand = [];
    this.bid = -1;
    this.blindNil = false;
    this.tricks = 0;
    this.team = index % 2; // 0 or 1 (partners: 0&2, 1&3)
  }

  get hasBid() { return this.bid >= 0; }
  get isNil() { return this.bid === 0; }
  get nilBusted() { return this.bid === 0 && this.tricks > 0; }

  resetRound() {
    this.hand = [];
    this.bid = -1;
    this.blindNil = false;
    this.tricks = 0;
  }

  getPlayableCards(leadSuit, spadesBroken) {
    if (!leadSuit) {
      if (spadesBroken || this.hand.every(c => c.isSpade)) return [...this.hand];
      return this.hand.filter(c => !c.isSpade);
    }
    const suited = this.hand.filter(c => c.suit === leadSuit);
    if (suited.length > 0) return suited;
    return [...this.hand];
  }
}
