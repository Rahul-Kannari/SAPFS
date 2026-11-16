"""Pydantic schemas for v2 advanced features."""
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime


class AcademicFeaturesCreate(BaseModel):
    student_id:           UUID
    semester_number:      int
    academic_year:        str = "2024-25"
    prev_sgpa:            Optional[float] = None
    prev_cgpa:            Optional[float] = None
    backlog_count:        int = 0
    avg_assignment_score: Optional[float] = None
    avg_internal_marks:   Optional[float] = None
    avg_lab_score:        Optional[float] = None
    avg_quiz_score:       Optional[float] = None
    subject_scores:       Optional[Dict[str, float]] = None


class BehavioralFeaturesCreate(BaseModel):
    student_id:                    UUID
    semester_number:               int
    academic_year:                 str = "2024-25"
    lms_login_frequency:           int = 0
    daily_learning_time_mins:      int = 0
    assignment_submission_delay:   float = 0.0
    online_course_completion_pct:  float = 0.0
    study_hours_per_week:          float = 0.0


class EngagementFeaturesCreate(BaseModel):
    student_id:            UUID
    semester_number:       int
    academic_year:         str = "2024-25"
    club_participation:    int = 0
    hackathon_count:       int = 0
    sports_activities:     int = 0
    workshop_attendance:   int = 0
    technical_event_count: int = 0


class EnsemblePredictionResponse(BaseModel):
    id:              UUID
    student_id:      UUID
    semester_number: int
    xgb_pred:        Optional[float]
    lgbm_pred:       Optional[float]
    catboost_pred:   Optional[float]
    rf_pred:         Optional[float]
    bilstm_pred:     Optional[float]
    stacked_pred:    Optional[float]
    confidence_score: Optional[float]
    risk_probability: Optional[float]
    risk_level:      Optional[str]
    shap_values:         Optional[Dict]
    positive_factors:    Optional[List]
    negative_factors:    Optional[List]
    recommendations:     Optional[Dict]
    model_version:       str
    predicted_at:        datetime

    class Config:
        from_attributes = True


class EarlyWarningAlertResponse(BaseModel):
    id:              UUID
    student_id:      UUID
    alert_type:      str
    risk_level:      str
    risk_probability: Optional[float]
    message:         str
    key_factors:     Optional[Dict]
    is_resolved:     bool
    created_at:      datetime

    class Config:
        from_attributes = True


class AgentPipelineRequest(BaseModel):
    student_id:      UUID
    prediction_type: str = "comprehensive"
    use_ensemble:    bool = True
    run_optimization: bool = False


class AgentPipelineResponse(BaseModel):
    student_id:      str
    prediction:      Dict[str, Any]
    risk:            Dict[str, Any]
    explanation:     Dict[str, Any]
    recommendations: Dict[str, Any]
    forecast:        Optional[Dict[str, Any]] = None
    pipeline_summary: Dict[str, Any]
