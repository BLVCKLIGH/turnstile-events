document.addEventListener("DOMContentLoaded", () => {
  const open = EVENTS.filter(e => eventStart(e) > Date.now());
  const sel = $("#event");
  sel.innerHTML = `<option value="">Choose an event</option>` + open.map(e =>
    `<option value="${e.id}"${remaining(e) ? "" : " disabled"}>${esc(e.name)}, ${fmtShort(e.date)}${remaining(e) ? "" : " (sold out)"}</option>`).join("");

  const pre = open.find(e => e.id === Number(param("id")) && remaining(e) > 0);
  const preQty = {};
  (param("t") || "").split(",").filter(Boolean).forEach(p => { const [id, n] = p.split(":"); preQty[id] = Number(n) || 0; });
  if (pre) sel.value = pre.id;

  const current = () => open.find(e => e.id === Number(sel.value));

  function drawTiers(usePre) {
    const e = current();
    if (!e) { $("#tier-fields").innerHTML = `<p class="muted">Choose an event to see ticket types.</p>`; return; }
    const left = remaining(e);
    $("#tier-fields").innerHTML = e.tiers.map((t, i) => `
      <div class="field">
        <label for="t-${t.id}">${esc(t.name)}, ${R(t.price)} each</label>
        <input type="number" id="t-${t.id}" data-tier="${t.id}" min="0" max="${Math.min(10, left)}" value="${usePre && preQty[t.id] !== undefined ? preQty[t.id] : i === 0 ? 1 : 0}" style="max-width:120px">
      </div>`).join("") + `<p class="hint muted" style="font-size:.88rem">${left} tickets left. Up to 10 per booking.</p>`;
  }

  function order() {
    const e = current();
    if (!e) return null;
    const lines = e.tiers.map(t => ({ ...t, qty: Math.max(0, Math.floor(Number(($("#t-" + t.id) || {}).value) || 0)) })).filter(l => l.qty > 0);
    const qty = lines.reduce((s, l) => s + l.qty, 0);
    return { e, lines, qty, total: lines.reduce((s, l) => s + l.price * l.qty, 0) };
  }

  function drawOrder() {
    const o = order();
    $("#pay-set").hidden = !!o && o.qty > 0 && o.total === 0;
    $("#submit").textContent = o && o.total > 0 ? `Pay ${R(o.total)} and book` : "Confirm booking";
    if (!o) { $("#order").innerHTML = `<div class="body"><h2 style="font-size:1.4rem">Your order</h2><p class="muted">Choose an event to start.</p></div>`; return; }
    $("#order").innerHTML = `<img src="${o.e.poster}" alt="">
      <div class="body">
        <h2 style="font-size:1.4rem;margin-bottom:.3rem">${esc(o.e.name)}</h2>
        <p class="muted" style="margin:0">${fmtLong(o.e.date)}, ${o.e.start}<br>${esc(o.e.venue)}, ${esc(o.e.city)}</p>
        <dl>${o.lines.length ? o.lines.map(l => `<dt>${l.qty} × ${esc(l.name)}</dt><dd>${R(l.price * l.qty)}</dd>`).join("") : `<dt>No tickets selected</dt><dd></dd>`}</dl>
        <div class="total"><span>Total</span><strong>${o.total === 0 ? (o.qty ? "Free" : "R0") : R(o.total)}</strong></div>
      </div>`;
  }

  // Payment method switch
  $$('input[name="method"]').forEach(r => r.addEventListener("change", () => {
    const m = $('input[name="method"]:checked').value;
    $("#card-fields").hidden = m !== "card"; $("#eft-fields").hidden = m !== "eft"; $("#snap-fields").hidden = m !== "snapscan";
  }));

  // Card formatting
  $("#cc-num").addEventListener("input", ev => { const d = ev.target.value.replace(/\D/g, "").slice(0, 19); ev.target.value = d.replace(/(.{4})/g, "$1 ").trim(); });
  $("#cc-exp").addEventListener("input", ev => { let d = ev.target.value.replace(/\D/g, "").slice(0, 4); if (d.length > 2) d = d.slice(0, 2) + "/" + d.slice(2); ev.target.value = d; });
  $("#cc-cvc").addEventListener("input", ev => { ev.target.value = ev.target.value.replace(/\D/g, "").slice(0, 4); });

  const luhn = num => { let s = 0, alt = false; for (let i = num.length - 1; i >= 0; i--) { let n = +num[i]; if (alt) { n *= 2; if (n > 9) n -= 9; } s += n; alt = !alt; } return s % 10 === 0; };
  const needsCard = () => { const o = order(); return o && o.total > 0 && $('input[name="method"]:checked').value === "card"; };

  const rules = {
    event: () => current() ? "" : "Choose an event.",
    tickets: () => { const o = order(); if (!o) return ""; const left = remaining(o.e); return o.qty === 0 ? "Choose at least one ticket." : o.qty > Math.min(10, left) ? `You can book up to ${Math.min(10, left)} tickets for this event.` : ""; },
    name: () => $("#name").value.trim().split(/\s+/).filter(Boolean).length >= 2 ? "" : "Enter your first name and surname.",
    email: () => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test($("#email").value.trim()) ? "" : "Enter an email address like name@example.com. Your tickets are sent here.",
    phone: () => /^(\+27|0)[6-8]\d{8}$/.test($("#phone").value.replace(/[\s()-]/g, "")) ? "" : "Enter a South African mobile number, e.g. 082 123 4567.",
    "cc-name": () => !needsCard() || $("#cc-name").value.trim().length >= 2 ? "" : "Enter the name shown on the card.",
    "cc-num": () => { if (!needsCard()) return ""; const d = $("#cc-num").value.replace(/\D/g, ""); return d.length >= 13 && luhn(d) ? "" : "That card number isn't valid. Check the digits and try again."; },
    "cc-exp": () => {
      if (!needsCard()) return "";
      const m = $("#cc-exp").value.match(/^(\d{2})\/(\d{2})$/); if (!m) return "Enter the expiry as MM/YY.";
      const mon = +m[1], yr = 2000 + +m[2]; if (mon < 1 || mon > 12) return "Month must be between 01 and 12.";
      const now = new Date(); return yr > now.getFullYear() || (yr === now.getFullYear() && mon >= now.getMonth() + 1) ? "" : "This card has expired.";
    },
    "cc-cvc": () => !needsCard() || /^\d{3,4}$/.test($("#cc-cvc").value) ? "" : "Enter the 3 or 4 digit code.",
    terms: () => $("#terms").checked ? "" : "Accept the ticket terms to continue.",
  };
  function check(k) {
    const msg = rules[k](); const el = $(`[data-err="${k}"]`); if (el) el.textContent = msg;
    const input = document.getElementById(k);
    if (input) { input.setAttribute("aria-invalid", msg ? "true" : "false"); const f = input.closest(".field"); if (f) f.classList.toggle("invalid", !!msg); }
    return !msg;
  }
  ["name", "email", "phone", "cc-name", "cc-num", "cc-exp", "cc-cvc"].forEach(k => {
    const el = document.getElementById(k);
    el.addEventListener("blur", () => { if (el.value) check(k); });
    el.addEventListener("input", () => { if (el.getAttribute("aria-invalid") === "true") check(k); });
  });
  $("#terms").addEventListener("change", () => check("terms"));

  sel.addEventListener("change", () => { drawTiers(false); drawOrder(); check("event"); });
  $("#tier-fields").addEventListener("input", () => { drawOrder(); if ($('[data-err="tickets"]').textContent) check("tickets"); });

  $("#book-form").addEventListener("submit", ev => {
    ev.preventDefault();
    const ok = Object.keys(rules).map(check);
    if (ok.includes(false)) {
      const first = $('[aria-invalid="true"]') || $("#event");
      first.focus();
      toast("Some details need fixing before we can book your tickets.");
      return;
    }
    const o = order();
    const ref = "TS-" + Date.now().toString(36).slice(-4).toUpperCase() + Math.random().toString(36).slice(2, 5).toUpperCase();
    const booking = {
      ref, eventId: o.e.id, lines: o.lines.map(l => ({ id: l.id, name: l.name, qty: l.qty, price: l.price })), qty: o.qty, total: o.total,
      name: $("#name").value.trim(), email: $("#email").value.trim(), phone: $("#phone").value.trim(),
      method: o.total === 0 ? "free" : $('input[name="method"]:checked').value,
      card: needsCard() ? $("#cc-num").value.replace(/\D/g, "").slice(-4) : null, createdAt: new Date().toISOString(),
    };
    Store.set("bookings", [booking, ...Store.get("bookings", [])]);
    location.href = "confirmation.html?ref=" + encodeURIComponent(ref);
  });

  const user = Store.get("lastContact", null);
  if (user) { $("#name").value = user.name; $("#email").value = user.email; $("#phone").value = user.phone; }
  $("#book-form").addEventListener("submit", () => Store.set("lastContact", { name: $("#name").value.trim(), email: $("#email").value.trim(), phone: $("#phone").value.trim() }), { capture: true });

  drawTiers(true); drawOrder();
});
