document.addEventListener("DOMContentLoaded", () => {
  let cat = param("cat") || "";
  $("#city").innerHTML += CITIES.map(c => `<option>${c}</option>`).join("");
  if (param("q")) $("#q").value = param("q");
  if (param("city")) $("#city").value = param("city");
  if (param("when")) $("#when").value = param("when");
  if (param("price")) $("#price").value = param("price");

  const chips = [{ id: "", name: "All" }, ...CATEGORIES];
  const drawChips = () => {
    $("#chips").innerHTML = chips.map(c => `<button class="chip" type="button" data-cat="${c.id}" aria-pressed="${c.id === cat}">${c.name}</button>`).join("");
  };
  drawChips();

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const daysAway = e => Math.round((d8(e.date) - today) / 864e5);
  function inWhen(e, when) {
    const n = daysAway(e), dow = d8(e.date).getDay();
    if (when === "weekend") {
      // the coming Friday to Sunday (or the current one, if it's already the weekend)
      const toSun = (7 - today.getDay()) % 7;
      return n <= toSun && (dow === 5 || dow === 6 || dow === 0) && n >= 0;
    }
    if (when === "week") return n <= 7;
    if (when === "month") return n <= 30;
    if (when === "later") return n > 30;
    return true;
  }

  function apply() {
    const q = $("#q").value.trim().toLowerCase();
    const city = $("#city").value, when = $("#when").value, price = $("#price").value, sort = $("#sort").value;
    const hideSold = $("#hide-sold").checked;
    let list = EVENTS.filter(e => eventStart(e) > Date.now()).filter(e =>
      (!q || [e.name, e.venue, e.city, e.organizer.name, catName(e.cat)].join(" ").toLowerCase().includes(q)) &&
      (!cat || e.cat === cat) && (!city || e.city === city) && inWhen(e, when) &&
      (!price || (price === "free" ? e.from === 0 : price === "u250" ? e.from < 250 : e.from < 500)) &&
      (!hideSold || remaining(e) > 0));
    if (sort === "price-asc") list.sort((a, b) => a.from - b.from);
    if (sort === "price-desc") list.sort((a, b) => b.from - a.from);
    if (sort === "popular") list.sort((a, b) => remaining(a) / a.capacity - remaining(b) / b.capacity);
    $("#count").textContent = `${list.length} ${list.length === 1 ? "event" : "events"}`;
    $("#results").innerHTML = list.length ? list.map(eventTicket).join("") :
      `<div class="empty"><h3>No events match your search</h3><p class="muted">Try another date range, or clear the filters to see everything that's on.</p><button class="btn btn-ink" type="button" id="clear">Clear filters</button></div>`;
    const c = $("#clear"); if (c) c.addEventListener("click", clear);
    // keep the URL shareable
    const p = new URLSearchParams();
    if (q) p.set("q", q); if (cat) p.set("cat", cat); if (city) p.set("city", city); if (when) p.set("when", when); if (price) p.set("price", price);
    history.replaceState(null, "", "events.html" + (p.toString() ? "?" + p : ""));
  }
  function clear() { $("#q").value = ""; $("#city").value = ""; $("#when").value = ""; $("#price").value = ""; $("#hide-sold").checked = false; cat = ""; drawChips(); apply(); }

  $("#filters").addEventListener("input", apply);
  $("#hide-sold").addEventListener("change", apply);
  $("#chips").addEventListener("click", e => { const b = e.target.closest(".chip"); if (!b) return; cat = b.dataset.cat; drawChips(); apply(); });
  apply();
});
