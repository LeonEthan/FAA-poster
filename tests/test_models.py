from faa_poster.models import PosterBrief, BriefConstraints, DesignStrategy, DimensionScore, QAReport


def test_poster_brief_creation():
    brief = PosterBrief(
        project="Test",
        brand_tone=["modern", "clean"],
        target_audience="devs",
        key_message="Hello",
        visual_premise="blue gradient",
        mandatory_elements=["logo", "cta"],
        constraints=BriefConstraints(size="1080x1350", language="zh-CN"),
    )
    assert brief.project == "Test"
    assert brief.constraints.size == "1080x1350"


def test_design_strategy_scores():
    ds = DesignStrategy(
        scores={
            "composition": DimensionScore(score=8, target=10, suggestion="add whitespace"),
            "color": DimensionScore(score=7, target=10, suggestion="increase contrast"),
        },
        layout_rule="f-pattern",
        color_strategy="high-contrast-cta",
        typography_rule="max-3-fonts-hierarchy",
        template="ecommerce_promo",
    )
    assert ds.scores["composition"].score == 8
    assert ds.layout_rule == "f-pattern"


def test_qa_report_defaults():
    report = QAReport(passed=True, checks={}, screenshots={})
    assert report.passed is True
    assert report.signals == []
