"""
Agent 1 — Feature Engineering Agent
Handles: missing values, normalization, encoding,
         feature extraction, sequence generation
"""
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional, Any
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.impute import KNNImputer
import logging, json, time

logger = logging.getLogger(__name__)

FEATURE_GROUPS = {
    "academic": [
        "prev_sgpa","prev_cgpa","backlog_count",
        "avg_assignment_score","avg_internal_marks",
        "avg_lab_score","avg_quiz_score",
    ],
    "behavioral": [
        "lms_login_frequency","daily_learning_time_mins",
        "assignment_submission_delay","online_course_completion_pct",
        "study_hours_per_week",
    ],
    "engagement": [
        "club_participation","hackathon_count","sports_activities",
        "workshop_attendance","technical_event_count",
    ],
    "timeseries": [
        "sgpa","cgpa","attendance_pct","assignment_rate",
        "credit_completion_rate","backlogs",
    ],
}

ALL_FEATURES = (
    FEATURE_GROUPS["academic"]
    + FEATURE_GROUPS["behavioral"]
    + FEATURE_GROUPS["engagement"]
    + FEATURE_GROUPS["timeseries"]
)


class FeatureEngineeringAgent:
    """Multi-stage feature engineering pipeline agent."""

    def __init__(self):
        self.scaler = StandardScaler()
        self.imputer = KNNImputer(n_neighbors=5)
        self.label_encoders: Dict[str, LabelEncoder] = {}
        self.feature_stats: Dict[str, Any] = {}
        self.is_fitted = False

    # ── Stage 1: Missing Value Handling ───────────────────
    def handle_missing_values(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()
        # Domain-specific zero-fill
        zero_cols = ["backlog_count","hackathon_count","club_participation",
                     "sports_activities","workshop_attendance","technical_event_count"]
        for c in zero_cols:
            if c in df.columns:
                df[c] = df[c].fillna(0)

        # KNN impute numeric
        num_cols = [c for c in ALL_FEATURES if c in df.columns]
        if num_cols:
            df[num_cols] = self.imputer.fit_transform(df[num_cols])

        pct_missing = df.isnull().sum().sum()
        logger.info(f"[FEAgent] Missing after imputation: {pct_missing}")
        return df

    # ── Stage 2: Normalization ─────────────────────────────
    def normalize(self, df: pd.DataFrame, fit: bool = True) -> pd.DataFrame:
        df = df.copy()
        num_cols = [c for c in ALL_FEATURES if c in df.columns]
        if not num_cols or len(df) <= 1:
            return df
        if fit:
            df[num_cols] = self.scaler.fit_transform(df[num_cols])
        else:
            df[num_cols] = self.scaler.transform(df[num_cols])
        return df

    # ── Stage 3: Feature Extraction ───────────────────────
    def extract_features(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()

        # Engagement composite score
        eng_cols = [c for c in FEATURE_GROUPS["engagement"] if c in df.columns]
        if eng_cols:
            weights = {"club_participation":0.2,"hackathon_count":0.3,
                       "sports_activities":0.1,"workshop_attendance":0.2,
                       "technical_event_count":0.2}
            df["engagement_score"] = sum(
                df[c] * weights.get(c, 0.2) for c in eng_cols
            )

        # Behavioral composite
        if "study_hours_per_week" in df.columns and "daily_learning_time_mins" in df.columns:
            df["learning_intensity"] = (
                df["study_hours_per_week"] * 0.6
                + (df["daily_learning_time_mins"] / 60) * 0.4
            )

        # Academic health index
        if "prev_sgpa" in df.columns and "backlog_count" in df.columns:
            df["academic_health"] = (
                df.get("prev_sgpa", 0) * 10 - df["backlog_count"] * 5
            ).clip(0, 100) / 100

        # LMS engagement ratio
        if "lms_login_frequency" in df.columns and "online_course_completion_pct" in df.columns:
            df["digital_engagement"] = (
                df["lms_login_frequency"] * 0.5
                + df["online_course_completion_pct"] / 100 * 0.5
            )

        # Submission discipline (inverted delay)
        if "assignment_submission_delay" in df.columns:
            df["submission_discipline"] = 1.0 / (1.0 + df["assignment_submission_delay"])

        # Performance momentum
        if all(c in df.columns for c in ["prev_sgpa","sgpa"]):
            df["performance_delta"] = df["sgpa"] - df["prev_sgpa"]

        return df

    # ── Stage 4: Temporal Sequence Generation ─────────────
    def generate_sequences(
        self,
        df: pd.DataFrame,
        seq_len: int = 4,
        feature_cols: Optional[List[str]] = None,
        target_col: str = "next_sgpa",
        student_col: str = "student_id",
        sort_col: str = "semester",
    ) -> Tuple[np.ndarray, np.ndarray]:
        feature_cols = feature_cols or [c for c in ALL_FEATURES if c in df.columns]
        sequences, targets = [], []

        for sid, grp in df.groupby(student_col):
            grp = grp.sort_values(sort_col)
            feats = grp[feature_cols].values.astype(np.float32)
            tgts  = grp[target_col].values.astype(np.float32) if target_col in grp else None

            if len(feats) < seq_len + 1:
                continue
            for i in range(len(feats) - seq_len):
                sequences.append(feats[i : i + seq_len])
                if tgts is not None:
                    targets.append(tgts[i + seq_len])

        X = np.array(sequences, dtype=np.float32)
        y = np.array(targets, dtype=np.float32) if targets else np.array([])
        logger.info(f"[FEAgent] Sequences: {X.shape}, targets: {y.shape}")
        return X, y

    # ── Main pipeline entry ───────────────────────────────
    def run(
        self,
        raw_df: pd.DataFrame,
        fit: bool = True,
        generate_seqs: bool = False,
        seq_len: int = 4,
    ) -> Dict[str, Any]:
        t0 = time.time()
        df = self.handle_missing_values(raw_df)
        df = self.extract_features(df)
        df = self.normalize(df, fit=fit)

        result: Dict[str, Any] = {"features_df": df, "status": "ok"}

        if generate_seqs:
            X_seq, y_seq = self.generate_sequences(df, seq_len=seq_len)
            result["X_sequences"] = X_seq
            result["y_targets"]   = y_seq

        feature_cols = [c for c in df.columns if c in ALL_FEATURES
                        or c in ["engagement_score","learning_intensity",
                                  "academic_health","digital_engagement",
                                  "submission_discipline","performance_delta"]]
        result["feature_names"] = feature_cols
        result["duration_ms"]   = int((time.time() - t0) * 1000)
        self.is_fitted = True
        logger.info(f"[FEAgent] Done in {result['duration_ms']}ms, features={len(feature_cols)}")
        return result

    def get_feature_summary(self, df: pd.DataFrame) -> Dict:
        num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        return {
            "total_features": len(num_cols),
            "missing_values": int(df[num_cols].isnull().sum().sum()),
            "feature_groups": {k: [c for c in v if c in df.columns]
                               for k, v in FEATURE_GROUPS.items()},
            "engineered_features": [c for c in df.columns
                                     if c not in ALL_FEATURES and df[c].dtype in [np.float32, np.float64, np.int64]],
        }
