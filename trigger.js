const { TemplateArchiveProcessor } = require("@accordproject/template-engine");
const { Template } = require("@accordproject/cicero-core");
const fs = require("fs");
const path = require("path");

const TEMPLATE_PATH = "./archives/latedeliveryandpenalty-typescript";

function loadJsonFile(filePath) {
  try {
    const fullPath = path.resolve(filePath);
    const fileContent = fs.readFileSync(fullPath, "utf8");
    return JSON.parse(fileContent);
  } catch (error) {
    console.error(`Error loading JSON file '${filePath}':`, error.message);
    process.exit(1);
  }
}

function showUsage() {
  console.log(
    "Usage: node trigger.js <template-data-file> <request-data-file>"
  );
  console.log("\nExample:");
  console.log(
    "  node trigger.js data/template-basic.json data/request-basic.json"
  );
  console.log(
    "  node trigger.js data/template-low-penalty.json data/request-high-value.json"
  );
  console.log("\nAvailable files:");
  console.log("  Template data files:");
  console.log(
    "    - data/template-basic.json      (10.5% penalty, 15 day termination)"
  );
  console.log(
    "    - data/template-low-penalty.json (5% penalty, 30 day termination)"
  );
  console.log(
    "    - data/template-high-penalty.json (15% penalty, 7 day termination)"
  );
  console.log("  Request data files:");
  console.log("    - data/request-basic.json       ($100 goods value)");
  console.log("    - data/request-low-value.json   ($50 goods value)");
  console.log("    - data/request-high-value.json  ($1000 goods value)");
}

async function trigger() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("No data files specified.\n");
    showUsage();
    process.exit(1);
  }

  if (args[0] === "--help" || args[0] === "-h") {
    showUsage();
    process.exit(0);
  }

  if (args.length < 2) {
    console.log(
      "Both template data file and request data file are required.\n"
    );
    showUsage();
    process.exit(1);
  }

  const templateDataFile = args[0];
  const requestDataFile = args[1];

  console.log(`Running TRIGGER operation:`);
  console.log(`   Template data: ${templateDataFile}`);
  console.log(`   Request data:  ${requestDataFile}\n`);

  try {
    const template = await Template.fromDirectory(TEMPLATE_PATH);
    const templateArchiveProcessor = new TemplateArchiveProcessor(template);

    // Load template data (the contract parameters)
    const data = loadJsonFile(templateDataFile);

    // Load request data (the input for the business logic)
    const request = loadJsonFile(requestDataFile);

    console.log("\nInput Data:");
    console.log("=".repeat(50));
    console.log("Template Data:", JSON.stringify(data, null, 2));
    console.log("\nRequest Data:", JSON.stringify(request, null, 2));

    const response = await templateArchiveProcessor.trigger(data, request);

    console.log("\nBusiness Logic Response:");
    console.log("=".repeat(50));
    console.log(JSON.stringify(response, null, 2));

    // Show calculation details
    if (response && response.penalty !== undefined) {
      console.log("\nCalculation Details:");
      console.log(`Penalty Rate: ${data.penaltyPercentage}%`);
      console.log(`Goods Value: $${request.goodsValue}`);
      console.log(`Calculated Penalty: $${response.penalty}`);
      console.log(`Buyer May Terminate: ${response.buyerMayTerminate}`);
    }

    console.log("\nTrigger operation completed successfully!\n");
  } catch (error) {
    console.error("Error in trigger operation:", error.message);
    process.exit(1);
  }
}

// Run the trigger operation
trigger();
