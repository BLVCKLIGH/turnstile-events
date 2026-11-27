document.addEventListener("DOMContentLoaded", () => {
  const upcoming = EVENTS.filter(e => eventStart(e) > Date.now());

  // Hero: the next big event with tickets left, as a ticket with a live countdown
  const feature = upcoming.filter(e => remaining(e) > 0).sort((a, b) => b.capacity - a.capacity).slice(0, 3)
    .sort((a, b) => eventStart(a) - eventStart(b))[0] || upcoming[0];
  if (feature) {
    $("#hero-ticket").innerHTML = `
      <article class="ticket hero-ticket" aria-label="Featured event">
        <div class="main">
          <img src="${feature.poster}" alt="" width="400" height="500">
          <div class="info">
            <div class="ev"><div class="kind">${catName(feature.cat)}</div></div>
            <h2>${esc(feature.name)}</h2>
            <p class="muted" style="margin-bottom:.9rem">${esc(feature.venue)}, ${esc(feature.city)}<br>${fmtLong(feature.date)}, ${feature.start}</p>
            <a class="btn btn-red btn-small" href="event.html?id=${feature.id}">Get tickets from ${R(feature.from)}</a>
          </div>
        </div>
        <div class="stub">
          <span class="wd">Starts in</span>
          <div class="countdown" id="hero-count" aria-live="off"></div>
        </div>
      </article>`;
    const tick = () => {
      const c = countdownParts(eventStart(feature));
      $("#hero-count").innerHTML = [["days", c.days], ["hrs", c.hours], ["min", c.mins], ["sec", c.secs]]
        .map(([l, v]) => `<div><strong>${String(v).padStart(2, "0")}</strong><span>${l}</span></div>`).join("");
    };
    tick(); setInterval(tick, 1000);
  }

  $("#upcoming-grid").innerHTML = upcoming.filter(e => e !== feature && remaining(e) > 0).slice(0, 6).map(eventTicket).join("");

  $("#cat-grid").innerHTML = CATEGORIES.map(c => {
    const n = upcoming.filter(e => e.cat === c.id).length;
    return `<a class="cat" href="events.html?cat=${c.id}"><h3>${c.name}</h3><span>${c.blurb}</span><span class="count">${n} ${n === 1 ? "event" : "events"}</span></a>`;
  }).join("");
});
