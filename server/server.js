// Version: hsdv (heart-rate, socket, DoryNode, view)

const ws = require('ws')                        // WebSocket module

const wsServer = new ws.Server({ port: 8080 })  // WebSocket server

//******************************************************************************
//*************************** Receive message from companion via WebSocket *****
//******************************************************************************

wsServer.on('connection', function connection(socket, request) {
  console.log(`server.js: connection from ${request.connection.remoteAddress}`)
  socket.on('message', function incoming(data) {
    //console.log(`server.js: received a message`)
    sendToClients(data, socket)
  })
})

//******************************************************************************
//*********************************** Send message to client via WebSocket *****
//******************************************************************************

function sendToClients(data, incomingSocket) {
  // Send data to all connected and open wsServer clients, except for incomingSocket.
  // data: text string to send.
  // incomingSocket: socket from companion on which data was received.

  wsServer.clients.forEach(function each(client) {
    if (client!==incomingSocket && client.readyState===ws.OPEN) {
      //console.log(`server.js: sending to a client; data=${data}`) // it would be nice to include client.url, but this is often undefined
      client.send(data)
    }
  })
}