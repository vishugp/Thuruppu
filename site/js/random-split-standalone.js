/**
 * Random Split Standalone - 4-way card distribution
 * Complete replacement for deck.js with only random split functionality
 */

(function() {
  'use strict';

  // Animation system
  var ticking;
  var animations = [];

  function animationFrames(delay, duration) {
    var now = Date.now();
    var start = now + delay;
    var end = start + duration;

    var animation = {
      start: start,
      end: end
    };

    animations.push(animation);

    if (!ticking) {
      ticking = true;
      requestAnimationFrame(tick);
    }

    var self = {
      start: function start(cb) {
        animation.startcb = cb;
        return self;
      },
      progress: function progress(cb) {
        animation.progresscb = cb;
        return self;
      },
      end: function end(cb) {
        animation.endcb = cb;
        return self;
      }
    };
    return self;
  }

  function tick() {
    var now = Date.now();

    if (!animations.length) {
      ticking = false;
      return;
    }

    for (var i = 0, animation; i < animations.length; i++) {
      animation = animations[i];
      if (now < animation.start) {
        continue;
      }
      if (!animation.started) {
        animation.started = true;
        animation.startcb && animation.startcb();
      }
      var t = (now - animation.start) / (animation.end - animation.start);
      animation.progresscb && animation.progresscb(t < 1 ? t : 1);
      if (now > animation.end) {
        animation.endcb && animation.endcb();
        animations.splice(i--, 1);
        continue;
      }
    }
    requestAnimationFrame(tick);
  }

  // Easing functions
  var ease = {
    cubicInOut: function cubicInOut(t) {
      return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
    }
  };

  // Utility functions
  function deg2rad(degrees) {
    return degrees * Math.PI / 180;
  }

  function fisherYates(array) {
    var rnd, temp;
    for (var i = array.length - 1; i; i--) {
      rnd = Math.random() * i | 0;
      temp = array[i];
      array[i] = array[rnd];
      array[rnd] = temp;
    }
    return array;
  }

  function fontSize() {
    return window.getComputedStyle(document.body).getPropertyValue('font-size').slice(0, -2);
  }

  // Spread calculation constants
  const SPLIT_SPREAD_FACTOR = 1.7;
  const SPLIT_SPREAD_CENTER = 6;

  function getSplitSpread(handIndex, handSize, fontSize) {
    var center = Math.floor(handSize / 2);
    var rot = (center - handIndex) * 2;
    var spreadX = (handIndex - center) * SPLIT_SPREAD_FACTOR * fontSize;
    var spreadY = (handIndex - center) * SPLIT_SPREAD_FACTOR * fontSize;
    return { spreadX, spreadY, rot };
  }

  // Card class
  function Card(element, index) {
    var self = {
      $el: element,
      i: index,
      x: 0,
      y: 0,
      rot: 0,
      animateTo: animateTo
    };

    function animateTo(params) {
      var delay = params.delay || 0;
      var duration = params.duration || 400;
      var x = params.x !== undefined ? params.x : self.x;
      var y = params.y !== undefined ? params.y : self.y;
      var rot = params.rot !== undefined ? params.rot : self.rot;
      var onStart = params.onStart;
      var onComplete = params.onComplete;

      var startX = self.x;
      var startY = self.y;
      var startRot = self.rot;

      animationFrames(delay, duration).start(function() {
        onStart && onStart();
      }).progress(function(t) {
        var et = ease.cubicInOut(t);
        self.x = startX + (x - startX) * et;
        self.y = startY + (y - startY) * et;
        self.rot = startRot + (rot - startRot) * et;
        
        self.$el.style.transform = 'translate(' + self.x + 'px, ' + self.y + 'px) rotate(' + self.rot + 'deg)';
      }).end(function() {
        onComplete && onComplete();
      });
    }

    return self;
  }

           // Deck class
    function Deck() {
      var cards = [];
      var $el = document.createElement('div');
      var $root;
      var playedCardZIndex = 10000; // Starting z-index for played cards
      
      // Configuration: Easy to change number of packs
      var NUM_PACKS = 1; // Change to 1 for single pack, 2 for double pack

      

                                       // Create cards
       function createCards() {
                   // NUM_PACKS with filtered ranks: A, 9, 10, K, Q, J only
          var t2Ranks = [1, 9, 10, 11, 12, 13]; // A, 9, 10, J, Q, K
          
          
          
          for (var pack = 0; pack < NUM_PACKS; pack++) {
           for (var suit = 0; suit < 4; suit++) {
             for (var rankIndex = 0; rankIndex < t2Ranks.length; rankIndex++) {
               var rank = t2Ranks[rankIndex];
               
               var cardEl = document.createElement('div');
               cardEl.className = 'card';
               
               var faceEl = document.createElement('div');
               faceEl.className = 'face';
               
                               // Track the actual card index for 2 packs
                var actualCardIndex = cards.length;
             
            // Add CSS classes for suit and rank
            cardEl.classList.add(getSuitClass(suit));
            cardEl.classList.add('rank' + rank);
            
            // The CSS will handle the background image automatically
           
           var backEl = document.createElement('div');
           backEl.className = 'back';
           
           cardEl.appendChild(faceEl);
           $el.appendChild(cardEl);
           
           var card = Card(cardEl, actualCardIndex);
           card.suit = suit;
           card.rank = rank;
           card.pack = pack; // Track which pack this card belongs to
           card.setSide = function(side) {
             if (side === 'front') {
               cardEl.removeChild(backEl);
               cardEl.appendChild(faceEl);
             } else {
               cardEl.removeChild(faceEl);
               cardEl.appendChild(backEl);
             }
           };
           
           cards.push(card);
          }
        }
      }
     }
     
     // Helper functions for card display
     function getRankText(rank) {
       if (rank === 1) return 'A';
       if (rank === 11) return 'J';
       if (rank === 12) return 'Q';
       if (rank === 13) return 'K';
       return rank.toString();
     }
     
           function getSuitSymbol(suit) {
        var symbols = ['♠', '♥', '♦', '♣'];
        return symbols[suit];
      }
      
             function getSuitClass(suit) {
         var classes = ['spades', 'hearts', 'diamonds', 'clubs'];
         return classes[suit];
       }
       
       // Card power values for sorting
       function getCardPower(rank) {
         if (rank === 11) return 3; // J
         if (rank === 9) return 2;  // 9
         if (rank === 1) return 1.1;  // A
         if (rank === 10) return 0.9; // 10
         if (rank === 13) return 0.11; // K
         if (rank === 12) return 0; // Q
         return 0;
       }

    // Random Split functionality
    function randomSplit() {
      var _fontSize = fontSize();

      var suitOrder = {
        1: 0, // Hearts
        0: 1, // Spades
        2: 2, // Diamonds
        3: 3  // Clubs
      };
      
      // Shuffle cards
      fisherYates(cards);

      // Group cards by player
      var hands = [[], [], [], []];
      cards.forEach(function(card, i) {
        var player = i % 4;
        hands[player].push(card);
        card.randomSplitPlayer = player;
        card.randomSplitIndex = Math.floor(i / 4);
      });

             // Sort each hand by card power (highest to lowest)
       hands.forEach(function(hand, player) {
         // Sort by power (highest first), then by suit for same power
         hand.sort(function(a, b) {
          var suitA = suitOrder[a.suit];
          var suitB = suitOrder[b.suit];
        
          if (suitA !== suitB) {
            return suitA - suitB; // Custom suit order: hearts > spades > diamonds > clubs
          }
        
          var powerA = getCardPower(a.rank);
          var powerB = getCardPower(b.rank);
          return powerB - powerA; // Within same suit, sort by descending power
        });
        
         
         // Update hand indices after sorting
         hand.forEach(function(card, j) {
           card.randomSplitHandIndex = j;
           card.randomSplitHandSize = hand.length;
         });
         
         // Log sorted hand for debugging
         var handText = hand.map(function(card) {
           return getRankText(card.rank) + getSuitSymbol(card.suit) + '(' + getCardPower(card.rank) + ')';
         }).join(', ');
         console.log('Player ' + (player + 1) + ' sorted hand:', handText);
       });

      // Animate cards to positions
      cards.forEach(function(card, i) {
        animateCardToPosition(card, i);
      });
    }

    // Animate individual card to position
    function animateCardToPosition(card, index) {
      var player = card.randomSplitPlayer;
      var handIndex = card.randomSplitHandIndex;
      var handSize = card.randomSplitHandSize;
      var delay = index * 10;

      var { spreadX, spreadY, rot } = getSplitSpread(handIndex, handSize, fontSize());

      // Position configurations
      var positions = {
        0: { x: 0, y: 240, rot: 0, sx: -1, sy: 0 },    // South
        1: { x: 240, y: 0, rot: 0, sx: -1, sy: 0 },     // West
        2: { x: -240, y: 0, rot: 0, sx: -1, sy: 0 },   // East
        3: { x: 0, y: -240, rot: 0, sx: -1, sy: 0 }   // North
      };

      var position = positions[player];
      // var finalX = position.x + (Math.cos(deg2rad(rot)) - 0.5) * spreadX * position.sx + -3 * Math.abs(position.x) * position.sx * ((rot));
      // var finalY = position.y + (Math.cos(deg2rad(rot)) - 0.5) * spreadY * position.sy + -3 * Math.abs(position.y) * position.sy * ((rot)) - 20;
      
      var finalX = position.x + spreadX * position.sx * 0.5;
      var finalY = position.y + spreadY * position.sy;


      // - Math.floor(card.randomSplitHandSize/2)

      finalX = finalX + 3*position.sy*Math.abs(0.5 - Math.abs(card.randomSplitHandIndex - Math.floor(card.randomSplitHandSize/2)))
      finalY = finalY - 3*position.sx*Math.abs(0.5 - Math.abs(card.randomSplitHandIndex - Math.floor(card.randomSplitHandSize/2)))
      card.animateTo({
        delay: delay,
        duration: 400,
        x: finalX,
        y: finalY,
        rot: rot,
        onStart: function() {
          var z = handSize - 1 - handIndex;
          card.$el.style.zIndex = z;
        },
        onComplete: function() {
          // Store final positions
          card._randomSplitFinalX = finalX;
          card._randomSplitFinalY = finalY;
          card._randomSplitFinalRot = position.rot + rot;

          if (index === cards.length - 1) {
            // Add interactions after all cards are positioned
            cards.forEach(addCardInteractions);
          }
        }
      });
    }

    // Add hover and click interactions
    function addCardInteractions(card) {
      var originalZ = card.$el.style.zIndex;
      var finalX = card._randomSplitFinalX;
      var finalY = card._randomSplitFinalY;
      var finalRot = card._randomSplitFinalRot;
      var isHovered = false;
      var isClicked = false;

      // var moves = {
      //   0: { x: 0, y: 30 },    // South
      //   1: { x: 30, y: 0,},     // West
      //   2: { x: -30, y: 0 },   // East
      //   3: { x: 0, y: -30 }   // North
      // };

      var moves = {
        0: { x: 0, y: 30 },    // South
        1: { x: 0, y: 30 },     // West
        2: { x: 0, y: 30 },   // East
        3: { x: 0, y: 30 }   // North
      };

      var player = card.randomSplitPlayer;
      var move = moves[player];

      function onMouseEnter() {
        if (isClicked) return;
        isHovered = true;
        card.$el.style.zIndex = '9999';
        card.animateTo({
          delay: 0,
          duration: 200,
          y: finalY - move.y,
          x: finalX - move.x,
          rot: finalRot
        });
      }

      function onMouseLeave() {
        if (isClicked) return;
        isHovered = false;
        card.$el.style.zIndex = originalZ;
        card.animateTo({
          delay: 0,
          duration: 200,
          y: finalY,
          x: finalX,
          rot: finalRot
        });
      }

                           function onClick() {
          if (isClicked) return;
          isClicked = true;
          playedCardZIndex++; // Increment z-index for each played card
          card.$el.style.zIndex = playedCardZIndex;
          card.animateTo({
            delay: 0,
            duration: 500,
            x: 0,
            y: 0,
            rot: (playedCardZIndex - 10008)*30,
            onComplete: function() {
              console.log('Card played to center:', getRankText(card.rank) + getSuitSymbol(card.suit) + ' (Suit: ' + card.suit + ', Rank: ' + card.rank + ')');
              // Keep the card on top after playing
              // card.$el.style.zIndex = playedCardZIndex;
            }
          });
        }

      card.$el.addEventListener('mouseenter', onMouseEnter);
      card.$el.addEventListener('mouseleave', onMouseLeave);
      card.$el.addEventListener('click', onClick);

      card._randomSplitInteractions = {
        onMouseEnter: onMouseEnter,
        onMouseLeave: onMouseLeave,
        onClick: onClick
      };
    }

    // Initialize
    createCards();

    // Public API
    var self = {
      cards: cards,
      $el: $el,
      mount: function(container) {
        $root = container;
        $root.appendChild($el);
      },
      randomSplit: randomSplit
    };

    return self;
  }

  // Expose to global scope
  window.Deck = Deck;
})(); 