/* global Deck */

var $container = document.getElementById('container')
var $topbar = document.getElementById('topbar')

var $header = document.createElement('h1')
$header.textContent = "Vish Cards Playground"
$topbar.appendChild($header)

// // Add button for random 4 player split
// var $randomSplit = document.createElement('button')
// $randomSplit.textContent = 'Random 4 Player Split'
// $topbar.appendChild($randomSplit)
// $randomSplit.addEventListener('click', function () {
//   deck.randomSplit()
// })

var deck = Deck()
deck.mount($container)

// Initialize with random split
deck.randomSplit() 