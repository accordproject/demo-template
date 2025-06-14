# Accord Project Demo Template

An Accord Project template demonstrating contract logic implementation using TypeScript, with flexible CLI tools and extensive testing.

## Quick Start

**Requirements:** Node.js v20 or higher

```bash
# Install dependencies
npm install

# Run the demo
npm start

# Generate a contract draft
npm run draft

# Test business logic
npm run trigger

# Run tests
npm test
```

## Project Structure

```
├── index.js                    # Main demo script
├── draft.js                    # Contract generation CLI
├── trigger.js                  # Business logic CLI
├── list-data-files.js          # Data file explorer
├── test-different-values.js    # Multi-scenario demo
├── data/                       # JSON configuration files
│   ├── template-*.json         # Template configurations
│   └── request-*.json          # Request data files
├── __tests__/                  # Comprehensive test suite
└── archives/                   # Accord Project template
```

## CLI Tools

### Draft Operation (Contract Generation)

Generate contract documents from template data:

```bash
# Using npm scripts
npm run draft           # Basic template
npm run draft:low       # Low penalty template
npm run draft:high      # High penalty template

# Using Node.js directly
node draft.js data/template-basic.json
node draft.js --help    # Show usage
```

### Trigger Operation (Business Logic)

Execute contract business logic with request data:

```bash
# Using npm scripts
npm run trigger         # Basic scenario
npm run trigger:low     # Low penalty + low value
npm run trigger:high    # High penalty + high value

# Using Node.js directly
node trigger.js data/template-basic.json data/request-basic.json
node trigger.js --help  # Show usage
```

### Utility Tools

```bash
# List available data files
node list-data-files.js

# Run multiple test scenarios
npm run test-values
```

## Data Configuration

### Template Data Files

Located in `data/` directory:

- `template-basic.json` - Default configuration (10.5% penalty, 15-day termination)
- `template-low-penalty.json` - Conservative (5% penalty, 30-day termination)
- `template-high-penalty.json` - Aggressive (15% penalty, 7-day termination)

### Request Data Files

- `request-basic.json` - $100 goods value
- `request-low-value.json` - $50 goods value
- `request-high-value.json` - $1000 goods value

### Example Template Format

```json
{
  "$class": "io.clause.latedeliveryandpenalty@0.1.0.TemplateModel",
  "forceMajeure": true,
  "penaltyDuration": {
    "$class": "org.accordproject.time@0.3.0.Duration",
    "amount": 2,
    "unit": "days"
  },
  "penaltyPercentage": 10.5,
  "capPercentage": 55,
  "termination": {
    "$class": "org.accordproject.time@0.3.0.Duration",
    "amount": 15,
    "unit": "days"
  },
  "fractionalPart": "days",
  "clauseId": "your-clause-id",
  "$identifier": "your-clause-id"
}
```

### Example Request Format

```json
{
  "goodsValue": 100
}
```

## Testing

Comprehensive test suite with CLI integration testing:

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run specific test file
npm test __tests__/trigger.test.js
```

### Test Coverage

- **CLI Integration Tests** - Tests actual command-line usage
- **Error Handling** - Invalid files, missing arguments, malformed JSON
- **Edge Cases** - Boundary conditions, different data formats
- **Output Validation** - Correct formatting, exit codes, error messages

Note: Coverage metrics are not meaningful for CLI tools tested via process spawning. The integration tests provide comprehensive validation of real-world usage scenarios.

## Example Scenarios

| Template     | Request    | Expected Penalty | Use Case             |
| ------------ | ---------- | ---------------- | -------------------- |
| Low Penalty  | Low Value  | $6.25            | Small contracts      |
| Basic        | Basic      | $262.50          | Standard contracts   |
| High Penalty | High Value | $3750.00         | High-value contracts |

## Development

### Adding New Scenarios

1. Create new JSON files in `data/` directory
2. Test with CLI tools:
   ```bash
   node draft.js data/your-template.json
   node trigger.js data/your-template.json data/your-request.json
   ```

### Running Tests During Development

```bash
# Watch mode for continuous testing
npm run test:watch

# Test specific functionality
npm test -- --testNamePattern="should handle"
```

## Key Features

- **Flexible Configuration** - JSON-based template and request data
- **CLI Tools** - Easy-to-use command-line interfaces
- **Comprehensive Testing** - Full CLI integration test coverage
- **Multiple Output Formats** - Markdown, HTML, PDF contract generation
- **Business Logic Engine** - Penalty calculations and contract logic
- **Scenario Testing** - Pre-configured test cases and combinations
- **Data Exploration** - Built-in tools to explore available configurations

## Usage Patterns

### For Development

```bash
npm run test:watch    # Continuous testing
node list-data-files.js  # Explore available data
```

### For Demos

```bash
npm start            # Full demonstration
npm run test-values  # Multiple scenarios
```

### For Integration

```bash
# Custom scenarios
echo '{"goodsValue": 5000}' > data/custom-request.json
node trigger.js data/template-high-penalty.json data/custom-request.json
```
