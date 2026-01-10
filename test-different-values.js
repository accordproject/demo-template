const { TemplateArchiveProcessor } = require("@accordproject/template-engine");
const { Template } = require("@accordproject/cicero-core");

const TEMPLATE_PATH = "./archives/latedeliveryandpenalty-typescript";

async function testWithDifferentValues() {
  console.log("Testing with Different Values...\n");

  try {
    const template = await Template.fromDirectory(TEMPLATE_PATH);
    const templateArchiveProcessor = new TemplateArchiveProcessor(template);

    // Test scenarios with different values
    const testScenarios = [
      {
        name: "Low Value Goods",
        templateData: {
          $class: "io.clause.latedeliveryandpenalty@0.1.0.TemplateModel",
          forceMajeure: false,
          penaltyDuration: {
            $class: "org.accordproject.time@0.3.0.Duration",
            amount: 1,
            unit: "days",
          },
          penaltyPercentage: 5.0,
          capPercentage: 25,
          termination: {
            $class: "org.accordproject.time@0.3.0.Duration",
            amount: 30,
            unit: "days",
          },
          fractionalPart: "days",
          clauseId: "test-1",
          $identifier: "test-1",
        },
        requestData: { goodsValue: 50 },
      },
      {
        name: "High Value Goods",
        templateData: {
          $class: "io.clause.latedeliveryandpenalty@0.1.0.TemplateModel",
          forceMajeure: true,
          penaltyDuration: {
            $class: "org.accordproject.time@0.3.0.Duration",
            amount: 3,
            unit: "days",
          },
          penaltyPercentage: 15.0,
          capPercentage: 50,
          termination: {
            $class: "org.accordproject.time@0.3.0.Duration",
            amount: 7,
            unit: "days",
          },
          fractionalPart: "hours",
          clauseId: "test-2",
          $identifier: "test-2",
        },
        requestData: { goodsValue: 1000 },
      },
      {
        name: "Zero Value Test",
        templateData: {
          $class: "io.clause.latedeliveryandpenalty@0.1.0.TemplateModel",
          forceMajeure: false,
          penaltyDuration: {
            $class: "org.accordproject.time@0.3.0.Duration",
            amount: 2,
            unit: "weeks",
          },
          penaltyPercentage: 20.0,
          capPercentage: 75,
          termination: {
            $class: "org.accordproject.time@0.3.0.Duration",
            amount: 1,
            unit: "months",
          },
          fractionalPart: "days",
          clauseId: "test-3",
          $identifier: "test-3",
        },
        requestData: { goodsValue: 0 },
      },
    ];

    for (let i = 0; i < testScenarios.length; i++) {
      const scenario = testScenarios[i];
      console.log(`\nTest ${i + 1}: ${scenario.name}`);
      console.log("─".repeat(40));

      // Test both draft and trigger for each scenario
      console.log("Draft Output:");
      const draftResult = await templateArchiveProcessor.draft(
        scenario.templateData,
        "markdown",
        { verbose: false }
      );
      console.log(draftResult.substring(0, 200) + "...\n");

      console.log("Trigger Response:");
      const triggerResponse = await templateArchiveProcessor.trigger(
        scenario.templateData,
        scenario.requestData
      );
      console.log(`Penalty: $${triggerResponse.penalty}`);
      console.log(`Buyer May Terminate: ${triggerResponse.buyerMayTerminate}`);
      console.log(
        `Penalty Rate: ${scenario.templateData.penaltyPercentage}% | Goods Value: $${scenario.requestData.goodsValue}`
      );

      if (i < testScenarios.length - 1) {
        console.log("\n" + "=".repeat(60));
      }
    }

    console.log("\nAll test scenarios completed successfully!");
  } catch (error) {
    console.error("Error in test scenarios:", error.message);
    process.exit(1);
  }
}

// Run the test scenarios
testWithDifferentValues();
