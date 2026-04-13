const fs = require('fs');
const path = require('path');

function ensureMemoryDir(repoRoot) {
  const memoryDir = path.join(repoRoot, 'memory');
  if (!fs.existsSync(memoryDir)) {
    fs.mkdirSync(memoryDir, { recursive: true });
  }
  return memoryDir;
}

function writeSignalsJsonl(repoRoot, signals) {
  const memoryDir = ensureMemoryDir(repoRoot);
  const filePath = path.join(memoryDir, 'poster-signals.jsonl');
  const lines = signals.map(s => JSON.stringify(s)).join('\n');
  fs.appendFileSync(filePath, lines + '\n', 'utf8');
  return filePath;
}

function writeTranscript(repoRoot, signals) {
  const memoryDir = ensureMemoryDir(repoRoot);
  const filePath = path.join(memoryDir, 'poster-transcript.txt');
  const timestamp = new Date().toISOString();
  let content = `\n=== PosterStack Session @ ${timestamp} ===\n`;
  if (signals.length === 0) {
    content += 'No signals detected.\n';
  } else {
    for (const s of signals) {
      content += `[${s.type.toUpperCase()}] ${s.category}: ${s.message}\n`;
      if (s.context && typeof s.context === 'object') {
        content += `  Context: ${JSON.stringify(s.context)}\n`;
      }
    }
  }
  fs.appendFileSync(filePath, content, 'utf8');
  return filePath;
}

module.exports = {
  ensureMemoryDir,
  writeSignalsJsonl,
  writeTranscript
};
