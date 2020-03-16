// Version: hsdv (heart-rate, socket, DoryNode, view)

//const http = require('http')
//const fs = require('fs')
const ws = require('ws')

const wsServer = new ws.Server({ port: 8080 }) // TODO see whether wsServer can be created from httpServer

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
//*************************** Receive message from companion via http POST *****
//******************************************************************************

/*const requestHandler = (request, response) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': 2592000, // 30 days
    'Content-Type': 'text/html'
  }

  //console.log(`server.js requestHandler(): received ${request.method}`)

  if (request.method == 'POST') {   // fetch() data sent from companion
    console.log(`server.js requestHandler(): received POST from URL=${request.url}`)
    var body = ''

    request.on('data', function(data) {
      body += data
      //console.log(`Partial body: ${body}`)
    })

    request.on('end', function() {
      //console.log('Body: ' + body)
      response.writeHead(200, headers)
      response.end('POST received')   // it isn't necessary to send a response, but it can help debugging (and seems polite)
      sendToClients(body)
    })
  } else if (request.method == 'GET') {   // request to download file
    response.writeHead(200, {'Content-Type': 'text/csv'})
    const savedData = fs.readFileSync('data.csv')
    response.end(savedData)
  }
}

const httpServer = http.createServer(requestHandler)  // TODO do we need the http server just to process sockets?

httpServer.listen(port, (err) => {
  if (err) {
    return console.log('HTTP server listen failure: ', err)
  }

  console.log(`HTTP server is listening on port ${port}`)
})*/

//******************************************************************************
//*********************************** Send message to client via WebSocket *****
//******************************************************************************

function sendToClients(data, incomingSocket) {
  // Send data to all connected and open wsServer clients.
  // incomingSocket: socket from companion on which data was received (undefined if using fetch POST).

  wsServer.clients.forEach(function each(client) {
    if (client!==incomingSocket && client.readyState===ws.OPEN) {
      console.log(`server.js: sending to a client at ${client.url}; data=${data}`)
      client.send(data)
    }
  })
}