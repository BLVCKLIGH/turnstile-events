/* Confirmation page and My tickets page */

// A deterministic, QR-style pattern drawn from the booking reference. Illustrative only; it is not a scannable QR code.
function codeSVG(text) {
  let h = 2166136261;
  for (const ch of text) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  const rnd = () => { h ^= h << 13; h ^= h >>> 17; h ^= h << 5; return ((h >>> 0) % 1000) / 1000; };
  const N = 21, cells = [];
  const finder = (x, y) => [[0, 0], [N - 7, 0], [0, N - 7]].some(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
  for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!finder(x, y) && rnd() > .52) cells.push(`<rect x="${x}" y="${y}" width="1" height="1"/>`);
  const box = (x, y) => `<rect x="${x}" y="${y}" width="7" height="7"/><rect x="${x + 1}" y="${y + 1}" width="5" height="5" fill="#fff"/><rect x="${x + 2}" y="${y + 2}" width="3" height="3"/>`;
  return `<svg class="code" viewBox="0 0 ${N} ${N}" shape-rendering="crispEdges" role="img" aria-label="Entry code for ${text}"><g fill="#1c2a5a">${box(0, 0)}${box(N - 7, 0)}${box(0, N - 7)}${cells.join("")}</g></svg>`;
}

function icsFor(b, e) {
  const dt = (d, t) => d.replace(/-/g, "") + "T" + t.replace(":", "") + "00";
  const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Turnstile//Tickets//EN", "BEGIN:VEVENT",
    `UID:${b.ref}@turnstile.co.za`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").slice(0, 15)}Z`,
    `DTSTART;TZID=Africa/Johannesburg:${dt(e.date, e.start)}`, `DTEND;TZID=Africa/Johannesburg:${dt(e.date, e.end < e.start ? "23:59" : e.end)}`,
    `SUMMARY:${e.name}`, `LOCATION:${e.venue}, ${e.address}`, `DESCRIPTION:Booking ${b.ref}. ${b.qty} ticket(s).`, "END:VEVENT", "END:VCALENDAR"].join("\r\n");
  return URL.createObjectURL(new Blob([body], { type: "text/calendar" }));
}

function eTicket(b, e) {
  const methods = { card: `Card ending ${b.card}`, eft: "Instant EFT", snapscan: "SnapScan", free: "Free registration" };
  return `<article class="ticket e-ticket" aria-label="Ticket for ${esc(e.name)}">
    <div class="main">
      <img src="${e.poster}" alt="">
      <div class="info">
        <div class="ev"><div class="kind">${catName(e.cat)}</div></div>
        <h2>${esc(e.name)}</h2>
        <dl>
          <dt>Date</dt><dd>${fmtLong(e.date)}</dd>
          <dt>Time</dt><dd>${e.start} (doors may open earlier)</dd>
          <dt>Venue</dt><dd>${esc(e.venue)}, ${esc(e.city)}</dd>
          <dt>Tickets</dt><dd>${b.lines.map(l => `${l.qty} × ${esc(l.name)}`).join(", ")}</dd>
          <dt>Name</dt><dd>${esc(b.name)}</dd>
          <dt>Paid</dt><dd>${b.total === 0 ? "Free" : R(b.total)}, ${methods[b.method] || b.method}</dd>
        </dl>
      </div>
    </div>
    <div class="stub">${codeSVG(b.ref)}<div class="ref">${esc(b.ref)}</div><span class="wd">Show at the entrance</span></div>
  </article>`;
}

document.addEventListener("DOMContentLoaded", () => {
  const bookings = Store.get("bookings", []);

  // Confirmation page
  if ($("#root")) {
    const b = bookings.find(x => x.ref === param("ref"));
    const e = b && EVENTS.find(x => x.id === b.eventId);
    if (!b || !e) {
      $("#root").innerHTML = `<div class="empty" style="width:100%"><h1 style="font-size:2.2rem">Booking not found</h1><p class="muted">Bookings are stored in the browser you booked with. Check My tickets there.</p><a class="btn btn-ink" href="my-tickets.html">My tickets</a></div>`;
      return;
    }
    document.title = `Tickets for ${e.name} | Turnstile`;
    $("#root").innerHTML = `
      <div class="success-head">
        <div class="tick" aria-hidden="true"><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m5 12 5 5 9-10"/></svg></div>
        <h1 style="font-size:clamp(2rem,4.5vw,3.2rem)">You're going to ${esc(e.name)}</h1>
        <p class="muted" style="margin-inline:auto">We've emailed your tickets to ${esc(b.email)}. They're also saved under My tickets.</p>
      </div>
      ${eTicket(b, e)}
      <div class="confirm-actions">
        <a class="btn btn-ink" id="ics" download="${e.slug}.ics" href="#">Add to calendar</a>
        <button class="btn btn-line" type="button" onclick="window.print()">Print tickets</button>
        <a class="btn btn-line" href="events.html">Find more events</a>
      </div>`;
    $("#ics").href = icsFor(b, e);
    return;
  }

  // My tickets page
  const root = $("#mine");
  const render = () => {
    const list = Store.get("bookings", []);
    if (!list.length) {
      root.innerHTML = `<div class="empty"><h2>No tickets yet</h2><p class="muted">When you book an event, your tickets appear here.</p><a class="btn btn-red" href="events.html">Find an event</a></div>`;
      return;
    }
    const withEv = list.map(b => ({ b, e: EVENTS.find(x => x.id === b.eventId) })).filter(x => x.e);
    const up = withEv.filter(x => eventStart(x.e) > Date.now()), past = withEv.filter(x => eventStart(x.e) <= Date.now());
    const card = ({ b, e }) => `<article class="ticket ev">
        <div class="main"><img src="${e.poster}" alt="">
          <div class="info"><div class="kind">${esc(b.ref)}</div><h3><a href="confirmation.html?ref=${encodeURIComponent(b.ref)}">${esc(e.name)}</a></h3>
            <p class="where">${esc(e.venue)}, ${esc(e.city)}<br>${fmtShort(e.date)} at ${e.start}</p>
            <div class="foot"><span class="price">${b.qty} ${b.qty === 1 ? "ticket" : "tickets"}</span><span class="muted">${b.total === 0 ? "Free" : R(b.total)}</span></div></div></div>
        ${stubHTML(e.date)}</article>`;
    root.innerHTML = `<h2>Upcoming</h2>${up.length ? `<div class="event-grid">${up.map(card).join("")}</div>` : `<p class="muted">No upcoming events.</p>`}
      ${past.length ? `<h2 style="margin-top:2.5rem">Past events</h2><div class="event-grid">${past.map(card).join("")}</div>` : ""}`;
  };
  render();
});
