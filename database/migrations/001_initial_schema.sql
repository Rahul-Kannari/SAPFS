-- ============================================================
-- Smart Academic Performance Forecasting System
-- PostgreSQL Database Schema - Version 1.0
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('admin', 'faculty', 'student');
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE assignment_status AS ENUM ('pending', 'submitted', 'graded', 'late', 'missing');
CREATE TYPE notification_type AS ENUM ('risk_alert', 'attendance_alert', 'grade_alert', 'general');
CREATE TYPE semester_type AS ENUM ('odd', 'even');

-- ============================================================
-- DEPARTMENTS
-- ============================================================
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(10) NOT NULL UNIQUE,
    description TEXT,
    head_faculty_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- USERS (Base table)
-- ============================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    hashed_password VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'student',
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- STUDENTS
-- ============================================================
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(10),
    phone VARCHAR(20),
    address TEXT,
    department_id UUID REFERENCES departments(id),
    batch_year INTEGER NOT NULL,
    current_semester INTEGER DEFAULT 1,
    cgpa DECIMAL(4,2) DEFAULT 0.00,
    total_credits INTEGER DEFAULT 0,
    risk_level risk_level DEFAULT 'low',
    profile_image VARCHAR(255),
    guardian_name VARCHAR(100),
    guardian_phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- FACULTY
-- ============================================================
CREATE TABLE faculty (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    faculty_id VARCHAR(20) NOT NULL UNIQUE,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    designation VARCHAR(100),
    specialization VARCHAR(200),
    phone VARCHAR(20),
    department_id UUID REFERENCES departments(id),
    profile_image VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add FK for department head
ALTER TABLE departments ADD CONSTRAINT fk_dept_head 
    FOREIGN KEY (head_faculty_id) REFERENCES faculty(id) ON DELETE SET NULL;

-- ============================================================
-- COURSES / SUBJECTS
-- ============================================================
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    credits INTEGER NOT NULL DEFAULT 3,
    department_id UUID REFERENCES departments(id),
    faculty_id UUID REFERENCES faculty(id),
    semester INTEGER NOT NULL,
    is_elective BOOLEAN DEFAULT FALSE,
    syllabus_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- ENROLLMENTS
-- ============================================================
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    academic_year VARCHAR(10) NOT NULL,
    semester_type semester_type NOT NULL,
    semester_number INTEGER NOT NULL,
    enrollment_date DATE DEFAULT CURRENT_DATE,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(student_id, course_id, academic_year, semester_type)
);

-- ============================================================
-- ACADEMIC RECORDS (Grades)
-- ============================================================
CREATE TABLE academic_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id),
    enrollment_id UUID REFERENCES enrollments(id),
    academic_year VARCHAR(10) NOT NULL,
    semester_number INTEGER NOT NULL,
    internal_marks DECIMAL(5,2) DEFAULT 0,
    external_marks DECIMAL(5,2) DEFAULT 0,
    total_marks DECIMAL(5,2) DEFAULT 0,
    max_marks DECIMAL(5,2) DEFAULT 100,
    grade VARCHAR(5),
    grade_points DECIMAL(4,2),
    credits_earned INTEGER DEFAULT 0,
    is_passed BOOLEAN DEFAULT FALSE,
    remarks TEXT,
    recorded_by UUID REFERENCES faculty(id),
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- ATTENDANCE
-- ============================================================
CREATE TABLE attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id),
    date DATE NOT NULL,
    status attendance_status NOT NULL DEFAULT 'present',
    hour_number INTEGER DEFAULT 1,
    marked_by UUID REFERENCES faculty(id),
    remarks VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, course_id, date, hour_number)
);

-- ============================================================
-- ASSIGNMENTS
-- ============================================================
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    faculty_id UUID NOT NULL REFERENCES faculty(id),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    max_marks DECIMAL(5,2) DEFAULT 100,
    weightage DECIMAL(4,2) DEFAULT 10,
    assignment_type VARCHAR(50) DEFAULT 'regular',
    attachment_url VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- ASSIGNMENT SUBMISSIONS
-- ============================================================
CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    submission_url VARCHAR(255),
    submitted_at TIMESTAMP WITH TIME ZONE,
    marks_obtained DECIMAL(5,2),
    status assignment_status DEFAULT 'pending',
    feedback TEXT,
    graded_by UUID REFERENCES faculty(id),
    graded_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(assignment_id, student_id)
);

-- ============================================================
-- PREDICTIONS
-- ============================================================
CREATE TABLE predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    prediction_type VARCHAR(50) NOT NULL,
    predicted_gpa DECIMAL(4,2),
    predicted_risk_level risk_level,
    confidence_score DECIMAL(5,4),
    feature_importance JSONB,
    shap_values JSONB,
    model_version VARCHAR(20) DEFAULT 'v1.0',
    semester_number INTEGER,
    recommendations JSONB,
    prediction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_valid BOOLEAN DEFAULT TRUE
);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    notification_type notification_type DEFAULT 'general',
    is_read BOOLEAN DEFAULT FALSE,
    priority INTEGER DEFAULT 1,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- STUDENT PERFORMANCE TIME-SERIES
-- ============================================================
CREATE TABLE student_performance_timeseries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    semester_number INTEGER NOT NULL,
    academic_year VARCHAR(10) NOT NULL,
    sgpa DECIMAL(4,2),
    cgpa DECIMAL(4,2),
    attendance_percentage DECIMAL(5,2),
    assignments_completed INTEGER DEFAULT 0,
    assignments_total INTEGER DEFAULT 0,
    credits_attempted INTEGER DEFAULT 0,
    credits_earned INTEGER DEFAULT 0,
    backlogs INTEGER DEFAULT 0,
    rank_in_class INTEGER,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, semester_number, academic_year)
);

-- ============================================================
-- MODEL METADATA
-- ============================================================
CREATE TABLE ml_models (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name VARCHAR(100) NOT NULL,
    model_type VARCHAR(50) NOT NULL,
    version VARCHAR(20) NOT NULL,
    accuracy DECIMAL(5,4),
    mae DECIMAL(8,4),
    rmse DECIMAL(8,4),
    r2_score DECIMAL(6,4),
    training_samples INTEGER,
    hyperparameters JSONB,
    feature_list JSONB,
    model_path VARCHAR(255),
    is_active BOOLEAN DEFAULT FALSE,
    trained_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(model_name, version)
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_students_department ON students(department_id);
CREATE INDEX idx_students_risk ON students(risk_level);
CREATE INDEX idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX idx_attendance_course_date ON attendance(course_id, date);
CREATE INDEX idx_academic_records_student ON academic_records(student_id);
CREATE INDEX idx_academic_records_semester ON academic_records(student_id, semester_number);
CREATE INDEX idx_predictions_student ON predictions(student_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_timeseries_student ON student_performance_timeseries(student_id);
CREATE INDEX idx_assignments_course ON assignments(course_id);
CREATE INDEX idx_submissions_student ON assignment_submissions(student_id);

-- ============================================================
-- TRIGGERS: updated_at auto-update
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$ 
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','students','faculty','departments','courses','academic_records'] LOOP
    EXECUTE format('CREATE TRIGGER trg_%s_updated BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t, t);
  END LOOP;
END $$;

-- ============================================================
-- VIEWS
-- ============================================================
CREATE OR REPLACE VIEW v_student_summary AS
SELECT 
    s.id, s.student_id, s.first_name, s.last_name,
    s.current_semester, s.cgpa, s.risk_level,
    d.name AS department_name,
    COUNT(DISTINCT e.course_id) AS enrolled_courses,
    COALESCE(AVG(CASE WHEN a.status = 'present' THEN 1.0 ELSE 0.0 END) * 100, 0) AS attendance_pct,
    u.email, u.is_active
FROM students s
LEFT JOIN departments d ON s.department_id = d.id
LEFT JOIN enrollments e ON s.id = e.student_id AND e.is_active = TRUE
LEFT JOIN attendance a ON s.id = a.student_id
LEFT JOIN users u ON s.user_id = u.id
GROUP BY s.id, d.name, u.email, u.is_active;

CREATE OR REPLACE VIEW v_course_analytics AS
SELECT 
    c.id, c.course_code, c.name,
    d.name AS department,
    f.first_name || ' ' || f.last_name AS faculty_name,
    COUNT(DISTINCT e.student_id) AS enrolled_students,
    AVG(ar.total_marks) AS avg_marks,
    MIN(ar.total_marks) AS min_marks,
    MAX(ar.total_marks) AS max_marks,
    COUNT(CASE WHEN ar.is_passed THEN 1 END) AS passed_count
FROM courses c
LEFT JOIN departments d ON c.department_id = d.id
LEFT JOIN faculty f ON c.faculty_id = f.id
LEFT JOIN enrollments e ON c.id = e.course_id
LEFT JOIN academic_records ar ON c.id = ar.course_id
GROUP BY c.id, d.name, f.first_name, f.last_name;

COMMENT ON TABLE predictions IS 'ML model predictions for student academic performance';
COMMENT ON TABLE student_performance_timeseries IS 'Time-series data for LSTM model training';
COMMENT ON TABLE ml_models IS 'Metadata and versioning for trained ML models';

ALTER TABLE students
    ADD COLUMN IF NOT EXISTS age INTEGER,
    ADD COLUMN IF NOT EXISTS attendance_pct NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS lms_logins INTEGER,
    ADD COLUMN IF NOT EXISTS study_hours NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS assignment_submission_rate NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS engagement_score NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS final_academic_performance VARCHAR(20);
