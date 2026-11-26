const API_BASE = "https://api.tvmaze.com";
const detailsSection = document.getElementById("show-details");

// 1. GET: ask TVmaze for one specific series, identified by its ID
async function fetchShow(id) {
  const response = await fetch(`${API_BASE}/shows/${id}`);
  if (!response.ok) {
    throw new Error(`TVmaze returned status ${response.status}`);
  }
  return response.json();
}

// 2. DISPLAY: build the page content from the show data
function renderShow(show) {
  detailsSection.innerHTML = "";   // clear the old content (no user/API text involved)

  const title = document.createElement("h2");
  title.textContent = show.name;
  detailsSection.append(title);

  // Not every show has a poster, so check first
  if (show.image) {
    const poster = document.createElement("img");
    poster.src = show.image.medium;
    poster.alt = `Poster of ${show.name}`;
    detailsSection.append(poster);
  }

  const info = document.createElement("p");
  const rating = show.rating.average ?? "no rating";
  info.textContent = `${show.genres.join(", ")} · Rating: ${rating} · ${show.status}`;
  detailsSection.append(info);
}

// 3. COMBINE: show "Loading…", fetch, then display, or show an error message
async function loadShow(id) {
  detailsSection.textContent = "Loading…";
  try {
    const show = await fetchShow(id);
    renderShow(show);
  } catch (error) {
    console.error(error);
    detailsSection.textContent = "Sorry, this show could not be loaded.";
  }
}

loadShow(431);   // for now, a fixed ID (Friends); step 3 lets the user choose



