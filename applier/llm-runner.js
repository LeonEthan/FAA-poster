const fs = require('fs');

async function runLLM(promptText) {
  require('dotenv').config({ path: require('path').join(process.cwd(), '.env') });

  const apiKey = process.env.LLM_API_KEY;
  const baseUrl = process.env.LLM_BASE_URL || 'https://www.dmxapi.cn/v1';
  const model = process.env.LLM_MODEL || 'kimi-k2.5-thinking';

  if (!apiKey) {
    throw new Error('LLM_API_KEY not found in .env');
  }

  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;
  const body = {
    model,
    messages: [
      { role: 'system', content: 'You are a protocol-bound evolution engine. Output RAW JSON ONLY. No markdown code blocks. No prelude.' },
      { role: 'user', content: promptText }
    ],
    temperature: 0.2,
    stream: false,
  };

  console.log(`🤖 Calling LLM API: ${url} (model: ${model})`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 180000); // 180s timeout

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`LLM API error ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('LLM response missing content');
    }

    return content;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error('LLM API request timed out after 180 seconds');
    }
    throw err;
  }
}

module.exports = { runLLM };
