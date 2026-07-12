/**
 * @file card.js — Playing card model and deck utilities for Spades.
 * @author Keith Adler
 * @copyright 2026 Keith Adler. MIT License.
 */

const SUITS = ['spades', 'hearts', 'diamonds', 'clubs'];
const SUIT_SYMBOLS = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' };
const SUIT_COLORS = { spades: '#1a1a2e', hearts: '#c0392b', diamonds: '#c0392b', clubs: '#1a1a2e' };
// 4-color deck for colorblind mode: every suit gets a distinct hue
const SUIT_COLORS_CB = { spades: '#1a1a2e', hearts: '#c0392b', diamonds: '#1565c0', clubs: '#1e7d32' };
const RANK_NAMES = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const RANK_VALUES = { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14 };

class Card {
  constructor(suit, rank) {
    this.suit = suit;
    this.rank = rank;
  }
  get value() { return RANK_VALUES[this.rank]; }
  get symbol() { return SUIT_SYMBOLS[this.suit]; }
  get color() {
    const cb = typeof document !== 'undefined' && document.body && document.body.classList.contains('colorblind');
    return (cb ? SUIT_COLORS_CB : SUIT_COLORS)[this.suit];
  }
  get isSpade() { return this.suit === 'spades'; }
  get displayName() { return `${this.rank}${this.symbol}`; }
  equals(c) { return this.suit === c.suit && this.rank === c.rank; }
  toString() { return this.displayName; }
}

function createDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANK_NAMES) {
      deck.push(new Card(suit, rank));
    }
  }
  return deck;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function sortHand(hand) {
  const suitOrder = { spades: 0, hearts: 1, diamonds: 2, clubs: 3 };
  return hand.sort((a, b) => {
    if (suitOrder[a.suit] !== suitOrder[b.suit]) return suitOrder[a.suit] - suitOrder[b.suit];
    return b.value - a.value;
  });
}
