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
    const SPLIT_SPREAD_FACTOR = 1.7;
    const SPLIT_SPREAD_CENTER = 6;

    function getSplitSpread(handIndex, handSize, fontSize) {
        var center = Math.floor(handSize / 2);
        var rot = (center - handIndex) * 2;
        var spreadX = (handIndex - center) * SPLIT_SPREAD_FACTOR * fontSize;
        var spreadY = (handIndex - center) * SPLIT_SPREAD_FACTOR * fontSize;
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
    window.createCard = function(index, suitClass, rank) {
        var cardEl = document.createElement('div');
        cardEl.className = 'card ' + suitClass + ' rank' + rank;
        var faceEl = document.createElement('div');
        faceEl.className = 'face';
        cardEl.appendChild(faceEl);
        return cardEl;
    };

    var playedCardZIndex = 10000;

    window.animateCardToPosition = function(cardEl, player, handIndex, handSize, index) {
        var card = Card(cardEl);
        var delay = index * 10;
        var _fontSize = fontSize();
        var { spreadX, spreadY, rot } = getSplitSpread(handIndex, handSize, _fontSize);

        var positions = {
            0: { x: 0, y: 240, rot: 0, sx: -1, sy: 0 }, // South
            1: { x: 240, y: 0, rot: 0, sx: -1, sy: 0 },  // West
            2: { x: -240, y: 0, rot: 0, sx: -1, sy: 0 }, // East
            3: { x: 0, y: -240, rot: 0, sx: -1, sy: 0 }  // North
        };

        var position = positions[player];
        var finalX = position.x + spreadX * position.sx * 0.5;
        var finalY = position.y + spreadY * position.sy;
        finalX = finalX + 3 * position.sy * Math.abs(0.5 - Math.abs(handIndex - Math.floor(handSize / 2)));
        finalY = finalY - 3 * position.sx * Math.abs(0.5 - Math.abs(handIndex - Math.floor(handSize / 2)));

        var moves = {
            0: { x: 0, y: 30 }, // South
            1: { x: 0, y: 30 }, // West
            2: { x: 0, y: 30 }, // East
            3: { x: 0, y: 30 }  // North
        };

        var move = moves[player];
        var originalZ = handSize - 1 - handIndex;
        var finalRot = rot;
        var isHovered = false;
        var isClicked = false;

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
            playedCardZIndex++;
            card.$el.style.zIndex = playedCardZIndex;
            card.animateTo({
                delay: 0,
                duration: 500,
                x: 0,
                y: 0,
                rot: (playedCardZIndex - 10008) * 30
            });
        }

        card.$el.addEventListener('mouseenter', onMouseEnter);
        card.$el.addEventListener('mouseleave', onMouseLeave);
        card.$el.addEventListener('click', onClick);

        card.animateTo({
            delay: delay,
            duration: 400,
            x: finalX,
            y: finalY,
            rot: rot,
            onStart: function() {
                card.$el.style.zIndex = originalZ;
            },
            onComplete: function() {
                card._randomSplitFinalX = finalX;
                card._randomSplitFinalY = finalY;
                card._randomSplitFinalRot = finalRot;
            }
        });
    };
})();