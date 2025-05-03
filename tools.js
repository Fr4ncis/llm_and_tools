const { exec } = require('child_process');

// Calculator tool: evaluates arithmetic expressions using macOS 'bc' CLI
class Calculator {
  /**
   * Evaluates an arithmetic expression using 'bc -l -e'.
   * @param {string} expression - The arithmetic expression to evaluate.
   * @returns {Promise<string>} - The result from bc.
   */
  static run({ expression }) {
    return new Promise((resolve, reject) => {
      // Escape single quotes in the expression
      const safeExpr = expression.replace(/'/g, "'\\''");
      exec(`bc -l -e '${safeExpr}'`, (error, stdout, stderr) => {
        if (error) return reject(stderr || error.message);
        resolve(stdout.trim());
      });
    });
  }
}

// GetCurrentWeather tool: stub implementation
class GetCurrentWeather {
  /**
   * Simulates fetching weather for a location (stub).
   * @param {string} location - The location to get the weather for.
   * @param {string} format - 'celsius' or 'fahrenheit'.
   * @returns {Promise<string>} - Stubbed weather info.
   */
  static async run({ location, format }) {
    // In a real implementation, call a weather API here.
    return `Weather for ${location} is 20° ${format} (stubbed)`;
  }
}

const toolDefinitions = [
  {
    type: "function",
    function: {
      name: "get_current_weather",
      description: "Get the current weather for a location",
      parameters: {
        type: "object",
        properties: {
          location: {
            type: "string",
            description: "The location to get the weather for, e.g. San Francisco, CA"
          },
          format: {
            type: "string",
            description: "The format to return the weather in, e.g. 'celsius' or 'fahrenheit'",
            enum: ["celsius", "fahrenheit"]
          }
        },
        required: ["location", "format"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "calculator",
      description: "Perform basic arithmetic calculations such as addition, subtraction, multiplication, and division",
      parameters: {
        type: "object",
        properties: {
          expression: {
            type: "string",
            description: "The arithmetic expression to evaluate 2 + 2 * (3 - 1)"
          }
        },
        required: ["expression"]
      }
    }
  }
];

module.exports = {
  Calculator,
  GetCurrentWeather,
  toolDefinitions
};
