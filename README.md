# FAA-poster — PosterStack + Evolver (ImageGen Edition)

> 基于 **gstack-kimi-cli + evolver + Gemini 3.1 Flash Image Preview (nano-banana 2)** 的进化式 AI 海报/广告设计系统。
> **核心变革**：从"HTML 预排版+截图"彻底升级为"纯文生图 + 多轮对话改图 + 进化式 Prompt 工程"。

## 核心概念

这不是一个"一次性生成图片"的工具，而是一个**持续进化的智能设计系统**：

1. **gstack 角色层（PosterStack）**：创意总监 → 美术指导 → Prompt 工程师 → 图像生成师 → 图像编辑师 → QA，协作产出最终海报 PNG。
2. **Evolver 进化层**：采集设计过程中的信号（prompt 质量低、编辑轮次过多、图文可读性差），通过 GEP 协议生成改进策略。
3. **策略固化**：成功的 prompt 技巧和编辑指令被编码为 **Gene**，写入 `poster-prompt/SKILL.md`，下一批海报自动继承。

---

## 项目结构

```
FAA-poster/
├── skills/                    # 自定义 gstack 技能
│   ├── poster-brief/SKILL.md       # 创意总监
│   ├── poster-strategy/SKILL.md    # 美术指导（输出图像生成策略）
│   ├── poster-prompt/SKILL.md      # Prompt 工程师
│   ├── poster-visualize/SKILL.md   # 图像生成师（文生图）
│   ├── poster-edit/SKILL.md        # 图像编辑师（多轮改图）
│   └── poster-check/SKILL.md       # 视觉 QA
├── bridge/                    # Node.js — gstack → evolver
├── applier/                   # Node.js — evolver → gstack（含 LLM 自动调用）
├── assets/gep/                # 海报专用 Gene / Capsule
├── memory/                    # evolver 输入日志
├── src/faa_poster/            # Python 封装层
│   ├── imagegen.py            # Gemini Image API 封装
│   ├── prompt_builder.py      # brief → 结构化 image prompt
│   └── cli.py                 # visualize / edit / check / build-prompt
├── examples/                  # 示例 brief
└── run-poster-evolution.sh    # 一键全自动进化脚本
```

---

## 快速开始

### 1. 安装依赖

```bash
# Node 依赖（bridge + applier）
npm install

# Python 依赖（渲染引擎）
pip install -e ".[dev]"
```

### 2. 安装自定义 gstack 技能

```bash
bash bin/setup-skills
```

这会将 `skills/` 下的 6 个角色软链到 `~/.kimi/skills/`。

### 3. 运行一轮设计

在 Kimi CLI 中依次执行：

```
/poster-brief
/poster-strategy
/poster-prompt
/poster-visualize
/poster-edit
/poster-check
```

**各角色产出：**
- `poster-brief` → `output/brief.json`
- `poster-strategy` → `output/image_generation_strategy.json`
- `poster-prompt` → `output/image_prompt.json`（含 `full_prompt` + `edit_plan`）
- `poster-visualize` → `output/poster_base.png`（Gemini 文生图）
- `poster-edit` → `output/poster_step_1.png` / `poster_step_2.png` ... → `output/poster_final.png`
- `poster-check` → `output/qa_report.json`

### 4. 运行全自动进化闭环

```bash
bash run-poster-evolution.sh 1
```

脚本会自动：
1. 归档当前输出到 `output/v1/`
2. 运行 `bridge` 提取信号到 `memory/`
3. 运行 `evolver` 生成 GEP prompt
4. **自动调用 LLM API**（`kimi-k2.5-thinking` 通过 `dmxapi.cn`）执行 GEP prompt，获取 5 个 JSON 对象
5. 运行 `applier` 将 Gene 规则追加到 `skills/poster-prompt/SKILL.md`

> **LLM 配置说明**  
> API 配置已经写入 `.env`（已被 `.gitignore` 忽略）。如需切换模型或平台，直接修改 `.env` 中的 `LLM_BASE_URL`、`LLM_API_KEY`、`LLM_MODEL` 即可。

### 5. 查看进化结果

```bash
cat memory/latest_gep_prompt.txt
cat memory/latest_gep_response.json
cat skills/poster-prompt/SKILL.md | tail -n 20
```

---

## 技术架构详解

### 图像生成引擎：`src/faa_poster/imagegen.py`

封装了 dmxapi.cn 的 Gemini 3.1 Flash Image Preview API：

```python
from faa_poster.imagegen import generate_image, edit_image

# 文生图
generate_image(
    prompt="A cinematic poster for a tech event...",
    aspect_ratio="9:16",
    image_size="1K",
    output_path="output/poster_base.png"
)

# 多轮对话改图
edit_image(
    image_path="output/poster_base.png",
    instruction="Add a bold red CTA button at bottom center",
    output_path="output/poster_final.png"
)
```

支持 **14 种宽高比**（1:1, 9:16, 16:9, 4:5, 3:4, 21:9 等）和 **1K/2K/4K** 分辨率。

### Prompt 工程：`src/faa_poster/prompt_builder.py`

将 `brief.json` + `image_generation_strategy.json` 转化为结构化的 `image_prompt.json`：

- `base_prompt`：主体、场景、品牌调性
- `style_prompt`：风格、光影、色调
- `composition_prompt`：构图、留白
- `text_overlay_prompt`：文字元素需求
- `full_prompt`：合并后的完整英文 prompt（直接喂给 API）
- `edit_plan`：1-3 轮图片编辑指令队列

### 进化基因库：`assets/gep/genes.json`

预置 5 个图像相关 Gene：
- `gene_prompt_ecommerce_red_cta` — 电商促销类 prompt 优化
- `gene_prompt_minimalist_brand` — 品牌简约风格 prompt 优化
- `gene_prompt_tech_neon` — 科技发布会风格 prompt 优化
- `gene_edit_text_overlay` — 图文叠加编辑指令优化
- `gene_edit_color_correction` — 色彩饱和度修复

---

## 关键设计决策

| 决策 | 说明 |
|------|------|
| **Gemini Image API 作为唯一图像引擎** | dmxapi.cn 已提供稳定接口，1K/2K/4K + 14种比例足够海报场景；无需额外接入 Midjourney/SD。 |
| **多轮编辑通过 image+text → API 实现** | Gemini 原生支持 `inlineData` 图片输入，实现真正的"对话式改图"，而不是每次都重新生成。 |
| **Prompt 结构化拆分** | 拆为 base/style/composition/text_overlay 便于 evolver 针对单一维度进化。 |
| **Applier 采用追加模式** | 不覆盖原始 `SKILL.md`，进化规则以 Markdown 区块追加，便于人工审查和回滚。 |
| **离线 evolver + 在线 LLM API 组合** | evolver 本地分析信号生成 GEP prompt，LLM API 自动执行该 prompt 产出 JSON，实现无人值守闭环。 |

---

## 扩展方向

- **A/B 测试闭环**：接入真实 CTR 数据，让 `text_legibility_low` 自动关联到 `low_ctr`。
- **风格 LoRA 微调**：基于历史生成的优质海报，训练专属风格 LoRA。
- **品牌资产库**：在 `SKILL.md` 中接入企业 VI 规范，自动校验品牌色值。
- **EvoMap 网络共享**：将成熟的 Capsule 发布到 evomap.ai，供其他海报项目复用。

---

## License

MIT
