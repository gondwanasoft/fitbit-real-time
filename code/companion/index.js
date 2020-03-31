// Version: hsdv (heart-rate, socket, DoryNode, view)

import * as messaging from "messaging"
import { settingsStorage } from "settings"

// Initialise settings:

settingsStorage.setItem('hr', '')
settingsStorage.setItem('time', '')

// Clockface-to-companion messaging:

messaging.peerSocket.onopen = function() {
  console.log('Messaging open')
}

messaging.peerSocket.onmessage = function(evt) {
  // Display data on settings page (for no good reason):
  settingsStorage.setItem('hr', evt.data.hr)
  settingsStorage.setItem('time', evt.data.time)

  // Pass data to server:
  let data = JSON.stringify(evt.data)
  sendToServerViaSocket(data)
}

messaging.peerSocket.onclose = function(evt) {
  console.log(`Messaging closed: ${evt.code}`)
}

messaging.peerSocket.onerror = function(evt) {
  console.log(`Messaging error: ${evt.code}: ${evt.message}`)
}

// Companion-to-server socket:

const wsURL = 'ws://127.0.0.1:8080'
// 127.0.0.1 indicates the companion device, and is the only URL we can use without SSL.
// 8080 is a port that's commonly used for WebSockets.

let websocket

openServerConnection()

function openServerConnection() {
  websocket = new WebSocket(wsURL)
  websocket.addEventListener('open', onSocketOpen)
  websocket.addEventListener('message', onSocketMessage)
  websocket.addEventListener('close', onSocketClose)
  websocket.addEventListener('error', onSocketError)
}

function onSocketOpen(evt) {
   console.log('onSocketOpen()')
}

function onSocketMessage(evt) {
  // If using fetch(), companion may receive a copy of the socket broadcast from the server. Ignore it.
  //console.log(`onSocketMessage(): ${evt.data}`)
}

function onSocketClose() {
   console.log('onSocketClose()')
}

function onSocketError(evt) {
   console.error('onSocketError(): check that the server is running and accessible')
}

function sendToServerViaSocket(data) {
  //console.log(`sendToServerViaSocket()`)

  if (websocket.readyState === websocket.OPEN) {
    websocket.send(data)
  } else {
    console.log(`sendToServerViaSocket(): can't send because socket readyState=${websocket.readyState}`)
  }
}

setInterval(() => {   // periodically try to reopen the connection if need be
  if (websocket.readyState === websocket.CLOSED) {
    console.error(`websocket is closed: check server is running at ${wsURL}`)
    console.log(`attempting to reopen websocket`)
    openServerConnection()
  }
}, 1000)
