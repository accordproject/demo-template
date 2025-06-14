#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { Template } = require("@accordproject/cicero-core");
const { TemplateArchiveProcessor } = require("@accordproject/template-engine");

// Function to show usage information
function showUsage() {
  console.log("Usage: node generate-md.js <template-data-file> [output-file]");
  console.log("");
  console.log("Generate markdown contract from template data");
  console.log("");
  console.log("Arguments:");
  console.log(
    "  template-data-file    Path to JSON file containing template data"
  );
  console.log(
    "  output-file          Optional: Markdown output file path (default: output/contract.md)"
  );
  console.log("");
  console.log("Examples:");
  console.log("  node generate-md.js data/template-basic.json");
  console.log(
    "  node generate-md.js data/template-basic.json output/contract.md"
  );
  console.log("  node generate-md.js data/template-basic.json custom/path.md");
  console.log("");
  console.log("Available template data files:");

  // List available template files
  const dataDir = "data";
  if (fs.existsSync(dataDir)) {
    const files = fs
      .readdirSync(dataDir)
      .filter((f) => f.startsWith("template-") && f.endsWith(".json"))
      .sort();

    files.forEach((file) => {
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
  if (process.argv.length < 3) {
    console.error("Error: Template data file is required");
    console.log("");
    showUsage();
    process.exit(1);
  }

  const templateDataFile = process.argv[2];
  const outputFile = process.argv[3] || "output/contract.md";

  // Validate template data file exists
  if (!fs.existsSync(templateDataFile)) {
    console.error(`Error: Template data file '${templateDataFile}' not found`);
    process.exit(1);
  }

  try {
    console.log("Generating markdown contract...");
    console.log("_".repeat(50));

    // Load template data
    console.log(`Loading template data from: ${templateDataFile}`);
    const templateData = loadJsonFile(templateDataFile);

    // Load the template
    console.log("Loading Accord Project template...");
    const template = await Template.fromDirectory(
      "./archives/latedeliveryandpenalty-typescript"
    );

    // Create template processor
    const processor = new TemplateArchiveProcessor(template);

    // Generate markdown
    console.log("Generating markdown contract...");
    const markdown = await processor.draft(templateData, "markdown", {
      verbose: false,
    });

    // Ensure output directory exists
    ensureDirectoryExists(outputFile);

    // Write markdown file
    fs.writeFileSync(outputFile, markdown);

    // Get file stats
    const stats = fs.statSync(outputFile);

    console.log("_".repeat(50));
    console.log("Markdown Generation Results:");
    console.log(`✓ Template data: ${templateDataFile}`);
    console.log(`✓ Markdown output: ${outputFile}`);
    console.log(`✓ File size: ${(stats.size / 1024).toFixed(1)} KB`);
    console.log("");
    console.log("Markdown generation completed successfully!");
  } catch (error) {
    console.error("Error generating markdown:", error.message);
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
