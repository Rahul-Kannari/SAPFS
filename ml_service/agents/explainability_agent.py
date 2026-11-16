"""
Agent 5 — Explainability Agent
Technology: SHAP
Visualizations: Force Plot, Waterfall Plot, Feature Importance
Provides explanation for every prediction.
"""
import numpy as np
import json, logging, os
from typing import Dict, List, Any, Optional

logger = logging.getLogger(__name__)


class ExplainabilityAgent:
    def __init__(self):
        self.explainers: Dict[str, Any] = {}

    # ── Register model explainer ───────────────────────────
    def register_model(self, name: str, model: Any, X_background: Optional[np.ndarray] = None):
        try:
            import shap
            if hasattr(model, "feature_importances_"):           # tree models
                self.explainers[name] = shap.TreeExplainer(model)
            elif X_background is not None:
                self.explainers[name] = shap.KernelExplainer(model.predict, X_background[:100])
            logger.info(f"[ExplAgent] Registered explainer for {name}")
        except ImportError:
            logger.warning("[ExplAgent] SHAP not available")

    # ── Core SHAP computation ──────────────────────────────
    def compute_shap(
        self,
        model_name: str,
        X: np.ndarray,
        feature_names: List[str],
    ) -> Optional[Dict]:
        if model_name not in self.explainers:
            return self._fallback_importance(feature_names)
        try:
            import shap
            explainer = self.explainers[model_name]
            shap_vals  = explainer.shap_values(X)
            if isinstance(shap_vals, list):
                shap_vals = shap_vals[0]
            mean_abs   = np.abs(shap_vals).mean(axis=0)
            raw        = shap_vals[0] if shap_vals.ndim > 1 else shap_vals

            named = {feature_names[i]: float(raw[i]) for i in range(min(len(feature_names), len(raw)))}
            return {
                "shap_values":    named,
                "mean_abs_shap":  {feature_names[i]: float(mean_abs[i]) for i in range(min(len(feature_names), len(mean_abs)))},
                "base_value":     float(explainer.expected_value) if hasattr(explainer, "expected_value") else 0,
                "positive_factors": self._top_factors(named, positive=True),
                "negative_factors": self._top_factors(named, positive=False),
            }
        except Exception as e:
            logger.error(f"[ExplAgent] SHAP failed: {e}")
            return self._fallback_importance(feature_names)

    @staticmethod
    def _top_factors(named: Dict[str, float], positive: bool, n: int = 5) -> List[Dict]:
        items = [(k, v) for k, v in named.items() if (v > 0) == positive]
        items.sort(key=lambda x: abs(x[1]), reverse=True)
        return [{"feature": k, "impact": round(v * 100, 1), "direction": "+" if v > 0 else "-"}
                for k, v in items[:n]]

    # ── Formatted explanation (no SHAP fallback) ──────────
    def explain_prediction(
        self,
        features: Dict[str, float],
        predicted_gpa: float,
        risk_level: str,
        feature_names: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """Rule-based SHAP-style explanation when library unavailable."""
        importance_map = {
            "prev_sgpa": 0.22, "attendance_pct": 0.18, "cgpa": 0.15,
            "assignment_rate": 0.12, "study_hours_per_week": 0.09,
            "backlog_count": -0.10, "assignment_submission_delay": -0.07,
            "lms_login_frequency": 0.06, "engagement_score": 0.05,
            "performance_delta": 0.06,
        }

        shap_vals, pos_factors, neg_factors = {}, [], []
        for feat, weight in importance_map.items():
            val = features.get(feat, 0)
            norm = (val - 5) / 5 if "sgpa" in feat or "cgpa" in feat else val / 100
            contribution = weight * norm

            shap_vals[feat] = round(contribution, 4)
            label = feat.replace("_", " ").title()
            pct   = round(abs(contribution) * 100, 1)

            if contribution > 0:
                pos_factors.append({"feature": label, "impact": f"+{pct}%", "value": round(val, 2)})
            elif contribution < 0:
                neg_factors.append({"feature": label, "impact": f"-{pct}%", "value": round(val, 2)})

        pos_factors.sort(key=lambda x: float(x["impact"].replace("+","").replace("-","").replace("%","")), reverse=True)
        neg_factors.sort(key=lambda x: float(x["impact"].replace("+","").replace("-","").replace("%","")), reverse=True)

        # Force-plot data (waterfall style)
        waterfall = [
            {"feature": feat, "shap": val, "cumulative": round(sum(list(shap_vals.values())[:i+1]), 4)}
            for i, (feat, val) in enumerate(sorted(shap_vals.items(), key=lambda x: abs(x[1]), reverse=True)[:8])
        ]

        return {
            "predicted_gpa":    predicted_gpa,
            "risk_level":       risk_level,
            "shap_values":      shap_vals,
            "positive_factors": pos_factors[:5],
            "negative_factors": neg_factors[:5],
            "waterfall_data":   waterfall,
            "feature_importance": dict(sorted(
                {k: abs(v) for k, v in shap_vals.items()}.items(),
                key=lambda x: -x[1]
            )),
            "summary": (
                f"The predicted GPA of {predicted_gpa} is mainly driven by "
                f"{pos_factors[0]['feature'] if pos_factors else 'attendance'} "
                f"({pos_factors[0]['impact'] if pos_factors else 'N/A'} contribution). "
                f"{'Key risk factor: ' + neg_factors[0]['feature'] if neg_factors else 'No major risk factors.'}"
            ),
        }

    @staticmethod
    def _fallback_importance(feature_names: List[str]) -> Dict:
        weights = [0.22, 0.18, 0.15, 0.12, 0.09, 0.08, 0.07, 0.06, 0.05, 0.04]
        named = {feature_names[i]: weights[i] if i < len(weights) else 0.02
                 for i in range(len(feature_names))}
        return {"shap_values": named, "mean_abs_shap": named, "base_value": 7.0,
                "positive_factors": [], "negative_factors": []}
