const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users.js')

const publicDirectoryPath = path.join(__dirname, '../public')
const port = process.env.PORT || 3000

const app = express()
const server = http.createServer(app)
const io = socketio(server)


app.use(express.static(publicDirectoryPath))

let count = 0

io.on('connection', (socket) => {
    console.log('New WebSocket connection')


    socket.on('join', (options, callback) => {

        const {error, user} = addUser({ id: socket.id, ...options })

        if (error) {
            return callback(error)
        }
        socket.join(user.room)

        socket.emit('message', generateMessage('Welcome! ' + user.username))
        socket.broadcast.to(user.room).emit('message', generateMessage(`${user.username} has joined!`))

        io.to(user.room).emit('roomData', {
            room: user.room,
            users: getUsersInRoom(user.room)
        })

        callback()

        // socket.emit, io.emit, socket.broadcast.emit
        // io.to.emit, socket.broadcast.to.emit
    })

    socket.on('sendMessage', (message, callback) => {
        const filter = new Filter()
        
        if(filter.isProfane(message)) {
            return callback('Profanity is not allowed!')
        }
        const user = getUser(socket.id)

        console.log(message)
        io.to(user.room).emit('message', generateMessage(message))
        callback()
    })

    socket.on('sendLocation', (location, callback) => {
        console.log(location)
        io.emit('locationMessage', generateLocationMessage(`https://www.google.com/maps/?q=${location.latitude},${location.longitude}`))
        callback()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage(`${user.username} has left!`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () => {
    console.log(`Started Server on Port ${port}`)
})
