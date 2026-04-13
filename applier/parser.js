const fs = require('fs');

function parseGEPPrompt(promptText) {
  const objects = [];
  const seen = new Set();

  // Strategy 1: scan each non-empty line as a potential JSON object
  const lines = promptText.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('===') || trimmed.startsWith('---')) continue;
    tryParse(trimmed, objects, seen);
  }

  // Strategy 2: try multi-line JSON blocks separated by blank lines
  let buffer = '';
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('===') || trimmed.startsWith('---')) {
      if (buffer) {
        tryParse(buffer, objects, seen);
        buffer = '';
      }
      continue;
    }
    buffer += line + '\n';
  }
  if (buffer) {
    tryParse(buffer, objects, seen);
  }

  // Strategy 3: find JSON blocks inside markdown code fences
  const fenceRegex = /```json\n([\s\S]*?)\n```/g;
  let m;
  while ((m = fenceRegex.exec(promptText)) !== null) {
    tryParse(m[1], objects, seen);
  }

  const result = {
    mutation: objects.find(o => o.type === 'Mutation') || null,
    personality: objects.find(o => o.type === 'PersonalityState') || null,
    event: objects.find(o => o.type === 'EvolutionEvent') || null,
    gene: objects.find(o => o.type === 'Gene') || null,
    capsule: objects.find(o => o.type === 'Capsule') || null,
  };

  return result;
}

function tryParse(text, targetArray, seenSet) {
  try {
    const obj = JSON.parse(text.trim());
    if (obj && obj.type) {
      const key = obj.type + ':' + (obj.id || JSON.stringify(obj).slice(0, 200));
      if (!seenSet.has(key)) {
        seenSet.add(key);
        targetArray.push(obj);
      }
    }
  } catch (e) {
    // ignore invalid JSON
  }
}

module.exports = { parseGEPPrompt };
