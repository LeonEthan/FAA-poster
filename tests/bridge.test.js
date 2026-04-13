const { describe, it } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { SignalCollector } = require('../bridge/signal-collector');
const { writeSignalsJsonl, writeTranscript } = require('../bridge/formatter');

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'faa-test-'));
}

describe('SignalCollector', () => {
  it('collects signals from a failing QA report', () => {
    const tmp = tmpDir();
    const reportPath = path.join(tmp, 'qa_report.json');
    const report = {
      passed: false,
      checks: {
        contrast: { passed: false, violations: ['diff too low'] },
        min_font_size: { passed: true }
      },
      screenshots: {},
      signals: ['contrast_violation']
    };
    fs.writeFileSync(reportPath, JSON.stringify(report));

    const collector = new SignalCollector();
    collector.collectFromQAReport(reportPath);
    const signals = collector.getSignals();

    assert.ok(signals.length >= 2, 'should have at least 2 signals');
    assert.ok(signals.some(s => s.message === 'contrast_violation'));
    assert.ok(signals.some(s => s.message === 'QA report marked as failed'));
  });
});

describe('Formatter', () => {
  it('writes jsonl and transcript files', () => {
    const root = tmpDir();
    const signals = [
      { type: 'error', category: 'color', message: 'contrast_violation', source: 'posterstack', timestamp: '2026-01-01T00:00:00Z' }
    ];

    const j = writeSignalsJsonl(root, signals);
    const t = writeTranscript(root, signals);

    assert.ok(fs.existsSync(j));
    assert.ok(fs.existsSync(t));

    const lines = fs.readFileSync(j, 'utf8').trim().split('\n');
    assert.strictEqual(lines.length, 1);
    const obj = JSON.parse(lines[0]);
    assert.strictEqual(obj.message, 'contrast_violation');
  });
});
