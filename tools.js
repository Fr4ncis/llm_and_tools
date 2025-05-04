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
   * @returns {Promise<string>} - Stubbed weather info.
   */
  static async run({ latitude, longitude }) {
    const https = require('https');

    function getJSON(url) {
      return new Promise((resolve, reject) => {
        https.get(url, (res) => {
          let data = '';
          res.on('data', chunk => { data += chunk; });
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(new Error('Failed to parse JSON response'));
            }
          });
        }).on('error', reject);
      });
    }

    if (!latitude || !longitude) {
      return 'Error: latitude and longitude are required.';
    }

    const params = [
      `latitude=${latitude}`,
      `longitude=${longitude}`,
      'current=temperature_2m,precipitation,weather_code,wind_direction_10m,wind_speed_10m,relative_humidity_2m,is_day,showers,snowfall'
    ].join('&');
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?${params}`;
    let weatherData;
    try {
      weatherData = await getJSON(weatherUrl);
    } catch (e) {
      return `Error: Failed to fetch weather data.`;
    }
    if (!weatherData || !weatherData.current) {
      return `Error: No weather data available.`;
    }
    const curr = weatherData.current;

    // Map weather_code to description
    const weatherCodeMap = {
      0: 'Clear', 1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Cloudy',
      45: 'Fog', 48: 'Freezing Fog', 51: 'Light Drizzle', 53: 'Drizzle', 55: 'Heavy Drizzle',
      56: 'Light Freezing Drizzle', 57: 'Freezing Drizzle', 61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
      66: 'Light Freezing Rain', 67: 'Freezing Rain', 71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow',
      77: 'Snow Grains', 80: 'Light Rain Shower', 81: 'Rain Shower', 82: 'Heavy Rain Shower',
      85: 'Snow Shower', 86: 'Heavy Snow Shower', 95: 'Thunderstorm', 96: 'Thunderstorm with Hail', 99: 'Heavy Thunderstorm with Hail'
    };
    const code = curr.weather_code;
    const weatherDesc = weatherCodeMap.hasOwnProperty(code) ? weatherCodeMap[code] : `Unknown (${code})`;

    // Format and return weather info
    return `Weather for (lat: ${latitude}, lon: ${longitude}):\n` +
      `- Time: ${curr.time} (${weatherData.timezone_abbreviation})\n` +
      `- Temperature: ${curr.temperature_2m}°C\n` +
      `- Weather: ${weatherDesc}\n` +
      `- Precipitation: ${curr.precipitation} mm\n` +
      `- Wind: ${curr.wind_speed_10m} km/h at ${curr.wind_direction_10m}°\n` +
      `- Humidity: ${curr.relative_humidity_2m}%\n` +
      `- Is Day: ${curr.is_day ? 'Yes' : 'No'}\n` +
      `- Showers: ${curr.showers} mm\n` +
      `- Snowfall: ${curr.snowfall} cm`;
  }
}

// GetCurrentDateTime tool: returns the current date and time using the 'date' command
class GetCurrentDateTime {
  /**
   * Returns the current date and time using the 'date' command.
   * @returns {Promise<string>} - The current date and time string.
   */
  static async run() {
    return new Promise((resolve, reject) => {
      exec('date', (error, stdout, stderr) => {
        if (error) return reject(stderr || error.message);
        resolve(stdout.trim());
      });
    });
  }
}

const toolDefinitions = [
  {
    type: "function",
    function: {
      name: "get_current_weather",
      description: "Get the current weather for a location using Open-Meteo API. Requires latitude and longitude as input, queries Open-Meteo for current weather, and returns a structured summary including mapped weather code.",
      parameters: {
        type: "object",
        properties: {
          latitude: {
            type: "number",
            description: "Latitude of the location."
          },
          longitude: {
            type: "number",
            description: "Longitude of the location."
          }
        },
        required: ["latitude", "longitude"]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "get_current_datetime",
      description: "Get the current date and time (e.g. 'Sat  3 May 2025 19:33:34 BST')",
      parameters: {}
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
  GetCurrentDateTime,
  toolDefinitions
};
