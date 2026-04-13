#!/bin/bash
set -e

ROUND=$1
if [ -z "$ROUND" ]; then
  echo "Usage: $0 <round_number>"
  exit 1
fi

OUTDIR="output/v${ROUND}"
mkdir -p "${OUTDIR}"

echo "🎨 Poster Evolution Round ${ROUND}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Step 1 (Manual): In Kimi CLI, run:"
echo "  /poster-brief"
echo "  /poster-strategy"
echo "  /poster-prompt"
echo "  /poster-visualize"
echo "  /poster-edit"
echo "  /poster-check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -r -p "Press Enter when manual steps are done..."

# Archive outputs for this round
cp output/brief.json "${OUTDIR}/" 2>/dev/null || true
cp output/image_generation_strategy.json "${OUTDIR}/" 2>/dev/null || true
cp output/image_prompt.json "${OUTDIR}/" 2>/dev/null || true
cp output/poster_base.png "${OUTDIR}/" 2>/dev/null || true
cp output/poster_step_*.png "${OUTDIR}/" 2>/dev/null || true
cp output/poster_final.png "${OUTDIR}/" 2>/dev/null || true
cp output/qa_report.json "${OUTDIR}/" 2>/dev/null || true

echo ""
echo "Step 2: Running Bridge..."
node bridge/index.js --input output/qa_report.json --prompt output/image_prompt.json

echo ""
echo "Step 3: Running Evolver..."
EVOLVER_DIR="${EVOLVER_DIR:-../evolver}"
if [ ! -d "${EVOLVER_DIR}" ]; then
  echo "⚠ Evolver not found at ${EVOLVER_DIR}."
  echo "  Clone it with: git clone https://github.com/EvoMap/evolver.git ${EVOLVER_DIR}"
  echo "  Or set EVOLVER_DIR to the correct path."
  exit 1
fi

MEMORY_DIR="$(pwd)/memory" node "${EVOLVER_DIR}/index.js" run > memory/latest_gep_prompt.txt
echo "✅ GEP prompt saved to memory/latest_gep_prompt.txt"

echo ""
echo "Step 4: Calling LLM to execute GEP prompt..."
node applier/index.js --prompt memory/latest_gep_prompt.txt --auto-llm

echo ""
echo "✅ Round ${ROUND} complete."
echo "   Outputs: ${OUTDIR}/"
echo "   GEP prompt: memory/latest_gep_prompt.txt"
echo "   GEP response: memory/latest_gep_response.json"
