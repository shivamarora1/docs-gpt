let lightMode = true;
let recorder = null;
let recording = false;
const responses = [];
const botRepeatButtonIDToIndexMap = {};
const userRepeatButtonIDToRecordingMap = {};
const baseUrl = window.location.origin

async function showBotLoadingAnimation() {
  await sleep(200);
  $(".loading-animation")[1].style.display = "inline-block";
  document.getElementById('send-button').disabled = true;
}

function hideBotLoadingAnimation() {
  $(".loading-animation")[1].style.display = "none";
  if(!isFirstMessage){
    document.getElementById('send-button').disabled = false;
  }
}

async function showUserLoadingAnimation() {
  await sleep(100);
  $(".loading-animation")[0].style.display = "flex";
}

function hideUserLoadingAnimation() {
  $(".loading-animation")[0].style.display = "none";
}


const processUserMessage = async (userMessage) => {
  let response = await fetch(baseUrl + "/process-message", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ userMessage: userMessage }),
  });
  response = await response.json();
  console.log(response);
  return response;
};

const cleanTextInput = (value) => {
  return value
    .trim() // remove starting and ending spaces
    .replace(/[\n\t]/g, "") // remove newlines and tabs
    .replace(/<[^>]*>/g, "") // remove HTML tags
    .replace(/[<>&;]/g, ""); // sanitize inputs
};

const sleep = (time) => new Promise((resolve) => setTimeout(resolve, time));

const scrollToBottom = () => {
  // Scroll the chat window to the bottom
  $("#chat-window").animate({
    scrollTop: $("#chat-window")[0].scrollHeight,
  });
};

const populateUserMessage = (userMessage, userRecording) => {
  // Clear the input field
  $("#message-input").val("");

  // Append the user's message to the message list
    $("#message-list").append(
      `<div class='message-line my-text'><div class='message-box my-text${
        !lightMode ? " dark" : ""
      }'><div class='me'>${userMessage}</div></div></div>`
    );

  scrollToBottom();
};

let isFirstMessage = true;

const populateBotResponse = async (userMessage) => {
  await showBotLoadingAnimation();

  let response;
  let uploadButtonHtml = '';

  if (isFirstMessage) {
    response = { botResponse: "Hello there! I'm your friendly data assistant, ready to answer any questions regarding your data. Could you please upload a TXT file for me to analyze?"};
    uploadButtonHtml = `
        <input type="file" id="file-upload" accept=".txt" hidden>
        <button id="upload-button" class="btn btn-primary btn-sm">Upload File</button>
    `;

  } else {
    response = await processUserMessage(userMessage);
  }

  renderBotResponse(response, uploadButtonHtml)

  // Event listener for file upload
  if (isFirstMessage) {
    $("#upload-button").on("click", function () {
      $("#file-upload").click();
    });

    $("#file-upload").on("change", async function () {
      const file = this.files[0];

      await showBotLoadingAnimation();

      const formData = new FormData();
      formData.append('file', file);

      let response = await fetch(baseUrl + "/extend_knowledge", {
        method: "POST",
        headers: { Accept: "application/json" }, // "Content-Type" should not be explicitly set here, the browser will automatically set it to "multipart/form-data"
        body: formData,
      });

      if (response.status !== 400) {
           document.querySelector('#upload-button').disabled = true;
      }

      response = await response.json();
      console.log('/process-document', response)
      renderBotResponse(response, '')
    });


    isFirstMessage = false;
  }
};

const renderBotResponse = (response, uploadButtonHtml) => {
  responses.push(response);

  hideBotLoadingAnimation();

  $("#message-list").append(
    `<div class='message-line'><div class='message-box${!lightMode ? " dark" : ""}'>${response.botResponse.trim()}<br>${uploadButtonHtml}</div></div>`
  );

  scrollToBottom();
}

populateBotResponse()


$(document).ready(function () {
  document.getElementById('send-button').disabled = true;
  $("#message-input").keyup(function (event) {
    let inputVal = cleanTextInput($("#message-input").val());

    if (event.keyCode === 13 && inputVal != "") {
      const message = inputVal;

      populateUserMessage(message, null);
      populateBotResponse(message);
    }

    inputVal = $("#message-input").val();
  });

  $("#send-button").click(async function () {
  const message = cleanTextInput($("#message-input").val());

  populateUserMessage(message, null);
  populateBotResponse(message);

  });

    $("#reset-button").click(async function () {
      $("#message-list").empty();

      responses.length = 0;
      isFirstMessage = true;

      document.querySelector('#upload-button').disabled = false;
      populateBotResponse();
    });


  $("#light-dark-mode-switch").change(function () {
    $("body").toggleClass("dark-mode");
    $(".message-box").toggleClass("dark");
    $(".loading-dots").toggleClass("dark");
    $(".dot").toggleClass("dark-dot");
    lightMode = !lightMode;
  });
});
