from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
import time
import logging

from app.core.config import settings
from app.api.endpoints import auth, students, predictions, dashboard

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    ## Smart Academic Performance Forecasting System API
    
    A comprehensive academic analytics platform with ML-powered predictions.
    
    ### Features:
    - 🎓 Student & Faculty Management
    - 📊 Academic Records & Attendance Tracking
    - 🤖 XGBoost + LSTM Hybrid Prediction Engine
    - 🔮 GPA & Risk Level Forecasting
    - 💡 SHAP Explainability
    - 📋 Personalized Recommendations
    - 📈 Interactive Dashboard Analytics
    - 📄 Automated Report Generation
    """,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    return response

# Exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)}
    )

# Routers
API_PREFIX = "/api/v1"
app.include_router(auth.router, prefix=API_PREFIX)
app.include_router(students.router, prefix=API_PREFIX)
app.include_router(predictions.router, prefix=API_PREFIX)
app.include_router(dashboard.router, prefix=API_PREFIX)

# Additional routers (attendance, faculty, assignments, reports)
from fastapi import APIRouter
from app.core.dependencies import get_current_user, require_faculty_or_admin
from app.db.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from fastapi import Depends, Query
from uuid import UUID
from typing import Optional
from app.models.models import Faculty, Course, Attendance, Assignment, AssignmentSubmission, Notification
from app.schemas.schemas import (FacultyCreate, FacultyResponse, CourseCreate, CourseResponse,
                                  AttendanceCreate, BulkAttendanceCreate, AttendanceResponse,
                                  AssignmentCreate, AssignmentResponse, SubmissionCreate, SubmissionGrade)

# Faculty Router
faculty_router = APIRouter(prefix="/faculty", tags=["Faculty"])

from sqlalchemy.orm import selectinload

@faculty_router.get("")
async def list_faculty(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    result = await db.execute(select(Faculty).options(selectinload(Faculty.department)))
    return result.scalars().all()

@faculty_router.post("")
async def create_faculty(data: FacultyCreate, db: AsyncSession = Depends(get_db), current_user = Depends(require_faculty_or_admin)):
    from app.models.models import User
    from app.core.security import get_password_hash
    user = User(email=data.email, hashed_password=get_password_hash(data.password), role="faculty", is_verified=True)
    db.add(user)
    await db.flush()
    count = (await db.execute(select(func.count(Faculty.id)))).scalar() + 1
    faculty = Faculty(user_id=user.id, faculty_id=f"FAC{str(count).zfill(3)}", **data.model_dump(exclude={'email', 'password'}))
    db.add(faculty)
    await db.commit()
    return faculty

app.include_router(faculty_router, prefix=API_PREFIX)

# Courses Router
courses_router = APIRouter(prefix="/courses", tags=["Courses"])

@courses_router.get("")
async def list_courses(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    result = await db.execute(select(Course))
    return result.scalars().all()

@courses_router.post("")
async def create_course(data: CourseCreate, db: AsyncSession = Depends(get_db), current_user = Depends(require_faculty_or_admin)):
    course = Course(**data.model_dump())
    db.add(course)
    await db.commit()
    return course

app.include_router(courses_router, prefix=API_PREFIX)

# Attendance Router
attendance_router = APIRouter(prefix="/attendance", tags=["Attendance"])

@attendance_router.post("/bulk")
async def mark_bulk_attendance(data: BulkAttendanceCreate, db: AsyncSession = Depends(get_db), current_user = Depends(require_faculty_or_admin)):
    records_created = 0
    for record in data.records:
        att = Attendance(
            student_id=record.get("student_id"),
            course_id=data.course_id,
            date=data.date,
            status=record.get("status", "present"),
            marked_by=None
        )
        db.add(att)
        records_created += 1
    await db.commit()
    return {"message": f"Attendance marked for {records_created} students"}

app.include_router(attendance_router, prefix=API_PREFIX)

# Assignments Router
assignments_router = APIRouter(prefix="/assignments", tags=["Assignments"])

@assignments_router.get("")
async def list_assignments(course_id: Optional[UUID] = None, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    query = select(Assignment)
    if course_id:
        query = query.where(Assignment.course_id == course_id)
    result = await db.execute(query)
    return result.scalars().all()

@assignments_router.post("")
async def create_assignment(data: AssignmentCreate, db: AsyncSession = Depends(get_db), current_user = Depends(require_faculty_or_admin)):
    faculty_result = await db.execute(select(Faculty).where(Faculty.user_id == current_user.id))
    faculty = faculty_result.scalar_one_or_none()
    assignment = Assignment(**data.model_dump(), faculty_id=faculty.id if faculty else None)
    db.add(assignment)
    await db.commit()
    return assignment

app.include_router(assignments_router, prefix=API_PREFIX)

# Notifications Router
notif_router = APIRouter(prefix="/notifications", tags=["Notifications"])

@notif_router.get("")
async def get_notifications(db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    result = await db.execute(
        select(Notification).where(Notification.user_id == current_user.id).order_by(Notification.created_at.desc()).limit(50)
    )
    return result.scalars().all()

@notif_router.put("/{notif_id}/read")
async def mark_read(notif_id: UUID, db: AsyncSession = Depends(get_db), current_user = Depends(get_current_user)):
    notif = await db.get(Notification, notif_id)
    if notif:
        notif.is_read = True
        await db.commit()
    return {"message": "Marked as read"}

app.include_router(notif_router, prefix=API_PREFIX)

from fastapi.responses import RedirectResponse

@app.get("/docs", include_in_schema=False)
async def redirect_docs():
    return RedirectResponse(url="/api/docs")

@app.get("/")
async def root():
    return {"message": f"{settings.APP_NAME} API", "version": settings.APP_VERSION, "docs": "/api/docs"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": settings.APP_VERSION, "timestamp": time.time()}

# Import and register academic records and reports routers
from app.api.endpoints.academic_records import router as academic_records_router
from app.api.endpoints.reports import router as reports_router
from app.api.v2.endpoints.agents import router as agents_v2_router

app.include_router(academic_records_router, prefix=API_PREFIX)
app.include_router(reports_router, prefix=API_PREFIX)
app.include_router(agents_v2_router, prefix="/api/v2")
app.include_router(agents_v2_router, prefix=API_PREFIX)
