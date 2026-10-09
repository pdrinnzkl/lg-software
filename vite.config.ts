import { nitro } from "nitro/vite";
import tailwindcss from "@tailwindcss/vite";
import vinext from "vinext";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const environment = loadEnv(mode, process.cwd(), "");
  const serverVariables = [
    "TURSO_DATABASE_URL",
    "TURSO_AUTH_TOKEN",
    "ADMIN_SETUP_CODE",
    "ADMIN_SETUP_CODES",
    "REFEREE_SETUP_CODE",
    "REFEREE_SETUP_CODES",
  ];

  for (const key of serverVariables) {
    if (!process.env[key] && environment[key]) {
      process.env[key] = environment[key];
    }
  }

  return {
    plugins: [tailwindcss(), vinext(), nitro()],
  };
});
