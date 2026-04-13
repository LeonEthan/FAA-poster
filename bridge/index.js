#!/usr/bin/env node
const { program } = require('commander');
const fs = require('fs');
const path = require('path');
const { SignalCollector } = require('./signal-collector');
const { writeSignalsJsonl, writeTranscript } = require('./formatter');

program
  .description('PosterStack Bridge — feed gstack signals into evolver memory')
  .requiredOption('-i, --input <path>', 'Path to QA report JSON')
  .option('-p, --prompt <path>', 'Path to image_prompt.json', 'output/image_prompt.json')
  .option('-r, --root <path>', 'Project root', process.cwd())
  .parse();

const opts = program.opts();

if (!fs.existsSync(opts.input)) {
  console.error(`❌ Input file not found: ${opts.input}`);
  process.exit(1);
}

const collector = new SignalCollector();
collector.collectFromQAReport(opts.input);
if (fs.existsSync(opts.prompt)) {
  collector.collectFromPrompt(opts.prompt);
}
const signals = collector.getSignals();

const jsonlPath = writeSignalsJsonl(opts.root, signals);
const transcriptPath = writeTranscript(opts.root, signals);

console.log(`✅ Signals written to memory:`);
console.log(`   - ${jsonlPath} (${signals.length} signals)`);
console.log(`   - ${transcriptPath}`);
