#!/usr/bin/env node

const token = process.env.CLOUDFLARE_API_TOKEN;
const zoneName = process.env.CLOUDFLARE_ZONE || "usecoherence.dev";
const pgsTarget = process.env.PGS_TARGET;

if (!token) {
  console.error("missing CLOUDFLARE_API_TOKEN");
  process.exit(1);
}

if (!pgsTarget) {
  console.error("missing PGS_TARGET; set it in .env, for example <pico-user>-usecoherence");
  process.exit(1);
}

const api = "https://api.cloudflare.com/client/v4";

async function cf(path, options = {}) {
  const res = await fetch(`${api}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const body = await res.json();
  if (!res.ok || !body.success) {
    throw new Error(JSON.stringify(body.errors || body, null, 2));
  }
  return body.result;
}

async function getZoneId() {
  const zones = await cf(`/zones?name=${encodeURIComponent(zoneName)}`);
  if (zones.length !== 1) {
    throw new Error(`expected one zone for ${zoneName}, got ${zones.length}`);
  }
  return zones[0].id;
}

async function upsertRecord(zoneId, record) {
  const query = new URLSearchParams({ type: record.type, name: record.name });
  const existing = await cf(`/zones/${zoneId}/dns_records?${query}`);
  const payload = JSON.stringify(record);

  if (existing.length === 0) {
    await cf(`/zones/${zoneId}/dns_records`, { method: "POST", body: payload });
    console.log(`created ${record.type} ${record.name}`);
    return;
  }

  await cf(`/zones/${zoneId}/dns_records/${existing[0].id}`, {
    method: "PUT",
    body: payload,
  });
  console.log(`updated ${record.type} ${record.name}`);
}

const zoneId = await getZoneId();

await upsertRecord(zoneId, {
  type: "CNAME",
  name: zoneName,
  content: "pgs.sh",
  ttl: 300,
  proxied: false,
});

await upsertRecord(zoneId, {
  type: "TXT",
  name: `_pgs.${zoneName}`,
  content: pgsTarget,
  ttl: 300,
});

console.log(`configured ${zoneName} -> ${pgsTarget}`);
