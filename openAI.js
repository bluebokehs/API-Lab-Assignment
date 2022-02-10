"use strict";

/* This script communicates with the OpenAI API using POST requests.
   It sends a single, preset request and gets us a response back.

   You will have to provide your own API key for this to work,
   see the variable "openAIKey". Get a key: https://openai.com/api/

   - Love Lagerkvist, 220110, Malmö Universitet
 */


const openAIKey = "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";
if (openAIKey.length === 0) {
  alert("You need to enter an API or your request will fail.")
}


/* Generic function to call an API, returns the response as JSON.
   Assumes no knowledge of the resource it is trying to find behind the URL.
   Expects the URL to be fully prepared with any search params.
   Errors on response errors. */
const JSONRequest = async (url, options, callback) => {
  const response = await fetch(url, options);

  if (response.ok) {
    const json = await response.json();
    callback(json);
  } else {
    const errorMessage = `An error has occured: ${response.status}`;
    throw new Error(errorMessage);
  }
}

/* This is where we provide the information required by the OpenAI API
   We need to provide an URL of the resource we are fetching,
   some JSON with the input that we have been specified to send. */

const url = new URL("https://api.openai.com/v1/engines/text-davinci-001/completions");

const responseBody = {
  prompt: "Create a yes or no question",
};

const options = {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + openAIKey,
  },
  body: JSON.stringify(responseBody),
}


/* `state` is just an object that we use to keep track
   of all of our application state. In this example, we
   only have one property, `reponses`, but you could image
   adding more properties to model the user interaction. */
const state = {
  responses: [],
}

/* Check the console to see the returned JSON/object
   It might take a second to get the response from
   the OpenAI api as it has to generate the response. */
JSONRequest(url, options, (data => {
  state.responses.push(data);
  console.dir(data);
  const hello = document.getElementById("response");
  const responseFromAPI = data.choices[0].text;
  hello.innerHTML = responseFromAPI;
}));