"use strict";

// OWEN:This script sets up OpenAI and prompts the AI to create a yes or no question.


const openAIKey = "insert API key here";
if (openAIKey.length === 0) {
  alert("You need to enter an API or your request will fail.")
}


/* OWEN: This is a standard call to the API and it 
returns the response in JSON format.*/
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

/* OWEN: This is where we create parameters that the AI 
needs in order to function correctly. */

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


/* OWEN: this is simply all of the responses that are 
currently being used. */
const state = {
  responses: [],
}

/* OWEN: This function sets the text of the paragraph 
  with the id "response" to the response that the AI comes back 
  with and displays it on the screen. */
JSONRequest(url, options, (data => {
  state.responses.push(data);
  console.dir(data);
  const responseUI = document.getElementById("response");
  const responseFromAPI = data.choices[0].text;
  responseUI.innerHTML = responseFromAPI;
}));