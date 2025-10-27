const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// Helper function to run CLI commands
function runCLI(args, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", ["generate-pdf.js", ...args], {
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
      if (file.endsWith(".pdf") || file.endsWith(".md")) {
        try {
          fs.unlinkSync(path.join(outputDir, file));
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    });
  }
}

describe("generate-pdf.js CLI Tool", () => {
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
      expect(result.stdout).toContain("Usage: node generate-pdf.js");
      expect(result.stdout).toContain(
        "Generate PDF contract from template data"
      );
      expect(result.stdout).toContain("template-data-file");
      expect(result.stdout).toContain("output-file");
      expect(result.stdout).toContain("Examples:");
    });

    test("should show usage with -h flag", async () => {
      const result = await runCLI(["-h"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("Usage: node generate-pdf.js");
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

      try {
        const result = await runCLI([tempFile]);
        expect(result.code).toBe(1);
        expect(result.stderr).toContain("Error loading JSON file");
      } finally {
        // Clean up temp file
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });
  });

  describe("PDF Generation", () => {
    test("should generate PDF with basic template (default output)", async () => {
      const result = await runCLI(["data/template-basic.json"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("Generating PDF contract...");
      expect(result.stdout).toContain(
        "Loading template data from: data/template-basic.json"
      );
      expect(result.stdout).toContain("Loading Accord Project template...");
      expect(result.stdout).toContain("Generating markdown contract...");
      expect(result.stdout).toContain("Converting markdown to PDF...");
      expect(result.stdout).toContain("PDF Generation Results:");
      expect(result.stdout).toContain(
        "✓ Template data: data/template-basic.json"
      );
      expect(result.stdout).toContain("✓ PDF output: output/contract.pdf");
      expect(result.stdout).toContain("PDF generation completed successfully!");

      // Check that PDF file was created
      expect(fs.existsSync("output/contract.pdf")).toBe(true);

      // Check file size is reasonable
      const stats = fs.statSync("output/contract.pdf");
      expect(stats.size).toBeGreaterThan(1000); // Should be at least 1KB
    }, 45000);

    test("should generate PDF with custom output path", async () => {
      const customPath = "output/custom-contract.pdf";
      const result = await runCLI(["data/template-basic.json", customPath]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain(`✓ PDF output: ${customPath}`);

      // Check that PDF file was created at custom path
      expect(fs.existsSync(customPath)).toBe(true);
    }, 45000);

    test("should generate PDF with low penalty template", async () => {
      const result = await runCLI([
        "data/template-low-penalty.json",
        "output/low-penalty.pdf",
      ]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain(
        "✓ Template data: data/template-low-penalty.json"
      );
      expect(result.stdout).toContain("✓ PDF output: output/low-penalty.pdf");

      // Check that PDF file was created
      expect(fs.existsSync("output/low-penalty.pdf")).toBe(true);
    }, 45000);

    test("should generate PDF with high penalty template", async () => {
      const result = await runCLI([
        "data/template-high-penalty.json",
        "output/high-penalty.pdf",
      ]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain(
        "✓ Template data: data/template-high-penalty.json"
      );
      expect(result.stdout).toContain("✓ PDF output: output/high-penalty.pdf");

      // Check that PDF file was created
      expect(fs.existsSync("output/high-penalty.pdf")).toBe(true);
    }, 45000);

    test("should create output directory if it does not exist", async () => {
      const customDir = "test-output-dir";
      const customPath = `${customDir}/test-contract.pdf`;

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
    }, 45000);
  });

  describe("Output Validation", () => {
    test("should display file size in output", async () => {
      const result = await runCLI(["data/template-basic.json"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toMatch(/✓ File size: \d+\.\d+ KB/);
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
          `output/test-${path.basename(template, ".json")}.pdf`,
        ]);
        expect(result.code).toBe(0);
        expect(result.stdout).toContain(
          "PDF generation completed successfully!"
        );
      }
    }, 120000); // Increase timeout to 2 minutes for multiple template processing
  });
});
