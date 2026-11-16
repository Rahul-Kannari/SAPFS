"""
SQLAlchemy ORM Models — v2 Advanced Feature Tables
Extends existing models without modifying them.
"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, Numeric, Text, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import Base


class StudentAcademicFeatures(Base):
    __tablename__ = "student_academic_features"
    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id      = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    semester_number = Column(Integer, nullable=False)
    academic_year   = Column(String(10), nullable=False)
    prev_sgpa                = Column(Numeric(4, 2))
    prev_cgpa                = Column(Numeric(4, 2))
    backlog_count            = Column(Integer, default=0)
    avg_assignment_score     = Column(Numeric(5, 2))
    avg_internal_marks       = Column(Numeric(5, 2))
    avg_lab_score            = Column(Numeric(5, 2))
    avg_quiz_score           = Column(Numeric(5, 2))
    subject_scores           = Column(JSON, default=dict)
    created_at               = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at               = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class StudentBehavioralFeatures(Base):
    __tablename__ = "student_behavioral_features"
    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id      = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    semester_number = Column(Integer, nullable=False)
    academic_year   = Column(String(10), nullable=False)
    lms_login_frequency          = Column(Integer, default=0)
    daily_learning_time_mins     = Column(Integer, default=0)
    assignment_submission_delay  = Column(Numeric(5, 2), default=0)
    online_course_completion_pct = Column(Numeric(5, 2), default=0)
    study_hours_per_week         = Column(Numeric(5, 2), default=0)
    created_at                   = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at                   = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class StudentEngagementFeatures(Base):
    __tablename__ = "student_engagement_features"
    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id      = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    semester_number = Column(Integer, nullable=False)
    academic_year   = Column(String(10), nullable=False)
    club_participation     = Column(Integer, default=0)
    hackathon_count        = Column(Integer, default=0)
    sports_activities      = Column(Integer, default=0)
    workshop_attendance    = Column(Integer, default=0)
    technical_event_count  = Column(Integer, default=0)
    engagement_score       = Column(Numeric(5, 2))
    created_at             = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at             = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)


class EnsemblePrediction(Base):
    __tablename__ = "ensemble_predictions"
    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id      = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    semester_number = Column(Integer, nullable=False)
    xgb_pred        = Column(Numeric(4, 2))
    lgbm_pred       = Column(Numeric(4, 2))
    catboost_pred   = Column(Numeric(4, 2))
    rf_pred         = Column(Numeric(4, 2))
    bilstm_pred     = Column(Numeric(4, 2))
    stacked_pred    = Column(Numeric(4, 2))
    confidence_score = Column(Numeric(5, 4))
    risk_probability = Column(Numeric(5, 4))
    risk_level      = Column(String(20))
    shap_values         = Column(JSON)
    feature_importance  = Column(JSON)
    positive_factors    = Column(JSON)
    negative_factors    = Column(JSON)
    recommendations     = Column(JSON)
    model_version       = Column(String(20), default="v2.0")
    predicted_at        = Column(DateTime(timezone=True), default=datetime.utcnow)


class EarlyWarningAlert(Base):
    __tablename__ = "early_warning_alerts"
    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id      = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    alert_type      = Column(String(30), nullable=False)
    risk_level      = Column(String(20), nullable=False)
    risk_probability = Column(Numeric(5, 4))
    message         = Column(Text, nullable=False)
    key_factors     = Column(JSON)
    is_resolved     = Column(Boolean, default=False)
    resolved_at     = Column(DateTime(timezone=True))
    created_at      = Column(DateTime(timezone=True), default=datetime.utcnow)


class ModelEvaluationResult(Base):
    __tablename__ = "model_evaluation_results"
    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_name      = Column(String(50), nullable=False)
    model_version   = Column(String(20), nullable=False)
    eval_type       = Column(String(30), nullable=False)
    accuracy        = Column(Numeric(6, 4))
    precision_score = Column(Numeric(6, 4))
    recall_score    = Column(Numeric(6, 4))
    specificity     = Column(Numeric(6, 4))
    f1_score        = Column(Numeric(6, 4))
    roc_auc         = Column(Numeric(6, 4))
    mae             = Column(Numeric(8, 4))
    rmse            = Column(Numeric(8, 4))
    r2_score        = Column(Numeric(6, 4))
    confusion_matrix      = Column(JSON)
    classification_report = Column(JSON)
    hyperparameters       = Column(JSON)
    training_samples      = Column(Integer)
    evaluated_at          = Column(DateTime(timezone=True), default=datetime.utcnow)


class SemesterForecast(Base):
    __tablename__ = "semester_forecasts"
    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id      = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    forecast_from   = Column(Integer, nullable=False)
    forecast_to     = Column(Integer, nullable=False)
    predicted_sgpa  = Column(Numeric(4, 2))
    predicted_cgpa  = Column(Numeric(4, 2))
    confidence      = Column(Numeric(5, 4))
    forecast_data   = Column(JSON)
    model_used      = Column(String(50), default="BiLSTM-Attention")
    forecasted_at   = Column(DateTime(timezone=True), default=datetime.utcnow)


class AgentExecutionLog(Base):
    __tablename__ = "agent_execution_log"
    id              = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id      = Column(UUID(as_uuid=True), ForeignKey("students.id"), nullable=True)
    agent_name      = Column(String(50), nullable=False)
    status          = Column(String(20), nullable=False)
    input_summary   = Column(JSON)
    output_summary  = Column(JSON)
    duration_ms     = Column(Integer)
    error_message   = Column(Text)
    executed_at     = Column(DateTime(timezone=True), default=datetime.utcnow)
