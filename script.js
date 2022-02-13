"use strict"

// OWEN: any comment line with "OWEN:" before the comment indicates my comments on the code that my group implemented during this project. - Owen Kern


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
  // OWEN: In this function, we have the logic for the joystick
  readJSONFromArduino(async () => {
    let hasMoved = false;
    // OWEN: if the joystick is less than a certain x value (aka moving to the left enough), then we turn the light red
    // OWEN: we set hasMoved to true so that this function doesn't keep taking inputs while the joystick is still in the left or right position.
    if (state.joystick.x < 200 && !hasMoved) {
      writeJoystickColorToArduinoLeft();
      hasMoved = true;
    } // OWEN: if the joystick is more than a certain x value (aka moving to the right enough), then we turn the light green
    else if (state.joystick.x > 800 && !hasMoved) {
      writeJoystickColorToArduinoRight();
      hasMoved = true;
    } // OWEN: if the joystick has moved back to the center, we must make hasMoved false to indicate that another movement can be made at this point. 
    else {
      hasMoved = false;
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
// OWEN: Assigns values from 0-255 to each color for the LED. In this case, giving 255 to green makes the LED shine green.
const writeJoystickColorToArduinoRight = async () => {
  state.dataToWrite.red = 0;   
  state.dataToWrite.green = 255; 
  state.dataToWrite.blue = 0;  
  writeJSONToArduino();
}

// Take the joystick data, map it to the LEDs range and and shuffle it over to the writer
// OWEN: Assigns values from 0-255 to each color for the LED. In this case, giving 255 to red makes the LED shine red.
const writeJoystickColorToArduinoLeft = async () => {
  state.dataToWrite.red = 255;
  state.dataToWrite.green = 0;
  state.dataToWrite.blue = 0;  
  writeJSONToArduino();
}

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

