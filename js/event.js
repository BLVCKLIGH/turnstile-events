document.addEventListener("DOMContentLoaded", () => {
  const e = EVENTS.find(x => x.id === Number(param("id")));
  const root = $("#root");
  if (!e) {
    root.innerHTML = `<div class="wrap" style="padding:4rem 0"><div class="empty"><h1 style="font-size:2.2rem">Event not found</h1><p class="muted">It may have been cancelled or the link is wrong.</p><a class="btn btn-ink" href="events.html">See all events</a></div></div>`;
    return;
  }
  document.title = `${e.name} | Turnstile`;
  const left = remaining(e), soldPct = Math.round(((e.capacity - left) / e.capacity) * 100);
  const past = eventStart(e) <= Date.now();
  const maxQty = Math.min(10, left);
  const qty = Object.fromEntries(e.tiers.map(t => [t.id, 0]));
  if (e.tiers.length === 1 && left > 0) qty[e.tiers[0].id] = 1;

  root.innerHTML = `
  <div class="detail-hero">
    <div class="wrap">
      <img src="${e.poster}" alt="Poster for ${esc(e.name)}" width="400" height="500">
      <div>
        <nav class="breadcrumb" aria-label="Breadcrumb"><a href="events.html">All events</a> / <a href="events.html?cat=${e.cat}">${catName(e.cat)}</a></nav>
        <div class="kind">${catName(e.cat)}</div>
        <h1>${esc(e.name)}</h1>
        <ul class="facts">
          <li><small>Date</small><strong>${fmtLong(e.date)}</strong></li>
          <li><small>Time</small><strong>${e.start} to ${e.end}</strong></li>
          <li><small>Venue</small><strong>${esc(e.venue)}, ${esc(e.city)}</strong></li>
          <li><small>Tickets</small><strong>${e.from === 0 ? "Free" : "From " + R(e.from)}</strong></li>
        </ul>
        ${past ? `<p><strong>This event has already happened.</strong></p>` : `<div class="hero-count" id="count" aria-label="Time until the event starts"></div>`}
      </div>
    </div>
  </div>
  <div class="wrap detail-body">
    <div>
      <section aria-labelledby="about-h"><h2 id="about-h">About this event</h2><p>${esc(e.about)}</p></section>
      <section aria-labelledby="sched-h"><h2 id="sched-h">Schedule</h2>
        <ol class="timeline">${e.schedule.map(([t, what]) => `<li><time>${t}</time>${esc(what)}</li>`).join("")}</ol>
      </section>
      <section aria-labelledby="venue-h"><h2 id="venue-h">Venue</h2>
        <div class="box"><h3>${esc(e.venue)}</h3><p style="margin:0">${esc(e.address)}</p>
          <a class="map-link" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(e.address)}" target="_blank" rel="noopener">Get directions in Google Maps</a></div>
      </section>
      <section aria-labelledby="org-h"><h2 id="org-h">Organiser</h2>
        <div class="box org"><span class="avatar" aria-hidden="true">${esc(e.organizer.name.split(" ").map(w => w[0]).join("").slice(0, 2))}</span>
          <div><h3 style="margin-bottom:.25rem">${esc(e.organizer.name)}</h3><p style="margin-bottom:.4rem">${esc(e.organizer.about)}</p><a href="mailto:${e.organizer.email}">${e.organizer.email}</a></div></div>
      </section>
      <section aria-labelledby="info-h"><h2 id="info-h">Ticket information</h2>
        <ul><li>Tickets are sent by email and saved under My tickets. Show the code on your phone at the entrance.</li>
        <li>Refunds are available up to 7 days before the event.</li><li>Maximum 10 tickets per booking.</li></ul>
      </section>
    </div>
    <aside class="box buy" aria-labelledby="buy-h">
      <h2 id="buy-h" style="font-size:1.6rem">Tickets</h2>
      <div class="meter" aria-hidden="true"><span style="width:${soldPct}%"></span></div>
      <p class="muted" style="font-size:.92rem">${left === 0 ? "Sold out" : `${left} of ${e.capacity} tickets left`}</p>
      <div id="tiers">${e.tiers.map(t => `
        <div class="tier">
          <div><div class="name">${esc(t.name)}</div><div class="muted">${R(t.price)}</div></div>
          <div class="stepper" role="group" aria-label="${esc(t.name)} quantity">
            <button type="button" data-dec="${t.id}" aria-label="One fewer ${esc(t.name)}">−</button>
            <output id="q-${t.id}" aria-live="polite">${qty[t.id]}</output>
            <button type="button" data-inc="${t.id}" aria-label="One more ${esc(t.name)}">+</button>
          </div>
        </div>`).join("")}</div>
      <div class="buy-total"><span>Total</span><strong id="total">R0</strong></div>
      <button class="btn btn-red btn-block" id="go" type="button">Continue to booking</button>
      <p class="error" id="buy-err" role="alert" style="margin-top:.6rem"></p>
    </aside>
  </div>`;

  if (!past) {
    const tick = () => {
      const c = countdownParts(eventStart(e));
      $("#count").innerHTML = [["days", c.days], ["hours", c.hours], ["minutes", c.mins], ["seconds", c.secs]].map(([l, v]) => `<div><strong>${String(v).padStart(2, "0")}</strong><span>${l}</span></div>`).join("");
    };
    tick(); setInterval(tick, 1000);
  }

  const totalQty = () => Object.values(qty).reduce((a, b) => a + b, 0);
  function refresh() {
    e.tiers.forEach(t => { $("#q-" + t.id).textContent = qty[t.id]; });
    $$("[data-inc]").forEach(b => (b.disabled = past || totalQty() >= maxQty));
    $$("[data-dec]").forEach(b => (b.disabled = qty[b.dataset.dec] === 0));
    const sum = e.tiers.reduce((s, t) => s + t.price * qty[t.id], 0);
    $("#total").textContent = totalQty() && sum === 0 ? "Free" : R(sum).replace("Free", "R0");
    $("#go").disabled = past || left === 0;
    $("#go").textContent = left === 0 ? "Sold out" : past ? "Event has ended" : "Continue to booking";
  }
  $("#tiers").addEventListener("click", ev => {
    const inc = ev.target.closest("[data-inc]"), dec = ev.target.closest("[data-dec]");
    if (inc && totalQty() < maxQty) qty[inc.dataset.inc]++;
    if (dec && qty[dec.dataset.dec] > 0) qty[dec.dataset.dec]--;
    $("#buy-err").textContent = "";
    refresh();
  });
  $("#go").addEventListener("click", () => {
    if (!totalQty()) { $("#buy-err").textContent = "Choose at least one ticket."; return; }
    const sel = Object.entries(qty).filter(([, n]) => n > 0).map(([id, n]) => `${id}:${n}`).join(",");
    location.href = `book.html?id=${e.id}&t=${encodeURIComponent(sel)}`;
  });
  refresh();
});
