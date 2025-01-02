const esbuild = require("esbuild");
const isDev = process.env.NODE_ENV == "development";

if (!isDev) {
  esbuild
    .build({
      entryPoints: ["src/index.js"],
      bundle: true,
      outfile: "dist/mod.js", // Mod output file
      platform: "node",
      target: "es2017"
    })
    .catch((err) => {
      throw err;
    });
} else {
  esbuild
    .context({
      entryPoints: ["src/index.js"],
      bundle: true,
      outfile: "svrjs/mods/mod.js", // Mod output file
      platform: "node",
      target: "es2017"
    })
    .then((ctx) => {
      ctx
        .watch()
        .then(() => {
          console.log("Watching for changes in SVR.JS mod source code...");
        })
        .catch((err) => {
          throw err;
        });
    })
    .catch((err) => {
      throw err;
    });
}
