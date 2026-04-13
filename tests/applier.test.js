const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { parseGEPPrompt } = require('../applier/parser');
const { applyGene, applyCapsule } = require('../applier/strategy-applier');

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'faa-test-'));
}

describe('Parser', () => {
  it('parses Mutation and Gene from raw text', () => {
    const text = `
Some prelude text.
{"type": "Mutation", "id": "mut_001", "category": "repair"}
{"type": "Gene", "id": "gene_test", "category": "repair", "signals_match": ["error"]}
{"type": "Capsule", "id": "cap_001", "gene": "gene_test"}
`;
    const parsed = parseGEPPrompt(text);
    assert.strictEqual(parsed.mutation.id, 'mut_001');
    assert.strictEqual(parsed.gene.id, 'gene_test');
    assert.strictEqual(parsed.capsule.id, 'cap_001');
  });

  it('returns nulls when no JSON found', () => {
    const parsed = parseGEPPrompt('just plain text');
    assert.strictEqual(parsed.mutation, null);
    assert.strictEqual(parsed.gene, null);
  });
});

describe('StrategyApplier', () => {
  it('appends gene to poster-prompt SKILL.md', () => {
    const root = tmpDir();
    const skillsDir = path.join(root, 'skills', 'poster-prompt');
    fs.mkdirSync(skillsDir, { recursive: true });
    const skillPath = path.join(skillsDir, 'SKILL.md');
    fs.writeFileSync(skillPath, '# Original\n');

    const gene = {
      id: 'gene_prompt_ecommerce_red_cta',
      category: 'optimize',
      signals_match: ['low_ctr'],
      strategy: ['Use high contrast', 'Limit palette']
    };

    const result = applyGene(root, gene);
    assert.ok(result.includes('poster-prompt/SKILL.md'));

    const content = fs.readFileSync(skillPath, 'utf8');
    assert.ok(content.includes('gene_prompt_ecommerce_red_cta'));
    assert.ok(content.includes('Use high contrast'));
  });

  it('appends capsule to capsules.json', () => {
    const root = tmpDir();
    const assetsDir = path.join(root, 'assets', 'gep');
    fs.mkdirSync(assetsDir, { recursive: true });

    const capsule = {
      type: 'Capsule',
      schema_version: '1.5.0',
      id: 'capsule_test_001',
      trigger: ['error'],
      gene: 'gene_test',
      summary: 'test capsule'
    };

    const result = applyCapsule(root, capsule);
    assert.ok(result.includes('capsules.json'));

    const data = JSON.parse(fs.readFileSync(result, 'utf8'));
    assert.ok(data.capsules.some(c => c.id === 'capsule_test_001'));
  });
});
