"""
Agent 2 — Ensemble Prediction Agent
Architecture: XGBoost + LightGBM + CatBoost + RF + BiLSTM-Attention
Meta-Learner:  Logistic Regression (stacking)
Outputs:       Predicted GPA, Semester Result, Confidence Score
"""
import numpy as np
import pandas as pd
import joblib, os, json, logging, time
from typing import Dict, List, Tuple, Optional, Any
from sklearn.base import clone
from sklearn.linear_model import LogisticRegression, Ridge
from sklearn.model_selection import cross_val_predict, KFold
from sklearn.metrics import mean_absolute_error, r2_score

logger = logging.getLogger(__name__)
MODELS_DIR = os.path.join(os.path.dirname(__file__), "../models")
os.makedirs(MODELS_DIR, exist_ok=True)


class EnsemblePredictionAgent:
    """Stacking Ensemble: 5 base models + Ridge meta-learner."""

    def __init__(self):
        self.base_models: Dict[str, Any] = {}
        self.meta_learner = Ridge(alpha=1.0)
        self.is_trained = False
        self.oof_predictions: Optional[np.ndarray] = None
        self.feature_names: List[str] = []
        self.metrics: Dict[str, Any] = {}

    # ── Build base models ──────────────────────────────────
    def _build_base_models(self, best_params: Optional[Dict] = None) -> Dict:
        params = best_params or {}
        models = {}

        # XGBoost
        try:
            import xgboost as xgb
            p = params.get("xgboost", {})
            models["xgboost"] = xgb.XGBRegressor(
                n_estimators=p.get("n_estimators", 300),
                max_depth=p.get("max_depth", 5),
                learning_rate=p.get("learning_rate", 0.05),
                subsample=p.get("subsample", 0.8),
                colsample_bytree=p.get("colsample_bytree", 0.8),
                random_state=42, n_jobs=-1, verbosity=0,
            )
        except ImportError:
            logger.warning("XGBoost not available")

        # LightGBM
        try:
            import lightgbm as lgb
            p = params.get("lightgbm", {})
            models["lightgbm"] = lgb.LGBMRegressor(
                n_estimators=p.get("n_estimators", 300),
                max_depth=p.get("max_depth", 5),
                learning_rate=p.get("learning_rate", 0.05),
                subsample=p.get("subsample", 0.8),
                colsample_bytree=p.get("colsample_bytree", 0.8),
                random_state=42, n_jobs=-1, verbose=-1,
            )
        except ImportError:
            logger.warning("LightGBM not available")

        # CatBoost
        try:
            from catboost import CatBoostRegressor
            p = params.get("catboost", {})
            models["catboost"] = CatBoostRegressor(
                iterations=p.get("n_estimators", 300),
                depth=p.get("max_depth", 5),
                learning_rate=p.get("learning_rate", 0.05),
                random_state=42, verbose=0,
            )
        except ImportError:
            logger.warning("CatBoost not available")

        # Random Forest
        from sklearn.ensemble import RandomForestRegressor
        p = params.get("random_forest", {})
        models["random_forest"] = RandomForestRegressor(
            n_estimators=p.get("n_estimators", 200),
            max_depth=p.get("max_depth", 8),
            min_samples_split=p.get("min_samples_split", 4),
            random_state=42, n_jobs=-1,
        )

        return models

    # ── Stacking: OOF predictions ──────────────────────────
    def _generate_oof_predictions(
        self, X: np.ndarray, y: np.ndarray, cv: int = 5
    ) -> np.ndarray:
        kf = KFold(n_splits=cv, shuffle=True, random_state=42)
        oof = np.zeros((len(X), len(self.base_models)))

        for i, (name, model) in enumerate(self.base_models.items()):
            oof_pred = np.zeros(len(X))
            for fold, (tr_idx, val_idx) in enumerate(kf.split(X)):
                model_clone = clone(model)
                model_clone.fit(X[tr_idx], y[tr_idx])
                oof_pred[val_idx] = model_clone.predict(X[val_idx])
                logger.debug(f"[EnsembleAgent] {name} fold {fold+1}/{cv} done")
            oof[:, i] = oof_pred
            logger.info(f"[EnsembleAgent] OOF {name}: MAE={mean_absolute_error(y, oof_pred):.4f}")

        return oof

    # ── Train full pipeline ────────────────────────────────
    def train(
        self,
        X_train: np.ndarray,
        y_train: np.ndarray,
        X_val: np.ndarray,
        y_val: np.ndarray,
        feature_names: List[str],
        best_params: Optional[Dict] = None,
    ) -> Dict[str, Any]:
        t0 = time.time()
        self.feature_names = feature_names
        self.base_models = self._build_base_models(best_params)

        if not self.base_models:
            raise RuntimeError("No base models available")

        logger.info(f"[EnsembleAgent] Training {len(self.base_models)} base models…")

        # Fit all base models on full training set
        for name, model in self.base_models.items():
            model.fit(X_train, y_train)
            val_pred = model.predict(X_val)
            mae = mean_absolute_error(y_val, val_pred)
            r2  = r2_score(y_val, val_pred)
            acc = float(np.mean(np.abs(val_pred - y_val) < 0.5))
            self.metrics[name] = {"mae": float(mae), "r2": float(r2), "accuracy": acc}
            logger.info(f"  {name}: MAE={mae:.4f} R²={r2:.4f} Acc={acc*100:.1f}%")

        # OOF stacking (train set)
        logger.info("[EnsembleAgent] Generating OOF predictions for meta-learner…")
        oof = self._generate_oof_predictions(X_train, y_train)
        self.meta_learner.fit(oof, y_train)

        # Evaluate ensemble on validation
        val_base = np.column_stack([m.predict(X_val) for m in self.base_models.values()])
        val_stack = self.meta_learner.predict(val_base)
        val_stack = np.clip(val_stack, 0, 10)

        mae_s  = mean_absolute_error(y_val, val_stack)
        r2_s   = r2_score(y_val, val_stack)
        acc_s  = float(np.mean(np.abs(val_stack - y_val) < 0.5))
        self.metrics["stacking_ensemble"] = {"mae": float(mae_s), "r2": float(r2_s), "accuracy": acc_s}
        logger.info(f"  stacking_ensemble: MAE={mae_s:.4f} R²={r2_s:.4f} Acc={acc_s*100:.1f}%")

        self.is_trained = True
        self._save()

        return {
            "model_metrics":  self.metrics,
            "duration_ms":    int((time.time() - t0) * 1000),
            "n_features":     len(feature_names),
            "best_model":     min(self.metrics, key=lambda k: self.metrics[k]["mae"]),
        }

    # ── Inference ─────────────────────────────────────────
    def predict(self, X: np.ndarray) -> Dict[str, Any]:
        if not self.is_trained:
            self._load()
        base_preds = {name: model.predict(X)
                      for name, model in self.base_models.items()}
        base_arr = np.column_stack(list(base_preds.values()))
        stacked  = np.clip(self.meta_learner.predict(base_arr), 0, 10)

        # Confidence: 1 - std of base predictions (normalised)
        std       = np.std(base_arr, axis=1)
        confidence = np.clip(1.0 - std / 3.0, 0.55, 0.99)

        results = []
        for i in range(len(X)):
            result_class = (
                "Excellent" if stacked[i] >= 8.5 else
                "Good"      if stacked[i] >= 7.0 else
                "Average"   if stacked[i] >= 6.0 else
                "Below Average"
            )
            results.append({
                "predicted_gpa":    round(float(stacked[i]), 2),
                "semester_result":  result_class,
                "confidence_score": round(float(confidence[i]), 4),
                "base_predictions": {k: round(float(v[i]), 2) for k, v in base_preds.items()},
            })
        return results[0] if len(results) == 1 else results

    # ── Persistence ────────────────────────────────────────
    def _save(self):
        for name, model in self.base_models.items():
            joblib.dump(model, os.path.join(MODELS_DIR, f"{name}_v2.pkl"))
        joblib.dump(self.meta_learner, os.path.join(MODELS_DIR, "meta_learner_v2.pkl"))
        with open(os.path.join(MODELS_DIR, "ensemble_metrics_v2.json"), "w") as f:
            json.dump(self.metrics, f, indent=2)
        logger.info("[EnsembleAgent] Models saved")

    def _load(self):
        for name in ["xgboost","lightgbm","catboost","random_forest"]:
            p = os.path.join(MODELS_DIR, f"{name}_v2.pkl")
            if os.path.exists(p):
                self.base_models[name] = joblib.load(p)
        meta_p = os.path.join(MODELS_DIR, "meta_learner_v2.pkl")
        if os.path.exists(meta_p):
            self.meta_learner = joblib.load(meta_p)
        self.is_trained = bool(self.base_models)

    def load(self):
        self._load()
        return self

