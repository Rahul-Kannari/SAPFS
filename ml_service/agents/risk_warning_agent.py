"""
Agent 4 — Risk Detection & Early Warning Agent
Models: Isolation Forest + XGBoost Classifier
Risk Levels: Safe / Moderate / High / Critical
Outputs: Risk Probability, Risk Level, Alerts
"""
import numpy as np
import pandas as pd
import joblib, os, json, logging, time
from typing import Dict, List, Any, Optional
from sklearn.ensemble import IsolationForest
from sklearn.metrics import classification_report, roc_auc_score

logger = logging.getLogger(__name__)
MODELS_DIR = os.path.join(os.path.dirname(__file__), "../models")

RISK_THRESHOLDS = {
    "safe":     (0.00, 0.30),
    "moderate": (0.31, 0.60),
    "high":     (0.61, 0.80),
    "critical": (0.81, 1.00),
}

ALERT_TEMPLATES = {
    "student": {
        "safe":     "Your academic performance is on track. Keep it up!",
        "moderate": "⚠️ Your performance needs attention. Review weak subjects and improve attendance.",
        "high":     "🚨 HIGH RISK: Immediate action needed. Contact your faculty advisor.",
        "critical": "🔴 CRITICAL: Academic intervention required urgently. Report to HOD.",
    },
    "faculty": {
        "safe":     "Student {name} is performing well — no intervention needed.",
        "moderate": "⚠️ Student {name} showing moderate risk. Schedule a counselling session.",
        "high":     "🚨 Student {name} is HIGH RISK. Please arrange remedial classes and alert parents.",
        "critical": "🔴 CRITICAL: Student {name} requires immediate departmental intervention.",
    },
    "parent": {
        "safe":     "Your ward {name} is performing satisfactorily.",
        "moderate": "⚠️ Your ward {name} needs improvement in academics. Please motivate them.",
        "high":     "🚨 Your ward {name} is at high academic risk. Please meet the faculty advisor.",
        "critical": "🔴 URGENT: Your ward {name} is critically at risk. Immediate meeting with HOD required.",
    },
}


class RiskWarningAgent:
    def __init__(self):
        self.iso_forest: Optional[IsolationForest] = None
        self.xgb_classifier = None
        self.is_trained = False

    # ── Build risk label from GPA + features ──────────────
    @staticmethod
    def compute_risk_probability(features: Dict[str, float]) -> float:
        score = 0.0
        gpa  = features.get("prev_sgpa", features.get("cgpa", 5.0))
        att  = features.get("attendance_pct", 75)
        back = features.get("backlog_count", 0)
        asgn = features.get("assignment_rate", 0.8)
        mom  = features.get("performance_delta", 0)
        study = features.get("study_hours_per_week", 15)

        # GPA component (0-40 points)
        if gpa < 5.0:  score += 40
        elif gpa < 6.0: score += 30
        elif gpa < 7.0: score += 20
        elif gpa < 8.0: score += 10

        # Attendance (0-25 points)
        if att < 55:    score += 25
        elif att < 65:  score += 18
        elif att < 75:  score += 10
        elif att < 85:  score += 5

        # Backlogs (0-20 points)
        score += min(back * 4, 20)

        # Assignments (0-10 points)
        if asgn < 0.5: score += 10
        elif asgn < 0.7: score += 6
        elif asgn < 0.85: score += 3

        # Negative momentum (0-5 points)
        if mom < -0.5: score += 5
        elif mom < -0.2: score += 3

        # Low study hours (0-5 points)
        if study < 5:  score += 5
        elif study < 10: score += 3

        return min(score / 100.0, 1.0)

    @staticmethod
    def probability_to_level(prob: float) -> str:
        if prob <= 0.30: return "safe"
        if prob <= 0.60: return "moderate"
        if prob <= 0.80: return "high"
        return "critical"

    # ── Train classifiers ──────────────────────────────────
    def train(self, X: np.ndarray, y_prob: np.ndarray) -> Dict:
        # Isolation Forest for anomaly detection
        self.iso_forest = IsolationForest(contamination=0.12, random_state=42, n_jobs=-1)
        self.iso_forest.fit(X)

        # XGBoost Classifier for risk level
        y_class = np.digitize(y_prob, [0.30, 0.60, 0.80])  # 0=safe,1=mod,2=high,3=crit
        try:
            import xgboost as xgb
            from sklearn.preprocessing import LabelEncoder
            self.label_encoder = LabelEncoder()
            y_encoded = self.label_encoder.fit_transform(y_class)
            self.xgb_classifier = xgb.XGBClassifier(
                n_estimators=200, max_depth=5, learning_rate=0.05,
                random_state=42, n_jobs=-1, verbosity=0,
                objective="multi:softprob",
            )
            self.xgb_classifier.fit(X, y_encoded)
        except ImportError:
            from sklearn.ensemble import GradientBoostingClassifier
            self.xgb_classifier = GradientBoostingClassifier(n_estimators=100, random_state=42)
            self.xgb_classifier.fit(X, y_class)

        self.is_trained = True
        joblib.dump(self.iso_forest, os.path.join(MODELS_DIR, "iso_forest_v2.pkl"))
        joblib.dump(self.xgb_classifier, os.path.join(MODELS_DIR, "risk_classifier_v2.pkl"))
        return {"status": "trained", "samples": len(X)}

    # ── Predict risk ──────────────────────────────────────
    def predict_risk(
        self,
        features: Dict[str, float],
        student_name: str = "Student",
        use_model: bool = False,
    ) -> Dict[str, Any]:
        prob  = self.compute_risk_probability(features)
        level = self.probability_to_level(prob)

        # Anomaly score from IsoForest
        anomaly_score = -1.0
        if self.iso_forest and use_model:
            X = np.array([[features.get(k, 0) for k in sorted(features)]])
            anomaly_score = float(self.iso_forest.decision_function(X)[0])

        # Key contributing factors
        factors = self._identify_key_factors(features)

        # Generate alerts
        alerts = {
            atype: ALERT_TEMPLATES[atype][level].format(name=student_name)
            for atype in ["student", "faculty", "parent"]
        }

        return {
            "risk_probability": round(prob, 4),
            "risk_level":       level,
            "risk_percentage":  round(prob * 100, 1),
            "anomaly_score":    round(anomaly_score, 4),
            "key_factors":      factors,
            "alerts":           alerts,
            "risk_threshold":   RISK_THRESHOLDS[level],
        }

    @staticmethod
    def _identify_key_factors(features: Dict) -> Dict[str, List]:
        pos, neg = [], []
        checks = [
            ("attendance_pct",   lambda v: v >= 85, "+Attendance above threshold",  "-Low attendance risk"),
            ("assignment_rate",  lambda v: v >= 0.8, "+Good assignment completion", "-Poor assignment rate"),
            ("study_hours_per_week", lambda v: v >= 15, "+Adequate study hours",    "-Insufficient study time"),
            ("backlog_count",    lambda v: v == 0, "+No backlogs",                  "-Backlog burden"),
            ("lms_login_frequency", lambda v: v >= 10, "+Active LMS engagement",   "-Low LMS activity"),
            ("hackathon_count",  lambda v: v >= 1, "+Technical engagement",         ""),
            ("online_course_completion_pct", lambda v: v >= 60, "+Online learning", "-Low online completion"),
        ]
        for key, cond, p_msg, n_msg in checks:
            if key in features:
                if cond(features[key]):
                    if p_msg: pos.append(p_msg)
                else:
                    if n_msg: neg.append(n_msg)
        return {"positive": pos[:5], "negative": neg[:5]}

    def batch_predict(self, students: List[Dict]) -> List[Dict]:
        return [
            {"student_id": s.get("id"), **self.predict_risk(s, s.get("name", "Student"))}
            for s in students
        ]

    def load(self):
        iso_p = os.path.join(MODELS_DIR, "iso_forest_v2.pkl")
        xgb_p = os.path.join(MODELS_DIR, "risk_classifier_v2.pkl")
        if os.path.exists(iso_p):
            self.iso_forest = joblib.load(iso_p)
        if os.path.exists(xgb_p):
            self.xgb_classifier = joblib.load(xgb_p)
        self.is_trained = bool(self.iso_forest or self.xgb_classifier)
        return self

