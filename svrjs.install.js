// Code in the SVR.JS installation script is derived from the "create-svrjs-server" command.

const fs = require("fs");
const https = require("https");
const zip = require("zip");
const zlib = require("zlib");
const YAML = require("yaml");

function downloadSVRJS(version) {
  const normalizedVersion = version.toLowerCase().replace(/[^0-9a-z]+/g, ".");
  let path = "/svr.js." + normalizedVersion + ".zip";
  if (normalizedVersion.indexOf("beta") != -1)
    path = "/beta/svr.js." + normalizedVersion + ".zip";
  if (normalizedVersion.indexOf("nightly") != -1)
    path = "/nightly/svr.js." + normalizedVersion + ".zip";
  https
    .get(
      {
        hostname: "downloads.svrjs.org",
        port: 443,
        path: path,
        method: "GET"
      },
      (res) => {
        let zipData = "";
        if (res.statusCode != 200) {
          console.log(
            "Server returned the " +
              res.statusCode +
              " HTTP status code while trying to download SVR.JS " +
              version
          );
          process.exit(1);
        }

        res.on("data", (chunk) => {
          zipData += chunk.toString("latin1");
        });

        res.on("end", function () {
          console.log("Downloaded the .zip file");
          zipData = Buffer.from(zipData, "latin1");
          const reader = zip.Reader(zipData);
          const allFiles = reader.toObject();
          Object.keys(allFiles).forEach((filename) => {
            const paths = filename.split("/");
            for (let i = 0; i < paths.length - 1; i++) {
              const dirname = JSON.parse(JSON.stringify(paths))
                .splice(0, i + 1)
                .join("/");
              if (!fs.existsSync(__dirname + "/svrjs/" + dirname)) {
                fs.mkdirSync(__dirname + "/svrjs/" + dirname);
              }
            }
            fs.writeFileSync(
              __dirname + "/svrjs/" + filename,
              allFiles[filename]
            );
          });
          if (!fs.existsSync(__dirname + "/svrjs/mods")) fs.mkdirSync(__dirname + "/svrjs/mods");
          if (fs.existsSync(__dirname + "/svrjs/svr.compressed")) {
            console.log("Deleting SVR.JS stub...");
            fs.unlinkSync(__dirname + "/svrjs/svr.js");
            // Modules aren't extracted in SVR.JS's 4.x stub, so no module extraction code here.
            console.log("Decompressing SVR.JS...");
            const script = zlib.gunzipSync(
              fs.readFileSync(__dirname + "/svrjs/svr.compressed")
            );
            fs.unlinkSync(__dirname + "/svrjs/svr.compressed");
            fs.writeFileSync(__dirname + "/svrjs/svr.js", script);
          }
          if (fs.existsSync(__dirname + "/svrjs/svrjs.yaml")) {
            console.log("Modifying SVR.JS configuration...");
            let svrjsConfig = YAML.parse(fs.readFileSync(__dirname + "/svrjs/svrjs.yaml"));
            if (!svrjsConfig) svrjsConfig = {};
            if (!svrjsConfig.global) svrjsConfig.global = {};
            svrjsConfig.global.enableDirectoryListing = true;
            svrjsConfig.global.stackHidden = false;
            svrjsConfig.global.exposeServerVersion = true;
            svrjsConfig.global.exposeModsInErrorPages = true;
            fs.writeFileSync(__dirname + "/svrjs/svrjs.yaml", YAML.stringify(svrjsConfig));
          } else if (fs.existsSync(__dirname + "/svrjs/config.json")) {
            console.log("Modifying SVR.JS configuration...");
            let svrjsConfig = JSON.parse(fs.readFileSync(__dirname + "/svrjs/config.json"));
            if (!svrjsConfig) svrjsConfig = {};
            svrjsConfig.enableDirectoryListing = true;
            svrjsConfig.stackHidden = false;
            svrjsConfig.exposeServerVersion = true;
            svrjsConfig.exposeModsInErrorPages = true;
            fs.writeFileSync(__dirname + "/svrjs/svrjs.yaml", JSON.stringify(svrjsConfig, null, 2));
          }
          console.log("SVR.JS is installed successfully.");
        });
      }
    )
    .on("error", function () {
      console.log("Can't connect to the SVR.JS download server!");
      process.exit(1);
    });
}

if (fs.existsSync(__dirname + "/svrjs")) {
  console.log("SVR.JS is already installed.");
} else {
  fs.mkdirSync(__dirname + "/svrjs");
  https
    .get(
      {
        hostname: "downloads.svrjs.org",
        port: 443,
        path: "/latest.svrjs",
        method: "GET"
      },
      (res) => {
        if (res.statusCode != 200) {
          console.log(
            "Server returned the " + res.statusCode + " HTTP status code"
          );
          process.exit(1);
        }
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          const selectedVersion = data.trim();
          if (!selectedVersion) {
            console.log(
              "Can't obtain the latest version from downloads server"
            );
            process.exit(1);
          } else {
            console.log("Selected SVR.JS " + selectedVersion);
            downloadSVRJS(selectedVersion);
          }
        });
      }
    )
    .on("error", function () {
      console.log("Can't connect to the SVR.JS download server!");
      process.exit(1);
    });
}
