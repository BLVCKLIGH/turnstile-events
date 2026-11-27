/* Shared helpers for Turnstile. */
const Store = {
  get(k, d) { try { const v = localStorage.getItem("turnstile:" + k); return v === null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem("turnstile:" + k, JSON.stringify(v)); } catch { /* storage unavailable */ } },
};
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const R = n => n === 0 ? "Free" : "R" + Number(n).toLocaleString("en-ZA").replace(/,/g, " ");
const param = n => new URLSearchParams(location.search).get(n);
const catName = id => (CATEGORIES.find(c => c.id === id) || {}).name || id;
const eventStart = e => new Date(`${e.date}T${e.start}:00`);
const d8 = iso => new Date(iso + "T12:00:00");
const fmtLong = iso => d8(iso).toLocaleDateString("en-ZA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const fmtShort = iso => d8(iso).toLocaleDateString("en-ZA", { day: "numeric", month: "short" });

/* Tickets this browser has booked, so availability goes down after a booking */
function bookedBy(eventId) {
  return Store.get("bookings", []).filter(b => b.eventId === eventId).reduce((s, b) => s + b.qty, 0);
}
const remaining = e => Math.max(0, e.capacity - e.sold - bookedBy(e.id));

function countdownParts(target) {
  const ms = Math.max(0, target - Date.now());
  return { days: Math.floor(ms / 864e5), hours: Math.floor(ms / 36e5) % 24, mins: Math.floor(ms / 6e4) % 60, secs: Math.floor(ms / 1e3) % 60, done: ms === 0 };
}

const ICON = {
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
};

(function () {
  const saved = Store.get("theme", null);
  document.documentElement.dataset.theme = saved || (window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
})();

function renderChrome() {
  const page = document.body.dataset.page;
  const links = [["index.html", "Home", "home"], ["events.html", "All events", "events"], ["index.html#categories", "Categories", "cats"], ["my-tickets.html", "My tickets", "mine"]];
  const dark = document.documentElement.dataset.theme === "dark";
  const h = $("#site-header");
  if (h) h.outerHTML = `<header class="site-header"><a class="skip" href="#main">Skip to content</a>
    <nav class="nav wrap" aria-label="Main">
      <a class="logo" href="index.html"><img src="assets/posters/favicon.svg" alt="" width="30" height="30">Turnstile</a>
      <ul class="nav-links" id="nav-links">${links.map(([href, t, k]) => `<li><a href="${href}"${k === page ? ' aria-current="page"' : ""}>${t}</a></li>`).join("")}</ul>
      <div class="nav-actions">
        <button class="icon-btn" id="theme-btn" type="button" aria-label="${dark ? "Switch to light mode" : "Switch to dark mode"}">${dark ? ICON.sun : ICON.moon}</button>
        <button class="icon-btn menu-btn" id="menu-btn" type="button" aria-label="Open menu" aria-expanded="false" aria-controls="nav-links">${ICON.menu}</button>
      </div>
    </nav></header>`;
  const f = $("#site-footer");
  if (f) f.outerHTML = `<footer class="site-footer"><div class="wrap footer-grid">
      <div><a class="logo" href="index.html"><img src="assets/posters/favicon.svg" alt="" width="30" height="30">Turnstile</a>
        <p style="margin-top:1rem">Tickets for concerts, festivals, talks and workshops across South Africa.</p>
        <div class="socials">
          <a href="https://instagram.com" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/></svg></a>
          <a href="https://facebook.com" aria-label="Facebook"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M14 8h3V4h-3a4 4 0 0 0-4 4v2H8v4h2v8h4v-8h3l1-4h-4V8z"/></svg></a>
          <a href="https://x.com" aria-label="X"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.8 3h3.3l-7.2 8.2L22.4 21h-6.6l-5.2-6.8L4.7 21H1.4l7.7-8.8L1 3h6.8l4.7 6.2L17.8 3z"/></svg></a>
          <a href="https://linkedin.com" aria-label="LinkedIn"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4 3a2 2 0 1 1 0 4 2 2 0 0 1 0-4zM2 9h4v12H2zM9 9h4v1.7A4.5 4.5 0 0 1 17 9c3 0 5 2 5 5.5V21h-4v-6c0-1.7-.7-2.8-2.2-2.8-1.7 0-2.8 1.1-2.8 3V21H9z"/></svg></a>
        </div></div>
      <div><h3>Find events</h3><ul><li><a href="events.html">All events</a></li><li><a href="events.html?when=weekend">This weekend</a></li><li><a href="events.html?price=free">Free events</a></li></ul></div>
      <div><h3>Cities</h3><ul>${CITIES.map(c => `<li><a href="events.html?city=${encodeURIComponent(c)}">${c}</a></li>`).join("")}</ul></div>
      <div><h3>Help</h3><ul><li><a href="my-tickets.html">My tickets</a></li><li><a href="mailto:help@turnstile.co.za">help@turnstile.co.za</a></li><li>Refunds up to 7 days before the event</li></ul></div>
    </div><div class="wrap footer-bottom"><span>© ${new Date().getFullYear()} Turnstile. A demo project.</span><span>All prices in rand, including VAT and booking fees.</span></div></footer>`;
  $("#theme-btn").addEventListener("click", () => {
    const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next; Store.set("theme", next);
    $("#theme-btn").innerHTML = next === "dark" ? ICON.sun : ICON.moon;
    $("#theme-btn").setAttribute("aria-label", next === "dark" ? "Switch to light mode" : "Switch to dark mode");
  });
  $("#menu-btn").addEventListener("click", e => { const o = $("#nav-links").classList.toggle("open"); e.currentTarget.setAttribute("aria-expanded", o); });
}

function stubHTML(iso) {
  const d = d8(iso);
  return `<div class="stub" aria-hidden="true"><span class="mon">${d.toLocaleDateString("en-ZA", { month: "short" })}</span><span class="day">${d.getDate()}</span><span class="wd">${d.toLocaleDateString("en-ZA", { weekday: "short" })}</span></div>`;
}

function eventTicket(e) {
  const left = remaining(e);
  const pill = left === 0 ? `<span class="pill out">Sold out</span>` : left <= Math.max(10, e.capacity * 0.1) ? `<span class="pill">${left} left</span>` : e.from === 0 ? `<span class="pill free">Free</span>` : "";
  return `<article class="ticket ev">
    <div class="main">
      <img src="${e.poster}" alt="" loading="lazy" width="400" height="500">
      <div class="info">
        <div class="kind">${catName(e.cat)}</div>
        <h3><a href="event.html?id=${e.id}">${esc(e.name)}</a></h3>
        <p class="where">${esc(e.venue)}, ${esc(e.city)}<br>${fmtShort(e.date)} at ${e.start}</p>
        <p class="where" style="margin:0 0 .6rem">${esc(e.short)}</p>
        <div class="foot"><span class="price">${e.from === 0 ? "Free" : "From " + R(e.from)}</span>${pill}</div>
      </div>
    </div>
    ${stubHTML(e.date)}
  </article>`;
}

function toast(msg) {
  let t = $(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.textContent = msg; t.classList.add("show"); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove("show"), 3000);
}

document.addEventListener("DOMContentLoaded", renderChrome);
