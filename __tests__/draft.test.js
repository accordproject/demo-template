const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

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

describe("Draft CLI Tool Tests", () => {
  const scriptPath = "draft.js";
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
      expect(result.stdout).toContain("Usage: node draft.js");
      expect(result.stdout).toContain("No template data file specified");
    });

    test("should show help with --help flag", async () => {
      const result = await runCLI(scriptPath, ["--help"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("Usage: node draft.js");
      expect(result.stdout).toContain("Available template data files:");
    });

    test("should show help with -h flag", async () => {
      const result = await runCLI(scriptPath, ["-h"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("Usage: node draft.js");
    });
  });

  describe("File Loading and Validation", () => {
    test("should handle non-existent template file", async () => {
      const result = await runCLI(scriptPath, ["non-existent.json"]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain("Error loading JSON file");
    });

    test("should handle invalid JSON in template file", async () => {
      // Create a temporary invalid JSON file
      const tempFile = "temp-invalid-draft.json";
      fs.writeFileSync(tempFile, "{ invalid json }");

      try {
        const result = await runCLI(scriptPath, [tempFile]);

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
    test("should run successfully with basic template", async () => {
      const templateFile = "data/template-basic.json";

      if (!fs.existsSync(templateFile)) {
        console.warn(`Skipping test - data file not found: ${templateFile}`);
        return;
      }

      const result = await runCLI(scriptPath, [templateFile]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain(
        "Running DRAFT operation with template data:"
      );
      expect(result.stdout).toContain("Contract Draft:");
      expect(result.stdout).toContain(
        "Draft operation completed successfully!"
      );
    });

    test("should work with low penalty template", async () => {
      const templateFile = "data/template-low-penalty.json";

      if (!fs.existsSync(templateFile)) {
        console.warn(`Skipping test - data file not found: ${templateFile}`);
        return;
      }

      const result = await runCLI(scriptPath, [templateFile]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain(
        "Draft operation completed successfully!"
      );
    });

    test("should work with high penalty template", async () => {
      const templateFile = "data/template-high-penalty.json";

      if (!fs.existsSync(templateFile)) {
        console.warn(`Skipping test - data file not found: ${templateFile}`);
        return;
      }

      const result = await runCLI(scriptPath, [templateFile]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain(
        "Draft operation completed successfully!"
      );
    });
  });

  describe("Output Formatting", () => {
    test("should include proper sections in output", async () => {
      const templateFile = "data/template-basic.json";

      if (!fs.existsSync(templateFile)) {
        console.warn(`Skipping test - data file not found: ${templateFile}`);
        return;
      }

      const result = await runCLI(scriptPath, [templateFile]);

      expect(result.code).toBe(0);

      // Check for section headers
      expect(result.stdout).toContain("Contract Draft:");
      expect(result.stdout).toContain("_".repeat(20));
    });

    test("should format JSON output properly", async () => {
      const templateFile = "data/template-basic.json";

      if (!fs.existsSync(templateFile)) {
        console.warn(`Skipping test - data file not found: ${templateFile}`);
        return;
      }

      const result = await runCLI(scriptPath, [templateFile]);

      expect(result.code).toBe(0);

      // Should contain contract draft content (markdown format)
      expect(result.stdout).toContain("Late Delivery and Penalty");
    });
  });

  describe("CLI Interface Consistency", () => {
    test("should show consistent file examples in help", async () => {
      const result = await runCLI(scriptPath, ["--help"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("template-basic.json");
      expect(result.stdout).toContain("template-low-penalty.json");
      expect(result.stdout).toContain("template-high-penalty.json");
    });

    test("should show proper command examples", async () => {
      const result = await runCLI(scriptPath, ["--help"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("node draft.js data/template-basic.json");
    });
  });

  describe("Error Scenarios", () => {
    test("should handle template archive errors gracefully", async () => {
      // Create a valid JSON file but with invalid template structure
      const tempTemplate = "temp-draft-template.json";

      fs.writeFileSync(tempTemplate, JSON.stringify({ invalid: "template" }));

      try {
        const result = await runCLI(scriptPath, [tempTemplate]);

        // Should either exit with error or handle gracefully
        expect(result.code).not.toBe(0);
        expect(result.stderr).toContain("Error");
      } finally {
        // Clean up temp file
        if (fs.existsSync(tempTemplate)) {
          fs.unlinkSync(tempTemplate);
        }
      }
    });
  });

  describe("Data File Validation", () => {
    test("should accept valid template data structure", async () => {
      // Create a minimal valid template file
      const tempTemplate = "temp-valid-draft-template.json";

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

      fs.writeFileSync(tempTemplate, JSON.stringify(validTemplate, null, 2));

      try {
        const result = await runCLI(scriptPath, [tempTemplate]);

        // Should process without JSON parsing errors
        expect(result.stdout).toContain(
          "Running DRAFT operation with template data:"
        );

        // May fail at template processing stage, but JSON should be parsed successfully
        if (result.code !== 0) {
          // If it fails, it should be at template processing, not JSON parsing
          expect(result.stderr).not.toContain("JSON");
        }
      } finally {
        // Clean up temp file
        if (fs.existsSync(tempTemplate)) {
          fs.unlinkSync(tempTemplate);
        }
      }
    });
  });

  describe("Options and Parameters", () => {
    test("should use markdown format by default", async () => {
      const templateFile = "data/template-basic.json";

      if (!fs.existsSync(templateFile)) {
        console.warn(`Skipping test - data file not found: ${templateFile}`);
        return;
      }

      const result = await runCLI(scriptPath, [templateFile]);

      expect(result.code).toBe(0);
      // The output should indicate markdown format is being used
      expect(result.stdout).toContain("Contract Draft:");
    });
  });

  describe("Template Processing", () => {
    test("should handle different penalty percentages in template", async () => {
      // Create templates with different penalty percentages
      const templates = [
        { name: "low", penaltyPercentage: 5.0 },
        { name: "medium", penaltyPercentage: 10.5 },
        { name: "high", penaltyPercentage: 15.0 },
      ];

      for (const template of templates) {
        const tempFile = `temp-${template.name}-penalty.json`;
        const templateData = {
          $class: "io.clause.latedeliveryandpenalty@0.1.0.TemplateModel",
          forceMajeure: true,
          penaltyDuration: {
            $class: "org.accordproject.time@0.3.0.Duration",
            amount: 2,
            unit: "days",
          },
          penaltyPercentage: template.penaltyPercentage,
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

        fs.writeFileSync(tempFile, JSON.stringify(templateData, null, 2));

        try {
          const result = await runCLI(scriptPath, [tempFile]);

          // Should process the template data
          expect(result.stdout).toContain(
            "Running DRAFT operation with template data:"
          );
          expect(result.stdout).toContain(`${template.penaltyPercentage}`);
        } finally {
          if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
          }
        }
      }
    }, 15000);

    test("should handle different time units in template", async () => {
      const tempFile = "temp-time-units.json";
      const templateData = {
        $class: "io.clause.latedeliveryandpenalty@0.1.0.TemplateModel",
        forceMajeure: false,
        penaltyDuration: {
          $class: "org.accordproject.time@0.3.0.Duration",
          amount: 1,
          unit: "weeks",
        },
        penaltyPercentage: 8.0,
        capPercentage: 40,
        termination: {
          $class: "org.accordproject.time@0.3.0.Duration",
          amount: 30,
          unit: "days",
        },
        fractionalPart: "hours",
        clauseId: "test-id",
        $identifier: "test-id",
      };

      fs.writeFileSync(tempFile, JSON.stringify(templateData, null, 2));

      try {
        const result = await runCLI(scriptPath, [tempFile]);

        // Should process the template data with different time units
        expect(result.stdout).toContain(
          "Running DRAFT operation with template data:"
        );
        expect(result.stdout).toContain("weeks");
        expect(result.stdout).toContain("hours");
      } finally {
        if (fs.existsSync(tempFile)) {
          fs.unlinkSync(tempFile);
        }
      }
    });
  });
});
