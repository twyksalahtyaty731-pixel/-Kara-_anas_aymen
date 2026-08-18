
const { spawn } = require("child_process");
const { readFileSync } = require("fs-extra");
const axios = require("axios");
const semver = require("semver");
const logger = require("./utils/log");
const express = require("express");
const gradient = require("gradient-string");

const logo = `
███╗   ███╗ ██╗ ██████╗   █████╗ 
████╗ ████║ ██║ ██╔══██╗ ██╔══██╗
██╔████╔██║ ██║ ██████╔╝ ███████║
██║╚██╔╝██║ ██║ ██╔══██╗ ██╔══██║
██║ ╚═╝ ██║ ██║ ██║  ██║ ██║  ██║
╚═╝     ╚═╝ ╚═╝ ╚═╝  ╚═╝ ╚═╝  ╚═╝
`;

const c = ["cyan", "#7D053F"];
const redToGreen = gradient("red", "cyan");

console.log(redToGreen("━".repeat(50), { interpolation: "hsv" }));
const text = gradient(c).multiline(logo);
console.log(text);
console.log(redToGreen("━".repeat(50), { interpolation: "hsv" }));

const app = express();
const port = process.env.PORT || 3078;

app.get("/", (req, res) => {
  res.send(`Hello im MIRA Bot..🤖`);
});

function startBot(message) {
  if (message) {
    logger(message, "[ Starting ]");
  }

  const child = spawn(
    "node",
    ["--trace-warnings", "--async-stack-traces", "index.js"],
    {
      cwd: __dirname,
      stdio: "inherit",
      shell: true
    }
  );

  child.on("close", (codeExit) => {
    if (codeExit != 0 || (global.countRestart && global.countRestart < 5)) {
      global.countRestart = (global.countRestart || 0) + 1;
      startBot("Starting up...");
      return;
    }
  });

  child.on("error", (error) => {
    logger(
      "An error occurred: " + JSON.stringify(error),
      "[ Starting ]"
    );
  });
}

logger("MIRA BOT", "[ NAME ]");
logger("Version: 1.2.14", "[ VERSION ]");

startBot();

app.listen(port, () => {
  console.log(`MIRA bot running in port: ${port}`);
});
