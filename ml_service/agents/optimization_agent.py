"""
Agent 3 — Hyperparameter Optimization Agent
Uses Optuna to tune all base models.
Best parameters auto-saved to JSON.
"""
import json, os, logging, time
import numpy as np
from typing import Dict, Any, Optional, List

logger = logging.getLogger(__name__)
PARAMS_DIR = os.path.join(os.path.dirname(__file__), "../models")
os.makedirs(PARAMS_DIR, exist_ok=True)
PARAMS_FILE = os.path.join(PARAMS_DIR, "best_hyperparams_v2.json")


class OptimizationAgent:
    def __init__(self, n_trials: int = 50, cv_folds: int = 5):
        self.n_trials   = n_trials
        self.cv_folds   = cv_folds
        self.best_params: Dict[str, Any] = {}

    def _objective_xgb(self, trial, X, y):
        try:
            import xgboost as xgb
            from sklearn.model_selection import cross_val_score
            params = {
                "n_estimators":     trial.suggest_int("n_estimators", 100, 600),
                "max_depth":        trial.suggest_int("max_depth", 3, 10),
                "learning_rate":    trial.suggest_float("learning_rate", 0.005, 0.3, log=True),
                "subsample":        trial.suggest_float("subsample", 0.5, 1.0),
                "colsample_bytree": trial.suggest_float("colsample_bytree", 0.5, 1.0),
                "min_child_weight": trial.suggest_int("min_child_weight", 1, 10),
                "reg_alpha":        trial.suggest_float("reg_alpha", 0, 2.0),
                "reg_lambda":       trial.suggest_float("reg_lambda", 0, 4.0),
                "random_state": 42, "n_jobs": -1, "verbosity": 0,
            }
            m = xgb.XGBRegressor(**params)
            s = cross_val_score(m, X, y, cv=self.cv_folds,
                                scoring="neg_mean_absolute_error", n_jobs=-1)
            return -s.mean()
        except Exception as e:
            logger.warning(f"[OptAgent] XGB objective failed: {e}")
            return 999.0

    def _objective_lgbm(self, trial, X, y):
        try:
            import lightgbm as lgb
            from sklearn.model_selection import cross_val_score
            params = {
                "n_estimators":     trial.suggest_int("n_estimators", 100, 600),
                "max_depth":        trial.suggest_int("max_depth", 3, 10),
                "learning_rate":    trial.suggest_float("learning_rate", 0.005, 0.3, log=True),
                "num_leaves":       trial.suggest_int("num_leaves", 15, 127),
                "subsample":        trial.suggest_float("subsample", 0.5, 1.0),
                "colsample_bytree": trial.suggest_float("colsample_bytree", 0.5, 1.0),
                "min_child_samples":trial.suggest_int("min_child_samples", 5, 50),
                "random_state": 42, "n_jobs": -1, "verbose": -1,
            }
            m = lgb.LGBMRegressor(**params)
            s = cross_val_score(m, X, y, cv=self.cv_folds,
                                scoring="neg_mean_absolute_error", n_jobs=-1)
            return -s.mean()
        except Exception as e:
            logger.warning(f"[OptAgent] LGBM objective failed: {e}")
            return 999.0

    def _objective_catboost(self, trial, X, y):
        try:
            from catboost import CatBoostRegressor
            from sklearn.model_selection import cross_val_score
            params = {
                "iterations":    trial.suggest_int("n_estimators", 100, 500),
                "depth":         trial.suggest_int("max_depth", 3, 9),
                "learning_rate": trial.suggest_float("learning_rate", 0.005, 0.3, log=True),
                "l2_leaf_reg":   trial.suggest_float("l2_leaf_reg", 1, 10),
                "border_count":  trial.suggest_int("border_count", 32, 255),
                "random_state": 42, "verbose": 0,
            }
            m = CatBoostRegressor(**params)
            s = cross_val_score(m, X, y, cv=self.cv_folds,
                                scoring="neg_mean_absolute_error", n_jobs=1)
            return -s.mean()
        except Exception as e:
            logger.warning(f"[OptAgent] CatBoost objective failed: {e}")
            return 999.0

    def _objective_rf(self, trial, X, y):
        try:
            from sklearn.ensemble import RandomForestRegressor
            from sklearn.model_selection import cross_val_score
            params = {
                "n_estimators":   trial.suggest_int("n_estimators", 100, 500),
                "max_depth":      trial.suggest_int("max_depth", 3, 20),
                "min_samples_split": trial.suggest_int("min_samples_split", 2, 20),
                "min_samples_leaf":  trial.suggest_int("min_samples_leaf", 1, 10),
                "max_features":   trial.suggest_categorical("max_features", ["sqrt","log2", 1.0]),
                "random_state": 42, "n_jobs": -1,
            }
            m = RandomForestRegressor(**params)
            s = cross_val_score(m, X, y, cv=self.cv_folds,
                                scoring="neg_mean_absolute_error", n_jobs=-1)
            return -s.mean()
        except Exception as e:
            logger.warning(f"[OptAgent] RF objective failed: {e}")
            return 999.0

    def _objective_bilstm(self, trial, X_seq, y):
        """Optuna objective for BiLSTM hyperparameters (fast proxy training)."""
        try:
            import tensorflow as tf
            from tensorflow.keras.models import Sequential
            from tensorflow.keras.layers import Bidirectional, LSTM, Dense, Dropout
            from tensorflow.keras.optimizers import Adam
            from sklearn.model_selection import train_test_split

            params = {
                "hidden_units": trial.suggest_int("hidden_units", 32, 256),
                "dropout_rate": trial.suggest_float("dropout_rate", 0.1, 0.5),
                "learning_rate": trial.suggest_float("learning_rate", 1e-4, 1e-2, log=True),
                "batch_size":   trial.suggest_categorical("batch_size", [32, 64, 128]),
            }
            X_tr, X_v, y_tr, y_v = train_test_split(X_seq, y, test_size=0.2, random_state=42)
            model = Sequential([
                Bidirectional(LSTM(params["hidden_units"], return_sequences=False),
                              input_shape=(X_seq.shape[1], X_seq.shape[2])),
                Dropout(params["dropout_rate"]),
                Dense(32, activation="relu"),
                Dense(1),
            ])
            model.compile(optimizer=Adam(params["learning_rate"]), loss="huber")
            model.fit(X_tr, y_tr, epochs=15, batch_size=params["batch_size"],
                      validation_data=(X_v, y_v), verbose=0)
            val_pred = model.predict(X_v, verbose=0).flatten()
            mae = float(np.mean(np.abs(val_pred - y_v)))
            tf.keras.backend.clear_session()
            return mae
        except ImportError:
            return 0.5  # fallback

    def optimize(
        self,
        X_flat: np.ndarray,
        y: np.ndarray,
        X_seq: Optional[np.ndarray] = None,
        models: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        try:
            import optuna
            optuna.logging.set_verbosity(optuna.logging.WARNING)
        except ImportError:
            logger.warning("[OptAgent] Optuna not installed; returning defaults")
            return {}

        models = models or ["xgboost","lightgbm","random_forest"]
        objectives = {
            "xgboost":     (self._objective_xgb,  X_flat),
            "lightgbm":    (self._objective_lgbm, X_flat),
            "catboost":    (self._objective_catboost, X_flat),
            "random_forest": (self._objective_rf, X_flat),
        }
        if X_seq is not None:
            objectives["bilstm"] = (self._objective_bilstm, X_seq)

        for name in models:
            if name not in objectives:
                continue
            obj_fn, X_input = objectives[name]
            logger.info(f"[OptAgent] Tuning {name} ({self.n_trials} trials)…")
            t0 = time.time()
            study = optuna.create_study(direction="minimize")
            study.optimize(
                lambda t, fn=obj_fn, Xi=X_input: fn(t, Xi, y),
                n_trials=self.n_trials,
                show_progress_bar=False,
            )
            elapsed = time.time() - t0
            self.best_params[name] = study.best_params
            self.best_params[name]["_best_value"] = study.best_value
            logger.info(f"  {name}: best MAE={study.best_value:.4f} ({elapsed:.1f}s)")

        self._save()
        return self.best_params

    def _save(self):
        with open(PARAMS_FILE, "w") as f:
            json.dump(self.best_params, f, indent=2)
        logger.info(f"[OptAgent] Best params saved → {PARAMS_FILE}")

    def load(self) -> Dict:
        if os.path.exists(PARAMS_FILE):
            with open(PARAMS_FILE) as f:
                self.best_params = json.load(f)
        return self.best_params

