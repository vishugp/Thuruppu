
/* global Deck */

var prefix = Deck.prefix

var transform = prefix('transform')

var translate = Deck.translate

var $container = document.getElementById('container')
var $topbar = document.getElementById('topbar')

var $header = document.createElement('h1')
$header.textContent = "Vish Cards Playground (🚧 Work In Progress 🚧)"
$topbar.appendChild($header)

var $flip = document.createElement('button')
$flip.textContent = 'Flip'
$topbar.appendChild($flip)
$flip.addEventListener('click', function () {
  deck.flip()
})

var $sort = document.createElement('button')
$sort.textContent = 'Sort'
$topbar.appendChild($sort)
$sort.addEventListener('click', function () {
  deck.sort()
})

var $shuffle = document.createElement('button')
$shuffle.textContent = 'Shuffle'
$topbar.appendChild($shuffle)
$shuffle.addEventListener('click', function () {
  deck.shuffle()
  deck.shuffle()
})

var $bysuit = document.createElement('button')
$bysuit.textContent = 'By suit'
$topbar.appendChild($bysuit)
$bysuit.addEventListener('click', function () {
  deck.sort(true) // sort reversed
  deck.bysuit()
})

var $fan = document.createElement('button')
$fan.textContent = 'Fan'
$topbar.appendChild($fan)
$fan.addEventListener('click', function () {
  deck.fan()
})



var $split = document.createElement('button')
$split.textContent = '4 player split'
$topbar.appendChild($split)
$split.addEventListener('click', function () {
  deck.sort(false)
  deck.split()
})

// Add button for random 4 player split
var $randomSplit = document.createElement('button')
$randomSplit.textContent = 'Random 4 player split'
$topbar.appendChild($randomSplit)
$randomSplit.addEventListener('click', function () {
  deck.randomSplit()
})


var deck = Deck()
deck.cards.forEach(function (card, i) {
  card.enableDragging()
  card.enableFlipping()
})



deck.mount($container)

deck.intro()
deck.sort()

function printMessage (text) {
  var animationFrames = Deck.animationFrames
  var ease = Deck.ease
  var $message = document.createElement('p')
  $message.classList.add('message')
  $message.textContent = text

  document.body.appendChild($message)

  $message.style[transform] = translate(window.innerWidth + 'px', 0)

  var diffX = window.innerWidth

  animationFrames(1000, 700)
    .progress(function (t) {
      t = ease.cubicInOut(t)
      $message.style[transform] = translate((diffX - diffX * t) + 'px', 0)
    })

  animationFrames(6000, 700)
    .start(function () {
      diffX = window.innerWidth
    })
    .progress(function (t) {
      t = ease.cubicInOut(t)
      $message.style[transform] = translate((-diffX * t) + 'px', 0)
    })
    .end(function () {
      document.body.removeChild($message)
    })
}
