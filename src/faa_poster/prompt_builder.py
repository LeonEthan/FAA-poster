from typing import List, Optional
from pydantic import BaseModel, Field

from .models import PosterBrief


class ImagePrompt(BaseModel):
    base_prompt: str
    style_prompt: str
    composition_prompt: str
    text_overlay_prompt: str
    full_prompt: str
    edit_plan: List[str] = Field(default_factory=list)
    aspect_ratio: str = "1:1"
    image_size: str = "1K"


# Template registry for different poster categories
_PROMPT_TEMPLATES = {
    "ecommerce_promo": {
        "style": "Vibrant commercial product photography style, cinematic lighting, shallow depth of field, bold saturated colors, high-end advertising aesthetic.",
        "composition": "Centered hero product with dramatic lighting, ample negative space at top for headline text, clean bottom area for CTA button placement.",
        "edit_plan": [
            "Add a bold red '立即抢购' CTA button at the bottom center with white text and soft shadow.",
            "Overlay the main headline text at the top in large modern Chinese font with high contrast.",
            "Add a small promotional badge/tag near the top-left corner indicating discount or limited time offer.",
        ],
    },
    "brand_awareness": {
        "style": "Elegant minimalist photography, soft natural lighting, pastel or earthy tones, editorial magazine aesthetic, warm and inviting atmosphere.",
        "composition": "Asymmetric composition with subject on golden ratio intersection, generous whitespace, subtle gradient background.",
        "edit_plan": [
            "Overlay elegant serif headline text at upper-left in soft cream color.",
            "Add a delicate brand slogan in smaller text beneath the headline.",
            "Place a small QR code hint or '扫码领券' text at bottom-right corner.",
        ],
    },
    "event_announcement": {
        "style": "Futuristic tech visual style, neon accent lights, dark moody background with subtle grid or particles, cinematic cyberpunk atmosphere.",
        "composition": "Dynamic diagonal composition, strong contrast between dark background and glowing subject, clear focal point in center.",
        "edit_plan": [
            "Add glowing headline text in the center with tech-style sans-serif Chinese font.",
            "Overlay event date and location details at bottom-center in neon cyan color.",
            "Add a futuristic '立即报名' button at lower-right with holographic effect.",
        ],
    },
}


def build_image_prompt(
    brief: PosterBrief,
    strategy: Optional[dict] = None,
) -> ImagePrompt:
    strategy = strategy or {}
    template_key = strategy.get("template", "ecommerce_promo")
    template = _PROMPT_TEMPLATES.get(template_key, _PROMPT_TEMPLATES["ecommerce_promo"])

    brand_tone = ", ".join(brief.brand_tone)
    base = (
        f"Create a commercial poster for '{brief.project}'. "
        f"Target audience: {brief.target_audience}. "
        f"Core message: {brief.key_message}. "
        f"Visual concept: {brief.visual_premise}. "
        f"Brand tone: {brand_tone}."
    )

    style = template["style"]
    composition = template["composition"]
    text_overlay = (
        f"The poster must include the following Chinese text elements clearly readable: "
        f"headline: '{brief.key_message}', mandatory elements: {', '.join(brief.mandatory_elements)}."
    )

    full = f"{base}\n\nStyle: {style}\n\nComposition: {composition}\n\nText requirements: {text_overlay}\n\nHigh quality, advertising poster, no watermarks."

    # Customize edit plan with actual brief content
    raw_edit_plan = template.get("edit_plan", [])
    edit_plan = [step.replace("立即抢购", brief.mandatory_elements[-1] if brief.mandatory_elements else "立即抢购") for step in raw_edit_plan]

    aspect = brief.constraints.size or "1080x1350"
    ratio_map = {
        "1080x1350": "4:5",
        "1080x1920": "9:16",
        "1080x1080": "1:1",
        "1200x628": "21:9",
    }
    aspect_ratio = ratio_map.get(aspect, "1:1")

    return ImagePrompt(
        base_prompt=base,
        style_prompt=style,
        composition_prompt=composition,
        text_overlay_prompt=text_overlay,
        full_prompt=full,
        edit_plan=edit_plan,
        aspect_ratio=aspect_ratio,
        image_size="1K",
    )
