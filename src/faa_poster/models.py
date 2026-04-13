from typing import List, Optional
from pydantic import BaseModel, Field


class BriefConstraints(BaseModel):
    size: str = "1080x1350"
    language: str = "zh-CN"


class PosterBrief(BaseModel):
    project: str
    brand_tone: List[str] = Field(..., min_length=2, max_length=5)
    target_audience: str
    key_message: str
    visual_premise: str
    mandatory_elements: List[str]
    constraints: BriefConstraints = BriefConstraints()
    reference_urls: List[str] = []


class DimensionScore(BaseModel):
    score: int = Field(..., ge=0, le=10)
    target: int = Field(10, ge=0, le=10)
    suggestion: str


class DesignStrategy(BaseModel):
    scores: dict[str, DimensionScore]
    layout_rule: str
    color_strategy: str
    typography_rule: str
    white_space_ratio: float = 1.618
    template: str
    evolution_notes: List[str] = []


class QACheckItem(BaseModel):
    passed: bool
    violations: List[str] = []


class QAScreenshots(BaseModel):
    mobile: Optional[str] = None
    desktop: Optional[str] = None


class QAReport(BaseModel):
    passed: bool
    checks: dict
    screenshots: QAScreenshots
    signals: List[str] = []
