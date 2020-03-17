// Version: hsdv (heart-rate, socket, DoryNode, view)

import * as messaging from "messaging"
import { settingsStorage } from "settings"

const wsURL = 'ws://127.0.0.1:8080'
const websocket = new WebSocket(wsURL)

// Initialise settings:

settingsStorage.setItem('hr', '')
settingsStorage.setItem('time', '')

// Companion-to-server socket:

websocket.addEventListener('open', onSocketOpen)
websocket.addEventListener('message', onSocketMessage)
websocket.addEventListener('close', onSocketClose)
websocket.addEventListener('error', onSocketError)

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
   console.error(`onSocketError(): ${evt.data}. Check that the server is running and accessible.`)
}

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

function sendToServerViaSocket(data) {
  //console.log(`sendToServerViaSocket()`)

  if (websocket.readyState === websocket.OPEN) {
    websocket.send(data)
  } else {
    console.log(`sendToServerViaSocket(): can't send because socket readyState=${websocket.readyState}`)
  }
}