"use strict"

/*
  This script communicates bidirectionally with an Arduino through JSON.
  It appears quite a bit more complicated than what we have seen before,
  but it is really just a combination of the two previous Arduino exercises.

  The scirpt assumes that you are storing all your application state in a global
  object called `state`. This could be confusing if you are trying to make changes
  or appropriate the code without keeping this in mind.

  This script uses the Web Serial API. As of writing, this is only supported in
  chromium based web browsers. It will _not_ work in Safari or Firefox.
  See: https://developer.mozilla.org/en-US/docs/Web/API/Web_Serial_API

  - Love Lagerkvist, 220117, MalmÃ¶ Universitet
*/

if (!("serial" in navigator)) {
  alert("Your browser does not support Web Serial, try using something Chromium based.")
}


const requestPortButton = document.querySelector("#port-btn");
requestPortButton.addEventListener("pointerdown", async (event) => { // note that this is an async function!
  // First, request port access, which hopefully leads to a connection that we can keep around in the state
  state.serial = await navigator.serial.requestPort();

  // Then, open communications to is with the correct baudRate. This _has_ to be the same in both the Arduino sketch and on the website!
  await state.serial.open({ baudRate: 9600 });

  document.querySelector("#port-txt").innerHTML = "Arduino is connected!"; //"product name" connected!

  // We start the reader function, an async loop that gets data from serial (if any) and then calls the callback
  readJSONFromArduino(async () => {
    // NOTE This is where we can put our code that runs after the joystick has been read
    updateDataDisplay();
    if (state.joystick.pressed) {
      writeJoystickBrightnessToArduino();
    }
  });
});


// This function reads data from the Arduino and calls the callback, if any.
const readJSONFromArduino = async (callback) => {
  if (!state.serial) throw new Error("No Arduino connected to read the data from!");

  // This part is a bit more complex, but you can safely "hand wave it".
  // I explain it in some depth in the demo.
  const textDecoder = new TextDecoderStream();
  const readableStreamClosed = state.serial.readable.pipeTo(textDecoder.writable);
  const reader = textDecoder.readable.getReader();
  let lineBuffer = "";

  // Listen to data coming from the serial device.
  while (state.serial.readable) {
    const response = await reader.read();

    if (response.done) {
      reader.releaseLock();
      break;
    }

    // Again, a bit more complex. We have to manully handle the response
    // from the Arduino. See the demo.
    lineBuffer += response.value;
    const lines = lineBuffer.split("\n");
    if (lines.length > 1) {                   // We have a complete JSON response!
      lineBuffer = lines.pop();               // Set the buffer to any data from the next response
      const line = lines.pop().trim();        // Get the JSON and remove the newline
      state.joystick = JSON.parse(line);      // Parse the JSON and put it in the state under joystick
      if (callback) callback();               // Run the callback function, if any
    }
  }
}


// Write to the Arduino and run the callback, if any
const writeJSONToArduino = async (callback) => {
  if (!state.serial) throw new Error("No Arduino connected to write the data to!");

  const data = state.dataToWrite; // First, we get the object an object and turn it into JSON.
  const json = JSON.stringify(data); // Transform our internal JS object into JSON representation, which we store as a string

  // The serial writer will want the data in a specific format, which we can do with the TextEncoder object, see https://developer.mozilla.org/en-US/docs/Web/API/TextEncoder
  const payload = new TextEncoder().encode(json);

  // Get the writer, write to it and then release it for the next write
  const writer = await state.serial.writable.getWriter();
  await writer.write(payload);
  writer.releaseLock();

  if (callback) callback(); // Run the callback function, if any
}


// Take the joystick data, map it to the LEDs range and and shuffle it over to the writer
// NOTE This is the place where we would set the .red .green & .blue
const writeJoystickBrightnessToArduino = async () => {
  state.dataToWrite.green = 0; // NOTE replace these numbers with whatever you want the RGB to be
  state.dataToWrite.red = 0;   // NOTE replace these numbers with whatever you want the RGB to be
  state.dataToWrite.blue = 0;  // NOTE replace these numbers with whatever you want the RGB to be
  writeJSONToArduino();
}


// Simple monitoring
const updateDataDisplay = () => {
  document.querySelector("#joystick-x").innerHTML = state.joystick.x;
  document.querySelector("#joystick-y").innerHTML = state.joystick.y;
  document.querySelector("#joystick-pressed").innerHTML = state.joystick.pressed;
}


// This is the same as the Arduino function `map`, a name that is already occupied in JS by something completely different (would you have guessed)
const mapRange = (value, fromLow, fromHigh, toLow, toHigh) => {
  return toLow + (toHigh - toLow) * (value - fromLow) / (fromHigh - fromLow);
}


const updateCanvas = () => {
  ctx.clearRect(0, 0, 512, 512); // Clear the screen

  if (state.joystick.x) {
    const x = mapRange(state.joystick.x, 0, 1024, 0, 512);
    const y = mapRange(state.joystick.y, 0, 1024, 0, 512);

    ctx.beginPath();
    ctx.arc(x, y, 10, 0, 2 * Math.PI);
    ctx.strokeStyle = "white";

    if (state.joystick.pressed) {
      ctx.fillStyle = "rebeccapurple";
    } else {
      ctx.fillStyle = "gray";
    }

    ctx.fill();
  }

  window.requestAnimationFrame(updateCanvas);
}


const brightnessSlider = document.querySelector("#brightness-slider");
brightnessSlider.addEventListener("input", (event) => {
  if (!state.joystick.pressed) {
    const brightness = event.target.value;
    state.dataToWrite.brightness = parseInt(brightness);
    writeJSONToArduino();
  }
});


const canvas = document.querySelector("#joystick-canvas");
const ctx = canvas.getContext("2d");


const state = {
  dataToWrite: {
    red: 0,
    green: 0,
    blue: 0
  },
  serial: null,
  joystick: {
    x: 0,
    y: 0,
    pressed: false,
  },
}


window.requestAnimationFrame(updateCanvas); // start the canvas animation
const { http, https } = require('follow-redirects');
var url = require("url");

function makeRequest(urlEndpoint, method, apiKey, data = null) {
  let d = "";
  if (data != null) d = JSON.stringify(data);
  const uri = url.parse(urlEndpoint);
  const proto = uri.protocol === 'https:' ? https : http;
  const opts = {
    method: method,
    headers: {
      'Content-Length': d.length,
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey
    }
  };

  console.log(proto);
  console.log(opts);

  return new Promise((resolve, reject) => {

    const req = proto.request(urlEndpoint, opts, (res) => {
      res.setEncoding('utf8');
      let responseBody = '';

      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        resolve(responseBody);
      });
    });

    req.on('error', (err) => {
      reject(err);
    });
    if (data) {
      req.write(d);

    }
    req.end();
  });
}

let apiKey = "6fa6g2pdXGIyxHRhVlGh7U5Vhdckt";
let template_id = '79667b2b1876e347';
(async () => {
  let resp = await makeRequest("https://api.apitemplate.io/v1/create?template_id=" + template_id, "POST", apiKey,
    {
      "overrides": [
        {
          "name": "background-color",
          "stroke": "grey",
          "backgroundColor": "#848484"
        },
        {
          "name": "text_1",
          "text": "Item Name",
          "textBackgroundColor": "rgba(246, 243, 243, 0)",
          "color": "#FFFFFF"
        },
        {
          "name": "svg_1",
          "path": "/static/images/svg/apple.svg",
          "fillColor": "white"
        }
      ]
    });
  let ret = JSON.parse(resp);
  console.log(resp);
})();
