const API_BASE = "https://api.tvmaze.com";
const DEFAULT_SHOW_ID = "431";   // Friends, shown when no ID is in the URL

const detailsSection = document.getElementById("show-details");
const idForm = document.getElementById("id-form");
const idInput = document.getElementById("id-input");
const formMessage = document.getElementById("form-message");
const searchForm = document.getElementById("search-form");
const searchInput = document.getElementById("search-input");
const resultsSection = document.getElementById("search-results");


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

// The TV network or streaming service of a show
function channelName(show) {
  return show.network?.name ?? show.webChannel?.name ?? "Unknown channel";
}


// ---------- 1. GET ----------

async function fetchShow(id) {
    const response = await fetch(`${API_BASE}/shows/${id}?embed[]=seasons&embed[]=cast`);
  if (!response.ok) {
    throw new Error(`TVmaze returned status ${response.status}`);
  }
  return response.json();
}

// Search by name: returns a list of shows (TVmaze gives at most 10)
async function searchShows(query) {
  const response = await fetch(`${API_BASE}/search/shows?q=${encodeURIComponent(query)}`);
  if (!response.ok) {
    throw new Error(`TVmaze returned status ${response.status}`);
  }
  const results = await response.json();      // [{ score, show }, ...]
  return results.map(result => result.show);  // keep only the shows
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
  const runtime = show.averageRuntime ? `${show.averageRuntime} min` : "runtime unknown";
  const meta = makeElement("p", `${start}–${end} · ${channelName(show)} · ${show.language ?? "Unknown language"} · ${runtime}`);
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

  // Extra data from the same request (embed)
  detailsSection.append(renderSeasons(show._embedded?.seasons ?? []));
  detailsSection.append(renderCast(show._embedded?.cast ?? []));
}

// Seasons table: number, episode count, air dates
function renderSeasons(seasons) {
  const section = makeElement("section");
  section.className = "extra-section";
  section.append(makeElement("h3", `Seasons (${seasons.length})`));

  if (seasons.length === 0) {
    section.append(makeElement("p", "No season information available."));
    return section;
  }

  const table = makeElement("table");
  const headerRow = makeElement("tr");
  for (const heading of ["Season", "Episodes", "Aired"]) {
    headerRow.append(makeElement("th", heading));
  }
  table.append(headerRow);

  for (const season of seasons) {
    const row = makeElement("tr");
    const label = season.name ? `Season ${season.number} – ${season.name}` : `Season ${season.number}`;
    row.append(makeElement("td", label));
    row.append(makeElement("td", season.episodeOrder ?? "?"));
    row.append(makeElement("td", `${season.premiereDate ?? "?"} → ${season.endDate ?? "?"}`));
    table.append(row);
  }

  section.append(table);
  return section;
}

// Cast grid: photo, actor name, character (first 12 only)
function renderCast(cast) {
  const section = makeElement("section");
  section.className = "extra-section";
  section.append(makeElement("h3", "Cast"));

  if (cast.length === 0) {
    section.append(makeElement("p", "No cast information available."));
    return section;
  }

  const grid = makeElement("div");
  grid.className = "card-grid";

  for (const member of cast.slice(0, 12)) {
    const card = makeElement("div");
    card.className = "cast-card";

    if (member.person.image) {
      const photo = makeElement("img");
      photo.src = member.person.image.medium;
      photo.alt = member.person.name;
      card.append(photo);
    } else {
      const placeholder = makeElement("div", "No photo");
      placeholder.className = "no-image";
      card.append(placeholder);
    }

    card.append(makeElement("strong", member.person.name));
    card.append(makeElement("span", `as ${member.character.name}`));
    grid.append(card);
  }

  section.append(grid);
  if (cast.length > 12) {
    section.append(makeElement("p", `Showing 12 of ${cast.length} cast members.`));
  }
  return section;
}

// One clickable card for a search result
function makeShowCard(show) {
  const card = makeElement("a");
  card.className = "show-card";
  card.href = `?id=${show.id}`;   // a real link: Ctrl+click opens it in a new tab

  if (show.image) {
    const poster = makeElement("img");
    poster.src = show.image.medium;
    poster.alt = `Poster of ${show.name}`;
    card.append(poster);
  } else {
    const placeholder = makeElement("div", "No image");
    placeholder.className = "no-image";
    card.append(placeholder);
  }

  const year = show.premiered ? show.premiered.slice(0, 4) : "?";
  card.append(makeElement("strong", show.name));
  card.append(makeElement("span", `${year} · ${channelName(show)}`));

  // A normal click opens the show inside the page
  card.addEventListener("click", function (event) {
    event.preventDefault();
    openShow(String(show.id));
    detailsSection.scrollIntoView({ behavior: "smooth" });
  });

  return card;
}

function renderResults(shows, query) {
  resultsSection.innerHTML = "";   // clear (no API text involved)

  if (shows.length === 0) {
    resultsSection.append(makeElement("p", `No shows found for "${query}".`));
    return;
  }

  resultsSection.append(makeElement("h2", `Results for "${query}"`));
  const grid = makeElement("div");
  grid.className = "card-grid";
  for (const show of shows) {
    grid.append(makeShowCard(show));
  }
  resultsSection.append(grid);
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

// Search form
searchForm.addEventListener("submit", async function (event) {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (query === "") {
    resultsSection.textContent = "Please type a show name.";
    return;
  }

  resultsSection.textContent = "Searching…";
  try {
    const shows = await searchShows(query);
    renderResults(shows, query);
  } catch (error) {
    console.error(error);
    resultsSection.textContent = "Sorry, the search failed. Please try again.";
  }
});

// ID form: digits only
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