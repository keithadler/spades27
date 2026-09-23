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
const RANK_VALUES = { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14,
  // Jokers & Deuces trumps (all of suit 'spades'): 2♠, then 2♦, Little Joker, Big Joker
  '2S':15, '2D':16, 'LJ':17, 'BJ':18 };
const SPECIAL_NAMES = { BJ: 'Big Joker', LJ: 'Little Joker', '2D': '2♦', '2S': '2♠' };

class Card {
  constructor(suit, rank) {
    this.suit = suit;
    this.rank = rank;
  }
  get value() { return RANK_VALUES[this.rank]; }
  get symbol() { return SUIT_SYMBOLS[this.suit]; }
  get color() {
    const cb = typeof document !== 'undefined' && document.body && document.body.classList.contains('colorblind');
    if (this.rank === 'BJ') return '#c0392b';
    return (cb ? SUIT_COLORS_CB : SUIT_COLORS)[this.faceSuit];
  }
  get isSpade() { return this.suit === 'spades'; }
  get isJoker() { return this.rank === 'BJ' || this.rank === 'LJ'; }
  /** The suit printed on the card (the 2♦ trump is still a diamond to look at). */
  get faceSuit() { return this.rank === '2D' ? 'diamonds' : this.suit; }
  /** The rank printed on the card. */
  get faceRank() { return (this.rank === '2D' || this.rank === '2S') ? '2' : this.rank; }
  get displayName() { return SPECIAL_NAMES[this.rank] || `${this.rank}${this.symbol}`; }
  equals(c) { return this.suit === c.suit && this.rank === c.rank; }
  toString() { return this.displayName; }
}

/**
 * A 52-card deck. With `jokers` (the Jokers & Deuces house rule) the 2♣ and
 * 2♥ come out and two jokers go in; the top of trump runs Big Joker, Little
 * Joker, 2♦, 2♠, A♠, K♠ … and the 2♦ plays as a spade, not a diamond.
 */
function createDeck(jokers) {
  const deck = [];
  for (const suit of SUITS) {
    for (const rank of RANK_NAMES) {
      if (jokers && rank === '2') {
        if (suit === 'spades') deck.push(new Card('spades', '2S'));
        else if (suit === 'diamonds') deck.push(new Card('spades', '2D'));
        continue; // 2♣ and 2♥ leave the deck
      }
      deck.push(new Card(suit, rank));
    }
  }
  if (jokers) deck.push(new Card('spades', 'LJ'), new Card('spades', 'BJ'));
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
