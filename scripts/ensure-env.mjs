// Creates .env from .env.example on first run (works on Windows, macOS and Linux).
import { copyFileSync, existsSync } from "node:fs";

if (!existsSync(".env")) {
  copyFileSync(".env.example", ".env");
  console.log("Created .env from .env.example — edit AUTH_SECRET and the admin password before going live.");
}
