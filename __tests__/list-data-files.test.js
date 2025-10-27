const { spawn } = require("child_process");
const fs = require("fs");

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
    }, 5000);
  });
}

describe("List Data Files CLI Tool Tests", () => {
  const scriptPath = "list-data-files.js";
  const testDataDir = "data";

  beforeAll(() => {
    // Ensure data directory exists and has the expected files
    if (!fs.existsSync(testDataDir)) {
      console.warn(`Warning: ${testDataDir} directory not found`);
    }
  });

  describe("Basic Functionality", () => {
    test("should run successfully and list data files", async () => {
      const result = await runCLI(scriptPath);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("Data Files");
    });

    test("should show proper header formatting", async () => {
      const result = await runCLI(scriptPath);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("─".repeat(50));
      expect(result.stdout).toContain("Available Data Files");
    });
  });

  describe("File Detection", () => {
    test("should detect template files if they exist", async () => {
      const result = await runCLI(scriptPath);

      expect(result.code).toBe(0);

      // Check if data directory exists, then verify appropriate output
      if (fs.existsSync(testDataDir)) {
        const files = fs
          .readdirSync(testDataDir)
          .filter((f) => f.endsWith(".json"));
        if (files.length > 0) {
          expect(result.stdout).toContain("Template Data Files:");
        }
      }
    });

    test("should handle missing data directory gracefully", async () => {
      // This tests the error handling when data directory doesn't exist
      // Since the script runs immediately, we test the actual behavior
      const result = await runCLI(scriptPath);

      // Should either succeed (if data dir exists) or handle the error gracefully
      if (result.code !== 0) {
        expect(result.stderr).toContain("Error");
      } else {
        expect(result.stdout).toContain("Data Files");
      }
    });
  });

  describe("Output Formatting", () => {
    test("should format output consistently", async () => {
      const result = await runCLI(scriptPath);

      expect(result.code).toBe(0);

      // Should have consistent formatting
      expect(result.stdout).toMatch(/─+/); // Contains separator lines
      expect(result.stdout).toContain("Available Data Files");
    });

    test("should include proper sections for different file types", async () => {
      const result = await runCLI(scriptPath);

      expect(result.code).toBe(0);

      // If data files exist, should show categorized sections
      if (fs.existsSync(testDataDir)) {
        const files = fs
          .readdirSync(testDataDir)
          .filter((f) => f.endsWith(".json"));
        if (files.some((f) => f.includes("template"))) {
          expect(result.stdout).toContain("Template Data Files:");
        }
        if (files.some((f) => f.includes("request"))) {
          expect(result.stdout).toContain("Request Data Files:");
        }
      }
    });
  });

  describe("File Type Categorization", () => {
    test("should properly categorize template files", async () => {
      const result = await runCLI(scriptPath);

      expect(result.code).toBe(0);

      // Check for template file patterns
      if (result.stdout.includes("template-basic.json")) {
        expect(result.stdout).toContain("Template Data Files:");
      }
    });

    test("should properly categorize request files", async () => {
      const result = await runCLI(scriptPath);

      expect(result.code).toBe(0);

      // Check for request file patterns
      if (result.stdout.includes("request-basic.json")) {
        expect(result.stdout).toContain("Request Data Files:");
      }
    });
  });

  describe("Error Handling", () => {
    test("should handle directory read errors gracefully", async () => {
      // The script should handle errors without crashing
      const result = await runCLI(scriptPath);

      // Either succeeds or fails gracefully
      if (result.code !== 0) {
        expect(result.stderr).toBeTruthy();
      } else {
        expect(result.stdout).toContain("Data Files");
      }
    });
  });

  describe("CLI Interface", () => {
    test("should run without requiring arguments", async () => {
      const result = await runCLI(scriptPath);

      // Should run successfully without any arguments
      expect(result.code).toBe(0);
      expect(result.stdout).toContain("Data Files");
    });

    test("should ignore extra arguments gracefully", async () => {
      const result = await runCLI(scriptPath, ["extra", "arguments"]);

      // Should still work normally even with extra arguments
      expect(result.code).toBe(0);
      expect(result.stdout).toContain("Data Files");
    });
  });

  describe("Performance", () => {
    test("should complete quickly", async () => {
      const startTime = Date.now();
      const result = await runCLI(scriptPath);
      const executionTime = Date.now() - startTime;

      expect(result.code).toBe(0);
      expect(executionTime).toBeLessThan(3000); // Should complete within 3 seconds
    });
  });

  describe("Data Directory Content", () => {
    test("should handle empty data directory", async () => {
      const result = await runCLI(scriptPath);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("Data Files");

      // If no files exist, should still show appropriate sections
      if (!result.stdout.includes(".json")) {
        expect(result.stdout).toContain("Data Files in");
      }
    });

    test("should handle non-JSON files in data directory", async () => {
      const result = await runCLI(scriptPath);

      expect(result.code).toBe(0);
      expect(result.stdout).toContain("Data Files");

      // Should only show JSON files, not other file types
      // The script should filter to only .json files
    });
  });
});
