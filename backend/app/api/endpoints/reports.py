from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from uuid import UUID
import io
from app.db.database import get_db
from app.models.models import Student, Department, Prediction
from app.core.dependencies import get_current_user, require_faculty_or_admin
from app.services.report_service import generate_student_report_card, generate_department_report

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/summary")
async def get_reports_summary(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Get system-wide summary for reports dashboard"""
    from sqlalchemy import func
    from app.models.models import Faculty, Course
    total_students = (await db.execute(select(func.count(Student.id)))).scalar()
    total_faculty  = (await db.execute(select(func.count(Faculty.id)))).scalar()
    total_courses  = (await db.execute(select(func.count(Course.id)))).scalar()
    avg_cgpa = (await db.execute(select(func.avg(Student.cgpa)))).scalar()
    risk_counts = await db.execute(
        select(Student.risk_level, func.count(Student.id)).group_by(Student.risk_level)
    )
    risk_dist = {str(r[0].value if r[0] else 'unknown'): r[1] for r in risk_counts}
    prediction_count = (await db.execute(select(func.count(Prediction.id)))).scalar()
    return {
        "total_students":    total_students,
        "total_faculty":     total_faculty,
        "total_courses":     total_courses,
        "avg_cgpa":          round(float(avg_cgpa or 0), 2),
        "risk_distribution": risk_dist,
        "predictions_made":  prediction_count,
        "report_types": [
            "Student Report Card", "Department Analytics",
            "At-Risk Summary", "Attendance Defaulters",
            "AI Model Metrics", "Student Master CSV"
        ]
    }

@router.get("/student/{student_id}/report-card")
async def download_student_report_card(
    student_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Download PDF report card for a student"""
    student = await db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get latest prediction
    from sqlalchemy import desc
    pred_result = await db.execute(
        select(Prediction)
        .where(Prediction.student_id == student_id, Prediction.is_valid == True)
        .order_by(desc(Prediction.prediction_date))
        .limit(1)
    )
    prediction = pred_result.scalar_one_or_none()
    
    student_data = {
        'first_name': student.first_name,
        'last_name': student.last_name,
        'student_id': student.student_id,
        'department': 'Computer Science Engineering',
        'batch_year': student.batch_year,
        'current_semester': student.current_semester,
        'cgpa': float(student.cgpa or 0),
        'risk_level': student.risk_level.value if student.risk_level else 'low',
    }
    
    pred_data = None
    if prediction:
        pred_data = {
            'predicted_gpa': float(prediction.predicted_gpa or 0),
            'predicted_risk_level': prediction.predicted_risk_level.value if prediction.predicted_risk_level else 'medium',
            'confidence_score': float(prediction.confidence_score or 0),
            'recommendations': prediction.recommendations or {}
        }
    
    # Generate PDF with demo transcript
    demo_transcript = {
        'semesters': [
            {
                'semester': sem,
                'academic_year': f"202{sem//2}-2{sem//2+1}",
                'sgpa': round(float(student.cgpa or 7.5) + (0.1 * (sem - student.current_semester)), 2),
                'credits': 20,
                'courses': [
                    {'course_code': f'CSE{sem}0{i}', 'course_name': f'Subject {i}',
                     'internal': 35, 'external': 55, 'total': 90, 'grade': 'A+',
                     'grade_points': 9, 'credits_earned': 4, 'passed': True}
                    for i in range(1, 4)
                ]
            }
            for sem in range(1, student.current_semester)
        ]
    }
    
    pdf_bytes = generate_student_report_card(student_data, demo_transcript, pred_data)
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=report_{student.student_id}.pdf"}
    )

@router.get("/department/{dept_id}/analytics")
async def download_department_report(
    dept_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_faculty_or_admin)
):
    """Download PDF department analytics report"""
    dept = await db.get(Department, dept_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    
    result = await db.execute(select(Student).where(Student.department_id == dept_id))
    students = result.scalars().all()
    
    students_data = [
        {'first_name': s.first_name, 'last_name': s.last_name,
         'student_id': s.student_id, 'cgpa': float(s.cgpa or 0),
         'risk_level': s.risk_level.value if s.risk_level else 'low'}
        for s in students
    ]
    
    dept_data = {'name': dept.name, 'code': dept.code}
    pdf_bytes = generate_department_report(dept_data, students_data)
    
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=dept_{dept.code}_report.pdf"}
    )

@router.get("/risk-summary")
async def get_risk_summary_report(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_faculty_or_admin)
):
    """Get JSON summary of all risk levels for report generation"""
    from sqlalchemy import func
    result = await db.execute(
        select(Student.risk_level, func.count(Student.id), func.avg(Student.cgpa))
        .group_by(Student.risk_level)
    )
    rows = result.all()
    return {
        "summary": [{"risk_level": r[0], "count": r[1], "avg_cgpa": round(float(r[2] or 0), 2)} for r in rows],
        "generated_at": "now"
    }
