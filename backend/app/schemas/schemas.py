from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Any, Dict
from datetime import datetime, date
from uuid import UUID
from enum import Enum

# ---- Enums ----
class UserRole(str, Enum):
    admin = "admin"
    faculty = "faculty"
    student = "student"

class RiskLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class AttendanceStatus(str, Enum):
    present = "present"
    absent = "absent"
    late = "late"
    excused = "excused"

# ---- Auth ----
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: UserRole
    user_id: str
    student_profile: Optional[Dict[str, Any]] = None

class TokenData(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

# ---- User ----
class UserBase(BaseModel):
    email: EmailStr
    role: UserRole

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserResponse(UserBase):
    id: UUID
    is_active: bool
    is_verified: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# ---- Department ----
class DepartmentBase(BaseModel):
    name: str
    code: str
    description: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

# ---- Student ----
class StudentBase(BaseModel):
    first_name: str
    last_name: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    department_id: Optional[UUID] = None
    batch_year: int
    current_semester: int = 1
    guardian_name: Optional[str] = None
    guardian_phone: Optional[str] = None

class StudentCreate(StudentBase):
    email: EmailStr
    password: str = Field(default="Student@123")

class StudentUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    current_semester: Optional[int] = None
    risk_level: Optional[RiskLevel] = None

class StudentResponse(StudentBase):
    id: UUID
    student_id: str
    cgpa: float
    risk_level: RiskLevel
    user_id: UUID
    created_at: datetime
    age: Optional[int] = None
    attendance_pct: Optional[float] = None
    lms_logins: Optional[int] = None
    study_hours: Optional[float] = None
    assignment_submission_rate: Optional[float] = None
    engagement_score: Optional[float] = None
    final_academic_performance: Optional[str] = None
    department_name: Optional[str] = None
    
    class Config:
        from_attributes = True

class StudentSummary(BaseModel):
    id: UUID
    student_id: str
    first_name: str
    last_name: str
    current_semester: int
    cgpa: float
    risk_level: RiskLevel
    department_name: Optional[str]
    attendance_pct: Optional[float]
    email: Optional[str]
    
    class Config:
        from_attributes = True

# ---- Faculty ----
class FacultyBase(BaseModel):
    first_name: str
    last_name: str
    designation: Optional[str] = None
    specialization: Optional[str] = None
    phone: Optional[str] = None
    department_id: Optional[UUID] = None

class FacultyCreate(FacultyBase):
    email: EmailStr
    password: str = Field(default="Faculty@123")

class FacultyResponse(FacultyBase):
    id: UUID
    faculty_id: str
    user_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

# ---- Course ----
class CourseBase(BaseModel):
    course_code: str
    name: str
    description: Optional[str] = None
    credits: int = 3
    department_id: Optional[UUID] = None
    faculty_id: Optional[UUID] = None
    semester: int
    is_elective: bool = False

class CourseCreate(CourseBase):
    pass

class CourseResponse(CourseBase):
    id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

# ---- Academic Record ----
class AcademicRecordBase(BaseModel):
    student_id: UUID
    course_id: UUID
    academic_year: str
    semester_number: int
    internal_marks: float = 0
    external_marks: float = 0
    max_marks: float = 100
    remarks: Optional[str] = None

class AcademicRecordCreate(AcademicRecordBase):
    pass

class AcademicRecordResponse(AcademicRecordBase):
    id: UUID
    total_marks: float
    grade: Optional[str]
    grade_points: Optional[float]
    credits_earned: int
    is_passed: bool
    recorded_at: datetime
    
    class Config:
        from_attributes = True

# ---- Attendance ----
class AttendanceBase(BaseModel):
    student_id: UUID
    course_id: UUID
    date: date
    status: AttendanceStatus
    hour_number: int = 1
    remarks: Optional[str] = None

class AttendanceCreate(AttendanceBase):
    pass

class BulkAttendanceCreate(BaseModel):
    course_id: UUID
    date: date
    records: List[Dict[str, Any]]

class AttendanceResponse(AttendanceBase):
    id: UUID
    marked_by: Optional[UUID]
    created_at: datetime
    
    class Config:
        from_attributes = True

# ---- Assignment ----
class AssignmentBase(BaseModel):
    course_id: UUID
    title: str
    description: Optional[str] = None
    due_date: datetime
    max_marks: float = 100
    weightage: float = 10
    assignment_type: str = "regular"

class AssignmentCreate(AssignmentBase):
    pass

class AssignmentResponse(AssignmentBase):
    id: UUID
    faculty_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

class SubmissionCreate(BaseModel):
    assignment_id: UUID
    student_id: UUID
    submission_url: Optional[str] = None

class SubmissionGrade(BaseModel):
    marks_obtained: float
    feedback: Optional[str] = None

# ---- Prediction ----
class PredictionRequest(BaseModel):
    student_id: UUID
    prediction_type: str = "comprehensive"
    semester_number: Optional[int] = None

class ScenarioSimulationRequest(BaseModel):
    student_id: Optional[str] = None
    current_gpa: float = 7.5
    target_attendance: float = 85.0
    target_assignment_rate: float = 0.90
    target_backlogs: int = 0

class PredictionResponse(BaseModel):
    id: UUID
    student_id: UUID
    prediction_type: str
    predicted_gpa: Optional[float]
    predicted_risk_level: Optional[RiskLevel]
    confidence_score: Optional[float]
    feature_importance: Optional[Dict]
    shap_values: Optional[Dict]
    recommendations: Optional[Dict]
    prediction_date: datetime
    
    class Config:
        from_attributes = True

# ---- Dashboard ----
class DashboardStats(BaseModel):
    total_students: int
    total_faculty: int
    total_courses: int
    avg_cgpa: float
    high_risk_students: int
    avg_attendance: float
    predictions_made: int

class PaginationParams(BaseModel):
    page: int = 1
    page_size: int = 20

class PaginatedResponse(BaseModel):
    items: List[Any]
    total: int
    page: int
    page_size: int
    pages: int
