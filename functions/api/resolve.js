// Cloudflare Pages Function: GET /api/resolve?url=<Google Maps link>
// Opens a Google Maps share link (short or long), and returns
// { name, address, lat, lng, district, url } as far as it can work them out.
// No API keys: it follows Google's redirect, reads the long URL,
// and uses OpenStreetMap Nominatim only when coordinates or the district are missing.

const ALLOWED = /^(maps\.app\.goo\.gl|goo\.gl|(www\.|maps\.)?google\.[a-z.]{2,6})$/i;
const UA = "MamapaZagreb/1.0 (community map of baby-friendly places in Zagreb)";

export async function onRequestGet({ request }) {
  const input = new URL(request.url).searchParams.get("url") || "";
  let url;
  try { url = new URL(input.trim()); } catch { return json({ error: "bad_url" }, 400); }
  if (!ALLOWED.test(url.hostname)) return json({ error: "not_google_maps" }, 400);

  // 1) Follow redirects ourselves so we can read each Location header
  let finalUrl = url.toString();
  for (let i = 0; i < 6; i++) {
    const host = new URL(finalUrl).hostname;
    if (!ALLOWED.test(host) && !/consent\.google\./.test(host)) break;
    let res;
    try {
      res = await fetch(finalUrl, { redirect: "manual", headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "hr,en" } });
    } catch { break; }
    const loc = res.headers.get("location");
    if (!loc || res.status < 300 || res.status >= 400) break;
    let next = new URL(loc, finalUrl);
    // EU consent page: the real target is in ?continue=
    if (/consent\.google\./.test(next.hostname) && next.searchParams.get("continue")) {
      next = new URL(next.searchParams.get("continue"));
    }
    finalUrl = next.toString();
    if (/\/maps\/place\/|[?&]q=|@-?\d/.test(finalUrl)) break;
  }

  const out = { url: url.toString(), resolved: finalUrl, name: "", address: "", lat: null, lng: null, district: "" };
  const u = new URL(finalUrl);

  // 2) Name / address from the long URL
  const place = finalUrl.match(/\/maps\/place\/([^/@?]+)/);
  const q = u.searchParams.get("q") || u.searchParams.get("query") || "";
  const text = place ? decode(place[1]) : decode(q);
  if (text && !/^-?\d+\.\d+,\s*-?\d+\.\d+$/.test(text)) {
    const parts = text.split(",").map(s => s.trim()).filter(Boolean);
    out.name = parts[0] || "";
    out.address = parts.slice(1).join(", ");
  }

  // 3) Coordinates: the exact place pin (!3d..!4d..) beats the camera position (@lat,lng)
  const pin = finalUrl.match(/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/);
  const cam = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  const qll = q.match(/^(-?\d+\.\d+),\s*(-?\d+\.\d+)$/);
  const m = pin || qll || cam;
  if (m) { out.lat = +m[1]; out.lng = +m[2]; }

  // 4) Missing coordinates → look the place/address up on OpenStreetMap
  if (out.lat == null && (out.name || out.address)) {
    for (const query of [[out.name, out.address].filter(Boolean).join(", "), out.address].filter(Boolean)) {
      const hit = await nominatim(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=hr&viewbox=15.75,45.95,16.25,45.70&q=${encodeURIComponent(query)}`);
      if (hit && hit[0]) { out.lat = +hit[0].lat; out.lng = +hit[0].lon; break; }
    }
  }

  // 5) District (gradska četvrt / kvart) from reverse lookup
  if (out.lat != null) {
    const rev = await nominatim(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=16&addressdetails=1&lat=${out.lat}&lon=${out.lng}`);
    const a = rev && rev.address;
    if (a) {
      out.district = a.city_district || a.suburb || a.quarter || a.neighbourhood || "";
      if (!out.address) out.address = [a.road && (a.road + (a.house_number ? " " + a.house_number : "")), a.city || a.town].filter(Boolean).join(", ");
    }
  }

  return json(out, 200);
}

function decode(s) { try { return decodeURIComponent(String(s).replace(/\+/g, " ")); } catch { return String(s); } }

async function nominatim(href) {
  try {
    const r = await fetch(href, { headers: { "User-Agent": UA, "Accept-Language": "hr,en" }, cf: { cacheTtl: 86400 } });
    if (!r.ok) return null;
    return await r.json();
  } catch { return null; }
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}
