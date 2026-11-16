# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List, Dict, Any, Optional
from uuid import UUID
from app.db.database import get_db
from app.models.models import Student, Prediction, StudentPerformanceTimeseries
from app.schemas.schemas import PredictionRequest, PredictionResponse, ScenarioSimulationRequest
from app.core.dependencies import get_current_user, require_faculty_or_admin
from app.ml.pipelines.prediction_pipeline import PredictionPipeline
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/predictions", tags=["Predictions"])

prediction_pipeline = PredictionPipeline()

@router.post("/predict")
async def predict_student_performance(
    request: PredictionRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_faculty_or_admin)
):
    student = await db.get(Student, request.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    ts_result = await db.execute(
        select(StudentPerformanceTimeseries)
        .where(StudentPerformanceTimeseries.student_id == request.student_id)
        .order_by(StudentPerformanceTimeseries.semester_number)
    )
    timeseries = ts_result.scalars().all()
    
    ts_data = [
        {
            "semester": t.semester_number,
            "sgpa": float(t.sgpa or 0),
            "cgpa": float(t.cgpa or 0),
            "attendance_pct": float(t.attendance_percentage or 0),
            "assignments_completed": t.assignments_completed,
            "assignments_total": t.assignments_total,
            "credits_earned": t.credits_earned,
            "credits_attempted": t.credits_attempted,
            "backlogs": t.backlogs,
        }
        for t in timeseries
    ]
    
    student_features = {
        "cgpa": float(student.cgpa or 0),
        "current_semester": student.current_semester,
        "batch_year": student.batch_year,
        "age": student.age,
        "gender": student.gender,
        "attendance_pct": float(student.attendance_pct or 85.0),
        "lms_logins": student.lms_logins,
        "study_hours": float(student.study_hours or 20.0),
        "assignment_submission_rate": float(student.assignment_submission_rate or 80.0),
        "engagement_score": float(student.engagement_score or 50.0),
        "final_academic_performance": student.final_academic_performance
    }
    
    result = await prediction_pipeline.predict(
        student_id=str(request.student_id),
        timeseries_data=ts_data,
        student_features=student_features,
        prediction_type=request.prediction_type
    )
    
    prediction = Prediction(
        student_id=request.student_id,
        prediction_type=request.prediction_type,
        predicted_gpa=result.get("predicted_gpa"),
        predicted_risk_level=result.get("risk_level", "medium"),
        confidence_score=result.get("confidence"),
        feature_importance=result.get("feature_importance"),
        shap_values=result.get("shap_values"),
        recommendations=result.get("recommendations"),
        semester_number=request.semester_number or student.current_semester + 1,
        model_version="v2.0-Stacking"
    )
    db.add(prediction)
    
    student.risk_level = result.get("risk_level", student.risk_level)
    await db.commit()
    await db.refresh(prediction)
    
    res_dict = {
        "id": str(prediction.id),
        "student_id": str(prediction.student_id),
        "prediction_type": prediction.prediction_type,
        "predicted_gpa": prediction.predicted_gpa,
        "predicted_risk_level": prediction.predicted_risk_level,
        "confidence_score": prediction.confidence_score,
        "base_models": result.get("base_models"),
        "meta_learner": result.get("meta_learner"),
        "architecture": result.get("architecture"),
        "feature_importance": prediction.feature_importance,
        "shap_values": prediction.shap_values,
        "recommendations": prediction.recommendations,
        "prediction_date": prediction.prediction_date.isoformat() if prediction.prediction_date else None,
    }
    return res_dict

@router.post("/simulate")
async def simulate_academic_scenario(
    request: ScenarioSimulationRequest,
    current_user = Depends(get_current_user)
):
    """Simulate What-If scenario based on Stacking Ensemble Architecture"""
    res = await prediction_pipeline.simulate_scenario(
        student_id=request.student_id or "demo",
        current_gpa=request.current_gpa,
        target_attendance=request.target_attendance,
        target_assignment_rate=request.target_assignment_rate,
        target_backlogs=request.target_backlogs
    )
    return res

@router.post("/retrain")
async def trigger_model_retraining(
    background_tasks: BackgroundTasks,
    current_user = Depends(require_faculty_or_admin)
):
    """Trigger background model retraining for Stacking Ensemble Architecture"""
    import subprocess, sys
    from pathlib import Path

    def run_retrain():
        try:
            backend_dir = Path(__file__).resolve().parents[3]
            project_root = backend_dir.parent
            train_script = project_root / "ml_training" / "train_models.py"
            subprocess.run([sys.executable, str(train_script)], cwd=str(project_root), check=True)
            prediction_pipeline._load_models()
            logger.info("Stacking Ensemble retrained successfully")
        except Exception as e:
            logger.error(f"Retrain error: {e}")
            
    background_tasks.add_task(run_retrain)
    return {"message": "Stacking Ensemble Model retraining triggered successfully", "status": "queued"}

@router.get("/history", response_model=List[PredictionResponse])
async def get_prediction_history(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(
        select(Prediction)
        .where(Prediction.is_valid == True)
        .order_by(desc(Prediction.prediction_date))
        .limit(limit)
    )
    return result.scalars().all()

@router.get("/student/{student_id}", response_model=List[PredictionResponse])
async def get_student_predictions(
    student_id: UUID,
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(
        select(Prediction)
        .where(Prediction.student_id == student_id, Prediction.is_valid == True)
        .order_by(desc(Prediction.prediction_date))
        .limit(limit)
    )
    return result.scalars().all()

@router.get("/risk-report")
async def get_risk_report(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_faculty_or_admin)
):
    from sqlalchemy import func
    risk_counts = await db.execute(
        select(Student.risk_level, func.count(Student.id))
        .group_by(Student.risk_level)
    )
    counts = {row[0]: row[1] for row in risk_counts}
    
    high_risk = await db.execute(
        select(Student).where(Student.risk_level.in_(["high", "critical"]))
        .order_by(Student.cgpa)
        .limit(20)
    )
    
    return {
        "risk_distribution": counts,
        "high_risk_students": [
            {"id": str(s.id), "name": f"{s.first_name} {s.last_name}", 
             "cgpa": float(s.cgpa or 0), "risk": s.risk_level}
            for s in high_risk.scalars().all()
        ]
    }
