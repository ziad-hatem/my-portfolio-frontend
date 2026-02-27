#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { MongoClient } from "mongodb";

const DEFAULT_DB_NAME = "portfolio_analytics";
const DEPRECATED_COLLECTIONS = [
  "events",
  "views",
  "view_details",
  "users",
  "fingerprints",
  "user_profiles",
  "near_users",
  "forms",
  "submissions",
  "congratulations",
];

function loadDotEnv() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, "utf8");
  const lines = content.split(/\r?\n/);

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");
    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if (
      (value.startsWith("\"") && value.endsWith("\"")) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

async function main() {
  loadDotEnv();

  const apply = process.argv.includes("--apply");
  const mongoUri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB_NAME || DEFAULT_DB_NAME;

  if (!mongoUri) {
    console.error("Missing required env var: MONGODB_URI");
    process.exit(1);
  }

  const client = new MongoClient(mongoUri, {
    retryWrites: true,
    w: "majority",
  });

  try {
    await client.connect();
    const db = client.db(dbName);
    const existingCollections = await db
      .listCollections({}, { nameOnly: true })
      .toArray();
    const existingNames = new Set(existingCollections.map((item) => item.name));

    console.log(
      apply
        ? `Executing collection drops in database '${dbName}'`
        : `Dry-run mode for database '${dbName}' (no collections will be dropped)`
    );

    let dropped = 0;
    let missing = 0;

    for (const name of DEPRECATED_COLLECTIONS) {
      if (!existingNames.has(name)) {
        console.log(`- [missing] ${name}`);
        missing += 1;
        continue;
      }

      if (!apply) {
        console.log(`- [would drop] ${name}`);
        continue;
      }

      await db.collection(name).drop();
      console.log(`- [dropped] ${name}`);
      dropped += 1;
    }

    if (apply) {
      console.log(`Done. Dropped ${dropped} collection(s), ${missing} already missing.`);
    } else {
      console.log(
        "Dry-run complete. Re-run with '--apply' to drop the listed collections."
      );
    }
  } finally {
    await client.close();
  }
}

main().catch((error) => {
  console.error("Failed to process deprecated collection cleanup:", error);
  process.exit(1);
});
