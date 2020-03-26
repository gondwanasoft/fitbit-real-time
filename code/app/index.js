// Version: hsdv (heart-rate, socket, DoryNode, view)

import { me } from "appbit"
import document from "document"
import { HeartRateSensor } from "heart-rate"
import * as messaging from "messaging"

const hrEl = document.getElementById('hr')
const timeEl = document.getElementById('time')

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

if (HeartRateSensor) {
  const hrm = new HeartRateSensor({ frequency: 1 })
  hrm.addEventListener("reading", () => {
    // Although it isn’t necessary, we display the reading and timestamp on the watch’s display.
    // You may not want to do this in a production environment, but you'll probably need to provide
    // some visual incentive for the user to keep this app running.
    hrEl.text = hrm.heartRate
    timeEl.text = hrm.timestamp

    // Send data (as an object) to companion:
    if (messaging.peerSocket.readyState === messaging.peerSocket.OPEN) {
      messaging.peerSocket.send({hr:hrm.heartRate, time:hrm.timestamp})
    } else {
      console.warn('Messaging socket not open')  // some instances of this are to be expected initially
    }
  })
  hrm.start()
}