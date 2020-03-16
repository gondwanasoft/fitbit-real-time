
const http = require('http')
let fs = require('fs')
const WebSocket = require('ws')

const PORT = process.env.PORT || 5000

let fileStream = fs.createWriteStream('data.csv')

const requestHandler = (request, response) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Max-Age': 2592000, // 30 days
    'Content-Type': 'text/html'
  }
  console.log(`server.js requestHandler(): received ${request.method}`)

  if (request.method == 'POST') {   // assume this is a fetch() from companion
    console.log(`server.js requestHandler(): received POST from URL=${request.url}`)
    var body = ''

    request.on('data', function(data) {
      body += data
      //console.log(`Partial body: ${body}`)
    })

    request.on('end', function() {
      //console.log('Body: ' + body)
      response.writeHead(200, headers)
      response.end('post received')
      //var postDataObject = JSON.parse(body);
      //console.log(`postDataObject=${postDataObject}`);
      sendToClients(body)
      appendToFile(body)
    })
  } else if (request.method == 'GET') {
    fileStream.end()  // close the file so no more batches can be written to it

    response.writeHead(200, {'Content-Type': 'text/csv'})
    let savedData = fs.readFileSync('data.csv')
    response.end(savedData)

    fileStream = fs.createWriteStream('data.csv')   // reopen file for subsequent batches
  }
}

const server = http.createServer(requestHandler)

server.listen(PORT, (err) => {
  if (err) {
    return console.log('HTTP server listen failure: ', err)
  }

  console.log(`HTTP server is listening on port ${PORT}`)
})

const wsServer = new WebSocket.Server({server:server})

wsServer.on('connection', function connection(socket, request) {
  console.log(`server.js: connection from ${request.connection.remoteAddress}`)
  socket.on('message', function incoming(data) {
    //console.log(`server.js: received a message`)
    sendToClients(data, socket)
    appendToFile(data)
  })
})

function sendToClients(data, incomingSocket) {
  // Send data to all connected and open wsServer clients.
  // incomingSocket: socket from companion on which data was received (undefined if using fetch POST)

  wsServer.clients.forEach(function each(client) {
    if (client!==incomingSocket && client.readyState===WebSocket.OPEN) {
      //console.log(`server.js: sending to a client at ${client.url}; data=${data}`);
      client.send(data);
    }
  });
}

function appendToFile(data) {
  // Unpack data object string and save as CSV.

  if (!fileStream.writable) {
    // Could possibly happen while file is being downloaded in response to GET request.
    console.log(`server.js appendToFile(): file isn't writable - dropping data batch`)
    return
  }

  let dataArray = JSON.parse(data)   // array of objects
  let recordArray, csvString
  dataArray.forEach(recordObject => {
    recordArray = Object.values(recordObject)
    csvString = String(recordArray[0])
    for (let i = 1; i < recordArray.length; i++) {
      csvString += ',' + recordArray[i]
    }
    fileStream.write(`${csvString}\n`)   // should check for success
  })
}
