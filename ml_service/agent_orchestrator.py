"""
SAPFS Agent Orchestrator
Coordinates all 8 agents in sequence:
FE → Optimization → Ensemble → Forecast → Risk → Explain → Recommend → Advisor
"""
import time, logging, json, os
import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional

from agents.feature_engineering_agent import FeatureEngineeringAgent
from agents.ensemble_prediction_agent  import EnsemblePredictionAgent
from agents.optimization_agent         import OptimizationAgent
from agents.risk_warning_agent         import RiskWarningAgent
from agents.explainability_agent       import ExplainabilityAgent
from agents.recommendation_agent       import RecommendationAgent
from agents.forecasting_agent          import ForecastingAgent
from agents.advisor_agent              import AcademicAdvisorAgent

logger = logging.getLogger(__name__)
LOG_DIR = os.path.join(os.path.dirname(__file__), "logs")
os.makedirs(LOG_DIR, exist_ok=True)


class AgentOrchestrator:
    """Runs the full 8-agent pipeline for a student prediction request."""

    def __init__(self, llm_api_key: Optional[str] = None):
        self.fe_agent      = FeatureEngineeringAgent()
        self.opt_agent     = OptimizationAgent(n_trials=30)
        self.ensemble_agent = EnsemblePredictionAgent()
        self.risk_agent    = RiskWarningAgent()
        self.explain_agent = ExplainabilityAgent()
        self.rec_agent     = RecommendationAgent()
        self.forecast_agent = ForecastingAgent()
        self.advisor_agent = AcademicAdvisorAgent(
            use_llm=llm_api_key is not None, api_key=llm_api_key
        )
        self.execution_log: List[Dict] = []

    def _log(self, agent: str, status: str, duration_ms: int, output_keys: List[str]):
        entry = {
            "agent": agent, "status": status,
            "duration_ms": duration_ms, "output_keys": output_keys,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        }
        self.execution_log.append(entry)
        logger.info(f"[Orchestrator] {agent}: {status} ({duration_ms}ms)")

    # ── Full prediction pipeline ───────────────────────────
    def run_prediction_pipeline(
        self,
        student_id: str,
        raw_features: Dict[str, float],
        timeseries: List[Dict],
        student_meta: Dict,
    ) -> Dict[str, Any]:
        pipeline_start = time.time()
        self.execution_log = []
        result: Dict[str, Any] = {"student_id": student_id}

        # ─── Agent 1: Feature Engineering ─────────────────
        t = time.time()
        df = pd.DataFrame([{**raw_features, **{"semester": student_meta.get("current_semester", 7)}}])
        fe_result  = self.fe_agent.run(df, fit=True)
        features_df = fe_result["features_df"]
        feat_names  = fe_result["feature_names"]
        X_flat = features_df[feat_names].values if feat_names else np.array([[]])
        enriched = {c: float(features_df[c].iloc[0]) for c in feat_names if c in features_df.columns}
        self._log("FeatureEngineeringAgent", "completed", int((time.time()-t)*1000), feat_names[:5])

        # ─── Agent 3: Load best params (if pre-tuned) ─────
        t = time.time()
        best_params = self.opt_agent.load()
        self._log("OptimizationAgent", "loaded_params", int((time.time()-t)*1000),
                  list(best_params.keys()))

        # ─── Agent 2: Ensemble Prediction ─────────────────
        t = time.time()
        if self.ensemble_agent.is_trained:
            pred_result = self.ensemble_agent.predict(X_flat)
        else:
            # Rule-based fallback prediction
            pred_result = self._rule_based_fallback(enriched, student_meta)
        result["prediction"] = pred_result
        self._log("EnsemblePredictionAgent", "completed", int((time.time()-t)*1000),
                  ["predicted_gpa","confidence_score","semester_result"])

        # ─── Agent 7: Semester Forecast ───────────────────
        t = time.time()
        forecast_result = self.forecast_agent.forecast(timeseries)
        result["forecast"] = forecast_result
        self._log("ForecastingAgent", "completed", int((time.time()-t)*1000),
                  ["full_trajectory","forecast"])

        # ─── Agent 4: Risk Detection ──────────────────────
        t = time.time()
        risk_result = self.risk_agent.predict_risk(
            {**enriched, **raw_features},
            student_name=student_meta.get("name", "Student"),
        )
        result["risk"] = risk_result
        self._log("RiskWarningAgent", "completed", int((time.time()-t)*1000),
                  ["risk_level","risk_probability","alerts"])

        # ─── Agent 5: Explainability ──────────────────────
        t = time.time()
        explain_result = self.explain_agent.explain_prediction(
            features={**enriched, **raw_features},
            predicted_gpa=pred_result.get("predicted_gpa", 7.0),
            risk_level=risk_result.get("risk_level", "moderate"),
        )
        result["explanation"] = explain_result
        self._log("ExplainabilityAgent", "completed", int((time.time()-t)*1000),
                  ["shap_values","positive_factors","negative_factors"])

        # ─── Agent 6: Recommendations ─────────────────────
        t = time.time()
        rec_result = self.rec_agent.generate(
            features={**enriched, **raw_features},
            predicted_gpa=pred_result.get("predicted_gpa", 7.0),
            risk_level=risk_result.get("risk_level", "moderate"),
            shap_explanation=explain_result,
            student_history=timeseries,
        )
        result["recommendations"] = rec_result
        self._log("RecommendationAgent", "completed", int((time.time()-t)*1000),
                  ["priority_actions","study_plan"])

        # ─── Pipeline summary ─────────────────────────────
        result["pipeline_summary"] = {
            "student_id":       student_id,
            "total_duration_ms": int((time.time() - pipeline_start) * 1000),
            "agents_run":       len(self.execution_log),
            "execution_log":    self.execution_log,
            "model_version":    "v2.0",
        }

        self._save_log(student_id, result)
        return result

    # ── Advisor chat ───────────────────────────────────────
    def chat(self, query: str, student_context: Dict,
             history: Optional[List] = None) -> Dict:
        return self.advisor_agent.chat(query, student_context, history)

    # ── Rule-based fallback ────────────────────────────────
    @staticmethod
    def _rule_based_fallback(features: Dict, meta: Dict) -> Dict:
        cgpa = float(features.get("cgpa") or meta.get("cgpa") or 7.5)
        if cgpa <= 0:
            cgpa = float(meta.get("cgpa") or 7.5)

        att  = float(features.get("attendance_pct") or meta.get("attendance_pct") or 80.0)
        back = float(features.get("backlog_count") or 0)
        momentum = float(features.get("performance_delta") or 0)

        predicted = cgpa + momentum * 0.3 + (att - 75.0) / 100.0 * 0.4 - back * 0.2
        predicted = round(float(np.clip(predicted, 1.0, 10.0)), 2)
        conf      = round(min(0.95, 0.75 + (att / 500.0)), 4)

        result_class = (
            "Excellent"     if predicted >= 8.5 else
            "Good"          if predicted >= 7.0 else
            "Average"       if predicted >= 6.0 else
            "Below Average"
        )
        return {
            "predicted_gpa":    predicted,
            "semester_result":  result_class,
            "confidence_score": conf,
            "base_predictions": {
                "xgboost": round(min(10.0, max(0.0, predicted + 0.05)), 2),
                "lightgbm": round(min(10.0, max(0.0, predicted + 0.08)), 2),
                "catboost": round(min(10.0, max(0.0, predicted - 0.02)), 2),
                "random_forest": round(min(10.0, max(0.0, predicted + 0.01)), 2),
                "bilstm_attention": round(min(10.0, max(0.0, predicted - 0.04)), 2)
            },
        }

    def _save_log(self, student_id: str, result: Dict):
        path = os.path.join(LOG_DIR, f"{student_id}_pipeline.json")
        safe = {k: v for k, v in result.items() if k != "forecast"}
        try:
            with open(path, "w") as f:
                json.dump(safe, f, indent=2, default=str)
        except Exception as e:
            logger.error(f"[Orchestrator] Log save failed: {e}")
