"""
Agent 6 — Recommendation Agent
Input:  Prediction results + SHAP explanation + Student history
Output: Personalized, prioritised recommendations
Technology: Rule-based engine (tier-1) + LLM hook (tier-2)
"""
from typing import Dict, List, Any, Optional
import logging

logger = logging.getLogger(__name__)

RECOMMENDATION_RULES = [
    # (condition_fn, priority, category, recommendation)
    (lambda f: f.get("attendance_pct", 100) < 60,
     1, "attendance", "🚨 URGENT: Attend ALL remaining classes immediately — debarment risk below 60%"),
    (lambda f: 60 <= f.get("attendance_pct", 100) < 75,
     1, "attendance", "⚠️ Boost attendance above 75% — you are close to the exam eligibility threshold"),
    (lambda f: 75 <= f.get("attendance_pct", 100) < 85,
     2, "attendance", "Aim for 90%+ attendance to strengthen your academic standing"),
    (lambda f: f.get("assignment_rate", 1) < 0.5,
     1, "assignments", "🚨 Submit all overdue assignments immediately — partial credit beats zero"),
    (lambda f: 0.5 <= f.get("assignment_rate", 1) < 0.75,
     2, "assignments", "Improve assignment submission rate above 80% — set weekly completion targets"),
    (lambda f: f.get("assignment_submission_delay", 0) > 2,
     2, "assignments", "Reduce late submissions — prepare a personal deadline tracker"),
    (lambda f: f.get("backlog_count", 0) >= 3,
     1, "academics", f"🚨 Clear {'{backlog_count}'} backlogs — register for next supplementary exam"),
    (lambda f: f.get("backlog_count", 0) in [1, 2],
     2, "academics", "Clear pending backlogs before they accumulate — dedicate 1 hour daily per subject"),
    (lambda f: f.get("study_hours_per_week", 20) < 8,
     1, "study_habits", "🚨 Study time critically low (<8h/week) — increase to at least 20 hours/week"),
    (lambda f: 8 <= f.get("study_hours_per_week", 20) < 15,
     2, "study_habits", "Increase weekly study time to 20+ hours — use Pomodoro (25 min on / 5 min off)"),
    (lambda f: f.get("lms_login_frequency", 10) < 5,
     2, "engagement", "Log in to the LMS daily — access study materials, video lectures, and quizzes"),
    (lambda f: f.get("online_course_completion_pct", 80) < 50,
     2, "engagement", "Complete pending online modules — they count towards your engagement score"),
    (lambda f: f.get("hackathon_count", 1) == 0,
     3, "extracurricular", "Participate in at least one hackathon this semester — boosts placement profile"),
    (lambda f: f.get("avg_quiz_score", 70) < 50,
     2, "academics", "Practice topic quizzes regularly — target 70%+ to improve internal assessment"),
    (lambda f: f.get("avg_lab_score", 70) < 60,
     2, "academics", "Focus on lab performance — seek help from lab instructor for hands-on practice"),
    (lambda f: f.get("performance_delta", 0) < -0.5,
     1, "academics", "⚠️ GPA declining trend — book an appointment with your academic advisor immediately"),
    (lambda f: f.get("avg_internal_marks", 70) < 55,
     2, "academics", "Improve internal assessment marks — attend all unit tests and submit assignments on time"),
    (lambda f: f.get("digital_engagement", 0.5) < 0.3,
     3, "engagement", "Increase digital learning engagement — explore e-resources and online practice sets"),
    (lambda f: f.get("prev_sgpa", 7) >= 8.5,
     3, "excellence", "✅ Excellent GPA trajectory — consider research projects or competitive certifications"),
    (lambda f: f.get("engagement_score", 0.5) >= 0.7,
     3, "excellence", "✅ Great extracurricular engagement — leverage this for internship applications"),
]


class RecommendationAgent:
    def __init__(self):
        self.tier2_available = False  # Set True when LLM API configured

    def generate(
        self,
        features: Dict[str, float],
        predicted_gpa: float,
        risk_level: str,
        shap_explanation: Dict,
        student_history: Optional[List] = None,
    ) -> Dict[str, Any]:
        recs = self._rule_based(features, predicted_gpa)
        recs = self._enrich_with_shap(recs, shap_explanation)
        categorised = self._categorise(recs)
        study_plan  = self._build_study_plan(features, predicted_gpa)

        return {
            "predicted_gpa":   predicted_gpa,
            "risk_level":      risk_level,
            "recommendations": categorised,
            "priority_actions": [r["text"] for r in recs if r["priority"] == 1][:5],
            "study_plan":      study_plan,
            "total_count":     len(recs),
        }

    def _rule_based(self, features: Dict, predicted_gpa: float) -> List[Dict]:
        triggered = []
        for cond, priority, category, template in RECOMMENDATION_RULES:
            try:
                if cond(features):
                    text = template.format(**{k: int(v) for k, v in features.items()
                                              if isinstance(v, (int, float))})
                    triggered.append({"priority": priority, "category": category, "text": text})
            except Exception:
                pass

        # GPA-level generic advice
        if predicted_gpa < 6.0:
            triggered.insert(0, {"priority": 1, "category": "academics",
                                  "text": f"📚 Predicted GPA {predicted_gpa:.2f} is at risk — intensive remedial study needed"})
        elif predicted_gpa >= 9.0:
            triggered.append({"priority": 3, "category": "excellence",
                               "text": "🏆 On track for outstanding GPA — aim for research publication or national competitions"})

        triggered.sort(key=lambda x: x["priority"])
        return triggered[:15]

    def _enrich_with_shap(self, recs: List[Dict], shap: Dict) -> List[Dict]:
        neg = shap.get("negative_factors", [])
        for n in neg[:3]:
            feat = n.get("feature", "").lower()
            impact = n.get("impact", "")
            if feat and not any(feat in r["text"].lower() for r in recs):
                recs.insert(0, {
                    "priority": 1,
                    "category": "shap_insight",
                    "text": f"⚡ AI Insight: '{n['feature']}' is dragging your score by {impact}",
                })
        return recs

    def _categorise(self, recs: List[Dict]) -> Dict[str, List[str]]:
        cats: Dict[str, List[str]] = {}
        for r in recs:
            cats.setdefault(r["category"], []).append(r["text"])
        return cats

    def _build_study_plan(self, features: Dict, gpa: float) -> Dict[str, Any]:
        hours = max(10, int(20 - (gpa - 5) * 2))
        plan = {
            "daily_study_hours": round(hours / 7, 1),
            "weekly_study_hours": hours,
            "focus_subjects": [],
            "daily_routine": [
                "07:00 – Morning revision (1h)",
                "09:00 – College / classes",
                "14:00 – Lab / practicals",
                "16:00 – Self-study / assignments (2h)",
                "19:00 – Online resources / LMS (1h)",
                "21:00 – Previous year paper practice (1h)",
            ],
            "weekly_goals": [
                "Complete all due assignments",
                f"Achieve {min(features.get('attendance_pct', 75) + 5, 100):.0f}% attendance",
                "Solve 10 practice problems per weak subject",
                "Login to LMS ≥ 5 times",
            ],
        }
        if features.get("backlog_count", 0) > 0:
            plan["focus_subjects"].append("Backlog clearance — 30 min extra per subject daily")
        if features.get("avg_lab_score", 70) < 65:
            plan["focus_subjects"].append("Lab strengthening — attend extra lab sessions")
        return plan


# Fix missing Optional import
import sys
if "Optional" not in dir():
    from typing import Optional
