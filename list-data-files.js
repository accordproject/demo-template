const fs = require("fs");
const path = require("path");

function listDataFiles() {
  console.log("Available Data Files\n");

  const dataDir = "./data";

  if (!fs.existsSync(dataDir)) {
    console.log("Data directory not found!");
    return;
  }

  const files = fs
    .readdirSync(dataDir)
    .filter((file) => file.endsWith(".json"));

  if (files.length === 0) {
    console.log("No JSON files found in data directory!");
    return;
  }

  // Separate template and request files
  const templateFiles = files.filter((file) => file.startsWith("template-"));
  const requestFiles = files.filter((file) => file.startsWith("request-"));

  console.log("Template Data Files:");
  console.log("─".repeat(50));

  templateFiles.forEach((file) => {
    try {
      const filePath = path.join(dataDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      console.log(`${file}`);
      console.log(`   Penalty: ${data.penaltyPercentage}%`);
      console.log(
        `   Termination: ${data.termination.amount} ${data.termination.unit}`
      );
      console.log(`   Force Majeure: ${data.forceMajeure}`);
      console.log(
        `   Penalty Duration: ${data.penaltyDuration.amount} ${data.penaltyDuration.unit}`
      );
      console.log(`   Cap: ${data.capPercentage}%`);
      console.log();
    } catch (error) {
      console.log(`Error reading ${file}: ${error.message}`);
    }
  });

  console.log("Request Data Files:");
  console.log("─".repeat(50));

  requestFiles.forEach((file) => {
    try {
      const filePath = path.join(dataDir, file);
      const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
      console.log(`${file}`);
      console.log(`   Goods Value: $${data.goodsValue}`);
      console.log();
    } catch (error) {
      console.log(`Error reading ${file}: ${error.message}`);
    }
  });

  console.log("Example Commands:");
  console.log("─".repeat(50));
  console.log("npm run draft:low");
  console.log("npm run trigger:high");
  console.log("node draft.js data/template-basic.json");
  console.log(
    "node trigger.js data/template-high-penalty.json data/request-low-value.json"
  );
  console.log(
    "\nFor more help: node draft.js --help or node trigger.js --help"
  );
}

listDataFiles();
