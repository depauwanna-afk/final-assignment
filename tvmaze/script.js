const API_BASE = "https://api.tvmaze.com";
const DEFAULT_SHOW_ID = "431";   // Friends, shown when no ID is in the URL

const detailsSection = document.getElementById("show-details");
const idForm = document.getElementById("id-form");
const idInput = document.getElementById("id-input");
const formMessage = document.getElementById("form-message");


// ---------- Helpers ----------

// Turn the HTML summary from TVmaze into plain text, without running any of it
function htmlToText(html) {
  const doc = new DOMParser().parseFromString(html ?? "", "text/html");
  return doc.body.textContent.trim();
}

// Only allow normal web links (blocks things like "javascript:...")
function isSafeLink(url) {
  return typeof url === "string" && /^https?:\/\//.test(url);
}

// Create an element with optional text, in one line
function makeElement(tag, text) {
  const element = document.createElement(tag);
  if (text !== undefined) {
    element.textContent = text;
  }
  return element;
}


// ---------- 1. GET ----------

async function fetchShow(id) {
  const response = await fetch(`${API_BASE}/shows/${id}`);
  if (!response.ok) {
    throw new Error(`TVmaze returned status ${response.status}`);
  }
  return response.json();
}


// ---------- 2. DISPLAY ----------

function renderShow(show) {
  detailsSection.innerHTML = "";   // clear (no API text involved)
  document.title = `${show.name} – TV Show Explorer`;

  const layout = makeElement("div");
  layout.className = "show-layout";

  // Left: poster
  if (show.image) {
    const poster = makeElement("img");
    poster.src = show.image.medium;
    poster.alt = `Poster of ${show.name}`;
    layout.append(poster);
  }

  // Right: information
  const info = makeElement("div");
  info.append(makeElement("h2", show.name));

  const rating = show.rating.average ?? "no rating";
  info.append(makeElement("p", `${show.genres.join(", ") || "No genres"} · Rating: ${rating} · ${show.status}`));

  // Years, e.g. "1994–2004" or "2019–present"
  const start = show.premiered ? show.premiered.slice(0, 4) : "?";
  const end = show.ended ? show.ended.slice(0, 4) : "present";
  const channel = show.network?.name ?? show.webChannel?.name ?? "Unknown channel";
  const runtime = show.averageRuntime ? `${show.averageRuntime} min` : "runtime unknown";
  const meta = makeElement("p", `${start}–${end} · ${channel} · ${show.language ?? "Unknown language"} · ${runtime}`);
  meta.className = "show-meta";
  info.append(meta);

  // Summary: HTML from the API, converted to plain text
  info.append(makeElement("p", htmlToText(show.summary) || "No summary available."));

  // Official site, only if it is a normal web link
  if (isSafeLink(show.officialSite)) {
    const link = makeElement("a", "Official website");
    link.href = show.officialSite;
    link.target = "_blank";
    link.rel = "noopener";
    info.append(link);
  }

  const idNote = makeElement("p", `TVmaze ID: ${show.id}`);
  idNote.className = "show-meta";
  info.append(idNote);

  layout.append(info);
  detailsSection.append(layout);
}


// ---------- 3. COMBINE ----------

async function loadShow(id) {
  detailsSection.textContent = "Loading…";
  try {
    const show = await fetchShow(id);
    renderShow(show);
  } catch (error) {
    console.error(error);
    detailsSection.textContent = `Sorry, no show could be loaded for ID ${id}.`;
  }
}


// ---------- The ID in the page address ----------

// Read ?id=... from the address, or use the default
function getIdFromUrl() {
  const id = new URLSearchParams(window.location.search).get("id");
  return /^\d+$/.test(id ?? "") ? id : DEFAULT_SHOW_ID;
}

// Open a show: put its ID in the address and load it
function openShow(id) {
  history.pushState({}, "", `?id=${id}`);
  loadShow(id);
}


// ---------- Events ----------

// The ID form: digits only
idForm.addEventListener("submit", function (event) {
  event.preventDefault();
  const id = idInput.value.trim();
  if (!/^\d+$/.test(id)) {
    formMessage.textContent = "Please enter a number, e.g. 431.";
    return;
  }
  formMessage.textContent = "";
  openShow(id);
});

// The browser's Back/Forward buttons: load the show for that address
window.addEventListener("popstate", function () {
  loadShow(getIdFromUrl());
});

// On page load: open the show from the address (or the default)
loadShow(getIdFromUrl());
