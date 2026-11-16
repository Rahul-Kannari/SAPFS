from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional, List
from uuid import UUID
from app.db.database import get_db
from app.models.models import AcademicRecord, Student, Course, Faculty
from app.schemas.schemas import AcademicRecordCreate, AcademicRecordResponse
from app.core.dependencies import get_current_user, require_faculty_or_admin

router = APIRouter(prefix="/academic-records", tags=["Academic Records"])

GRADE_TABLE = [
    (91, 'O', 10), (81, 'A+', 9), (71, 'A', 8),
    (61, 'B+', 7), (51, 'B', 6), (41, 'C', 5), (0, 'F', 0)
]

def calculate_grade(total: float, max_marks: float = 100):
    pct = (total / max_marks) * 100
    for threshold, grade, points in GRADE_TABLE:
        if pct >= threshold:
            return grade, points, pct >= 40
    return 'F', 0, False

@router.get("")
async def list_academic_records(
    student_id: Optional[UUID] = None,
    semester_number: Optional[int] = None,
    academic_year: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    query = select(AcademicRecord)
    if student_id:
        query = query.where(AcademicRecord.student_id == student_id)
    if semester_number:
        query = query.where(AcademicRecord.semester_number == semester_number)
    if academic_year:
        query = query.where(AcademicRecord.academic_year == academic_year)
    result = await db.execute(query.order_by(AcademicRecord.semester_number))
    return result.scalars().all()

@router.post("", response_model=AcademicRecordResponse)
async def create_academic_record(
    data: AcademicRecordCreate,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_faculty_or_admin)
):
    total = data.internal_marks + data.external_marks
    grade, grade_points, is_passed = calculate_grade(total, data.max_marks)
    
    course = await db.get(Course, data.course_id)
    credits_earned = course.credits if is_passed else 0

    faculty_result = await db.execute(select(Faculty).where(Faculty.user_id == current_user.id))
    faculty = faculty_result.scalar_one_or_none()

    record = AcademicRecord(
        **data.model_dump(),
        total_marks=total,
        grade=grade,
        grade_points=grade_points,
        credits_earned=credits_earned,
        is_passed=is_passed,
        recorded_by=faculty.id if faculty else None
    )
    db.add(record)
    
    # Update student CGPA
    await _update_student_cgpa(data.student_id, db)
    
    await db.commit()
    await db.refresh(record)
    return record

@router.put("/{record_id}", response_model=AcademicRecordResponse)
async def update_academic_record(
    record_id: UUID,
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(require_faculty_or_admin)
):
    record = await db.get(AcademicRecord, record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Record not found")
    
    if 'internal_marks' in data or 'external_marks' in data:
        internal = data.get('internal_marks', record.internal_marks)
        external = data.get('external_marks', record.external_marks)
        total = internal + external
        grade, grade_points, is_passed = calculate_grade(total, float(record.max_marks))
        data['total_marks'] = total
        data['grade'] = grade
        data['grade_points'] = grade_points
        data['is_passed'] = is_passed
    
    for k, v in data.items():
        setattr(record, k, v)
    
    await _update_student_cgpa(record.student_id, db)
    await db.commit()
    await db.refresh(record)
    return record

@router.get("/student/{student_id}/transcript")
async def get_student_transcript(
    student_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    result = await db.execute(
        select(AcademicRecord, Course.name, Course.course_code, Course.credits)
        .join(Course, AcademicRecord.course_id == Course.id)
        .where(AcademicRecord.student_id == student_id)
        .order_by(AcademicRecord.semester_number, Course.course_code)
    )
    rows = result.all()
    
    transcript = {}
    for record, course_name, course_code, credits in rows:
        sem = record.semester_number
        if sem not in transcript:
            transcript[sem] = {'semester': sem, 'academic_year': record.academic_year, 'courses': [], 'sgpa': 0, 'credits': 0}
        transcript[sem]['courses'].append({
            'course_code': course_code,
            'course_name': course_name,
            'internal': float(record.internal_marks or 0),
            'external': float(record.external_marks or 0),
            'total': float(record.total_marks or 0),
            'grade': record.grade,
            'grade_points': float(record.grade_points or 0),
            'credits': credits,
            'credits_earned': record.credits_earned,
            'passed': record.is_passed
        })
    
    # Calculate SGPA per semester
    for sem_data in transcript.values():
        courses = sem_data['courses']
        total_gp = sum(c['grade_points'] * c['credits_earned'] for c in courses)
        total_credits = sum(c['credits_earned'] for c in courses)
        sem_data['sgpa'] = round(total_gp / max(total_credits, 1), 2)
        sem_data['credits'] = total_credits
    
    return {'student_id': str(student_id), 'semesters': list(transcript.values())}

async def _update_student_cgpa(student_id: UUID, db: AsyncSession):
    result = await db.execute(
        select(
            func.sum(AcademicRecord.grade_points * AcademicRecord.credits_earned),
            func.sum(AcademicRecord.credits_earned)
        ).where(AcademicRecord.student_id == student_id)
    )
    row = result.first()
    if row and row[1] and row[1] > 0:
        cgpa = round(float(row[0]) / float(row[1]), 2)
        student = await db.get(Student, student_id)
        if student:
            student.cgpa = cgpa
            student.total_credits = int(row[1])
