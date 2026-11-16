"""
XGBoost Model Wrapper for Academic GPA Prediction
Includes Optuna hyperparameter tuning and SHAP explainability
"""
import numpy as np
import logging
import joblib
import os
from typing import Tuple, Dict, Optional, List

logger = logging.getLogger(__name__)

DEFAULT_PARAMS = {
    'n_estimators': 300, 'max_depth': 5, 'learning_rate': 0.05,
    'subsample': 0.8, 'colsample_bytree': 0.8, 'min_child_weight': 3,
    'reg_alpha': 0.1, 'reg_lambda': 1.0, 'random_state': 42, 'n_jobs': -1
}


def tune_hyperparameters(X_train, y_train, n_trials: int = 50) -> Dict:
    """Optuna hyperparameter tuning for XGBoost"""
    try:
        import optuna
        import xgboost as xgb
        from sklearn.model_selection import cross_val_score

        optuna.logging.set_verbosity(optuna.logging.WARNING)

        def objective(trial):
            params = {
                'n_estimators': trial.suggest_int('n_estimators', 100, 600),
                'max_depth': trial.suggest_int('max_depth', 3, 9),
                'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
                'subsample': trial.suggest_float('subsample', 0.6, 1.0),
                'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
                'min_child_weight': trial.suggest_int('min_child_weight', 1, 10),
                'reg_alpha': trial.suggest_float('reg_alpha', 0, 1.0),
                'reg_lambda': trial.suggest_float('reg_lambda', 0, 2.0),
                'random_state': 42, 'n_jobs': -1
            }
            model = xgb.XGBRegressor(**params)
            scores = cross_val_score(model, X_train, y_train, cv=5,
                                     scoring='neg_mean_absolute_error', n_jobs=-1)
            return -scores.mean()

        study = optuna.create_study(direction='minimize')
        study.optimize(objective, n_trials=n_trials, show_progress_bar=False)
        logger.info(f"Best params: {study.best_params} (MAE={study.best_value:.4f})")
        return study.best_params

    except ImportError:
        logger.warning("Optuna not available — using default XGBoost params")
        return DEFAULT_PARAMS


def train_xgboost(X_train, y_train, X_val, y_val,
                  feature_names: List[str], tune: bool = False) -> Tuple[Optional[object], Dict]:
    """Train XGBoost model for GPA prediction"""
    try:
        import xgboost as xgb
        from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

        params = tune_hyperparameters(X_train, y_train, n_trials=30) if tune else DEFAULT_PARAMS

        model = xgb.XGBRegressor(**params)
        model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)

        y_pred = model.predict(X_val)
        mae = mean_absolute_error(y_val, y_pred)
        rmse = np.sqrt(mean_squared_error(y_val, y_pred))
        r2 = r2_score(y_val, y_pred)
        accuracy = float(np.mean(np.abs(y_pred - y_val) < 0.5))

        feature_imp = dict(zip(feature_names, model.feature_importances_.tolist()))

        metrics = {
            'mae': float(mae), 'rmse': float(rmse),
            'r2': float(r2), 'accuracy': accuracy,
            'feature_importance': feature_imp,
            'best_params': params
        }

        logger.info(f"XGBoost trained: MAE={mae:.4f}, R²={r2:.4f}, Accuracy={accuracy*100:.2f}%")
        return model, metrics

    except ImportError:
        logger.error("XGBoost not installed")
        return None, {}
    except Exception as e:
        logger.error(f"XGBoost training failed: {e}")
        return None, {}


def compute_shap_values(model, X: np.ndarray, feature_names: List[str]) -> Optional[Dict]:
    """Compute SHAP values for model explainability"""
    try:
        import shap
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X[:200] if len(X) > 200 else X)
        mean_abs = np.abs(shap_values).mean(0)
        return {
            'mean_abs_shap': dict(zip(feature_names, mean_abs.tolist())),
            'global_importance': sorted(
                zip(feature_names, mean_abs.tolist()),
                key=lambda x: -x[1]
            )[:10]
        }
    except Exception as e:
        logger.warning(f"SHAP computation skipped: {e}")
        return None


def save_model(model, path: str):
    joblib.dump(model, path)
    logger.info(f"XGBoost model saved to {path}")


def load_model(path: str):
    if os.path.exists(path):
        return joblib.load(path)
    logger.warning(f"Model not found at {path}")
    return None
