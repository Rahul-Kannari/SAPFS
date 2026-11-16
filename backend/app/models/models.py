import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer, Numeric, Text, Enum, Date, JSON
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum

class UserRole(str, enum.Enum):
    admin = "admin"
    faculty = "faculty"
    student = "student"

class RiskLevel(str, enum.Enum):
    low = "low"
    medium = "medium"
    high = "high"
    critical = "critical"

class AttendanceStatus(str, enum.Enum):
    present = "present"
    absent = "absent"
    late = "late"
    excused = "excused"

class AssignmentStatus(str, enum.Enum):
    pending = "pending"
    submitted = "submitted"
    graded = "graded"
    late = "late"
    missing = "missing"

class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole, name="user_role"), nullable=False, default=UserRole.student)
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    last_login = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    student = relationship("Student", back_populates="user", uselist=False)
    faculty = relationship("Faculty", back_populates="user", uselist=False)
    notifications = relationship("Notification", back_populates="user")

class Department(Base):
    __tablename__ = "departments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), unique=True, nullable=False)
    code = Column(String(10), unique=True, nullable=False)
    description = Column(Text)
    head_faculty_id = Column(UUID(as_uuid=True), ForeignKey("faculty.id", use_alter=True, name="fk_dept_head"), nullable=True)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    students = relationship("Student", back_populates="department")
    faculty_members = relationship("Faculty", back_populates="department", foreign_keys="Faculty.department_id")
    courses = relationship("Course", back_populates="department")

class Student(Base):
    __tablename__ = "students"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(String(20), unique=True, nullable=False)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    date_of_birth = Column(Date)
    gender = Column(String(10))
    phone = Column(String(20))
    address = Column(Text)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"))
    batch_year = Column(Integer, nullable=False)
    current_semester = Column(Integer, default=1)
    cgpa = Column(Numeric(4, 2), default=0.00)
    total_credits = Column(Integer, default=0)
    risk_level = Column(Enum(RiskLevel, name="risk_level"), default=RiskLevel.low)
    age = Column(Integer)
    attendance_pct = Column(Numeric(5, 2))
    lms_logins = Column(Integer)
    study_hours = Column(Numeric(5, 2))
    assignment_submission_rate = Column(Numeric(5, 2))
    engagement_score = Column(Numeric(5, 2))
    final_academic_performance = Column(String(20))
    profile_image = Column(String(255))
    guardian_name = Column(String(100))
    guardian_phone = Column(String(20))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="student")
    department = relationship("Department", back_populates="students")
    enrollments = relationship("Enrollment", back_populates="student")
    academic_records = relationship("AcademicRecord", back_populates="student")
    attendance_records = relationship("Attendance", back_populates="student")
    submissions = relationship("AssignmentSubmission", back_populates="student")
    predictions = relationship("Prediction", back_populates="student")
    performance_timeseries = relationship("StudentPerformanceTimeseries", back_populates="student")

class Faculty(Base):
    __tablename__ = "faculty"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    faculty_id = Column(String(20), unique=True, nullable=False)
    first_name = Column(String(50), nullable=False)
    last_name = Column(String(50), nullable=False)
    designation = Column(String(100))
    specialization = Column(String(200))
    phone = Column(String(20))
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"))
    profile_image = Column(String(255))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="faculty")
    department = relationship("Department", back_populates="faculty_members", foreign_keys=[department_id])
    courses = relationship("Course", back_populates="faculty")

class Course(Base):
    __tablename__ = "courses"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_code = Column(String(20), unique=True, nullable=False)
    name = Column(String(150), nullable=False)
    description = Column(Text)
    credits = Column(Integer, nullable=False, default=3)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"))
    faculty_id = Column(UUID(as_uuid=True), ForeignKey("faculty.id"))
    semester = Column(Integer, nullable=False)
    is_elective = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    department = relationship("Department", back_populates="courses")
    faculty = relationship("Faculty", back_populates="courses")
    enrollments = relationship("Enrollment", back_populates="course")
    academic_records = relationship("AcademicRecord", back_populates="course")
    attendance_records = relationship("Attendance", back_populates="course")
    assignments = relationship("Assignment", back_populates="course")

class Enrollment(Base):
    __tablename__ = "enrollments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    academic_year = Column(String(10), nullable=False)
    semester_type = Column(String(10), nullable=False)
    semester_number = Column(Integer, nullable=False)
    enrollment_date = Column(Date, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    student = relationship("Student", back_populates="enrollments")
    course = relationship("Course", back_populates="enrollments")

class AcademicRecord(Base):
    __tablename__ = "academic_records"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    enrollment_id = Column(UUID(as_uuid=True), ForeignKey("enrollments.id"))
    academic_year = Column(String(10), nullable=False)
    semester_number = Column(Integer, nullable=False)
    internal_marks = Column(Numeric(5, 2), default=0)
    external_marks = Column(Numeric(5, 2), default=0)
    total_marks = Column(Numeric(5, 2), default=0)
    max_marks = Column(Numeric(5, 2), default=100)
    grade = Column(String(5))
    grade_points = Column(Numeric(4, 2))
    credits_earned = Column(Integer, default=0)
    is_passed = Column(Boolean, default=False)
    remarks = Column(Text)
    recorded_by = Column(UUID(as_uuid=True), ForeignKey("faculty.id"))
    recorded_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    updated_at = Column(DateTime(timezone=True), default=datetime.utcnow, onupdate=datetime.utcnow)
    
    student = relationship("Student", back_populates="academic_records")
    course = relationship("Course", back_populates="academic_records")

class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id"), nullable=False)
    date = Column(Date, nullable=False)
    status = Column(Enum(AttendanceStatus, name="attendance_status"), nullable=False, default=AttendanceStatus.present)
    hour_number = Column(Integer, default=1)
    marked_by = Column(UUID(as_uuid=True), ForeignKey("faculty.id"))
    remarks = Column(String(255))
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    student = relationship("Student", back_populates="attendance_records")
    course = relationship("Course", back_populates="attendance_records")

class Assignment(Base):
    __tablename__ = "assignments"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    course_id = Column(UUID(as_uuid=True), ForeignKey("courses.id", ondelete="CASCADE"), nullable=False)
    faculty_id = Column(UUID(as_uuid=True), ForeignKey("faculty.id"), nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    due_date = Column(DateTime(timezone=True), nullable=False)
    max_marks = Column(Numeric(5, 2), default=100)
    weightage = Column(Numeric(4, 2), default=10)
    assignment_type = Column(String(50), default="regular")
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    course = relationship("Course", back_populates="assignments")
    submissions = relationship("AssignmentSubmission", back_populates="assignment")

class AssignmentSubmission(Base):
    __tablename__ = "assignment_submissions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assignment_id = Column(UUID(as_uuid=True), ForeignKey("assignments.id", ondelete="CASCADE"), nullable=False)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    submission_url = Column(String(255))
    submitted_at = Column(DateTime(timezone=True))
    marks_obtained = Column(Numeric(5, 2))
    status = Column(Enum(AssignmentStatus, name="assignment_status"), default=AssignmentStatus.pending)
    feedback = Column(Text)
    graded_by = Column(UUID(as_uuid=True), ForeignKey("faculty.id"))
    graded_at = Column(DateTime(timezone=True))
    
    assignment = relationship("Assignment", back_populates="submissions")
    student = relationship("Student", back_populates="submissions")

class Prediction(Base):
    __tablename__ = "predictions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    prediction_type = Column(String(50), nullable=False)
    predicted_gpa = Column(Numeric(4, 2))
    predicted_risk_level = Column(Enum(RiskLevel, name="risk_level"))
    confidence_score = Column(Numeric(5, 4))
    feature_importance = Column(JSON)
    shap_values = Column(JSON)
    model_version = Column(String(20), default="v1.0")
    semester_number = Column(Integer)
    recommendations = Column(JSON)
    prediction_date = Column(DateTime(timezone=True), default=datetime.utcnow)
    is_valid = Column(Boolean, default=True)
    
    student = relationship("Student", back_populates="predictions")

class StudentPerformanceTimeseries(Base):
    __tablename__ = "student_performance_timeseries"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False)
    semester_number = Column(Integer, nullable=False)
    academic_year = Column(String(10), nullable=False)
    sgpa = Column(Numeric(4, 2))
    cgpa = Column(Numeric(4, 2))
    attendance_percentage = Column(Numeric(5, 2))
    assignments_completed = Column(Integer, default=0)
    assignments_total = Column(Integer, default=0)
    credits_attempted = Column(Integer, default=0)
    credits_earned = Column(Integer, default=0)
    backlogs = Column(Integer, default=0)
    rank_in_class = Column(Integer)
    recorded_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    student = relationship("Student", back_populates="performance_timeseries")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(String(50), default="general")
    is_read = Column(Boolean, default=False)
    priority = Column(Integer, default=1)
    notification_metadata = Column(JSON)
    created_at = Column(DateTime(timezone=True), default=datetime.utcnow)
    
    user = relationship("User", back_populates="notifications")

class MLModel(Base):
    __tablename__ = "ml_models"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_name = Column(String(100), nullable=False)
    model_type = Column(String(50), nullable=False)
    version = Column(String(20), nullable=False)
    accuracy = Column(Numeric(5, 4))
    mae = Column(Numeric(8, 4))
    rmse = Column(Numeric(8, 4))
    r2_score = Column(Numeric(6, 4))
    training_samples = Column(Integer)
    hyperparameters = Column(JSON)
    feature_list = Column(JSON)
    model_path = Column(String(255))
    is_active = Column(Boolean, default=False)
    trained_at = Column(DateTime(timezone=True), default=datetime.utcnow)
