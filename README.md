## What is this?

A lightweight Node.js CLI app that interacts with the Ollama API, supports custom tool use (like calculators or weather fetchers), and logs the reasoning and response flow directly in the console.

## How to run

1) Run ```ollama``` locally
2) Install dependencies ```npm install```
3) Run the app ```node index.js```

## Parameters

Specify the prompt with -p flag (required).

Specify tools to use with -t flag (comma separated list). If not specified, no tools are used (!). Tools are entirely defined in tools.js.

-  ```-t calculator```
-  ```-t "calculator,getCurrentWeather"``` (multiple tools)

Specify model with -m flag (qwen3:4b by default)

## Notable Examples

- Running a prompt with no tools, this will force the LLM to do the math by itself.

```
node index.js -p "I have initially 100 USD in an account that gives 3.42% interest/year for the first 2 years then switches to a 3% interest/year. how much will I have after 5 years? Return response as float number only." -m qwen3:4b
```

- Running a prompt with tools, this will offer the LLM to use the tools.

```
node index.js -p "I have initially 100 USD in an account that gives 3.42% interest/year for the first 2 years then switches to a 3% interest/year. how much will I have after 5 years? Return response as float number only." -t calculator -m qwen3:4b
```

- Running a prompt with all the tools, this will offer the LLM all the tools, might be useful to understand the LLM tool selection strategy.

```
node index.js -p "I have initially 100 USD in an account that gives 3.42% interest/year for the first 2 years then switches to a 3% interest/year. how much will I have after 5 years? Return response as float number only." -t "calculator,getCurrentWeather,getCurrentDateTime" -m qwen3:4b
```

- Giving the LLM a tool that might help, but will not get them 100% there.

```
node index.js -p "what is the weather near St. Peter's Square?" -t getCurrentWeather -m qwen3:4b
```

