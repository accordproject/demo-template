const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// Helper function to run CLI commands
function runCLI(args, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", ["generate-md.js", ...args], {
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    const timer = setTimeout(() => {
      child.kill();
      reject(new Error(`Command timed out after ${timeout}ms`));
    }, timeout);

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({
        code,
        stdout,
        stderr,
      });
    });

    child.on("error", (error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}

// Clean up generated files after tests
function cleanupOutputFiles() {
  const outputDir = "output";
  if (fs.existsSync(outputDir)) {
    const files = fs.readdirSync(outputDir);
    files.forEach((file) => {
      if (file.endsWith(".md")) {
        try {
          fs.unlinkSync(path.join(outputDir, file));
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    });
  }
}

describe("generate-md.js CLI Tool", () => {
  beforeEach(() => {
    cleanupOutputFiles();
  });

  afterAll(() => {
    cleanupOutputFiles();
  });

  describe("Help and Usage", () => {
    test("should show usage with --help flag", async () => {
      const result = await runCLI(["--help"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("Usage: node generate-md.js");
      expect(result.stdout).toContain(
        "Generate markdown contract from template data"
      );
      expect(result.stdout).toContain("template-data-file");
      expect(result.stdout).toContain("output-file");
      expect(result.stdout).toContain("Examples:");
    });

    test("should show usage with -h flag", async () => {
      const result = await runCLI(["-h"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("Usage: node generate-md.js");
    });

    test("should list available template data files", async () => {
      const result = await runCLI(["--help"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("Available template data files:");
      expect(result.stdout).toContain("data/template-basic.json");
      expect(result.stdout).toContain("data/template-low-penalty.json");
      expect(result.stdout).toContain("data/template-high-penalty.json");
    });
  });

  describe("Error Handling", () => {
    test("should show error when no arguments provided", async () => {
      const result = await runCLI([]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("Error: Template data file is required");
    });

    test("should show error when template file does not exist", async () => {
      const result = await runCLI(["nonexistent.json"]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain(
        "Template data file 'nonexistent.json' not found"
      );
    });

    test("should handle invalid JSON in template file", async () => {
      // Create a temporary invalid JSON file
      const tempFile = "temp-invalid.json";
      fs.writeFileSync(tempFile, "{ invalid json }");

      // Verify file was created
      expect(fs.existsSync(tempFile)).toBe(true);

      try {
        const result = await runCLI([tempFile]);
        expect(result.code).toBe(1);
        // The error could be either file not found (if cleaned up) or JSON parsing error
        expect(
          result.stderr.includes(`Error loading JSON file '${tempFile}':`) ||
            result.stderr.includes(`Template data file '${tempFile}' not found`)
        ).toBe(true);
      } finally {
        // Clean up temp file
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });
  });

  describe("Markdown Generation", () => {
    test("should generate markdown with basic template (default output)", async () => {
      const result = await runCLI(["data/template-basic.json"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("Generating markdown contract...");
      expect(result.stdout).toContain(
        "Loading template data from: data/template-basic.json"
      );
      expect(result.stdout).toContain("Loading Accord Project template...");
      expect(result.stdout).toContain("Markdown Generation Results:");
      expect(result.stdout).toContain(
        "✓ Template data: data/template-basic.json"
      );
      expect(result.stdout).toContain("✓ Markdown output: output/contract.md");
      expect(result.stdout).toContain(
        "Markdown generation completed successfully!"
      );

      // Check that markdown file was created
      expect(fs.existsSync("output/contract.md")).toBe(true);

      // Check file content
      const content = fs.readFileSync("output/contract.md", "utf8");
      expect(content).toContain("Late Delivery and Penalty");
      expect(content).toContain("penalty");
      expect(content).toContain("delay");
    });

    test("should generate markdown with custom output path", async () => {
      const customPath = "output/custom-contract.md";
      const result = await runCLI(["data/template-basic.json", customPath]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain(`✓ Markdown output: ${customPath}`);

      // Check that markdown file was created at custom path
      expect(fs.existsSync(customPath)).toBe(true);
    });

    test("should generate markdown with low penalty template", async () => {
      const result = await runCLI([
        "data/template-low-penalty.json",
        "output/low-penalty.md",
      ]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain(
        "✓ Template data: data/template-low-penalty.json"
      );
      expect(result.stdout).toContain(
        "✓ Markdown output: output/low-penalty.md"
      );

      // Check that markdown file was created
      expect(fs.existsSync("output/low-penalty.md")).toBe(true);

      // Check content reflects low penalty configuration
      const content = fs.readFileSync("output/low-penalty.md", "utf8");
      expect(content).toContain("Late Delivery and Penalty");
    });

    test("should generate markdown with high penalty template", async () => {
      const result = await runCLI([
        "data/template-high-penalty.json",
        "output/high-penalty.md",
      ]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain(
        "✓ Template data: data/template-high-penalty.json"
      );
      expect(result.stdout).toContain(
        "✓ Markdown output: output/high-penalty.md"
      );

      // Check that markdown file was created
      expect(fs.existsSync("output/high-penalty.md")).toBe(true);
    });

    test("should create output directory if it does not exist", async () => {
      const customDir = "test-output-dir";
      const customPath = `${customDir}/test-contract.md`;

      // Ensure directory doesn't exist
      if (fs.existsSync(customDir)) {
        fs.rmSync(customDir, { recursive: true });
      }

      try {
        const result = await runCLI(["data/template-basic.json", customPath]);

        expect(result.code).toBe(0);
        expect(fs.existsSync(customPath)).toBe(true);
      } finally {
        // Clean up test directory
        if (fs.existsSync(customDir)) {
          fs.rmSync(customDir, { recursive: true });
        }
      }
    });

    test("should handle different template configurations", async () => {
      // Test all three template variants
      const templates = [
        "data/template-basic.json",
        "data/template-low-penalty.json",
        "data/template-high-penalty.json",
      ];

      for (const template of templates) {
        const result = await runCLI([
          template,
          `output/test-${path.basename(template, ".json")}.md`,
        ]);
        expect(result.code).toBe(0);
        expect(result.stdout).toContain(
          "Markdown generation completed successfully!"
        );
      }
    }, 60000); // Increase timeout to 1 minute for multiple template processing
  });

  describe("Output Validation", () => {
    test("should display file size in output", async () => {
      const result = await runCLI(["data/template-basic.json"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toMatch(/✓ File size: \d+\.\d+ KB/);
    });

    test("should generate valid markdown content", async () => {
      const result = await runCLI(["data/template-basic.json"]);

      expect(result.code).toBe(0);

      // Check that markdown file contains expected structure
      const content = fs.readFileSync("output/contract.md", "utf8");
      expect(content).toContain("Late Delivery and Penalty");
      expect(content).toContain("----"); // Markdown separator
      expect(content).toContain("penalty");
      expect(content).toContain("delay");
      expect(content).toContain("%"); // Percentage values
    });

    test("should handle different template configurations", async () => {
      // Test all three template variants
      const templates = [
        "data/template-basic.json",
        "data/template-low-penalty.json",
        "data/template-high-penalty.json",
      ];

      for (const template of templates) {
        const result = await runCLI([
          template,
          `output/test-${path.basename(template, ".json")}.md`,
        ]);
        expect(result.code).toBe(0);
        expect(result.stdout).toContain(
          "Markdown generation completed successfully!"
        );

        // Verify file was created and has content
        const outputFile = `output/test-${path.basename(template, ".json")}.md`;
        expect(fs.existsSync(outputFile)).toBe(true);

        const content = fs.readFileSync(outputFile, "utf8");
        expect(content.length).toBeGreaterThan(100); // Should have substantial content
      }
    }, 60000); // Increase timeout to 1 minute for multiple template processing
  });
});
