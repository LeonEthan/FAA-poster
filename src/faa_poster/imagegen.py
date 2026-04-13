import base64
import os
from pathlib import Path
from typing import Optional

import requests
from rich.console import Console

console = Console()

API_URL = "https://www.dmxapi.cn/v1beta/models/gemini-3.1-flash-image-preview:generateContent"


def _get_api_key() -> str:
    key = os.environ.get("LLM_API_KEY")
    if not key:
        # fallback to dotenv
        try:
            from dotenv import load_dotenv
            load_dotenv(Path.cwd() / ".env")
            key = os.environ.get("LLM_API_KEY")
        except Exception:
            pass
    if not key:
        raise RuntimeError("LLM_API_KEY not found in environment or .env")
    return key


def _aspect_ratio_to_dmxapi(ratio: str) -> str:
    mapping = {
        "1:1": "1:1",
        "9:16": "9:16",
        "16:9": "16:9",
        "4:5": "4:5",
        "3:4": "3:4",
        "4:3": "4:3",
        "2:3": "2:3",
        "3:2": "3:2",
        "21:9": "21:9",
    }
    return mapping.get(ratio, "1:1")


def _call_api(payload: dict, timeout: int = 300) -> dict:
    api_key = _get_api_key()
    headers = {
        "Content-Type": "application/json",
        "x-goog-api-key": api_key,
    }
    response = requests.post(API_URL, headers=headers, json=payload, timeout=timeout)
    if not response.ok:
        raise RuntimeError(f"Image API error {response.status_code}: {response.text}")
    return response.json()


def _extract_image_bytes(data: dict) -> Optional[bytes]:
    try:
        parts = data["candidates"][0]["content"]["parts"]
        for part in parts:
            if "inlineData" in part:
                b64 = part["inlineData"]["data"]
                return base64.b64decode(b64)
    except (KeyError, IndexError) as e:
        console.print(f"[yellow]Warning: could not extract image bytes: {e}")
    return None


def generate_image(
    prompt: str,
    aspect_ratio: str = "1:1",
    image_size: str = "1K",
    output_path: str = "output/poster_base.png",
) -> str:
    """Generate an image from text prompt using Gemini 3.1 Flash Image Preview."""
    ratio = _aspect_ratio_to_dmxapi(aspect_ratio)
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "responseModalities": ["IMAGE"],
            "imageConfig": {
                "aspectRatio": ratio,
                "imageSize": image_size,
            },
        },
    }
    console.print(f"🎨 Generating image ({ratio}, {image_size})...")
    data = _call_api(payload)
    image_bytes = _extract_image_bytes(data)
    if not image_bytes:
        raise RuntimeError("No image data returned from API")
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(image_bytes)
    console.print(f"[green]✓[/green] Saved base image to {output_path}")
    return str(out.absolute())


def edit_image(
    image_path: str,
    instruction: str,
    aspect_ratio: str = "1:1",
    output_path: str = "output/poster_final.png",
) -> str:
    """Edit an existing image via multi-turn conversation with Gemini Image API."""
    img_path = Path(image_path)
    if not img_path.exists():
        raise FileNotFoundError(f"Image not found: {image_path}")

    b64_data = base64.b64encode(img_path.read_bytes()).decode("utf-8")
    ratio = _aspect_ratio_to_dmxapi(aspect_ratio)

    payload = {
        "contents": [
            {
                "parts": [
                    {"inlineData": {"mimeType": "image/png", "data": b64_data}},
                    {"text": instruction},
                ]
            }
        ],
        "generationConfig": {
            "responseModalities": ["IMAGE"],
            "imageConfig": {
                "aspectRatio": ratio,
            },
        },
    }
    console.print(f"✏️  Editing image: {instruction[:60]}...")
    data = _call_api(payload)
    image_bytes = _extract_image_bytes(data)
    if not image_bytes:
        raise RuntimeError("No image data returned from edit API")
    out = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_bytes(image_bytes)
    console.print(f"[green]✓[/green] Saved edited image to {output_path}")
    return str(out.absolute())
