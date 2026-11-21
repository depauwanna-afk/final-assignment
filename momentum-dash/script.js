// Find the elements on the page we want to update
const timeEl = document.getElementById("time");
const greetingEl = document.getElementById("greeting");

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
  greetingEl.textContent = greeting;
}

updateClock();                   // run once immediately...
setInterval(updateClock, 1000);  // ...then every second
