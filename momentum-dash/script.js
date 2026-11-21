
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
// ===== To-do list =====
const todoList = document.getElementById("todo-list");
const todoForm = document.getElementById("todo-form");
const todoInput = document.getElementById("todo-input");

// Load saved to-dos, or start with an empty list if none are saved
let todos = JSON.parse(localStorage.getItem("todos")) || [];

function saveTodos() {
  localStorage.setItem("todos", JSON.stringify(todos));
}

// Redraw the whole list from the todos array
function renderTodos() {
  todoList.innerHTML = "";   // clear the current list

  todos.forEach(function (todo, index) {
    const li = document.createElement("li");
    if (todo.done) {
      li.classList.add("done");
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;
    checkbox.addEventListener("change", function () {
      todos[index].done = checkbox.checked;
      saveTodos();
      renderTodos();
    });

    const text = document.createElement("span");
    text.textContent = todo.text;   // textContent = safe for user input

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "✕";
    deleteButton.addEventListener("click", function () {
      todos.splice(index, 1);       // remove 1 item at this position
      saveTodos();
      renderTodos();
    });

    li.append(checkbox, text, deleteButton);
    todoList.appendChild(li);
  });
}

// Add a new to-do when the user presses Enter
todoForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const text = todoInput.value.trim();
  if (text === "") {
    return;
  }
  todos.push({ text: text, done: false });
  todoInput.value = "";   // empty the box for the next one
  saveTodos();
  renderTodos();
});

renderTodos();   // show saved to-dos when the page opens
// ===== Background image (data from the Lorem Picsum API) =====
const photoCredit = document.getElementById("photo-credit");

async function loadBackground() {
  try {
    // Ask the API for a list of 30 photos from a random page (1-10)
    const page = Math.floor(Math.random() * 10) + 1;
    const response = await fetch(`https://picsum.photos/v2/list?page=${page}&limit=30`);

    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }

    const photos = await response.json();   // turn the JSON text into an array
    const photo = photos[Math.floor(Math.random() * photos.length)];

    // Request the chosen photo at screen size (the originals are huge)
    const imageUrl = `https://picsum.photos/id/${photo.id}/1920/1080`;

    // A semi-transparent dark layer on top of the photo keeps the text readable
    document.body.style.backgroundImage =
      `linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url("${imageUrl}")`;

    photoCredit.textContent = `Photo by ${photo.author}`;
  } catch (error) {
    // If anything fails, keep the plain background colour from style.css
    console.error("Could not load background image:", error);
  }
}

loadBackground();
