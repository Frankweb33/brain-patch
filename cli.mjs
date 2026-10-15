import { readFile } from 'node:fs/promises';
import { reviewDecision, SCENARIOS } from './src/engine.mjs';
try {
  const args=process.argv.slice(2);
  if(args[0]==='--example') console.log(JSON.stringify(reviewDecision(SCENARIOS.peak),null,2));
  else if(args[0]==='--file'&&args[1]) console.log(JSON.stringify(reviewDecision(JSON.parse(await readFile(args[1],'utf8'))),null,2));
  else {console.log('Usage: node cli.mjs --example | --file decision.json');process.exitCode=1;}
} catch(error){console.error(error.message);process.exitCode=1;}
