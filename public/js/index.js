const player = {
    host : false,
    playedCell : "",
    roomId : null,
    username : "",
    socketId : "",
    symbol : "X",
    turn : false,
    win : false
};

const socket = io();

const queryString = window.location.search
const urlParams = new URLSearchParams(queryString)
const roomId = urlParams.get('room')

if(roomId){
    document.getElementById('start').innerText = 'Lancer la partie'
}

const usernameInput = document.getElementById('username');
const userCard = document.getElementById('user-card');

const waitingArea = document.getElementById('waiting-area')
const roomsCard = document.getElementById('rooms-card')
const roomsList = document.getElementById('rooms-list')

const restartArea = document.getElementById('restart-area')

const gameCard = document.getElementById('game-card')
const turnMessage = document.getElementById('turn-message')

const linkToShare = document.getElementById('link-to-share')

let ennemyUsername = ""

socket.emit('get rooms');
socket.on('list rooms', (rooms) =>{
    let html = "";

    if(rooms.length >0){
        rooms.forEach(room => {
            if (room.players.length !== 2) {
                html += `<li class = "list-group-item d-flex justify-content-between">
                            <p class = "p-0 m-0 flex-grow-1 fw-bold">Partie de ${room.players[0].username}</p>
                            <button class = "btn btn-sm btn-success join-room" data-room="${room.id}"><i class="fa fa-user-check"></i> Lancer la partie</button>
                        </li>`;
            }
        });
    }
    
    if(html !== ''){
        roomsCard.classList.remove('d-none')
        roomsList.innerHTML = html

        for (const element of document.getElementsByClassName('join-room')) {
            element.addEventListener('click', joinRoom, false)
            
        }
    }
})

$('#form').on('submit', function (e){
    e.preventDefault();

    player.username = usernameInput.value;

    if(roomId){
        player.roomId = roomId
    }else{
        player.host = true
        player.turn = true
    }
    // console.log(player)
    
    player.socketId = socket.id

    userCard.hidden = true
    waitingArea.classList.remove('d-none')
    roomsCard.classList.add('d-none')

    socket.emit('playerData', player)
});

$('.cell').on('click', function (){
    const playedCell = this.getAttribute('id')

    if(this.innerText === '' && player.turn){
        player.playedCell = playedCell

        this.innerText = player.symbol
        player.win = calculateWin(playedCell)
        player.turn = false

        socket.emit('play', player)
    }
})

$('#restart').on('click', function () {
    restartGame()
})

socket.on('start game', (players) => {
    startGame(players);
})

socket.on('join room', (roomId) =>{
    player.roomId = roomId
    linkToShare.innerHTML = `<a href="${window.location.href}?room=${player.roomId}" target="_blank">${window.location.href}?room=${player.roomId}</a>`
})

socket.on('play', (ennemyPlayer) =>{
    if (ennemyPlayer.socketId !== player.socketId && !ennemyPlayer.turn){
        const playedCell = document.getElementById(`${ennemyPlayer.playedCell}`)
        playedCell.classList.add("text-danger")
        playedCell.innerHTML = 'O'

        if(ennemyPlayer.win){
            SetTurnMessage('alert-info', 'alert-danger', `C'est perdu ! <b>${ennemyPlayer.username}</b> a gagné !`)
            calculateWin(ennemyPlayer.playedCell, 'O')
            showRestartArea()
            return
        }

        if(calculateEquality()){
            SetTurnMessage('alert-info', 'alert-warning', 'C\' est une égalité !')
            return
        }
        SetTurnMessage('alert-info', 'alert-success', 'C\'est ton tour de jouer')
        player.turn = true

    }else{
        if(player.win){
            $('#turn-message').addClass('alert-success').html("Félicitation, vous avez gagné la partie !")
            showRestartArea()
            return
        }
        if(calculateEquality()){
            SetTurnMessage('alert-info', 'alert-warning', 'C\' est une égalité !')
            showRestartArea()
            return
        }

        SetTurnMessage('alert-success', 'alert-info', `C'est au tour de <b>${ennemyUsername}</b> de jouer`)
        player.turn = false
    }
})

socket.on('play again', (players) =>{
    restartGame(players)
})

function restartGame(players = null) {
    if(player.host && !players){
        player.turn = true
        socket.emit('play again', player.roomId)
    }

    const cells = document.getElementsByClassName('cell')

    for (const cell of cells){
        cell.innerHTML = ''
        cell.classList.remove('win-cell', 'text-danger')
    }

    turnMessage.classList.remove('alert-warning', 'alert-danger')
 

    if(!player.host){
        player.turn = false
    }

    player.win = false

    if(players){
        startGame(players)
    }
}

function startGame(players) {
    restartArea.classList.add('d-none')
    waitingArea.classList.add('d-none')
    gameCard.classList.remove('d-none')
    turnMessage.classList.remove('d-none')

    const ennemyPlayer = players.find(p => p.socketId != player.socketId)
    ennemyUsername = ennemyPlayer.username

    if (player.host && player.turn) {
        SetTurnMessage('alert-info', 'alert-success', 'C\'est votre tour de joueur')
    }else{
        SetTurnMessage('alert-success', 'alert-info', `C'est au tour de <b>${ennemyPlayer.username}</b> de jouer`)
    }
}

function SetTurnMessage(classToRemove, classToAdd, html) {
    turnMessage.classList.remove(classToRemove)
    turnMessage.classList.add(classToAdd)
    turnMessage.innerHTML = html
}

function calculateEquality() {
    let equality = true
    const cells = document.getElementsByClassName('cell')

    for (const cell of cells){
        if(cell.textContent === ''){
            equality = false
        }
    }
    return equality;
}

const joinRoom = function (){
    if(usernameInput.value !== ""){
        player.username = usernameInput.value
        player.socketId = socket.id
        player.roomId = this.dataset.room

        socket.emit('playerData', player)
        userCard.hidden =true
        waitingArea.classList.remove('d-none')
        roomsCard.classList.add('d-none')
    }
}

function calculateWin(playedCell, symbol = player.symbol) {
    let  row = playedCell[5]
    let column = playedCell[7]

    // 1 Vertical (verifie si tous les symboles cliké dans la cellule de la colonne sont les même)
    let win = true

    for(let i = 1; i<4; i++){
        if($(`#cell-${i}-${column}`).text() !== symbol){
            win = false
        }
    }

    if(win){
        for (let i=1; i<4; i++){
            $(`#cell-${i}-${column}`).addClass("win-cell")
        }

        return win
    }

    // 2 Horizontale

    win = true
    for(let i=1; i<4; i++){
        if($(`#cell-${row}-${i}`).text() !== symbol){
            win = false
        }
    }

    if(win){
        for(let i = 1; i<4; i++){
            $(`#cell-${row}-${i}`).addClass("win-cell")
        }

        return win
    }

    // 3 main diag
    win = true

    for(let i=1; i<4; i++){
      if($(`#cell-${i}-${i}`).text() !== symbol){
        win = false
      }
    }

    if(win){
        for(let i=1; i<4; i++){
            $(`#cell-${i}-${i}`).addClass("win-cell")
        }

        return win
    }

    // 4 secondary

    win = false
    if($("#cell-1-3").text() === symbol){
        if($("#cell-2-2").text() === symbol){
            if($("#cell-3-1").text() === symbol){
                win = true

                $("#cell-1-3").addClass("win-cell")
                $("#cell-2-2").addClass("win-cell")
                $("#cell-3-1").addClass("win-cell")

                return win
            }
        }
    }
}

function showRestartArea() {
    if(player.host){
        restartArea.classList.remove('d-none')
    }
}