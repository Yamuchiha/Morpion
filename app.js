const { Socket } = require('socket.io');

const express = require('express');

const app = express()

const http = require('http').createServer(app)
const port = 3005
const path = require('path')

/**
 * @type {Socket}
*/
const io = require('socket.io')(http)//creation de serveur à partir d'express et de socket.io

/*prendre les fichiers qui se trouve dans "node_modules/bootstrap/dist/css" et les metter dans un chemin vituel
 /bootttrap/css pour pouvoir les utiliser à partir de ce chemin virtuel*/
app.use('/bootstrap/css', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/css')))
app.use('/bootstrap/js', express.static(path.join(__dirname, 'node_modules/bootstrap/dist/js')))
app.use('/jquery', express.static(path.join(__dirname, 'node_modules/jquery/dist')))
app.use(express.static('public'))

app.get('/', (req, res) =>{
    res.sendFile(path.join(__dirname, 'templates/base.html'))
})

app.get('/jeu/morpion', (req, res) =>{
    res.sendFile(path.join(__dirname, 'templates/jeu_morpion.html'))
})

http.listen(port, () =>{
    console.log(`Listening on http://localhost:${port}`)
})

let rooms = []

//écoute des évènemets à partir de la socket.io "io" créé ci-dessous
//cet évènement "connection est émis lorsqu'un socket va se connecter"
io.on('connection', (socket)=>{
    console.log(`Connexion de l'adresse ip : ${socket.id}`)
    
    //évènement qui permet de recevoir les donnée du joueur
    socket.on('playerData', (player) =>{
        console.log(`playerData ${player.username}`)
        let room = null

        if(!player.roomId){
            room = createRoom(player)
            console.log(`create room - ${room.id} - ${player.username} et son id est : ${player.roomId}`)
        }
        else{
            room = rooms.find(r => r.id === player.roomId)

            if(room === undefined) {
                return
            }
            player.roomId = room.id
            room.players.push(player)
        }

        socket.join(room.id)

        io.to(socket.id).emit('join room', room.id)

        if (room.players.length === 2){
            io.to(room.id).emit('start game', room.players)
        }
    })

    socket.on('get rooms', () =>{
        io.to(socket.id).emit('list rooms', rooms)
    })

    socket.on('play', (player) =>{
        io.to(player.roomId).emit('play', player)
    })

    socket.on('disconnect', ()=>{
        console.log(`Deconnexion ${socket.id}`)
        let room = null
        
        rooms.forEach(r =>{
            r.players.forEach(p =>{
              if(p.socketId === socket.id && p.host){
                    room = r;
                    rooms = rooms.filter(r => r != room)
              }
            })
        })
    })

    socket.on('play again', (roomId) =>{
        const room = rooms.find(r => r.id === roomId)

        if(room && room.players.length === 2){
            io.to(room.id).emit('play again', room.players)
        }
    })
})

function createRoom(player){
    const room = { id: roomId(), players: [] }

    player.roomId = room.id
    room.players.push(player) //ajout du joueur courant dans le tableau des joueurs players[]
    rooms.push(room) //ajout du salon créer dans le tableau des salon rooms[]

    return room
}

function roomId(){
    return Math.random().toString(36).substr(2,9)
}