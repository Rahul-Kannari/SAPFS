-- ============================================================
-- Sample Seed Data for Smart Academic Forecasting System
-- ============================================================

-- Departments
INSERT INTO departments (id, name, code, description) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Computer Science Engineering', 'CSE', 'Department of Computer Science and Engineering'),
  ('22222222-2222-2222-2222-222222222222', 'Electronics Engineering', 'ECE', 'Department of Electronics and Communication'),
  ('33333333-3333-3333-3333-333333333333', 'Mechanical Engineering', 'MECH', 'Department of Mechanical Engineering'),
  ('44444444-4444-4444-4444-444444444444', 'Information Technology', 'IT', 'Department of Information Technology');

-- Admin User (password: Admin@123)
INSERT INTO users (id, email, hashed_password, role, is_active, is_verified) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin@sapfs.edu', '$2b$12$dpYOZmTyQq2frwmf7I1ddOOZxTIGQGSR6iNB.etV2oxbZ6eRQdPm6', 'admin', TRUE, TRUE);

-- Faculty Users (password: Faculty@123)
INSERT INTO users (id, email, hashed_password, role, is_active, is_verified) VALUES
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'dr.sharma@sapfs.edu', '$2b$12$PXNizNNlw06YMpHO9jG8NuXzamL33VYnS9l/SZ6BX3FNS.cvjR4Zy', 'faculty', TRUE, TRUE),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'prof.mehta@sapfs.edu', '$2b$12$PXNizNNlw06YMpHO9jG8NuXzamL33VYnS9l/SZ6BX3FNS.cvjR4Zy', 'faculty', TRUE, TRUE),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'dr.patel@sapfs.edu', '$2b$12$PXNizNNlw06YMpHO9jG8NuXzamL33VYnS9l/SZ6BX3FNS.cvjR4Zy', 'faculty', TRUE, TRUE);

-- Faculty Records
INSERT INTO faculty (id, user_id, faculty_id, first_name, last_name, designation, specialization, department_id) VALUES
  ('f1111111-1111-1111-1111-111111111111', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'FAC001', 'Rajesh', 'Sharma', 'Professor', 'Machine Learning, Data Science', '11111111-1111-1111-1111-111111111111'),
  ('f2222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'FAC002', 'Priya', 'Mehta', 'Associate Professor', 'Algorithms, Software Engineering', '11111111-1111-1111-1111-111111111111'),
  ('f3333333-3333-3333-3333-333333333333', 'dddddddd-dddd-dddd-dddd-dddddddddddd', 'FAC003', 'Amit', 'Patel', 'Assistant Professor', 'Databases, Cloud Computing', '44444444-4444-4444-4444-444444444444');

-- Student Users (password: Student@123)
INSERT INTO users (id, email, hashed_password, role, is_active, is_verified) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'arjun.kumar@student.sapfs.edu', '$2b$12$rlPBbj2AsGcKWNOrddXx4OEibC52sn4YTqZsfFCv/A5jul3RJVmGW', 'student', TRUE, TRUE),
  ('b2222222-2222-2222-2222-222222222222', 'priya.singh@student.sapfs.edu', '$2b$12$rlPBbj2AsGcKWNOrddXx4OEibC52sn4YTqZsfFCv/A5jul3RJVmGW', 'student', TRUE, TRUE),
  ('b3333333-3333-3333-3333-333333333333', 'rahul.verma@student.sapfs.edu', '$2b$12$rlPBbj2AsGcKWNOrddXx4OEibC52sn4YTqZsfFCv/A5jul3RJVmGW', 'student', TRUE, TRUE),
  ('b4444444-4444-4444-4444-444444444444', 'neha.gupta@student.sapfs.edu', '$2b$12$rlPBbj2AsGcKWNOrddXx4OEibC52sn4YTqZsfFCv/A5jul3RJVmGW', 'student', TRUE, TRUE),
  ('b5555555-5555-5555-5555-555555555555', 'vikram.das@student.sapfs.edu', '$2b$12$rlPBbj2AsGcKWNOrddXx4OEibC52sn4YTqZsfFCv/A5jul3RJVmGW', 'student', TRUE, TRUE);

-- Students
INSERT INTO students (id, user_id, student_id, first_name, last_name, department_id, batch_year, current_semester, cgpa, risk_level) VALUES
  ('e1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'CSE2021001', 'Arjun', 'Kumar', '11111111-1111-1111-1111-111111111111', 2021, 7, 8.45, 'low'),
  ('e2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222', 'CSE2021002', 'Priya', 'Singh', '11111111-1111-1111-1111-111111111111', 2021, 7, 9.12, 'low'),
  ('e3333333-3333-3333-3333-333333333333', 'b3333333-3333-3333-3333-333333333333', 'CSE2021003', 'Rahul', 'Verma', '11111111-1111-1111-1111-111111111111', 2021, 7, 6.78, 'medium'),
  ('e4444444-4444-4444-4444-444444444444', 'b4444444-4444-4444-4444-444444444444', 'CSE2022001', 'Neha', 'Gupta', '11111111-1111-1111-1111-111111111111', 2022, 5, 7.23, 'medium'),
  ('e5555555-5555-5555-5555-555555555555', 'b5555555-5555-5555-5555-555555555555', 'CSE2022002', 'Vikram', 'Das', '11111111-1111-1111-1111-111111111111', 2022, 5, 5.89, 'high');

-- Courses
INSERT INTO courses (id, course_code, name, credits, department_id, faculty_id, semester) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'CSE301', 'Machine Learning', 4, '11111111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111', 7),
  ('c2222222-2222-2222-2222-222222222222', 'CSE302', 'Deep Learning', 4, '11111111-1111-1111-1111-111111111111', 'f1111111-1111-1111-1111-111111111111', 7),
  ('c3333333-3333-3333-3333-333333333333', 'CSE303', 'Algorithm Design', 3, '11111111-1111-1111-1111-111111111111', 'f2222222-2222-2222-2222-222222222222', 7),
  ('c4444444-4444-4444-4444-444444444444', 'CSE304', 'Database Systems', 3, '11111111-1111-1111-1111-111111111111', 'f3333333-3333-3333-3333-333333333333', 7),
  ('c5555555-5555-5555-5555-555555555555', 'CSE305', 'Cloud Computing', 3, '44444444-4444-4444-4444-444444444444', 'f3333333-3333-3333-3333-333333333333', 7);

-- Performance time-series data (historical)
INSERT INTO student_performance_timeseries (student_id, semester_number, academic_year, sgpa, cgpa, attendance_percentage, assignments_completed, assignments_total, credits_attempted, credits_earned, backlogs) VALUES
  ('e1111111-1111-1111-1111-111111111111', 1, '2021-22', 8.2, 8.2, 88.5, 12, 12, 22, 22, 0),
  ('e1111111-1111-1111-1111-111111111111', 2, '2021-22', 8.5, 8.35, 91.2, 14, 14, 20, 20, 0),
  ('e1111111-1111-1111-1111-111111111111', 3, '2022-23', 8.8, 8.5, 89.0, 13, 14, 21, 21, 0),
  ('e1111111-1111-1111-1111-111111111111', 4, '2022-23', 8.1, 8.4, 85.5, 11, 13, 22, 22, 0),
  ('e1111111-1111-1111-1111-111111111111', 5, '2023-24', 8.6, 8.44, 90.5, 15, 15, 21, 21, 0),
  ('e1111111-1111-1111-1111-111111111111', 6, '2023-24', 8.7, 8.45, 92.3, 14, 14, 20, 20, 0),
  ('e3333333-3333-3333-3333-333333333333', 1, '2021-22', 7.1, 7.1, 72.0, 9, 12, 22, 20, 2),
  ('e3333333-3333-3333-3333-333333333333', 2, '2021-22', 6.9, 7.0, 68.5, 8, 14, 20, 18, 3),
  ('e3333333-3333-3333-3333-333333333333', 3, '2022-23', 6.5, 6.85, 65.0, 7, 14, 21, 19, 4),
  ('e3333333-3333-3333-3333-333333333333', 4, '2022-23', 6.8, 6.825, 70.5, 10, 13, 22, 21, 3),
  ('e3333333-3333-3333-3333-333333333333', 5, '2023-24', 7.0, 6.86, 75.0, 11, 15, 21, 21, 1),
  ('e3333333-3333-3333-3333-333333333333', 6, '2023-24', 6.8, 6.85, 69.0, 9, 14, 20, 19, 2),
  ('e5555555-5555-5555-5555-555555555555', 1, '2022-23', 6.1, 6.1, 61.0, 7, 12, 22, 20, 4),
  ('e5555555-5555-5555-5555-555555555555', 2, '2022-23', 5.8, 5.95, 58.5, 6, 14, 20, 17, 6),
  ('e5555555-5555-5555-5555-555555555555', 3, '2023-24', 5.5, 5.8, 55.0, 5, 14, 21, 18, 7),
  ('e5555555-5555-5555-5555-555555555555', 4, '2023-24', 6.0, 5.85, 60.0, 8, 13, 22, 20, 5);

