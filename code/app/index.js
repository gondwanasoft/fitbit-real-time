// Version: asdv (accelerometer, socket, DoryNode, view)

import { Accelerometer } from "accelerometer"
import { me } from "appbit"
import document from "document"
import * as messaging from "messaging"

const accelXEl = document.getElementById('accelX')
const accelYEl = document.getElementById('accelY')
const accelZEl = document.getElementById('accelZ')
const timeEl = document.getElementById('time')
const accel           // Accelerometer sensor
const dataBuffer
const dataBufferView  // lets us store Int16 values in dataBuffer
let bufferIndex = 0   // position of next value to write to the messaging data buffer via dataBufferView

me.appTimeoutEnabled = false

messaging.peerSocket.onopen = function() {
  console.log("Messaging open")
}

messaging.peerSocket.onclose = function(evt) {
  console.log(`Messaging closed: ${evt.code}`)
}

messaging.peerSocket.onerror = function(evt) {
  console.log(`Messaging error: ${evt.code}: ${evt.message}`)
}

if (Accelerometer) {
  const valuesPerRecord = 4                     // x, y, z, time
  const bytesPerRecord = valuesPerRecord * 2    // 2 because values are Int16 (2 bytes) each
  const readingsPerBatch = 10                   // should be okay up to about 127
  const bytesPerBatch = bytesPerRecord * readingsPerBatch
  if (bytesPerBatch > 1024) {
    throw 'dataBuffer is too large for messaging'
  }
  const lastReadingInBatch = readingsPerBatch - 1
  const frequency = 100                         // Hz
  dataBuffer = new ArrayBuffer(bytesPerBatch)
  dataBufferView = new Int16Array(dataBuffer)
  accel = new Accelerometer({ frequency: frequency, batch: readingsPerBatch })
  accel.addEventListener("reading", () => {
    // Put data into a single Int16 array for faster messaging.
    // To wedge the timestamp into an Int16, we'll only send the lowest 15 bits. The companion will correct for this.
    for (let i = 0; i < readingsPerBatch; i++) {
      addReading(accel.readings.x[i] * 1000, accel.readings.y[i] * 1000, accel.readings.z[i] * 1000, accel.readings.timestamp[i] & 32767)
    }

    // Display the last reading:
    accelXEl.text = accel.readings.x[lastReadingInBatch].toFixed(3)
    accelYEl.text = accel.readings.y[lastReadingInBatch].toFixed(3)
    accelZEl.text = accel.readings.z[lastReadingInBatch].toFixed(3)
    timeEl.text = accel.readings.timestamp[lastReadingInBatch]
    // Time value won't agree with other devices because this is the original value rather than an Int16 reconstruction.
  })
  accel.start()
} else {
  console.log("This device doesn't have an accelerometer")
}

function addReading(x, y, z, time) {
  // Adds a reading to the data buffer. If the buffer is full, sends the buffer and empties it.
  dataBufferView[bufferIndex++] = x
  dataBufferView[bufferIndex++] = y
  dataBufferView[bufferIndex++] = z
  dataBufferView[bufferIndex++] = time

  if (bufferIndex >= dataBufferView.length) {
    // Buffer is full: send it to companion and empty it.
    //console.log(`addReading(): buffered amount = ${messaging.peerSocket.bufferedAmount}`)
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
      if (messaging.peerSocket.bufferedAmount < 1000) {
        messaging.peerSocket.send(dataBuffer)
        //console.log(`addReading(): sent a batch`)
      } else {
        console.error("Messaging isn't keeping up - data dropped")
      }
    } else {
      console.warn('Messaging socket not open')     // some instances of this are to be expected initially
    }

    // Reset buffer for next batch:
    bufferIndex = 0
  }
}