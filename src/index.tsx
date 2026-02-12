import { createCliRenderer } from "@opentui/core";
import { createRoot } from "@opentui/react";
import { App } from "./app/App";
import pkg from "../package.json";

if (process.argv.includes("--version") || process.argv.includes("-v")) {
  console.log(pkg.version);
  process.exit(0);
}

const renderer = await createCliRenderer();
createRoot(renderer).render(<App />);
