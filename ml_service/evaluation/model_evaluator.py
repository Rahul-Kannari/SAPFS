"""
Model Evaluation Module
Computes: Accuracy, Precision, Recall, Specificity, F1, ROC-AUC,
          Confusion Matrix, PR Curve, Feature Importance
Compares all 6 models side-by-side.
"""
import numpy as np
import json, os, logging
from typing import Dict, List, Any, Optional, Tuple

logger = logging.getLogger(__name__)
RESULTS_DIR = os.path.join(os.path.dirname(__file__), "../models")
os.makedirs(RESULTS_DIR, exist_ok=True)


def compute_regression_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> Dict:
    from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
    mae  = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    r2   = float(r2_score(y_true, y_pred))
    acc  = float(np.mean(np.abs(y_pred - y_true) < 1.0))
    mape = float(np.mean(np.abs((y_true - y_pred) / np.clip(y_true, 0.1, None))) * 100)
    return {"mae": round(mae,4), "rmse": round(rmse,4), "r2": round(r2,4),
            "accuracy": round(acc,4), "mape": round(mape,2)}


def compute_classification_metrics(
    y_true: np.ndarray, y_pred: np.ndarray,
    threshold: float = 6.0
) -> Dict:
    from sklearn.metrics import (precision_score, recall_score, f1_score,
                                  roc_auc_score, confusion_matrix,
                                  precision_recall_curve, average_precision_score)
    # Binary: passed (>=threshold) vs at-risk (<threshold)
    y_true_bin = (y_true >= threshold).astype(int)
    y_pred_bin = (y_pred >= threshold).astype(int)
    y_pred_prob = np.clip((y_pred - (threshold - 2)) / 4, 0, 1)

    cm = confusion_matrix(y_true_bin, y_pred_bin).tolist()
    tn, fp, fn, tp = confusion_matrix(y_true_bin, y_pred_bin).ravel()

    precision   = float(precision_score(y_true_bin, y_pred_bin, zero_division=0))
    recall      = float(recall_score(y_true_bin, y_pred_bin, zero_division=0))
    specificity = float(tn / (tn + fp)) if (tn + fp) > 0 else 0.0
    f1          = float(f1_score(y_true_bin, y_pred_bin, zero_division=0))
    roc_auc     = float(roc_auc_score(y_true_bin, y_pred_prob))
    avg_prec    = float(average_precision_score(y_true_bin, y_pred_prob))

    prec_curve, rec_curve, _ = precision_recall_curve(y_true_bin, y_pred_prob)
    pr_curve = {
        "precision": prec_curve[::max(1, len(prec_curve)//20)].tolist(),
        "recall":    rec_curve[::max(1, len(rec_curve)//20)].tolist(),
    }

    return {
        "precision":    round(precision, 4),
        "recall":       round(recall, 4),
        "specificity":  round(specificity, 4),
        "f1_score":     round(f1, 4),
        "roc_auc":      round(roc_auc, 4),
        "avg_precision": round(avg_prec, 4),
        "confusion_matrix": cm,
        "pr_curve":     pr_curve,
        "tp": int(tp), "tn": int(tn), "fp": int(fp), "fn": int(fn),
    }


def evaluate_all_models(
    models: Dict[str, Any],
    X_test: np.ndarray,
    y_test: np.ndarray,
    feature_names: List[str],
) -> Dict[str, Any]:
    results = {}
    for name, model in models.items():
        try:
            y_pred = np.clip(model.predict(X_test).flatten(), 0, 10)
            reg_m  = compute_regression_metrics(y_test, y_pred)
            cls_m  = compute_classification_metrics(y_test, y_pred)
            feat_imp = {}
            if hasattr(model, "feature_importances_"):
                feat_imp = dict(zip(feature_names,
                                    model.feature_importances_.tolist()))
                feat_imp = dict(sorted(feat_imp.items(), key=lambda x: -x[1]))
            results[name] = {**reg_m, **cls_m, "feature_importance": feat_imp,
                             "n_test_samples": len(y_test)}
            logger.info(f"[Evaluator] {name}: Acc={reg_m['accuracy']:.4f} "
                        f"F1={cls_m['f1_score']:.4f} AUC={cls_m['roc_auc']:.4f}")
        except Exception as e:
            logger.error(f"[Evaluator] {name} failed: {e}")
            results[name] = {"error": str(e)}

    # Comparison table
    metrics_order = ["accuracy","precision","recall","specificity","f1_score","roc_auc","mae","rmse","r2"]
    comparison = {
        m: {name: results[name].get(m, "N/A") for name in results}
        for m in metrics_order
    }
    results["_comparison"] = comparison
    results["_best_model"]  = _find_best(results, metrics_order)

    # Save
    path = os.path.join(RESULTS_DIR, "evaluation_results_v2.json")
    with open(path, "w") as f:
        json.dump(results, f, indent=2, default=str)
    logger.info(f"[Evaluator] Results saved → {path}")
    return results


def _find_best(results: Dict, metrics: List[str]) -> Dict:
    model_names = [k for k in results if not k.startswith("_")]
    scores = {}
    for name in model_names:
        s = 0
        for m in ["accuracy","f1_score","roc_auc"]:
            v = results[name].get(m, 0)
            s += float(v) if isinstance(v, (int, float)) else 0
        scores[name] = s / 3
    best = max(scores, key=scores.get) if scores else "unknown"
    return {"model": best, "avg_score": round(scores.get(best, 0), 4)}


# ── Multi-class risk classification evaluator ─────────────
def evaluate_risk_classification(
    y_true_risk: np.ndarray,
    y_pred_risk: np.ndarray,
    labels: Optional[List[str]] = None,
) -> Dict:
    from sklearn.metrics import (classification_report, confusion_matrix,
                                  roc_auc_score, accuracy_score)
    labels = labels or ["safe", "moderate", "high", "critical"]
    acc    = float(accuracy_score(y_true_risk, y_pred_risk))
    report = classification_report(y_true_risk, y_pred_risk,
                                   target_names=labels, output_dict=True)
    cm     = confusion_matrix(y_true_risk, y_pred_risk).tolist()
    return {
        "accuracy":              round(acc, 4),
        "classification_report": report,
        "confusion_matrix":      cm,
        "labels":                labels,
    }
