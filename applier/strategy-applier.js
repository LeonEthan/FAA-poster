const fs = require('fs');
const path = require('path');

const SKILL_TARGET_MAP = {
  'gene_prompt_ecommerce_red_cta': 'poster-prompt/SKILL.md',
  'gene_prompt_minimalist_brand': 'poster-prompt/SKILL.md',
  'gene_prompt_tech_neon': 'poster-prompt/SKILL.md',
  'gene_edit_text_overlay': 'poster-edit/SKILL.md',
  'gene_edit_color_correction': 'poster-edit/SKILL.md',
  'gene_initialize_memory_infrastructure': 'poster-prompt/SKILL.md',
};

function applyGene(repoRoot, gene) {
  if (!gene || !gene.id) {
    console.log('⚠ No Gene found in prompt; nothing to apply.');
    return null;
  }

  const skillFile = SKILL_TARGET_MAP[gene.id] || 'poster-prompt/SKILL.md';
  const skillPath = path.join(repoRoot, 'skills', skillFile);

  if (!fs.existsSync(skillPath)) {
    console.error(`❌ Skill file not found: ${skillPath}`);
    return null;
  }

  const timestamp = new Date().toISOString();
  const strategyList = Array.isArray(gene.strategy)
    ? gene.strategy.map((s, i) => `${i + 1}. ${s}`).join('\n')
    : String(gene.strategy);

  const appendBlock = `

<!-- Auto-evolved by PosterStack @ ${timestamp} -->
## [Evolved] ${gene.id}
**Category:** ${gene.category || 'unknown'}  
**Trigger signals:** ${Array.isArray(gene.signals_match) ? gene.signals_match.join(', ') : '-'}  
**Strategy:**
${strategyList}
**Constraints:**
${gene.constraints ? '- max_files: ' + (gene.constraints.max_files || '-') : '- none'}

`;

  fs.appendFileSync(skillPath, appendBlock, 'utf8');
  console.log(`✅ Appended gene ${gene.id} to ${skillFile}`);
  return skillPath;
}

function applyCapsule(repoRoot, capsule) {
  if (!capsule || !capsule.id) {
    console.log('⚠ No Capsule found in prompt; nothing to apply.');
    return null;
  }

  const capsulesPath = path.join(repoRoot, 'assets', 'gep', 'capsules.json');
  let data = { version: 1, capsules: [] };
  if (fs.existsSync(capsulesPath)) {
    data = JSON.parse(fs.readFileSync(capsulesPath, 'utf8'));
  }

  const existingIndex = data.capsules.findIndex(c => c.id === capsule.id);
  if (existingIndex >= 0) {
    data.capsules[existingIndex] = capsule;
    console.log(`♻ Updated existing capsule ${capsule.id}`);
  } else {
    data.capsules.push(capsule);
    console.log(`✅ Appended new capsule ${capsule.id}`);
  }

  fs.writeFileSync(capsulesPath, JSON.stringify(data, null, 2) + '\n', 'utf8');
  return capsulesPath;
}

module.exports = { applyGene, applyCapsule };
