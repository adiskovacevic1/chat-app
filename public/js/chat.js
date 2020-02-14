const socket = io()

// Elements
const $messageForm = document.querySelector('form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')

//Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// Options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const autoscroll = () => {
    const $newMessage = $messages.lastElementChild

    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    //Height of messages conatiner
    const containerHeight = $messages.scrollHeight

    //How far have i scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight

    }
}

socket.on('locationMessage', (message) => {
    console.log(message)
    const html = Mustache.render(locationTemplate, {
        url: message.url,
        createdAt: moment(message.createAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('message', (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        message: message.text,
        createdAt: moment(message.createdAt).format('h:mm a')
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate,{
        room,
        users
    })

    document.querySelector('#sidebar').innerHTML = html
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value

    socket.emit("sendMessage", message, (error) => {
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        // enable location
        if (error) {
            return console.log(error)
        }

        console.log('Message Delivered!')
    })
})

$locationButton.addEventListener('click', () => {
    $locationButton.setAttribute('disabled', 'disabled')
    console.log('click')
    if (!navigator.geolocation) {
        return alert('Geolocation is not supported by your browser')
    }

    navigator.geolocation.getCurrentPosition((position) => {
        console.log(position)

        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
        }, (error) => {
            $locationButton.removeAttribute('disabled')
            if (error) {
                return console.log(error)
            }

            console.log('Location Shared!')
        })
    })
})

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = '/'
    }
})