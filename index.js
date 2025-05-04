#!/usr/bin/env node

// index.js: Send a prompt to Ollama API and print the response
const http = require('http');
const { toolDefinitions, Calculator, GetCurrentWeather, GetCurrentDateTime } = require('./tools');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
let chalk;

async function ensureChalk() {
  if (!chalk) {
    chalk = await import('chalk');
  }
}

const argv = yargs(hideBin(process.argv))
  .option('prompt', {
    alias: 'p',
    type: 'string',
    description: 'Prompt to send to the LLM',
    demandOption: true
  })
  .option('model', {
    alias: 'm',
    type: 'string',
    description: 'Model to use (e.g. qwen3:4b, qwen3:8b)',
    default: 'qwen3:4b'
  })
  .option('tools', {
    alias: 't',
    type: 'string',
    description: 'Comma-separated list of tool names to enable (e.g. calculator,get_current_weather)'
  })
  .help()
  .argv;

const prompt = argv.prompt;
const model = argv.model;

async function callLLM({ model, messages, tools }) {
  const payload = {
    model,
    messages,
    stream: false,
    options: {
      temperature: 0
    }
  };
  if (tools) payload.tools = tools;
  const data = JSON.stringify(payload);

  // Log the outgoing call
  console.log(chalk.default.yellowBright.bold('\n[LLM Call]\n') + chalk.default.yellowBright(data));

  const options = {
    hostname: 'localhost',
    port: 11434,
    path: '/api/chat',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };

  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => { body += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve(parsed);
        } catch (e) {
          reject(new Error('Failed to parse response: ' + body));
        }
      });
    });
    req.on('error', (e) => reject(e));
    req.write(data);
    req.end();
  });
}

async function executeToolCall(toolCall) {
  const { name, arguments: args } = toolCall.function;
  if (name === 'calculator') {
    return await Calculator.run(args);
  } else if (name === 'get_current_weather') {
    return await GetCurrentWeather.run(args);
  } else if (name === 'get_current_datetime') {
    return await GetCurrentDateTime.run();
  } else {
    throw new Error(`Unknown tool: ${name}`);
  }
}

async function main() {
  let messages = [
    { role: 'user', content: prompt }
  ];
  // Determine which tools to use
  let tools;
  if (argv.tools) {
    const requestedTools = argv.tools.split(',').map(s => s.trim()).filter(Boolean);
    tools = toolDefinitions.filter(td => requestedTools.includes(td.function.name));
    // Do not unset tools after the first call; keep it for all subsequent calls
  } else {
    tools = undefined; // No tools property unless specified
  }

  while (true) {
    const response = await callLLM({ model, messages, tools });
    console.log(chalk.default.blueBright.bold('\n[LLM Response]\n') + chalk.default.blueBright(JSON.stringify(response, null, 2)));
    const assistantMsg = response.message;
    messages.push({ role: 'assistant', content: assistantMsg.content || '', tool_calls: assistantMsg.tool_calls });

    if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
      // Only handle one tool call at a time for simplicity
      const toolCall = assistantMsg.tool_calls[0];
      console.log(chalk.default.hex('#FFA500').bold(`\n[Tool Call] Running tool: ${toolCall.function.name}`));
      console.log(chalk.default.hex('#FFA500')('Arguments:'), chalk.default.hex('#FFA500')(JSON.stringify(toolCall.function.arguments, null, 2)));
      try {
        const toolResult = await executeToolCall(toolCall);
        console.log(chalk.default.hex('#FFA500').bold(`[Tool Result] Output:`), chalk.default.hex('#FFA500')(toolResult));
        messages.push({ role: 'tool', content: String(toolResult) });
      } catch (err) {
        console.log(chalk.default.redBright.bold(`[Tool Error]`), chalk.default.redBright(err.message));
        messages.push({ role: 'tool', content: `Error: ${err.message}` });
      }
      // Loop again to send the new message list
    } else {
      // No more tool calls, print final assistant message and exit
      break;
    }
  }

  // Print the final assistant response
  const lastMsg = messages[messages.length - 1];
  console.log(chalk.default.magentaBright.bold('\n[Final Assistant Response]\n') + chalk.default.magentaBright(lastMsg.content));
}

(async () => {
  await ensureChalk();
  await main();
})().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
