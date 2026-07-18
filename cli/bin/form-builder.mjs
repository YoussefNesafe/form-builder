#!/usr/bin/env node
import { runCli } from "../src/cli.mjs";

try {
  runCli(process.argv.slice(2));
} catch (err) {
  console.error(err?.message ?? err);
  process.exit(1);
}
