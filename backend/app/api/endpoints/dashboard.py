# pyrefly: ignore [missing-import]
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.db.database import get_db
from app.models.models import Student, Faculty, Course, Attendance, AcademicRecord, Prediction, Enrollment
from app.core.dependencies import get_current_user
from datetime import date, timedelta

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    total_students = (await db.execute(select(func.count(Student.id)))).scalar()
    total_faculty = (await db.execute(select(func.count(Faculty.id)))).scalar()
    total_courses = (await db.execute(select(func.count(Course.id)))).scalar()
    avg_cgpa = (await db.execute(select(func.avg(Student.cgpa)))).scalar()
    high_risk = (await db.execute(
        select(func.count(Student.id)).where(Student.risk_level.in_(["high", "critical"]))
    )).scalar()
    try:
        predictions_made = (await db.execute(select(func.count(Prediction.id)))).scalar()
    except Exception:
        predictions_made = 0
    
    thirty_days_ago = date.today() - timedelta(days=30)
    try:
        attendance_data = await db.execute(
            select(
                func.count(Attendance.id).label("total"),
                func.sum(func.case((Attendance.status == "present", 1), else_=0)).label("present")
            ).where(Attendance.date >= thirty_days_ago)
        )
        att_row = attendance_data.first()
        if att_row and att_row.total and att_row.total > 0:
            avg_att = round(((att_row.present or 0) / att_row.total) * 100, 2)
        else:
            stu_att = (await db.execute(select(func.avg(Student.attendance_pct)))).scalar()
            avg_att = round(float(stu_att or 0), 2)
    except Exception:
        stu_att = (await db.execute(select(func.avg(Student.attendance_pct)))).scalar()
        avg_att = round(float(stu_att or 0), 2)
    
    return {
        "total_students": total_students,
        "total_faculty": total_faculty,
        "total_courses": total_courses,
        "avg_cgpa": round(float(avg_cgpa or 0), 2),
        "high_risk_students": high_risk,
        "avg_attendance": avg_att,
        "predictions_made": predictions_made
    }

@router.get("/performance-trends")
async def get_performance_trends(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    from app.models.models import StudentPerformanceTimeseries
    result = await db.execute(
        select(
            StudentPerformanceTimeseries.semester_number,
            func.avg(StudentPerformanceTimeseries.sgpa).label("avg_sgpa"),
            func.avg(StudentPerformanceTimeseries.attendance_percentage).label("avg_attendance"),
            func.avg(StudentPerformanceTimeseries.backlogs).label("avg_backlogs")
        ).group_by(StudentPerformanceTimeseries.semester_number)
        .order_by(StudentPerformanceTimeseries.semester_number)
    )
    rows = result.all()
    return [
        {
            "semester": r.semester_number,
            "avg_sgpa": round(float(r.avg_sgpa or 0), 2),
            "avg_attendance": round(float(r.avg_attendance or 0), 2),
            "avg_backlogs": round(float(r.avg_backlogs or 0), 2)
        }
        for r in rows
    ]

@router.get("/risk-heatmap")
async def get_risk_heatmap(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    from app.models.models import Department
    result = await db.execute(
        select(
            Department.name,
            Student.risk_level,
            func.count(Student.id).label("count")
        )
        .join(Department, Student.department_id == Department.id)
        .group_by(Department.name, Student.risk_level)
    )
    rows = result.all()
    
    heatmap = {}
    for r in rows:
        if r.name not in heatmap:
            heatmap[r.name] = {"low": 0, "medium": 0, "high": 0, "critical": 0}
        heatmap[r.name][r.risk_level] = r.count
    
    return heatmap

@router.get("/attendance-analytics")
async def get_attendance_analytics(
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    from sqlalchemy import extract, case
    result = await db.execute(
        select(
            extract('month', Attendance.date).label("month"),
            func.count(Attendance.id).label("total"),
            func.sum(case((Attendance.status == "present", 1), else_=0)).label("present")
        ).group_by(extract('month', Attendance.date))
        .order_by(extract('month', Attendance.date))
    )
    rows = result.all()
    months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    return [
        {
            "month": months[int(r.month) - 1],
            "total": r.total,
            "present": r.present or 0,
            "percentage": round(((r.present or 0) / (r.total or 1)) * 100, 2)
        }
        for r in rows
    ]
