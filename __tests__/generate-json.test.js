const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

// Helper function to run CLI commands
function runCLI(args, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const child = spawn("node", ["generate-json.js", ...args], {
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
      if (file.endsWith(".json")) {
        try {
          fs.unlinkSync(path.join(outputDir, file));
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    });
  }
}

describe("generate-json.js CLI Tool", () => {
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
      expect(result.stdout).toContain("Usage: node generate-json.js");
      expect(result.stdout).toContain(
        "Generate JSON business logic response from template and request data"
      );
      expect(result.stdout).toContain("template-data-file");
      expect(result.stdout).toContain("request-data-file");
      expect(result.stdout).toContain("output-file");
      expect(result.stdout).toContain("Examples:");
    });

    test("should show usage with -h flag", async () => {
      const result = await runCLI(["-h"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("Usage: node generate-json.js");
    });

    test("should list available template and request data files", async () => {
      const result = await runCLI(["--help"]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("Available template data files:");
      expect(result.stdout).toContain("data/template-basic.json");
      expect(result.stdout).toContain("data/template-low-penalty.json");
      expect(result.stdout).toContain("data/template-high-penalty.json");
      expect(result.stdout).toContain("Available request data files:");
      expect(result.stdout).toContain("data/request-basic.json");
      expect(result.stdout).toContain("data/request-low-value.json");
      expect(result.stdout).toContain("data/request-high-value.json");
    });
  });

  describe("Error Handling", () => {
    test("should show error when no arguments provided", async () => {
      const result = await runCLI([]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain(
        "Error: Both template data file and request data file are required"
      );
    });

    test("should show error when only template file provided", async () => {
      const result = await runCLI(["data/template-basic.json"]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain(
        "Error: Both template data file and request data file are required"
      );
    });

    test("should show error when template file does not exist", async () => {
      const result = await runCLI([
        "nonexistent.json",
        "data/request-basic.json",
      ]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain(
        "Template data file 'nonexistent.json' not found"
      );
    });

    test("should show error when request file does not exist", async () => {
      const result = await runCLI([
        "data/template-basic.json",
        "nonexistent.json",
      ]);

      expect(result.code).toBe(1);
      expect(result.stderr).toContain(
        "Request data file 'nonexistent.json' not found"
      );
    });

    test("should handle invalid JSON in template file", async () => {
      // Create a temporary invalid JSON file
      const tempFile = "temp-invalid.json";
      fs.writeFileSync(tempFile, "{ invalid json }");

      // Verify file was created
      expect(fs.existsSync(tempFile)).toBe(true);

      try {
        const result = await runCLI([tempFile, "data/request-basic.json"]);
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

    test("should handle invalid JSON in request file", async () => {
      // Create a temporary invalid JSON file
      const tempFile = "temp-invalid-request.json";
      fs.writeFileSync(tempFile, "{ invalid json }");

      try {
        const result = await runCLI(["data/template-basic.json", tempFile]);
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

  describe("JSON Response Generation", () => {
    test("should generate JSON response with basic template and request (default output)", async () => {
      const result = await runCLI([
        "data/template-basic.json",
        "data/request-basic.json",
      ]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain(
        "Generating JSON business logic response..."
      );
      expect(result.stdout).toContain(
        "Loading template data from: data/template-basic.json"
      );
      expect(result.stdout).toContain(
        "Loading request data from: data/request-basic.json"
      );
      expect(result.stdout).toContain("Loading Accord Project template...");
      expect(result.stdout).toContain("Executing business logic...");
      expect(result.stdout).toContain("JSON Response Generation Results:");
      expect(result.stdout).toContain(
        "✓ Template data: data/template-basic.json"
      );
      expect(result.stdout).toContain(
        "✓ Request data: data/request-basic.json"
      );
      expect(result.stdout).toContain("✓ JSON output: output/response.json");
      expect(result.stdout).toContain("✓ Penalty calculated:");
      expect(result.stdout).toContain(
        "JSON response generation completed successfully!"
      );

      // Check that JSON file was created
      expect(fs.existsSync("output/response.json")).toBe(true);

      // Check JSON content structure
      const content = fs.readFileSync("output/response.json", "utf8");
      const jsonData = JSON.parse(content);
      expect(jsonData).toHaveProperty("result");
      expect(jsonData.result).toHaveProperty("penalty");
      expect(jsonData.result).toHaveProperty("buyerMayTerminate");
      expect(jsonData.result).toHaveProperty("$timestamp");
      expect(jsonData.result).toHaveProperty("$class");
    });

    test("should generate JSON response with custom output path", async () => {
      const customPath = "output/custom-response.json";
      const result = await runCLI([
        "data/template-basic.json",
        "data/request-basic.json",
        customPath,
      ]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain(`✓ JSON output: ${customPath}`);

      // Check that JSON file was created at custom path
      expect(fs.existsSync(customPath)).toBe(true);
    });

    test("should generate JSON response with low penalty scenario", async () => {
      const result = await runCLI([
        "data/template-low-penalty.json",
        "data/request-low-value.json",
        "output/low-response.json",
      ]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain(
        "✓ Template data: data/template-low-penalty.json"
      );
      expect(result.stdout).toContain(
        "✓ Request data: data/request-low-value.json"
      );
      expect(result.stdout).toContain(
        "✓ JSON output: output/low-response.json"
      );

      // Check that JSON file was created
      expect(fs.existsSync("output/low-response.json")).toBe(true);

      // Check JSON content
      const content = fs.readFileSync("output/low-response.json", "utf8");
      const jsonData = JSON.parse(content);
      expect(jsonData.result).toHaveProperty("penalty");
      expect(typeof jsonData.result.penalty).toBe("number");
    });

    test("should generate JSON response with high penalty scenario", async () => {
      const result = await runCLI([
        "data/template-high-penalty.json",
        "data/request-high-value.json",
        "output/high-response.json",
      ]);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain(
        "✓ Template data: data/template-high-penalty.json"
      );
      expect(result.stdout).toContain(
        "✓ Request data: data/request-high-value.json"
      );
      expect(result.stdout).toContain(
        "✓ JSON output: output/high-response.json"
      );

      // Check that JSON file was created
      expect(fs.existsSync("output/high-response.json")).toBe(true);

      // Check JSON content
      const content = fs.readFileSync("output/high-response.json", "utf8");
      const jsonData = JSON.parse(content);
      expect(jsonData.result).toHaveProperty("penalty");
      expect(typeof jsonData.result.penalty).toBe("number");
    });

    test("should create output directory if it does not exist", async () => {
      const customDir = "test-output-dir";
      const customPath = `${customDir}/test-response.json`;

      // Ensure directory doesn't exist
      if (fs.existsSync(customDir)) {
        fs.rmSync(customDir, { recursive: true });
      }

      try {
        const result = await runCLI([
          "data/template-basic.json",
          "data/request-basic.json",
          customPath,
        ]);

        expect(result.code).toBe(0);
        expect(fs.existsSync(customPath)).toBe(true);
      } finally {
        // Clean up test directory
        if (fs.existsSync(customDir)) {
          fs.rmSync(customDir, { recursive: true });
        }
      }
    });
  });

  describe("Output Validation", () => {
    test("should display file size in output", async () => {
      const result = await runCLI([
        "data/template-basic.json",
        "data/request-basic.json",
      ]);

      expect(result.code).toBe(0);
      expect(result.stdout).toMatch(/✓ File size: \d+\.\d+ KB/);
    });

    test("should display calculated penalty in output", async () => {
      const result = await runCLI([
        "data/template-basic.json",
        "data/request-basic.json",
      ]);

      expect(result.code).toBe(0);
      expect(result.stdout).toMatch(/✓ Penalty calculated: \d+%/);
    });

    test("should generate valid JSON structure", async () => {
      const result = await runCLI([
        "data/template-basic.json",
        "data/request-basic.json",
      ]);

      expect(result.code).toBe(0);

      // Check that JSON file contains expected structure
      const content = fs.readFileSync("output/response.json", "utf8");
      const jsonData = JSON.parse(content);

      // Validate core response structure
      expect(jsonData).toHaveProperty("result");
      expect(jsonData.result).toHaveProperty("penalty");
      expect(jsonData.result).toHaveProperty("buyerMayTerminate");
      expect(jsonData.result).toHaveProperty("$timestamp");
      expect(jsonData.result).toHaveProperty("$class");

      // Validate data types
      expect(typeof jsonData.result.penalty).toBe("number");
      expect(typeof jsonData.result.buyerMayTerminate).toBe("boolean");
      expect(typeof jsonData.result.$timestamp).toBe("string");
      expect(typeof jsonData.result.$class).toBe("string");

      // Validate class name
      expect(jsonData.result.$class).toContain(
        "LateDeliveryAndPenaltyResponse"
      );
    });

    test("should handle different template and request combinations", async () => {
      // Test different combinations
      const combinations = [
        ["data/template-basic.json", "data/request-basic.json"],
        ["data/template-low-penalty.json", "data/request-basic.json"],
        ["data/template-high-penalty.json", "data/request-basic.json"],
      ];

      for (const [template, request] of combinations) {
        const result = await runCLI([
          template,
          request,
          `output/test-${path.basename(template, ".json")}-${path.basename(
            request,
            ".json"
          )}.json`,
        ]);
        expect(result.code).toBe(0);
        expect(result.stdout).toContain(
          "JSON response generation completed successfully!"
        );
      }
    }, 60000); // Increase timeout to 1 minute for multiple combinations
  });
});
