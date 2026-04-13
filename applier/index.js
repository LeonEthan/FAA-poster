#!/usr/bin/env node
const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const { parseGEPPrompt } = require('./parser');
const { applyGene, applyCapsule } = require('./strategy-applier');
const { runLLM } = require('./llm-runner');

program
  .description('PosterStack Applier — parse evolver GEP prompt and update skills')
  .requiredOption('-p, --prompt <path>', 'Path to GEP prompt file')
  .option('-r, --root <path>', 'Project root', process.cwd())
  .option('--auto-llm', 'Automatically call LLM API to get GEP response', false)
  .parse();

const opts = program.opts();

if (!fs.existsSync(opts.prompt)) {
  console.error(`❌ Prompt file not found: ${opts.prompt}`);
  process.exit(1);
}

let responseText;
let responsePath = opts.prompt;

if (opts.autoLlm) {
  const promptText = fs.readFileSync(opts.prompt, 'utf8');
  (async () => {
    try {
      responseText = await runLLM(promptText);
      responsePath = path.join(opts.root, 'memory', 'latest_gep_response.json');
      fs.writeFileSync(responsePath, responseText, 'utf8');
      console.log(`✅ LLM response saved to ${responsePath}`);
      runApplier(responsePath, opts.root);
    } catch (err) {
      console.error('❌ LLM call failed:', err.message);
      process.exit(1);
    }
  })();
} else {
  runApplier(responsePath, opts.root);
}

function runApplier(filePath, root) {
  const text = fs.readFileSync(filePath, 'utf8');
  const parsed = parseGEPPrompt(text);

  console.log('🔍 Parsed GEP objects:');
  console.log(`   Mutation: ${parsed.mutation ? parsed.mutation.id : 'none'}`);
  console.log(`   Gene: ${parsed.gene ? parsed.gene.id : 'none'}`);
  console.log(`   Capsule: ${parsed.capsule ? parsed.capsule.id : 'none'}`);

  applyGene(root, parsed.gene);
  applyCapsule(root, parsed.capsule);

  console.log('✅ Applier finished.');
}
