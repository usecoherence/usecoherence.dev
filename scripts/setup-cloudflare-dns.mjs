#!/usr/bin/env node

const token = process.env.CLOUDFLARE_API_TOKEN;
const zoneName = process.env.CLOUDFLARE_ZONE || "usecoherence.dev";
const pgsTarget = process.env.PGS_TARGET;
const fastmailEnabled = process.env.FASTMAIL_ENABLED !== "false";
const dryRun = process.env.DRY_RUN === "1" || process.env.DRY_RUN === "true";

if (!token) { console.error("missing CLOUDFLARE_API_TOKEN"); process.exit(1); }
if (!pgsTarget) { console.error("missing PGS_TARGET"); process.exit(1); }

const MODE = Object.freeze({
  ENSURE_EXACT: "ensure-exact",
  REPLACE_BY_NAME: "replace-by-name",
  REPLACE_MATCHING_CONTENT: "replace-matching-content",
  CREATE_IF_MISSING_CONTENT: "create-if-missing-content",
});

const api = "https://api.cloudflare.com/client/v4";

const cf = async (path, opts = {}) => {
  const res = await fetch(`${api}${path}`, {
    ...opts,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...opts.headers },
  });
  const body = await res.json();
  if (!res.ok || !body.success) throw new Error(JSON.stringify(body.errors || body, null, 2));
  return body.result;
};

const zoneId = await cf(`/zones?name=${encodeURIComponent(zoneName)}`)
  .then(z => { if (z.length !== 1) throw new Error(`expected 1 zone for ${zoneName}, got ${z.length}`); return z[0].id; });

const label = r =>
  r.type === "MX"
    ? `MX ${r.name} -> ${r.content} priority ${r.priority}`
    : `${r.type} ${r.name}`;

const save = async (zoneId, verb, r, id) => {
  const l = label(r);
  if (dryRun) { console.log(`  [DRY RUN] ${verb} ${l}`); return; }
  const path = verb === "create"
    ? `/zones/${zoneId}/dns_records`
    : `/zones/${zoneId}/dns_records/${id}`;
  await cf(path, { method: verb === "create" ? "POST" : "PUT", body: JSON.stringify(r) });
  console.log(`  ${verb} ${l}`);
};

async function apply(zoneId, r) {
  const existing = await cf(
    `/zones/${zoneId}/dns_records?${new URLSearchParams({ type: r.type, name: r.name })}`
  );
  const l = label(r);

  const matcher = {
    [MODE.ENSURE_EXACT]:              e => e.content === r.content && e.priority === r.priority,
    [MODE.REPLACE_BY_NAME]:           e => e.content === r.content,
    [MODE.REPLACE_MATCHING_CONTENT]:  e => e.content.includes(r.match),
    [MODE.CREATE_IF_MISSING_CONTENT]: e => e.content.includes(r.match),
  }[r.mode];
  const matched = existing.find(matcher);

  if (matched) {
    if (r.mode === MODE.REPLACE_MATCHING_CONTENT && matched.content !== r.content)
      return save(zoneId, "update", r, matched.id);
    const detail = r.mode === MODE.CREATE_IF_MISSING_CONTENT
      ? `existing ${r.match} record found`
      : "already up to date";
    console.log(`  skipped ${l} (${detail})`);
    return;
  }

  if (r.mode === MODE.REPLACE_BY_NAME && existing.length > 0)
    return save(zoneId, "update", r, existing[0].id);
  return save(zoneId, "create", r);
}

const records = [
  { group: "pgs", mode: MODE.REPLACE_BY_NAME, type: "CNAME", name: zoneName, content: "pgs.sh", ttl: 300, proxied: false },
  { group: "pgs", mode: MODE.REPLACE_BY_NAME, type: "TXT", name: `_pgs.${zoneName}`, content: pgsTarget, ttl: 300 },

  ...(fastmailEnabled ? [
    { group: "fastmail", mode: MODE.ENSURE_EXACT, type: "MX", name: zoneName, content: "in1-smtp.messagingengine.com", priority: 10, ttl: 300 },
    { group: "fastmail", mode: MODE.ENSURE_EXACT, type: "MX", name: zoneName, content: "in2-smtp.messagingengine.com", priority: 20, ttl: 300 },

    ...[1, 2, 3].map(n => ({
      group: "fastmail",
      mode: MODE.REPLACE_BY_NAME,
      type: "CNAME",
      name: `fm${n}._domainkey.${zoneName}`,
      content: `fm${n}.${zoneName}.dkim.fmhosted.com`,
      ttl: 300,
      proxied: false,
    })),

    { group: "fastmail", mode: MODE.REPLACE_MATCHING_CONTENT, match: "v=spf1", type: "TXT", name: zoneName, content: "v=spf1 include:spf.messagingengine.com ?all", ttl: 300 },

    { group: "fastmail", mode: MODE.CREATE_IF_MISSING_CONTENT, match: "v=DMARC1", type: "TXT", name: `_dmarc.${zoneName}`, content: `v=DMARC1; p=none; rua=mailto:postmaster@${zoneName}`, ttl: 300 },
  ] : []),
];

let currentGroup;
for (const r of records) {
  if (r.group !== currentGroup) {
    currentGroup = r.group;
    const groupLabel = currentGroup === "pgs" ? "PGS Website Records" : "Fastmail Email Records";
    console.log(`\n--- ${groupLabel} ---`);
  }
  await apply(zoneId, r);
}

if (!fastmailEnabled) console.log(`\nFastmail DNS records disabled (FASTMAIL_ENABLED=false)`);
console.log(``);
