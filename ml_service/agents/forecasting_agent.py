"""
Agent 7 — Forecasting Agent
Model: BiLSTM with Attention
Output: Semester-wise future GPA trajectory (Sem 1→8)
"""
import numpy as np
import os, json, logging
from typing import Dict, List, Optional, Any

logger = logging.getLogger(__name__)
MODELS_DIR = os.path.join(os.path.dirname(__file__), "../models")


class AttentionLayer:
    """Simple attention mechanism – pure numpy (no Keras needed for inference)."""
    @staticmethod
    def apply(hidden_states: np.ndarray) -> np.ndarray:
        scores = np.dot(hidden_states, hidden_states[-1])
        weights = np.exp(scores - scores.max())
        weights /= weights.sum()
        return np.sum(hidden_states * weights[:, None], axis=0)


class ForecastingAgent:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.seq_len = 4
        self.is_trained = False

    def build_model(self, n_features: int, seq_len: int = 4):
        try:
            import tensorflow as tf
            from tensorflow.keras.models import Model
            from tensorflow.keras.layers import (
                Input, Bidirectional, LSTM, Dense, Dropout,
                Softmax, Flatten, Dot
            )

            self.seq_len = seq_len
            inputs = Input(shape=(seq_len, n_features))

            # BiLSTM layer
            bilstm_out = Bidirectional(
                LSTM(128, return_sequences=True, dropout=0.2, recurrent_dropout=0.1)
            )(inputs)

            # Attention layer
            attn_scores = Dense(1, activation="tanh")(bilstm_out)
            attn_scores = Flatten()(attn_scores)
            attn_weights = Softmax()(attn_scores)
            context = Dot(axes=1)([attn_weights, bilstm_out])

            # Dense head
            x = Dense(64, activation="relu")(context)
            x = Dropout(0.2)(x)
            x = Dense(32, activation="relu")(x)
            output = Dense(1, activation="linear")(x)

            self.model = Model(inputs, output)
            self.model.compile(optimizer="adam", loss="huber", metrics=["mae"])
            logger.info("[ForecastAgent] BiLSTM-Attention model built")
            return self.model
        except ImportError:
            logger.warning("[ForecastAgent] TensorFlow not available — using rule-based forecasting")
            return None

    def train(self, X_seq: np.ndarray, y: np.ndarray, epochs: int = 80) -> Dict:
        from sklearn.model_selection import train_test_split
        from sklearn.metrics import mean_absolute_error, r2_score

        if X_seq.shape[0] < 50:
            return {"status": "insufficient_data", "samples": X_seq.shape[0]}

        X_tr, X_v, y_tr, y_v = train_test_split(X_seq, y, test_size=0.2, random_state=42)
        n_features = X_seq.shape[2]

        if self.model is None:
            self.build_model(n_features, X_seq.shape[1])

        if self.model is None:
            return {"status": "model_unavailable"}

        try:
            from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau
            callbacks = [
                EarlyStopping(patience=12, restore_best_weights=True, monitor="val_mae"),
                ReduceLROnPlateau(factor=0.5, patience=6, min_lr=1e-6),
            ]
            history = self.model.fit(
                X_tr, y_tr, validation_data=(X_v, y_v),
                epochs=epochs, batch_size=64, callbacks=callbacks, verbose=0,
            )
            y_pred = self.model.predict(X_v, verbose=0).flatten()
            mae  = mean_absolute_error(y_v, y_pred)
            r2   = r2_score(y_v, y_pred)
            acc  = float(np.mean(np.abs(y_pred - y_v) < 1.0))

            self.model.save(os.path.join(MODELS_DIR, "bilstm_attention_v2.keras"))
            self.is_trained = True

            return {
                "mae": float(mae), "r2": float(r2), "accuracy": acc,
                "epochs_run": len(history.history["loss"]),
            }
        except Exception as e:
            logger.error(f"[ForecastAgent] Training failed: {e}")
            return {"status": "failed", "error": str(e)}

    # ── Rule-based forecasting (no model) ─────────────────
    @staticmethod
    def rule_based_forecast(
        timeseries: List[Dict],
        target_semesters: int = 8,
    ) -> List[Dict]:
        if not timeseries:
            return []

        sgpa_vals = [float(t.get("sgpa", 7.0)) for t in timeseries]
        att_vals  = [float(t.get("attendance_pct", 75)) for t in timeseries]

        # Trend from last 3 points
        def trend(vals):
            if len(vals) < 2: return 0
            recent = vals[-min(3, len(vals)):]
            if len(recent) < 2: return 0
            return (recent[-1] - recent[0]) / max(len(recent) - 1, 1)

        sgpa_trend = trend(sgpa_vals)
        att_trend  = trend(att_vals)
        forecasts  = []
        last_sgpa  = sgpa_vals[-1]
        last_sem   = timeseries[-1].get("semester", len(timeseries))

        for future_sem in range(last_sem + 1, target_semesters + 1):
            decay = 0.85 ** (future_sem - last_sem)
            projected_sgpa = last_sgpa + sgpa_trend * decay
            projected_sgpa = round(float(np.clip(projected_sgpa, 0, 10)), 2)

            projected_att = att_vals[-1] + att_trend * decay
            projected_att = round(float(np.clip(projected_att, 0, 100)), 1)

            ci_width = 0.15 * (future_sem - last_sem)
            forecasts.append({
                "semester":          future_sem,
                "predicted_sgpa":    projected_sgpa,
                "predicted_attendance": projected_att,
                "confidence":        round(max(0.55, 0.95 - 0.08 * (future_sem - last_sem)), 3),
                "ci_lower":          round(max(0, projected_sgpa - ci_width), 2),
                "ci_upper":          round(min(10, projected_sgpa + ci_width), 2),
                "is_forecast":       True,
            })

        return forecasts

    def forecast(
        self,
        timeseries: List[Dict],
        feature_names: Optional[List[str]] = None,
        target_semesters: int = 8,
    ) -> Dict[str, Any]:
        historical = [
            {"semester": t.get("semester"), "sgpa": float(t.get("sgpa", 0)),
             "attendance_pct": float(t.get("attendance_pct", 0)),
             "is_forecast": False}
            for t in timeseries
        ]
        forecast_pts = self.rule_based_forecast(timeseries, target_semesters)

        full_trajectory = historical + forecast_pts
        last_forecast   = forecast_pts[-1] if forecast_pts else {}

        return {
            "historical":          historical,
            "forecast":            forecast_pts,
            "full_trajectory":     full_trajectory,
            "final_predicted_gpa": last_forecast.get("predicted_sgpa"),
            "forecast_confidence": last_forecast.get("confidence"),
            "semesters_ahead":     len(forecast_pts),
            "model_used":          "BiLSTM-Attention" if self.is_trained else "Rule-Based Trend",
        }

    def load(self, model_path: Optional[str] = None):
        try:
            import tensorflow as tf
            p = model_path or os.path.join(MODELS_DIR, "bilstm_attention_v2.keras")
            if os.path.exists(p):
                self.model = tf.keras.models.load_model(p, safe_mode=False)
                self.is_trained = True
                logger.info(f"[ForecastAgent] BiLSTM model loaded from {p}")
        except Exception as e:
            logger.warning(f"[ForecastAgent] Failed to load BiLSTM model: {e}")
        return self


