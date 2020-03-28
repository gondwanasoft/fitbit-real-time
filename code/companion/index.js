// Version: asdv (accelerometer, socket, DoryNode, view)

import * as messaging from "messaging"
import { settingsStorage } from "settings"

// Initialise settings:

settingsStorage.setItem('x', '')
settingsStorage.setItem('y', '')
settingsStorage.setItem('z', '')
settingsStorage.setItem('time', '')

// Clockface-to-companion messaging:

const valuesPerReading = 4                    // x, y, z, time
const bytesPerReading = valuesPerReading * 2  // 2 because values are Int16 (2 bytes) each
let previousTime = 0                          // timestamp of previous reading
let timeMSB = 0                               // most significant bits to add to timestamp to adjust for Int16 truncation

messaging.peerSocket.onopen = function() {
  console.log('Messaging open')
}

messaging.peerSocket.onmessage = function(evt) {
  // Unpack binary data into an array of objects:
  const dataView = new DataView(new Uint8Array(evt.data).buffer)
  const readingCount = dataView.byteLength / bytesPerReading
  const readingArray = []
  let x, y, z, time
  let reading                 // reconstructed reading object
  let index = 0               // offset into dataView of the first byte in a reading
  for (let readingNo = 0; readingNo < readingCount; readingNo++) {
    x = dataView.getInt16(index, true) / 1000
    y = dataView.getInt16(index + 2, true) / 1000
    z = dataView.getInt16(index + 4, true) / 1000
    time = dataView.getInt16(index + 6, true) + timeMSB

    if (time < previousTime) {
      // time seems to have gone backwards, so push it up to the next block
      time += 32768
      timeMSB += 32768  // subsequent timestamps need to be increased as well
    }
    previousTime = time

    reading = {x:x, y:y, z:z, time:time}
    readingArray.push(reading)
    index += bytesPerReading
  }

  const dataObjectString = JSON.stringify(readingArray)
  //console.log(`dataObjectString=${dataObjectString}`)
  sendToServerViaSocket(dataObjectString)

  // Display data on settings page (for no good reason):
  settingsStorage.setItem('x', x)
  settingsStorage.setItem('y', y)
  settingsStorage.setItem('z', z)
  settingsStorage.setItem('time', time)
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
    // If you want to log an error, limit it to a few times a second.
    //console.log(`sendToServerViaSocket(): can't send because socket readyState=${websocket.readyState}`)
  }
}

setInterval(() => {   // periodically try to reopen the connection if need be
  if (websocket.readyState === websocket.CLOSED) {
    console.error(`websocket is closed: check server is running at ${wsURL}`)
    console.log(`attempting to reopen websocket`)
    openServerConnection()
  }
}, 1000)