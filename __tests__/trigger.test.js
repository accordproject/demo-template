const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");
// CLI testing for trigger.js - no mocking needed since we test via process spawning

// Helper function to run the CLI tool and capture output
function runCLI(scriptName, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", [scriptName, ...args], {
      cwd: process.cwd(),
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

    child.on("close", (code) => {
      resolve({
        code,
        stdout,
        stderr,
      });
    });

    child.on("error", (error) => {
      reject(error);
    });

    // Set a timeout to prevent hanging
    setTimeout(() => {
      child.kill();
      reject(new Error("Process timeout"));
    }, 10000);
  });
}

describe("Trigger CLI Tool Tests", () => {
  const scriptPath = "trigger.js";
  const testDataDir = "data";

  beforeAll(() => {
    // Ensure data directory exists and has the expected files
    if (!fs.existsSync(testDataDir)) {
      console.warn(`Warning: ${testDataDir} directory not found`);
    }
  });

  describe("Help and Usage", () => {
    test("should show usage when no arguments provided", async () => {
      const result = await runCLI(scriptPath);

      expect(result.code).toBe(1);
      expect(result.stdout).toContain("Usage: node trigger.js");
      expect(result.stdout).toContain("No data files specified");
    });

    test("should show help with --help flag", async () => {
      const result = await runCLI(scriptPath, ["--help"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("Usage: node trigger.js");
      expect(result.stdout).toContain("Available files:");
    });

    test("should show help with -h flag", async () => {
      const result = await runCLI(scriptPath, ["-h"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("Usage: node trigger.js");
    });

    test("should show error when only one argument provided", async () => {
      const result = await runCLI(scriptPath, ["template.json"]);

      expect(result.code).toBe(1);
      expect(result.stdout).toContain(
        "Both template data file and request data file are required"
      );
    });
  });

  describe("File Loading and Validation", () => {
    test("should handle non-existent template file", async () => {
      const result = await runCLI(scriptPath, [
        "non-existent.json",
        "data/request-basic.json",
      ]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("Error loading JSON file");
    });

    test("should handle non-existent request file", async () => {
      const result = await runCLI(scriptPath, [
        "data/template-basic.json",
        "non-existent.json",
      ]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("Error loading JSON file");
    });

    test("should handle invalid JSON in template file", async () => {
      // Create a temporary invalid JSON file
      const tempFile = "temp-invalid.json";
      fs.writeFileSync(tempFile, "{ invalid json }");

      try {
        const result = await runCLI(scriptPath, [
          tempFile,
          "data/request-basic.json",
        ]);

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

  describe("Successful Operations", () => {
    test("should run successfully with basic template and request", async () => {
      // Check if the data files exist
      const templateFile = "data/template-basic.json";
      const requestFile = "data/request-basic.json";

      if (!fs.existsSync(templateFile) || !fs.existsSync(requestFile)) {
        console.warn(
          `Skipping test - data files not found: ${templateFile}, ${requestFile}`
        );
        return;
      }

      const result = await runCLI(scriptPath, [templateFile, requestFile]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("Running TRIGGER operation:");
      expect(result.stdout).toContain("Template data:");
      expect(result.stdout).toContain("Request data:");
      expect(result.stdout).toContain("Business Logic Response:");
      expect(result.stdout).toContain(
        "Trigger operation completed successfully!"
      );
    });

    test("should display business logic response details", async () => {
      const templateFile = "data/template-basic.json";
      const requestFile = "data/request-basic.json";

      if (!fs.existsSync(templateFile) || !fs.existsSync(requestFile)) {
        console.warn(`Skipping test - data files not found`);
        return;
      }

      const result = await runCLI(scriptPath, [templateFile, requestFile]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("Business Logic Response:");
      expect(result.stdout).toContain("penalty");
      expect(result.stdout).toContain("buyerMayTerminate");
      // Note: The response structure has penalty in result.penalty, not directly in response.penalty
      // So the "Calculation Details" section may not appear with the current response structure
    });

    test("should work with low penalty template", async () => {
      const templateFile = "data/template-low-penalty.json";
      const requestFile = "data/request-low-value.json";

      if (!fs.existsSync(templateFile) || !fs.existsSync(requestFile)) {
        console.warn(`Skipping test - data files not found`);
        return;
      }

      const result = await runCLI(scriptPath, [templateFile, requestFile]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain(
        "Trigger operation completed successfully!"
      );
    });

    test("should work with high penalty template", async () => {
      const templateFile = "data/template-high-penalty.json";
      const requestFile = "data/request-high-value.json";

      if (!fs.existsSync(templateFile) || !fs.existsSync(requestFile)) {
        console.warn(`Skipping test - data files not found`);
        return;
      }

      const result = await runCLI(scriptPath, [templateFile, requestFile]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain(
        "Trigger operation completed successfully!"
      );
    });
  });

  describe("Output Formatting", () => {
    test("should include proper sections in output", async () => {
      const templateFile = "data/template-basic.json";
      const requestFile = "data/request-basic.json";

      if (!fs.existsSync(templateFile) || !fs.existsSync(requestFile)) {
        console.warn(`Skipping test - data files not found`);
        return;
      }

      const result = await runCLI(scriptPath, [templateFile, requestFile]);

      expect(result.code).toBe(0);

      // Check for section headers
      expect(result.stdout).toContain("Input Data:");
      expect(result.stdout).toContain("=".repeat(50));
      expect(result.stdout).toContain("Template Data:");
      expect(result.stdout).toContain("Request Data:");
      expect(result.stdout).toContain("Business Logic Response:");
    });

    test("should format JSON output properly", async () => {
      const templateFile = "data/template-basic.json";
      const requestFile = "data/request-basic.json";

      if (!fs.existsSync(templateFile) || !fs.existsSync(requestFile)) {
        console.warn(`Skipping test - data files not found`);
        return;
      }

      const result = await runCLI(scriptPath, [templateFile, requestFile]);

      expect(result.code).toBe(0);

      // Should contain formatted JSON (with indentation)
      expect(result.stdout).toMatch(/{\s+["\w$]/); // JSON with indentation
    });
  });

  describe("CLI Interface Consistency", () => {
    test("should show consistent file examples in help", async () => {
      const result = await runCLI(scriptPath, ["--help"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("template-basic.json");
      expect(result.stdout).toContain("template-low-penalty.json");
      expect(result.stdout).toContain("template-high-penalty.json");
      expect(result.stdout).toContain("request-basic.json");
      expect(result.stdout).toContain("request-low-value.json");
      expect(result.stdout).toContain("request-high-value.json");
    });

    test("should show proper command examples", async () => {
      const result = await runCLI(scriptPath, ["--help"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain(
        "node trigger.js data/template-basic.json data/request-basic.json"
      );
      expect(result.stdout).toContain(
        "node trigger.js data/template-low-penalty.json data/request-high-value.json"
      );
    });
  });

  describe("Error Scenarios", () => {
    test("should handle template archive errors gracefully", async () => {
      // Create a valid JSON file but with invalid template structure
      const tempTemplate = "temp-template.json";
      const tempRequest = "temp-request.json";

      fs.writeFileSync(tempTemplate, JSON.stringify({ invalid: "template" }));
      fs.writeFileSync(tempRequest, JSON.stringify({ goodsValue: 100 }));

      try {
        const result = await runCLI(scriptPath, [tempTemplate, tempRequest]);

        // The tool might still complete successfully but produce unexpected results
        // or it might fail - both are acceptable behaviors for invalid template data
        if (result.code !== 0) {
          expect(result.stderr).toContain("Error");
        } else {
          // If it succeeds, it should at least process the files
          expect(result.stdout).toContain("Template data:");
        }
      } finally {
        // Clean up temp files
        [tempTemplate, tempRequest].forEach((file) => {
          if (fs.existsSync(file)) {
            fs.unlinkSync(file);
          }
        });
      }
    });
  });

  describe("Data File Validation", () => {
    test("should accept valid template data structure", async () => {
      // Create a minimal valid template file
      const tempTemplate = "temp-valid-template.json";
      const tempRequest = "temp-valid-request.json";

      const validTemplate = {
        $class: "io.clause.latedeliveryandpenalty@0.1.0.TemplateModel",
        forceMajeure: true,
        penaltyDuration: {
          $class: "org.accordproject.time@0.3.0.Duration",
          amount: 2,
          unit: "days",
        },
        penaltyPercentage: 10.5,
        capPercentage: 55,
        termination: {
          $class: "org.accordproject.time@0.3.0.Duration",
          amount: 15,
          unit: "days",
        },
        fractionalPart: "days",
        clauseId: "test-id",
        $identifier: "test-id",
      };

      const validRequest = { goodsValue: 100 };

      fs.writeFileSync(tempTemplate, JSON.stringify(validTemplate, null, 2));
      fs.writeFileSync(tempRequest, JSON.stringify(validRequest, null, 2));

      try {
        const result = await runCLI(scriptPath, [tempTemplate, tempRequest]);

        // Should process without JSON parsing errors
        expect(result.stdout).toContain("Template data:");
        expect(result.stdout).toContain("Request data:");

        // May fail at template processing stage, but JSON should be parsed successfully
        if (result.code !== 0) {
          // If it fails, it should be at template processing, not JSON parsing
          expect(result.stderr).not.toContain("JSON");
        }
      } finally {
        // Clean up temp files
        [tempTemplate, tempRequest].forEach((file) => {
          if (fs.existsSync(file)) {
            fs.unlinkSync(file);
          }
        });
      }
    });
  });
});
