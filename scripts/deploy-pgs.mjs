#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";

const pgsHost = process.env.PGS_HOST || "pgs.sh";
const pgsUser = process.env.PGS_USER;
const pgsProject = process.env.PGS_PROJECT || "usecoherence";
const pgsIdentity = process.env.PGS_IDENTITY || "";

if (!pgsUser) {
  console.error("missing PGS_USER; set it in .env");
  process.exit(1);
}

if (!existsSync("public")) {
  console.error("missing public/; run npm run build first");
  process.exit(1);
}

const sshParts = ["ssh", "-o", "StrictHostKeyChecking=accept-new"];
if (pgsIdentity) {
  sshParts.push("-i", pgsIdentity);
}

const result = spawnSync(
  "rsync",
  [
    "--delete",
    "-rv",
    "-e",
    sshParts.join(" "),
    "public/",
    `${pgsUser}@${pgsHost}:/${pgsProject}/`,
  ],
  { stdio: "inherit" },
);

process.exit(result.status || 0);
