/**
 * Animation System for Card Game
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
    function fontSize() {
        return parseFloat(window.getComputedStyle(document.body).getPropertyValue('font-size'));
    }

    // Spread calculation constants
    const SPLIT_SPREAD_FACTOR = 2.5;
    const SPLIT_SPREAD_CENTER = 6;

    function getSplitSpread(handIndex, handSize, fontSize) {
        var rotCenter = Math.floor(handSize / 2);
        var spreadCenter = (handSize - 1) / 2;
        var rot = (rotCenter - handIndex) * 2;
        var spreadX = (handIndex - spreadCenter) * SPLIT_SPREAD_FACTOR * fontSize;
        var spreadY = (handIndex - spreadCenter) * SPLIT_SPREAD_FACTOR * fontSize;
        return { spreadX, spreadY, rot };
    }

    // Card animation handler
    function Card(element) {
        var self = {
            $el: element,
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

    // Global functions for client-side
    window.createCard = function(cardId, suitClass, rank) {
        var cardEl = document.createElement('div');
        cardEl.className = 'card ' + suitClass + ' rank' + rank;
        cardEl.dataset.cardId = cardId;
        var faceEl = document.createElement('div');
        faceEl.className = 'face';
        cardEl.appendChild(faceEl);
        return cardEl;
    };

    window.animateCardToPosition = function(cardEl, player, handIndex, handSize, index, onReady) {
        var card = Card(cardEl);
        var match = cardEl.style.transform.match(/translate\(([^,]+)px,\s*([^)]+)px\).*rotate\(([^)]+)\)/);
        if (match) {
            card.x = parseFloat(match[1]);
            card.y = parseFloat(match[2]);
            card.rot = parseFloat(match[3]) || 0;
        }
        var delay = index * 10;
        var _fontSize = fontSize();
        var { spreadX, spreadY, rot } = getSplitSpread(handIndex, handSize, _fontSize);

        var positions = {
            0: { x: 0, y: 210, rot: 0, sx: -1, sy: 0 },  // South (bottom)
            1: { x: -350, y: 0, rot: 0, sx: -1, sy: 0 }, // West (left)
            2: { x: 0, y: -180, rot: 0, sx: -1, sy: 0 }, // North (top)
            3: { x: 350, y: 0, rot: 0, sx: -1, sy: 0 }   // East (right)
        };
        var position = positions[player];
        var finalX = position.x + spreadX * position.sx * 0.5;
        var finalY = position.y + spreadY * position.sy;
        finalX = finalX + 3 * position.sy * Math.abs(0.5 - Math.abs(handIndex - Math.floor(handSize / 2)));
        finalY = finalY - 3 * position.sx * Math.abs(0.5 - Math.abs(handIndex - Math.floor(handSize / 2)));


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
                cardEl.dataset.origX = card.x;
                cardEl.dataset.origY = card.y;
                cardEl.dataset.origRot = card.rot;
                cardEl.dataset.origZ = card.$el.style.zIndex;
                if (onReady) onReady(card.$el);
            }
        });
    };

    window.spreadCardsHorizontally = function(player, cardEls, onComplete) {
        if (!cardEls || !cardEls.length) return;
        var count = cardEls.length;
        var positions = {
            0: { bx: 0, by: 240, axis: 'x' },
            1: { bx: -350, by: 0, axis: 'y' },
            2: { bx: 0, by: -240, axis: 'x' },
            3: { bx: 350, by: 0, axis: 'y' }
        };
        var p = positions[player];
        var spacing = Math.min(65, 500 / count);
        var start = -(count - 1) * spacing / 2;
        cardEls.forEach(function(el, i) {
            var card = Card(el);
            var match = el.style.transform.match(/translate\(([^,]+)px,\s*([^)]+)px\).*rotate\(([^)]+)\)/);
            if (match) {
                card.x = parseFloat(match[1]);
                card.y = parseFloat(match[2]);
                card.rot = parseFloat(match[3]) || 0;
            }
            var targetX = p.axis === 'x' ? p.bx + start + i * spacing : p.bx;
            var targetY = p.axis === 'y' ? p.by + start + i * spacing : p.by;
            card.animateTo({
                delay: i * 15,
                duration: 350,
                x: targetX,
                y: targetY,
                rot: 0,
                onStart: function() {
                    el.style.zIndex = i;
                },
                onComplete: function() {
                    if (i === count - 1 && onComplete) onComplete();
                }
            });
        });
    };

    window.restoreCardPositions = function(cardEls, onComplete) {
        if (!cardEls || !cardEls.length) return;
        cardEls.forEach(function(el, i) {
            var ox = parseFloat(el.dataset.origX) || 0;
            var oy = parseFloat(el.dataset.origY) || 0;
            var orot = parseFloat(el.dataset.origRot) || 0;
            var oz = el.dataset.origZ || (cardEls.length - 1 - i);
            var card = Card(el);
            var match = el.style.transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
            if (match) {
                card.x = parseFloat(match[1]);
                card.y = parseFloat(match[2]);
            }
            card.animateTo({
                delay: i * 15,
                duration: 350,
                x: ox,
                y: oy,
                rot: orot,
                onStart: function() {
                    el.style.zIndex = oz;
                },
                onComplete: function() {
                    if (i === cardEls.length - 1 && onComplete) onComplete();
                }
            });
        });
    };

    window.animateCardElement = function(cardEl, toX, toY, toRot, duration, onComplete) {
        var card = Card(cardEl);
        var match = cardEl.style.transform.match(/translate\(([^,]+)px,\s*([^)]+)px\)/);
        if (match) {
            card.x = parseFloat(match[1]);
            card.y = parseFloat(match[2]);
        }
        card.animateTo({
            delay: 0,
            duration: duration || 400,
            x: toX,
            y: toY,
            rot: toRot !== undefined ? toRot : card.rot,
            onComplete: function() {
                if (onComplete) onComplete(card.$el);
            }
        });
    };
})();