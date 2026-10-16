(function () {
"use strict";
const T = window.BEBI_I18N, CATS = window.BEBI_CATS, COLORS = window.BEBI_COLORS, CFG = window.BEBI_CONFIG, IC = window.MAMAPA_ICONS;
const $ = id => document.getElementById(id);
const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const ic = (name, cls) => `<span class="${cls || ""}">${IC[name] || ""}</span>`;
let lang = "en";
try { lang = localStorage.getItem("bk-lang") || ((navigator.language || "").toLowerCase().startsWith("hr") ? "hr" : "en"); } catch (e) {}
const t = k => T[lang][k];
const catName = id => (CATS.find(c => c.id === id) || {})[lang] || id;
const mainCat = p => (p.categories || [])[0] || "changing";
const colorOf = p => COLORS[mainCat(p)] || "#17A99B";

const sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
const S = { places: [], loaded: false, failed: false, cat: null, district: "", q: "", user: null, sheet: null, pick: null, sel: null };

$("brandmark").innerHTML = IC.pin; $("searchico").innerHTML = IC.search; $("fabico").innerHTML = IC.plus;

// ---------- map: OpenFreeMap "Liberty" (free, no key, Google-like look); plain OSM if the browser can't draw vector maps ----------
const map = L.map("map", { zoomControl: false, attributionControl: true }).setView([45.800, 15.975], 12);
L.control.zoom({ position: "topright" }).addTo(map);
const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
function rasterFallback() { L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: OSM_ATTR }).addTo(map); }
try {
  if (!L.maplibreGL || !window.maplibregl || (maplibregl.supported && !maplibregl.supported())) throw new Error("no webgl");
  L.maplibreGL({ style: "https://tiles.openfreemap.org/styles/liberty",
    attribution: '<a href="https://openfreemap.org">OpenFreeMap</a> &copy; <a href="https://www.openmaptiles.org/">OpenMapTiles</a> ' + OSM_ATTR }).addTo(map);
} catch (e) { rasterFallback(); }
const pinLayer = L.layerGroup().addTo(map);
const DROP = c => `<svg class="drop" viewBox="0 0 34 44"><path d="M17 43C17 43 2 27.5 2 16.5a15 15 0 0 1 30 0C32 27.5 17 43 17 43z" fill="${c}" stroke="#fff" stroke-width="2"/></svg>`;
function pinIcon(cat, color, sel) {
  return L.divIcon({ className: "", iconSize: [34, 44], iconAnchor: [17, 43], tooltipAnchor: [0, -38],
    html: `<div class="gpin${sel ? " sel" : ""}">${DROP(color)}<span class="gi">${IC[cat] || ""}</span></div>` });
}
let draftMarker = null;
function drawPins(list) {
  pinLayer.clearLayers();
  list.forEach(p => {
    L.marker([p.lat, p.lng], { icon: pinIcon(mainCat(p), colorOf(p), S.sel === p.id), riseOnHover: true, zIndexOffset: S.sel === p.id ? 1000 : 0 })
      .on("click", () => openPlace(p.id)).bindTooltip(p.name, { direction: "top" }).addTo(pinLayer);
  });
}
function setDraft(lat, lng) {
  if (draftMarker) draftMarker.remove();
  draftMarker = lat == null ? null : L.marker([lat, lng], { draggable: true, icon: pinIcon("pin", "#25303A", true), zIndexOffset: 2000 }).addTo(map)
    .on("dragend", e => { const ll = e.target.getLatLng(); if (S.draft) { S.draft.lat = ll.lat; S.draft.lng = ll.lng; } });
}
map.on("click", e => {
  if (!S.pick) return;
  S.draft.lat = e.latlng.lat; S.draft.lng = e.latlng.lng; setDraft(e.latlng.lat, e.latlng.lng);
  S.pick = null; $("pickbar").hidden = true; openAdd();
});
$("pickcancel").onclick = () => { S.pick = null; $("pickbar").hidden = true; openAdd(); };

// ---------- data ----------
async function loadPlaces() {
  const { data, error } = await sb.from("places").select("id,name,address,district,lat,lng,gmaps_url,categories,created_by,created_at,reviews(rating)").limit(2000);
  if (error) { S.failed = true; renderList(); return; }
  S.places = data.map(p => {
    const rated = (p.reviews || []).filter(r => r.rating);
    return { ...p, reviewCount: (p.reviews || []).length, avg: rated.length ? rated.reduce((a, r) => a + r.rating, 0) / rated.length : 0 };
  });
  S.loaded = true; renderAll();
  if (S.sheet && S.sheet.rerender && S.sheet.kind === "place") S.sheet.rerender();
}
sb.channel("places-live").on("postgres_changes", { event: "*", schema: "public", table: "places" }, () => loadPlaces())
  .on("postgres_changes", { event: "*", schema: "public", table: "reviews" }, () => loadPlaces()).subscribe();

// ---------- auth ----------
sb.auth.onAuthStateChange((_e, session) => { S.user = session ? session.user : null; renderChrome(); });
$("auth").onclick = async () => {
  if (S.user) { await sb.auth.signOut(); toast(t("logout")); }
  else await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.origin + location.pathname } });
};
function displayName() {
  const m = (S.user && S.user.user_metadata) || {};
  return String(m.full_name || m.name || "").split(" ")[0].slice(0, 40);
}

// ---------- chrome & list ----------
function filtered() {
  const q = S.q.trim().toLowerCase();
  return S.places.filter(p => (!S.cat || (p.categories || []).includes(S.cat)) && (!S.district || p.district === S.district) &&
    (!q || (p.name + " " + p.address + " " + p.district).toLowerCase().includes(q))).sort((a, b) => a.name.localeCompare(b.name, "hr"));
}
function renderChrome() {
  document.documentElement.lang = lang;
  $("t-sub").textContent = t("sub"); $("q").placeholder = t("search"); $("t-places").textContent = t("places");
  $("t-pick").textContent = t("pick"); $("pickcancel").textContent = t("cancel"); $("t-foot").textContent = t("foot");
  $("fabtxt").textContent = t("add").replace("+ ", ""); $("auth").textContent = S.user ? t("logout") : t("loginShort");
  $("lang-hr").setAttribute("aria-pressed", lang === "hr"); $("lang-en").setAttribute("aria-pressed", lang === "en");
  $("cats").innerHTML = `<button class="tile all" type="button" data-c="" aria-pressed="${!S.cat}"><span class="blk">${esc(t("all").toUpperCase())}</span><span class="lbl">${esc(t("all"))}</span></button>` +
    CATS.map(c => `<button class="tile" type="button" data-c="${c.id}" style="--c:${COLORS[c.id]}" aria-pressed="${S.cat === c.id}"><span class="blk">${ic(c.id)}</span><span class="lbl">${esc(c[lang])}</span></button>`).join("");
  const ds = [...new Set(S.places.map(p => p.district).filter(Boolean))].sort((a, b) => a.localeCompare(b, "hr"));
  $("district").innerHTML = `<option value="">${esc(t("allDistricts"))}</option>` + ds.map(d => `<option ${d === S.district ? "selected" : ""}>${esc(d)}</option>`).join("");
}
function renderList() {
  const L2 = filtered(); drawPins(L2); $("count").textContent = S.loaded ? L2.length : "";
  const el = $("list");
  if (!S.loaded) { el.innerHTML = `<div class="empty">${esc(S.failed ? t("offline") : t("loading"))}</div>`; return; }
  if (!S.places.length) { el.innerHTML = `<div class="empty"><strong>${esc(t("emptyT"))}</strong>${esc(t("emptyD"))}</div>`; return; }
  if (!L2.length) { el.innerHTML = `<div class="empty">${esc(t("noMatch"))}</div>`; return; }
  el.innerHTML = L2.map(p => `<button class="item" type="button" data-id="${p.id}" style="--c:${colorOf(p)}">
    <span class="blk">${ic(mainCat(p))}</span>
    <span class="txt"><span class="name">${esc(p.name)}</span><span class="meta">${esc([p.district, p.address].filter(Boolean).join(" · "))}</span>
      <span class="dots">${(p.categories || []).map(c => `<i style="--c:${COLORS[c]}" title="${esc(catName(c))}"></i>`).join("")}</span></span>
    <span class="end">${p.avg ? `${ic("star", "st")}${p.avg.toFixed(1)}` : ""}${ic("chevron", "chev")}</span></button>`).join("");
}
function renderAll() { renderChrome(); renderList(); }
$("cats").onclick = e => { const b = e.target.closest(".tile"); if (!b) return; S.cat = b.dataset.c || null; renderAll(); };
$("district").onchange = e => { S.district = e.target.value; renderList(); };
$("q").oninput = e => { S.q = e.target.value; renderList(); };
$("list").onclick = e => { const b = e.target.closest(".item"); if (b) openPlace(b.dataset.id); };
function setLang(l) { lang = l; try { localStorage.setItem("bk-lang", l); } catch (e) {} renderAll(); if (S.sheet && S.sheet.rerender) S.sheet.rerender(); }
$("lang-hr").onclick = () => setLang("hr"); $("lang-en").onclick = () => setLang("en");

// ---------- sheets ----------
function showSheet(html, color) {
  $("sheetroot").innerHTML = `<div class="scrim" id="scrim"><div class="sheet" role="dialog" aria-modal="true" style="--c:${color || "var(--teal)"}">${html}</div></div>`;
  $("scrim").addEventListener("click", e => { if (e.target.id === "scrim") closeSheet(); });
}
function band(title, sub, icon) {
  return `<div class="band">${icon ? ic(icon, "bi") : ""}<div style="flex:1;min-width:0"><h3>${esc(title)}</h3>${sub ? `<p>${esc(sub)}</p>` : ""}</div><button class="x" id="sx" type="button" aria-label="${esc(t("cancel"))}">${IC.close}</button></div>`;
}
function closeSheet() { S.sheet = null; $("sheetroot").innerHTML = ""; if (S.sel) { S.sel = null; renderList(); } }
document.addEventListener("keydown", e => { if (e.key === "Escape" && S.sheet) closeSheet(); });
function toast(msg) { const el = $("toast"); el.textContent = msg; el.hidden = false; clearTimeout(toast.h); toast.h = setTimeout(() => el.hidden = true, 2600); }
const starsHtml = (id, n) => `<div class="stars" id="${id}">${[1, 2, 3, 4, 5].map(i => `<button type="button" data-n="${i}" class="${i <= n ? "on" : ""}" aria-label="${i}">${IC.star}</button>`).join("")}</div>`;
const fileHtml = id => `<label class="file">${ic("camera", "fi")}<span id="${id}-l">${esc(t("addPhoto"))} · ${esc(t("photoTip"))}</span><input id="${id}" type="file" accept="image/*" multiple></label>`;
function bindFile(id, onFiles) { const el = $(id); if (!el) return; el.onchange = e => { const f = [...e.target.files]; onFiles(f); $(id + "-l").textContent = f.length ? `${t("addPhoto")} · ${f.length}` : `${t("addPhoto")} · ${t("photoTip")}`; }; }
function bindStars(id, get, set) { const el = $(id); if (!el) return; el.onclick = e => { const b = e.target.closest("button"); if (!b) return; set(+b.dataset.n); [...el.children].forEach((x, i) => x.classList.toggle("on", i < get())); }; }

// ---------- photos ----------
async function compress(file) {
  const img = await createImageBitmap(file).catch(() => null);
  if (!img) return file;
  const max = 1600, k = Math.min(1, max / Math.max(img.width, img.height));
  const c = document.createElement("canvas"); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
  c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
  return await new Promise(r => c.toBlob(b => r(b || file), "image/jpeg", 0.82));
}
async function uploadPhotos(files) {
  const paths = []; let failed = false;
  for (const f of files.slice(0, 6)) {
    try {
      const blob = await compress(f);
      const path = `${S.user.id}/${crypto.randomUUID()}.jpg`;
      const { error } = await sb.storage.from("photos").upload(path, blob, { contentType: "image/jpeg" });
      if (error) throw error; paths.push(path);
    } catch (e) { failed = true; }
  }
  if (failed) toast(t("photoErr"));
  return paths;
}
const photoUrl = p => sb.storage.from("photos").getPublicUrl(p).data.publicUrl;

// ---------- add place ----------
function needLogin() {
  if (S.user) return false;
  showSheet(`${band(t("add").replace("+ ", ""), "", "pin")}<div class="body"><p style="margin:0">${esc(t("loginToPost"))}</p><div class="row"><button class="btn" id="go" type="button">${esc(t("login"))}</button></div></div>`);
  $("sx").onclick = closeSheet; $("go").onclick = () => $("auth").click(); return true;
}
$("fab").onclick = () => { if (needLogin()) return; S.draft = { link: "", name: "", address: "", district: "", lat: null, lng: null, cats: [], rating: 0, text: "", status: "" }; S.files = []; setDraft(null); openAdd(); };

function openAdd() {
  const d = S.draft; S.sheet = { kind: "add", rerender: () => { keepFields(); openAdd(); } };
  const show = d.status === "found" || d.status === "partial";
  showSheet(`${band(t("add").replace("+ ", ""), t("shareHelp"), "pin")}
  <div class="body">
  <label class="f"><span class="step"><b>1</b>${esc(t("shareLbl"))}</span><input id="flink" type="url" inputmode="url" placeholder="https://maps.app.goo.gl/…" value="${esc(d.link)}"></label>
  ${d.status === "loading" ? `<p class="note">${esc(t("finding"))}</p>` : ""}
  ${show ? `<div class="found">
    ${d.status === "found" ? `<span class="ok">✓ ${esc(t("found"))}</span>` : `<span class="err">${esc(t("notFound"))}</span>`}
    <label class="f"><span class="lab">${esc(t("name"))}</span><input id="fname" value="${esc(d.name)}" maxlength="120"></label>
    <label class="f"><span class="lab">${esc(t("address"))}</span><input id="faddr" value="${esc(d.address)}" maxlength="200"></label>
    <div class="row">${d.lat != null ? `<span class="note">✓ ${esc(t("locSet"))}${d.district ? " · " + esc(d.district) : ""}</span><button class="btn ghost small" id="fpick" type="button">${esc(t("moveLoc"))}</button>` : `<span class="err">${esc(t("locMissing"))}</span><button class="btn ghost small" id="fpick" type="button">${esc(t("pickOnMap"))}</button>`}</div>
  </div>` : ""}
  <div class="f"><span class="step"><b>2</b>${esc(t("cats"))}</span><div class="picks" id="fcats">${CATS.map(c => `<label style="--c:${COLORS[c.id]}"><input type="checkbox" value="${c.id}" ${d.cats.includes(c.id) ? "checked" : ""}>${ic(c.id, "pi")}${esc(c[lang])}</label>`).join("")}</div></div>
  <div class="f"><span class="step"><b>3</b>${esc(t("writeReview"))} · ${esc(t("optional"))}</span>
    ${starsHtml("fstars", d.rating)}
    <textarea id="ftext" maxlength="1000" placeholder="${esc(t("reviewText"))}">${esc(d.text)}</textarea>
    ${fileHtml("fphotos")}
  </div>
  <p class="err" id="ferr" role="alert"></p>
  <div class="row"><button class="btn" id="fsave" type="button">${esc(t("save"))}</button><button class="btn ghost" id="fcancel" type="button">${esc(t("cancel"))}</button></div>
  </div>`);
  $("sx").onclick = $("fcancel").onclick = () => { setDraft(null); closeSheet(); };
  const pk = $("fpick"); if (pk) pk.onclick = () => { keepFields(); $("sheetroot").innerHTML = ""; S.pick = true; $("pickbar").hidden = false; if (d.lat != null) map.setView([d.lat, d.lng], 17); $("map").scrollIntoView({ behavior: "smooth", block: "center" }); };
  bindStars("fstars", () => d.rating, n => d.rating = n);
  bindFile("fphotos", f => S.files = f);
  const lk = $("flink");
  const go = () => { const v = lk.value.trim(); if (v && v !== d.resolvedFor) resolveLink(v); };
  lk.addEventListener("paste", () => setTimeout(go, 0)); lk.addEventListener("change", go);
  $("fsave").onclick = savePlace;
}
function keepFields() {
  const d = S.draft; if (!d || !$("fcats")) return;
  if ($("flink")) d.link = $("flink").value.trim();
  if ($("fname")) d.name = $("fname").value; if ($("faddr")) d.address = $("faddr").value;
  d.text = $("ftext").value; d.cats = [...document.querySelectorAll("#fcats input:checked")].map(i => i.value);
}
async function resolveLink(v) {
  keepFields(); const d = S.draft; d.link = v; d.resolvedFor = v; d.status = "loading"; openAdd();
  let r = null;
  if (/^https?:\/\//i.test(v)) { try { const res = await fetch("/api/resolve?url=" + encodeURIComponent(v)); if (res.ok) r = await res.json(); } catch (e) {} }
  else { r = { name: v }; d.link = ""; }
  if (S.draft !== d) return;
  d.name = (r && r.name) || d.name; d.address = (r && r.address) || d.address; d.district = (r && r.district) || "";
  if (r && r.lat != null) { d.lat = r.lat; d.lng = r.lng; setDraft(d.lat, d.lng); map.setView([d.lat, d.lng], 16); }
  d.status = d.name && d.lat != null ? "found" : "partial";
  keepFields(); openAdd();
}
async function districtFor(lat, lng) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&lat=${lat}&lon=${lng}`, { headers: { "Accept-Language": "hr" } });
    const a = (await r.json()).address || {}; return a.city_district || a.suburb || a.quarter || "";
  } catch (e) { return ""; }
}
async function savePlace() {
  keepFields(); const d = S.draft, err = $("ferr"); err.textContent = "";
  if (!d.link && !d.name) return err.textContent = t("needLink");
  if (!d.name.trim()) return err.textContent = t("needName");
  if (d.lat == null) return err.textContent = t("needLoc");
  if (!d.cats.length) return err.textContent = t("needCat");
  const dupe = S.places.find(p => p.name.toLowerCase() === d.name.trim().toLowerCase() && Math.abs(p.lat - d.lat) < 0.001 && Math.abs(p.lng - d.lng) < 0.0015);
  if (dupe) { err.innerHTML = `${esc(t("dupe"))} <button class="btn ghost small" id="opendupe" type="button">${esc(t("openIt"))}</button>`; $("opendupe").onclick = () => { setDraft(null); openPlace(dupe.id); }; return; }
  const b = $("fsave"); b.disabled = true; b.textContent = t("saving");
  try {
    if (!d.district) d.district = await districtFor(d.lat, d.lng);
    const { data: place, error } = await sb.from("places").insert({ name: d.name.trim(), address: d.address.trim(), district: d.district, lat: d.lat, lng: d.lng, gmaps_url: d.link, categories: d.cats }).select().single();
    if (error) throw error;
    if (d.text.trim() || d.rating || S.files.length) {
      const photos = S.files.length ? await uploadPhotos(S.files) : [];
      await sb.from("reviews").insert({ place_id: place.id, rating: d.rating || null, body: d.text.trim(), photos, author_name: displayName() });
    }
    setDraft(null); toast(t("saved")); await loadPlaces(); openPlace(place.id);
  } catch (e) { b.disabled = false; b.textContent = t("save"); err.textContent = t("saveErr"); }
}

// ---------- place detail ----------
function openPlace(id) {
  const st = { reviews: null, rating: 0, files: [] };
  const sheet = { kind: "place", id, rerender: () => render() }; S.sheet = sheet; S.sel = id;
  const p0 = S.places.find(x => x.id === id); if (p0) map.setView([p0.lat, p0.lng], Math.max(map.getZoom(), 15));
  renderList();
  function render() {
    if (S.sheet !== sheet) return;
    const p = S.places.find(x => x.id === id); if (!p) return closeSheet();
    const keep = $("rtext") ? $("rtext").value : "";
    const gm = p.gmaps_url && /^https:\/\//.test(p.gmaps_url) ? p.gmaps_url : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name + ", " + (p.address || "Zagreb"))}`;
    const mine = S.user && p.created_by === S.user.id;
    const rev = st.reviews == null ? `<p class="note">${esc(t("loading"))}</p>` : st.reviews.length ? st.reviews.map(r => `<div class="review">
        <div class="who">${r.rating ? `<span class="rst">${Array.from({ length: r.rating }, () => `<span>${IC.star}</span>`).join("")}</span>` : ""}<span>${esc(r.author_name || t("someone"))} · ${new Date(r.created_at).toLocaleDateString(lang === "hr" ? "hr-HR" : "en-GB")}</span></div>
        ${r.body ? `<div>${esc(r.body)}</div>` : ""}
        ${(r.photos || []).length ? `<div class="photos">${r.photos.map(ph => `<a href="${esc(photoUrl(ph))}" target="_blank" rel="noopener"><img src="${esc(photoUrl(ph))}" alt="" loading="lazy"></a>`).join("")}</div>` : ""}
        ${S.user && r.created_by === S.user.id ? `<button class="btn ghost small" data-del="${r.id}" type="button" style="align-self:flex-start">${esc(t("del"))}</button>` : ""}</div>`).join("") : `<p class="note">${esc(t("noReviews"))}</p>`;
    showSheet(`${band(p.name, [p.district, p.address].filter(Boolean).join(" · "), mainCat(p))}
    <div class="body">
      <div class="tags">${(p.categories || []).map(c => `<span class="tag" style="--c:${COLORS[c]}">${ic(c)}${esc(catName(c))}</span>`).join("")}</div>
      <a class="link" href="${esc(gm)}" target="_blank" rel="noopener">${esc(t("gmaps"))} ${ic("external")}</a>
      <h4 class="sec">${esc(t("reviews"))}${p.avg ? `<span class="note">★ ${p.avg.toFixed(1)} · ${esc(t("reviewsN")(p.reviewCount))}</span>` : ""}</h4>
      <div id="rlist" style="display:flex;flex-direction:column;gap:14px">${rev}</div>
      ${S.user ? `<div class="review" style="gap:12px"><span class="step"><b>+</b>${esc(t("writeReview"))}</span>${starsHtml("rstars", st.rating)}
        <textarea id="rtext" maxlength="1000" placeholder="${esc(t("reviewText"))}" style="font:400 .95rem var(--body);border:0;border-bottom:1.5px solid var(--line);padding:9px 2px;outline:none"></textarea>
        ${fileHtml("rphotos")}
        <p class="err" id="rerr" role="alert"></p><div class="row"><button class="btn" id="rpost" type="button">${esc(t("post"))}</button></div></div>`
        : `<p class="note">${esc(t("loginToPost"))}</p>`}
      ${mine ? `<div class="row" id="delrow"><button class="btn ghost small" id="delplace" type="button">${esc(t("delPlace"))}</button></div>` : ""}
    </div>`, colorOf(p));
    if ($("rtext")) $("rtext").value = keep;
    $("sx").onclick = closeSheet;
    bindStars("rstars", () => st.rating, n => st.rating = n);
    bindFile("rphotos", f => st.files = f);
    if ($("rpost")) $("rpost").onclick = post;
    $("rlist").onclick = async e => { const b = e.target.closest("[data-del]"); if (!b) return; b.disabled = true; await sb.from("reviews").delete().eq("id", b.dataset.del); await loadReviews(); loadPlaces(); };
    if ($("delplace")) $("delplace").onclick = () => { $("delrow").innerHTML = `<span class="note">${esc(t("confirmDel"))}</span><button class="btn small warn" id="delyes" type="button">${esc(t("yes"))}</button>`; $("delyes").onclick = async () => { await sb.from("places").delete().eq("id", id); closeSheet(); loadPlaces(); }; };
  }
  async function loadReviews() {
    const { data } = await sb.from("reviews").select("*").eq("place_id", id).order("created_at", { ascending: false });
    st.reviews = data || []; render();
  }
  async function post() {
    const text = $("rtext").value.trim(); if (!text && !st.rating && !st.files.length) return;
    const b = $("rpost"); b.disabled = true; b.textContent = t("saving");
    try {
      const photos = st.files.length ? await uploadPhotos(st.files) : [];
      const { error } = await sb.from("reviews").insert({ place_id: id, rating: st.rating || null, body: text, photos, author_name: displayName() });
      if (error) throw error;
      st.rating = 0; st.files = []; $("rtext").value = ""; toast(t("saved")); await loadReviews(); loadPlaces();
    } catch (e) { b.disabled = false; b.textContent = t("post"); $("rerr").textContent = t("saveErr"); }
  }
  render(); loadReviews();
}

// ---------- boot ----------
renderAll();
sb.auth.getSession().then(({ data }) => { S.user = data.session ? data.session.user : null; renderChrome(); });
loadPlaces();
window.__mamapa = { S, renderAll, openPlace };
})();
