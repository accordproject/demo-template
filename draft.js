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
  console.log("Usage: node draft.js <template-data-file>");
  console.log("\nExample:");
  console.log("  node draft.js data/template-basic.json");
  console.log("  node draft.js data/template-low-penalty.json");
  console.log("  node draft.js data/template-high-penalty.json");
  console.log("\nAvailable template data files:");
  console.log("  - data/template-basic.json      (default scenario)");
  console.log(
    "  - data/template-low-penalty.json (5% penalty, 30 day termination)"
  );
  console.log(
    "  - data/template-high-penalty.json (15% penalty, 7 day termination)"
  );
}

async function draft() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log("No template data file specified.\n");
    showUsage();
    process.exit(1);
  }

  if (args[0] === "--help" || args[0] === "-h") {
    showUsage();
    process.exit(0);
  }

  const templateDataFile = args[0];
  console.log(
    `Running DRAFT operation with template data: ${templateDataFile}\n`
  );

  try {
    const template = await Template.fromDirectory(TEMPLATE_PATH);
    const templateArchiveProcessor = new TemplateArchiveProcessor(template);

    const data = loadJsonFile(templateDataFile);

    const options = { verbose: false };
    const result = await templateArchiveProcessor.draft(
      data,
      "markdown",
      options
    );

    console.log("\n\nContract Draft:");
    console.log("____________________\n");
    console.log(result);
    console.log("____________________\n");
    console.log("\nDraft operation completed successfully!\n");
  } catch (error) {
    console.error("Error in draft operation:", error.message);
    process.exit(1);
  }
}

draft();
