from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.orm import selectinload
from typing import Optional, List
from uuid import UUID
from app.db.database import get_db
from app.models.models import Student, User, Department, Enrollment, Attendance
from app.schemas.schemas import StudentCreate, StudentResponse, StudentUpdate, PaginatedResponse
from app.core.dependencies import get_current_user, require_faculty_or_admin, require_admin
from app.core.security import get_password_hash
import math

router = APIRouter(prefix="/students", tags=["Students"])

def generate_student_id(batch_year: int, department_code: str, count: int) -> str:
    return f"{department_code}{batch_year}{str(count).zfill(3)}"

@router.get("", response_model=PaginatedResponse)
async def list_students(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=5000),
    department_id: Optional[UUID] = None,
    risk_level: Optional[str] = None,
    batch_year: Optional[int] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = select(Student).options(selectinload(Student.department), selectinload(Student.user))
    
    if current_user.role == "student" or getattr(current_user.role, "value", "") == "student":
        query = query.where(Student.user_id == current_user.id)
    else:
        if department_id:
            query = query.where(Student.department_id == department_id)
        if risk_level:
            query = query.where(Student.risk_level == risk_level)
        if batch_year:
            query = query.where(Student.batch_year == batch_year)
        if search:
            query = query.where(
                (Student.first_name.ilike(f"%{search}%")) |
                (Student.last_name.ilike(f"%{search}%")) |
                (Student.student_id.ilike(f"%{search}%"))
            )
    
    count_result = await db.execute(select(func.count()).select_from(query.subquery()))
    total = count_result.scalar()
    
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    students = result.scalars().all()
    
    items = []
    for s in students:
        s_res = StudentResponse.model_validate(s)
        if s.department:
            s_res.department_name = s.department.code
        items.append(s_res)
    
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size) if total > 0 else 1
    )

@router.post("", response_model=StudentResponse)
async def create_student(
    data: StudentCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_faculty_or_admin)
):
    existing = await db.execute(select(User).where(User.email == data.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(email=data.email, hashed_password=get_password_hash(data.password), role="student", is_verified=True)
    db.add(user)
    await db.flush()
    
    count_result = await db.execute(select(func.count()).where(Student.batch_year == data.batch_year))
    count = count_result.scalar() + 1
    
    dept_code = "STU"
    if data.department_id:
        dept = await db.get(Department, data.department_id)
        if dept:
            dept_code = dept.code
    
    student = Student(
        user_id=user.id,
        student_id=generate_student_id(data.batch_year, dept_code, count),
        **data.model_dump(exclude={'email', 'password'})
    )
    db.add(student)
    await db.commit()
    await db.refresh(student)
    return student

@router.get("/{student_id}", response_model=StudentResponse)
async def get_student(
    student_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(
        select(Student).options(selectinload(Student.department), selectinload(Student.user))
        .where(Student.id == student_id)
    )
    student = result.scalar_one_or_none()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    if (current_user.role == "student" or getattr(current_user.role, "value", "") == "student") and student.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied to other student details")
        
    return student

@router.put("/{student_id}", response_model=StudentResponse)
async def update_student(
    student_id: UUID,
    data: StudentUpdate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_faculty_or_admin)
):
    student = await db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(student, field, value)
    
    await db.commit()
    await db.refresh(student)
    return student

@router.delete("/{student_id}")
async def delete_student(
    student_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_admin)
):
    student = await db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    await db.delete(student)
    await db.commit()
    return {"message": "Student deleted successfully"}

@router.get("/{student_id}/attendance-summary")
async def get_attendance_summary(
    student_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    total = await db.execute(
        select(func.count()).where(Attendance.student_id == student_id)
    )
    present = await db.execute(
        select(func.count()).where(
            and_(Attendance.student_id == student_id, Attendance.status == "present")
        )
    )
    t = total.scalar()
    p = present.scalar()
    return {
        "total_classes": t,
        "present": p,
        "absent": t - p,
        "percentage": round((p / t * 100) if t > 0 else 0, 2)
    }

@router.post("/bulk-import")
async def bulk_import_students(
    records: List[dict],
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_faculty_or_admin)
):
    from app.models.models import Department
    dept_res = await db.execute(select(Department))
    depts = {d.code: d.id for d in dept_res.scalars().all()}
    
    count = 0
    for r in records:
        s_id = str(r.get("Student_ID") or r.get("student_id") or (count + 1))
        existing = await db.execute(select(Student).where(Student.student_id == s_id))
        s_obj = existing.scalar_one_or_none()
        
        dept_code = r.get("department_name") or "CSE"
        dept_id = depts.get(dept_code)
        
        first_name = r.get("first_name") or f"Student"
        last_name = r.get("last_name") or f"#{s_id}"
        gender = r.get("Gender") or r.get("gender") or "Female"
        age = int(r.get("Age") or r.get("age") or 20)
        cgpa = float(r.get("Prior_GPA") or r.get("cgpa") or 3.0)
        att = float(r.get("Attendance_Rate") or r.get("attendance_pct") or 85.0)
        lms = int(r.get("LMS_Logins") or r.get("lms_logins") or 150)
        hrs = float(r.get("Study_Hours_Per_Week") or r.get("study_hours") or 20.0)
        sub_rate = float(r.get("Assignment_Submission_Rate") or r.get("assignment_submission_rate") or 80.0)
        eng = float(r.get("Engagement_Score") or r.get("engagement_score") or 50.0)
        perf = r.get("Final_Academic_Performance") or r.get("final_academic_performance") or "Medium"
        
        risk = "medium"
        p_str = perf.lower()
        if p_str == "high": risk = "low"
        elif p_str == "low": risk = "high"
        
        if s_obj:
            s_obj.cgpa = cgpa
            s_obj.attendance_pct = att
            s_obj.risk_level = risk
            s_obj.age = age
            s_obj.gender = gender
            s_obj.lms_logins = lms
            s_obj.study_hours = hrs
            s_obj.assignment_submission_rate = sub_rate
            s_obj.engagement_score = eng
            s_obj.final_academic_performance = perf
        else:
            email = f"student{s_id}@sapfs.edu"
            u_existing = await db.execute(select(User).where(User.email == email))
            u_obj = u_existing.scalar_one_or_none()
            if not u_obj:
                u_obj = User(email=email, hashed_password=get_password_hash("Student@123"), role="student", is_verified=True)
                db.add(u_obj)
                await db.flush()
                
            new_s = Student(
                user_id=u_obj.id,
                student_id=s_id,
                first_name=first_name,
                last_name=last_name,
                department_id=dept_id,
                batch_year=2024,
                current_semester=1,
                cgpa=cgpa,
                risk_level=risk,
                gender=gender,
                age=age,
                attendance_pct=att,
                lms_logins=lms,
                study_hours=hrs,
                assignment_submission_rate=sub_rate,
                engagement_score=eng,
                final_academic_performance=perf
            )
            db.add(new_s)
        count += 1
        
    await db.commit()
    return {"status": "success", "imported": count, "message": f"Successfully processed {count} records into database"}
