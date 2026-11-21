
// Find the elements on the page we want to update
const timeEl = document.getElementById("time");
const greetingEl = document.getElementById("greeting");
const nameForm = document.getElementById("name-form");
const nameInput = document.getElementById("name-input");

function updateClock() {
  const now = new Date();

  // Clock: add a leading zero so 9:5 shows as 09:05
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  timeEl.textContent = `${hours}:${minutes}`;

  // Greeting depends on the hour (0-23)
  const hour = now.getHours();
  let greeting;
  if (hour < 12) {
    greeting = "Good morning";
  } else if (hour < 18) {
    greeting = "Good afternoon";
  } else {
    greeting = "Good evening";
  }
  const name = localStorage.getItem("userName");
  if (name) {
    greetingEl.textContent = `${greeting}, ${name}.`;
  } else {
    greetingEl.textContent = greeting;
  }
}

updateClock();                   // run once immediately...
setInterval(updateClock, 1000);  // ...then every second
// Show the name form only if no name has been saved yet
if (localStorage.getItem("userName") === null) {
  nameForm.hidden = false;
}

// When the user presses Enter in the form: save the name
nameForm.addEventListener("submit", function (event) {
  event.preventDefault();               // stop the page from reloading
  const name = nameInput.value.trim();  // trim() removes spaces at the start/end
  if (name === "") {
    return;                             // ignore empty names
  }
  localStorage.setItem("userName", name);
  nameForm.hidden = true;
  updateClock();                        // update the greeting straight away
});

// Double-click the greeting to change the name
greetingEl.addEventListener("dblclick", function () {
  nameInput.value = localStorage.getItem("userName") || "";
  nameForm.hidden = false;
  nameInput.focus();                    // put the cursor in the box
});
