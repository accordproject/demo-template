const { spawn } = require("child_process");

// Set up command line arguments for draft.js and trigger.js to use default data
const templateFile = "data/template-basic.json";
const requestFile = "data/request-basic.json";

function runCommand(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [command, ...args], {
      stdio: "inherit", // This will show output in real-time
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });

    child.on("error", (error) => {
      reject(error);
    });
  });
}

async function runSequentially() {
  await runCommand("draft.js", [templateFile]);
  await runCommand("trigger.js", [templateFile, requestFile]);
}

runSequentially().catch(console.error);
