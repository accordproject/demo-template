#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { Template } = require("@accordproject/cicero-core");
const { TemplateArchiveProcessor } = require("@accordproject/template-engine");

// Function to show usage information
function showUsage() {
  console.log(
    "Usage: node generate-json.js <template-data-file> <request-data-file> [output-file]"
  );
  console.log("");
  console.log(
    "Generate JSON business logic response from template and request data"
  );
  console.log("");
  console.log("Arguments:");
  console.log(
    "  template-data-file    Path to JSON file containing template data"
  );
  console.log(
    "  request-data-file     Path to JSON file containing request data"
  );
  console.log(
    "  output-file          Optional: JSON output file path (default: output/response.json)"
  );
  console.log("");
  console.log("Examples:");
  console.log(
    "  node generate-json.js data/template-basic.json data/request-basic.json"
  );
  console.log(
    "  node generate-json.js data/template-basic.json data/request-basic.json output/response.json"
  );
  console.log(
    "  node generate-json.js data/template-low-penalty.json data/request-low-value.json output/low-response.json"
  );
  console.log("");
  console.log("Available template data files:");

  // List available template files
  const dataDir = "data";
  if (fs.existsSync(dataDir)) {
    const templateFiles = fs
      .readdirSync(dataDir)
      .filter((f) => f.startsWith("template-") && f.endsWith(".json"))
      .sort();

    templateFiles.forEach((file) => {
      console.log(`  data/${file}`);
    });

    console.log("");
    console.log("Available request data files:");

    const requestFiles = fs
      .readdirSync(dataDir)
      .filter((f) => f.startsWith("request-") && f.endsWith(".json"))
      .sort();

    requestFiles.forEach((file) => {
      console.log(`  data/${file}`);
    });
  }
}

// Function to load JSON file
function loadJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    console.error(`Error loading JSON file '${filePath}':`, error.message);
    process.exit(1);
  }
}

// Function to ensure directory exists
function ensureDirectoryExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Main function
async function main() {
  // Check for help flags
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    showUsage();
    process.exit(0);
  }

  // Check arguments
  if (process.argv.length < 4) {
    console.error(
      "Error: Both template data file and request data file are required"
    );
    console.log("");
    showUsage();
    process.exit(1);
  }

  const templateDataFile = process.argv[2];
  const requestDataFile = process.argv[3];
  const outputFile = process.argv[4] || "output/response.json";

  // Validate files exist
  if (!fs.existsSync(templateDataFile)) {
    console.error(`Error: Template data file '${templateDataFile}' not found`);
    process.exit(1);
  }

  if (!fs.existsSync(requestDataFile)) {
    console.error(`Error: Request data file '${requestDataFile}' not found`);
    process.exit(1);
  }

  try {
    console.log("Generating JSON business logic response...");
    console.log("_".repeat(50));

    // Load template and request data
    console.log(`Loading template data from: ${templateDataFile}`);
    const templateData = loadJsonFile(templateDataFile);

    console.log(`Loading request data from: ${requestDataFile}`);
    const requestData = loadJsonFile(requestDataFile);

    // Load the template
    console.log("Loading Accord Project template...");
    const template = await Template.fromDirectory(
      "./archives/latedeliveryandpenalty-typescript"
    );

    // Create template processor
    const processor = new TemplateArchiveProcessor(template);

    // Execute business logic
    console.log("Executing business logic...");
    const response = await processor.trigger(templateData, requestData);

    // Ensure output directory exists
    ensureDirectoryExists(outputFile);

    // Write JSON response file (core response only)
    fs.writeFileSync(outputFile, JSON.stringify(response, null, 2));

    // Get file stats
    const stats = fs.statSync(outputFile);

    console.log("_".repeat(50));
    console.log("JSON Response Generation Results:");
    console.log(`✓ Template data: ${templateDataFile}`);
    console.log(`✓ Request data: ${requestDataFile}`);
    console.log(`✓ JSON output: ${outputFile}`);
    console.log(`✓ File size: ${(stats.size / 1024).toFixed(1)} KB`);

    // Display key response details
    if (response && response.result && response.result.penalty !== undefined) {
      console.log(`✓ Penalty calculated: ${response.result.penalty}%`);
    }

    console.log("");
    console.log("JSON response generation completed successfully!");
  } catch (error) {
    console.error("Error generating JSON response:", error.message);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

// Run the main function
main();
