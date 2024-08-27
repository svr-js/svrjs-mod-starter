const cluster = require("./utils/clusterBunShim.js"); // Cluster shim for Bun
const { add } = require("./utils/helper.js"); // Require the addition module
const modInfo = require("../modInfo.json"); // SVR.JS mod information

// Exported SVR.JS mod callback
module.exports = (req, res, logFacilities, config, next) => {
  if (req.parsedURL.pathname == "/test.svr") {
    res.writeHead(200, "OK", {
      "Content-Type": "text/plain"
    });
    res.end("2 + 2 = " + add(2,2));
  } else if (req.parsedURL.pathname == "/ping.svr") {
    if (!cluster.isWorker) {
      // Invoke 500 Internal Server Error status code, if the process is not a worker
      res.error(500, new Error("SVR.JS is running single-threaded, so this request is not supported"));
      return;
    }

    // Ping OK message listener
    const pingOKListener = (message) => {
      if (message == "\x14MODPINGOK") {
        process.removeListener("message", pingOKListener);
        res.writeHead(200, "OK", {
          "Content-Type": "text/plain"
        });
        res.end("OK");
      }
    };

    // Listen to Ping OK messages
    process.on("message", pingOKListener);

    // Send Ping message
    process.send("\x12MODPING");
  } else {
    next(); // Invoke other request handlers
  }
};

// Exported command
module.exports.commands = {
  somecmd: (args, log, passCommand) => {
    log("Arguments: " + args.toString()); // Print arguments
    passCommand(args, log) // Invoke other command handlers
  }
};

// Uncomment, if you want the callback to cover the forward proxy requests
//module.exports.proxySafe = true;

// Uncomment, if you want to handle proxy requests
//module.exports.proxy = (req, socket, head, logFacilities, config, next) => {
//  next(); // Invoke other proxy handlers
//}

// IPC listener for main process
// Control messages received by main process begin with 0x12 control character
// Control messages sent by main process begin with 0x14 control character
process.messageEventListeners.push((worker, serverconsole) => {
  return (message) => {
    if (message == "\x12MODPING") {
      // Ping back
      worker.send("\x14MODPINGOK");
    }
  }
});

module.exports.modInfo = modInfo;
