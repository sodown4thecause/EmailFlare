import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import esbuild from "esbuild";
import { getStaticAssets } from "./assets.js";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const ASSETS = await getStaticAssets("../app/dist");

// add config
if (process.argv.includes("--config")) {
    const configPath = path.resolve(__dirname, "../../app/config.json");
    const configContent = await fs.readFile(configPath, "utf8");
    ASSETS.push({
        path: "/assets/config.js",
        contentType: "text/javascript",
        data: `export default ${configContent}`,
        encoding: "utf8"
    });
}


await fs.writeFile("./dist/index.ts", `
import app from "../app";
export const ASSETS = ${JSON.stringify(ASSETS)};

export default app(ASSETS);
`, "utf8");

// build API
await esbuild.build({
    bundle: true,
    minify: true,
    entryPoints: ["./dist/index.ts"],
    outfile: "./dist/index.bundle.js",
    format: "esm",
    target: "esnext",
    conditions: ["workerd"],
    external: ["node:*"],
    define: {
        "process.env.NODE_ENV": "\"production\""
    }
});

await fs.unlink("./dist/index.ts");
