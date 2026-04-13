from pathlib import Path
from faa_poster.prompt_builder import build_image_prompt, ImagePrompt
from faa_poster.models import PosterBrief, BriefConstraints


def test_prompt_builder_loads():
    brief = PosterBrief(
        project="Test",
        brand_tone=["modern", "clean"],
        target_audience="devs",
        key_message="Hello",
        visual_premise="blue gradient",
        mandatory_elements=["logo", "cta"],
        constraints=BriefConstraints(size="1080x1350", language="zh-CN"),
    )
    prompt = build_image_prompt(brief)
    assert prompt.full_prompt is not None
    assert len(prompt.full_prompt) > 50
