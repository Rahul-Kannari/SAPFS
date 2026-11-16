"""
SAPFS v2 — Full Ensemble Training Pipeline
Trains all 5 base models + meta-learner + BiLSTM
Runs hyperparameter optimization, evaluation, and research export
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import numpy as np
import pandas as pd
import json, logging, time
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler

from agents.feature_engineering_agent import FeatureEngineeringAgent, ALL_FEATURES
from agents.ensemble_prediction_agent  import EnsemblePredictionAgent
from agents.optimization_agent         import OptimizationAgent
from agents.risk_warning_agent         import RiskWarningAgent
from agents.forecasting_agent          import ForecastingAgent
from evaluation.model_evaluator        import compute_regression_metrics, compute_classification_metrics, evaluate_all_models
from research.research_exporter        import ResearchExporter, PAPER_METRICS

logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

DATA_PATH  = os.path.join(os.path.dirname(__file__), "../student_performance_dataset.csv")
MODELS_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(MODELS_DIR, exist_ok=True)


# ────────────────────────────────────────────────────────────
# 1. GENERATE ENHANCED SYNTHETIC DATASET
# ────────────────────────────────────────────────────────────
def generate_enhanced_dataset(n_students: int = 2000) -> pd.DataFrame:
    np.random.seed(42)
    records = []

    for sid in range(n_students):
        ability  = np.random.beta(5, 3)
        diligence = np.random.beta(4, 4)
        engagement = np.random.beta(3, 3)
        lms_habit  = np.random.beta(4, 2)

        prev_sgpa_val = None
        cumulative_sgpa = 0.0

        for sem in range(1, 9):
            att  = float(np.clip(lms_habit * 90 + np.random.normal(0, 5), 30, 100))
            # Base SGPA from latent factors + reduced noise (σ=0.12)
            base_sgpa = ability * 5 + diligence * 3 + (att / 100) * 1.5
            # Temporal correlation: 70% base + 30% previous semester momentum
            if prev_sgpa_val is not None:
                sgpa = float(np.clip(0.7 * base_sgpa + 0.3 * prev_sgpa_val
                                      + np.random.normal(0, 0.12), 0, 10))
            else:
                sgpa = float(np.clip(base_sgpa + np.random.normal(0, 0.12), 0, 10))

            cumulative_sgpa = (cumulative_sgpa * (sem - 1) + sgpa) / sem

            backlogs = int(np.random.choice([0,0,0,1,2,3],
                p=[0.55,0.15,0.1,0.1,0.06,0.04]) if diligence < 0.5 else
                np.random.choice([0,0,0,1], p=[0.8,0.1,0.06,0.04]))
            assign_total = int(np.random.randint(8, 16))
            assign_done  = int(np.clip(assign_total * (diligence + np.random.normal(0,0.1)), 0, assign_total))
            credits_att  = int(np.random.choice([18,20,21,22]))
            credits_earn = int(min(credits_att, max(0, credits_att - backlogs * 2)))
            delay = float(np.clip(np.random.exponential(1.5) if diligence < 0.5 else
                                  np.random.exponential(0.4), 0, 7))

            records.append({
                "student_id":    sid,
                "semester":      sem,
                # timeseries base
                "sgpa":          round(sgpa, 2),
                "cgpa":          round(cumulative_sgpa, 2),
                "attendance_pct": round(att, 2),
                "assignment_rate": round(assign_done / max(assign_total,1), 4),
                "assignments_total": assign_total,
                "assignments_completed": assign_done,
                "credits_attempted": credits_att,
                "credits_earned":    credits_earn,
                "backlogs":          backlogs,
                "credit_completion_rate": round(credits_earn / max(credits_att,1), 4),
                # academic features — use actual previous semester values
                "prev_sgpa":         round(prev_sgpa_val, 2) if prev_sgpa_val is not None else round(sgpa, 2),
                "prev_cgpa":         round(cumulative_sgpa, 2),
                "backlog_count":     backlogs,
                "avg_assignment_score": round(50 + diligence * 45 + np.random.normal(0,3), 2),
                "avg_internal_marks":   round(45 + ability * 40 + np.random.normal(0,4), 2),
                "avg_lab_score":        round(55 + diligence * 35 + np.random.normal(0,3), 2),
                "avg_quiz_score":       round(40 + ability * 50 + np.random.normal(0,5), 2),
                # behavioral
                "lms_login_frequency":  int(max(0, lms_habit * 20 + np.random.normal(0,2))),
                "daily_learning_time_mins": int(max(0, diligence * 120 + np.random.normal(0,12))),
                "assignment_submission_delay": round(delay, 2),
                "online_course_completion_pct": round(engagement * 80 + np.random.normal(0,6), 2),
                "study_hours_per_week": round(max(0, diligence * 30 + np.random.normal(0,3)), 2),
                # engagement
                "club_participation":   int(np.random.poisson(engagement * 2)),
                "hackathon_count":      int(np.random.poisson(engagement * 1.5)),
                "sports_activities":    int(np.random.poisson(0.8)),
                "workshop_attendance":  int(np.random.poisson(engagement * 2.5)),
                "technical_event_count":int(np.random.poisson(engagement * 3)),
                # target
                "next_sgpa": None,
            })

            prev_sgpa_val = sgpa

    df = pd.DataFrame(records)
    df = df.sort_values(["student_id","semester"])
    df["next_sgpa"] = df.groupby("student_id")["sgpa"].shift(-1)
    df = df.dropna(subset=["next_sgpa"])
    df["performance_delta"] = df["sgpa"] - df["prev_sgpa"]
    logger.info(f"Enhanced dataset: {df.shape[0]} records, {df.shape[1]} features")
    return df.fillna(0)


# ────────────────────────────────────────────────────────────
# MAIN
# ────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("="*65)
    print("  SAPFS v2 — ENSEMBLE TRAINING PIPELINE")
    print("="*65)

    # 1. Data
    logger.info("[Train] Generating enhanced dataset…")
    df = generate_enhanced_dataset(n_students=2000)

    # 2. Feature engineering
    logger.info("[Train] Running Feature Engineering Agent…")
    fe_agent = FeatureEngineeringAgent()
    fe_result = fe_agent.run(df, fit=True)
    df_fe = fe_result["features_df"]
    feat_cols = fe_result["feature_names"]

    X = df_fe[feat_cols].values
    y = df["next_sgpa"].values
    scaler = StandardScaler()
    X_sc   = scaler.fit_transform(X)

    X_tr, X_te, y_tr, y_te = train_test_split(X_sc, y, test_size=0.2, random_state=42)
    logger.info(f"[Train] Train: {X_tr.shape}, Test: {X_te.shape}")

    opt_agent = OptimizationAgent(n_trials=30)
    best_params = opt_agent.load()
    if not best_params:
        logger.info("[Train] Running Optimization Agent (30 trials each)…")
        best_params = opt_agent.optimize(X_tr, y_tr, models=["xgboost","lightgbm","random_forest"])

    # 4. Ensemble training
    logger.info("[Train] Training Ensemble Prediction Agent…")
    ens_agent = EnsemblePredictionAgent()
    train_result = ens_agent.train(X_tr, y_tr, X_te, y_te, feat_cols, best_params)
    logger.info(f"[Train] Ensemble trained: {train_result}")

    # 5. BiLSTM sequences
    logger.info("[Train] Building sequences for BiLSTM Forecasting Agent…")
    X_seq, y_seq = fe_agent.generate_sequences(df_fe.assign(
        student_id=df["student_id"], semester=df["semester"],
        next_sgpa=df["next_sgpa"]
    ), seq_len=4, feature_cols=feat_cols, target_col="next_sgpa")

    forecast_agent = ForecastingAgent()
    if len(X_seq) >= 100:
        forecast_result = forecast_agent.train(X_seq, y_seq, epochs=60)
        logger.info(f"[Train] BiLSTM: {forecast_result}")

    # 6. Risk classifier
    logger.info("[Train] Training Risk Warning Agent…")
    risk_agent = RiskWarningAgent()
    y_risk_prob = np.array([risk_agent.compute_risk_probability({
        "prev_sgpa": float(df["prev_sgpa"].iloc[i]) if "prev_sgpa" in df.columns else float(df.get("cgpa", pd.Series([7.0]*len(df))).iloc[i]),
        "attendance_pct": float(df["attendance_pct"].iloc[i]) if "attendance_pct" in df.columns else 80.0,
        "backlog_count":  float(df["backlog_count"].iloc[i]) if "backlog_count" in df.columns else 0.0,
        "assignment_rate": float(df["assignment_rate"].iloc[i]) if "assignment_rate" in df.columns else 0.85,
    }) for i in range(len(X_tr))])
    risk_agent.train(X_tr, y_risk_prob)

    # 7. Evaluate all models
    logger.info("[Train] Evaluating all models…")
    eval_results = evaluate_all_models(
        ens_agent.base_models, X_te, y_te, feat_cols
    )

    # 8. Research export
    logger.info("[Train] Exporting research tables…")
    exporter = ResearchExporter()
    export_paths = exporter.export_all()

    # Summary
    print("\n" + "="*65)
    print("  TRAINING COMPLETE — SUMMARY")
    print("="*65)
    for model_name, m in train_result.get("model_metrics", {}).items():
        acc = m.get("accuracy", 0) * 100
        print(f"  {model_name:<22}: Accuracy={acc:.1f}%  MAE={m.get('mae',0):.4f}")
    print(f"\n  Research exports: {list(export_paths.values())}")
    print("="*65)
