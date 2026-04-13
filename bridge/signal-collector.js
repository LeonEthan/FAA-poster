const fs = require('fs');
const path = require('path');

class SignalCollector {
  constructor() {
    this.signals = [];
  }

  collectFromQAReport(reportPath) {
    const raw = fs.readFileSync(reportPath, 'utf8');
    const report = JSON.parse(raw);

    // Direct signals from QA report
    if (Array.isArray(report.signals)) {
      for (const sig of report.signals) {
        this.signals.push({
          type: 'error',
          category: this._mapSignalCategory(sig),
          message: sig,
          context: sig,
          severity: 'high',
          source: 'posterstack',
          timestamp: new Date().toISOString()
        });
      }
    }

    if (!report.passed) {
      this.signals.push({
        type: 'error',
        category: 'quality',
        message: 'QA report marked as failed',
        context: report.checks,
        severity: 'high',
        source: 'posterstack',
        timestamp: new Date().toISOString()
      });
    }

    return this.signals;
  }

  collectFromPrompt(promptPath) {
    if (!fs.existsSync(promptPath)) return this.signals;
    const raw = fs.readFileSync(promptPath, 'utf8');
    const prompt = JSON.parse(raw);

    if (Array.isArray(prompt.edit_plan) && prompt.edit_plan.length > 3) {
      this.signals.push({
        type: 'warning',
        category: 'workflow',
        message: `Edit plan has ${prompt.edit_plan.length} rounds (>3), indicating prompt quality issues`,
        context: { edit_rounds: prompt.edit_plan.length },
        severity: 'medium',
        source: 'posterstack',
        timestamp: new Date().toISOString()
      });
    }

    if (!prompt.full_prompt || prompt.full_prompt.length < 50) {
      this.signals.push({
        type: 'error',
        category: 'prompt',
        message: 'Full prompt is too short or missing',
        context: { prompt_length: prompt.full_prompt ? prompt.full_prompt.length : 0 },
        severity: 'high',
        source: 'posterstack',
        timestamp: new Date().toISOString()
      });
    }

    return this.signals;
  }

  _mapSignalCategory(sig) {
    if (sig.includes('contrast')) return 'color';
    if (sig.includes('font') || sig.includes('typography') || sig.includes('text')) return 'typography';
    if (sig.includes('layout') || sig.includes('hierarchy')) return 'composition';
    if (sig.includes('margin') || sig.includes('mobile') || sig.includes('safe')) return 'responsive';
    if (sig.includes('prompt')) return 'prompt';
    if (sig.includes('image')) return 'imagegen';
    return 'general';
  }

  getSignals() {
    return this.signals;
  }
}

module.exports = { SignalCollector };
