#!/usr/bin/env node
/**
 * CI guards: catch classes of issues that power attack chains W1–W5.
 * Fails the build; does not replace manual RLS review.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "../..")
let failed = 0
function fail(msg) {
  console.error(`[security:check] FAIL: ${msg}`)
  failed += 1
}
function read(p) {
  return fs.readFileSync(p, "utf8")
}
function walk(dir, pred, cb) {
  if (!fs.existsSync(dir)) return
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name === ".git") continue
    const p = path.join(dir, name)
    const st = fs.statSync(p)
    if (st.isDirectory()) walk(p, pred, cb)
    else if (pred(p)) cb(p, read(p))
  }
}

// G1: service / secret patterns in Vite client tree
const clientDir = path.join(root, "client", "src")
if (fs.existsSync(clientDir)) {
  walk(
    clientDir,
    (p) => p.endsWith(".ts") || p.endsWith(".tsx"),
    (p, text) => {
      if (/\bSERVICE_ROLE\b|service_role/i.test(text)) {
        fail(`possible service role reference in client: ${p}`)
      }
    },
  )
}

// G2: engagement must not return raw .message to client (W1) — if reintroduced, fail
const eng = path.join(root, "supabase/functions/engagement/index.ts")
if (fs.existsSync(eng)) {
  const t = read(eng)
  if (/return json\(\{ error: \w+Err?\.message/.test(t) || /error: \w+\.message/.test(t)) {
    fail("engagement function still exposes .message to clients")
  }
}

// G3: warn-only — AI_DISABLE_AUTH in example files should stay commented
for (const f of [".env.example", ".env.docker.example"]) {
  const p = path.join(root, f)
  if (fs.existsSync(p)) {
    const lines = read(p).split("\n")
    for (const line of lines) {
      if (/^AI_DISABLE_AUTH=1\s*$/m.test(line) || /^AI_DISABLE_AUTH=true\s*$/m.test(line)) {
        // uncommented line that enables auth off
        if (!line.trim().startsWith("#")) {
          fail(`${f} has uncommented AI_DISABLE_AUTH — do not commit enabled`)
        }
      }
    }
  }
}

if (failed) {
  process.exit(1)
}
console.log("[security:check] static guards passed")
