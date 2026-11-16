# Software Requirements Specification (SRS)
## Smart Academic Performance Forecasting System (SAPFS)
**Version:** 1.0 | **Date:** 2025 | **Dept:** Computer Science Engineering

---

## 1. Introduction

### 1.1 Purpose
SAPFS is an AI-powered web application that forecasts student academic performance using time-series analysis, XGBoost, and LSTM neural networks, providing early warning systems for at-risk students.

### 1.2 Scope
The system covers student lifecycle management, academic records, attendance tracking, assignment management, ML-based performance prediction, risk assessment, and automated recommendations for 3 stakeholder groups: Administrators, Faculty, and Students.

### 1.3 Definitions
- **CGPA**: Cumulative Grade Point Average (scale: 0–10)
- **SGPA**: Semester Grade Point Average
- **XGBoost**: eXtreme Gradient Boosting (ML algorithm)
- **LSTM**: Long Short-Term Memory (deep learning architecture)
- **SHAP**: SHapley Additive exPlanations (explainable AI)
- **Risk Level**: Student classification (Low / Medium / High / Critical)

---

## 2. Overall Description

### 2.1 Product Perspective
SAPFS is a three-tier web application:
- **Presentation Layer**: React.js (SPA)
- **Business Logic Layer**: FastAPI (Python)
- **Data Layer**: PostgreSQL + Redis

### 2.2 User Classes
| User | Permissions |
|------|------------|
| Admin | Full CRUD, reports, system config, all analytics |
| Faculty | Course management, grade entry, attendance marking, dept analytics |
| Student | View own records, predictions, recommendations |

### 2.3 Operating Environment
- **Frontend**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **Backend**: Ubuntu 22.04 LTS, Python 3.11+
- **Database**: PostgreSQL 16+
- **Deployment**: Docker containers, optionally AWS/GCP

---

## 3. Specific Requirements

### 3.1 Functional Requirements

#### FR-01: Authentication & Authorization
- FR-01.1: System shall support JWT-based authentication
- FR-01.2: System shall enforce role-based access control (RBAC)
- FR-01.3: Tokens shall expire after 60 minutes (refresh: 7 days)
- FR-01.4: Failed logins shall be rate-limited (5 attempts/15min)

#### FR-02: Student Management
- FR-02.1: Create, read, update, delete student profiles
- FR-02.2: Auto-generate unique student IDs (DEPT+YEAR+SEQ)
- FR-02.3: Associate students with departments and courses
- FR-02.4: Track student risk level automatically

#### FR-03: Academic Records
- FR-03.1: Record internal (40%) and external (60%) marks
- FR-03.2: Auto-calculate grade (O/A+/A/B+/B/C/F) and grade points
- FR-03.3: Compute CGPA from all completed semesters
- FR-03.4: Track credit completion and backlogs

#### FR-04: Attendance Management
- FR-04.1: Mark attendance at course-hour level
- FR-04.2: Bulk attendance marking for entire class
- FR-04.3: Calculate attendance percentage per student per course
- FR-04.4: Alert when attendance drops below 75%

#### FR-05: ML Prediction Engine
- FR-05.1: Predict next-semester GPA (MAE < 0.5)
- FR-05.2: Classify student risk level (4 categories)
- FR-05.3: Generate confidence score for each prediction
- FR-05.4: Provide SHAP feature importance explanations
- FR-05.5: Support batch prediction for all students
- FR-05.6: Store prediction history for audit

#### FR-06: Recommendations
- FR-06.1: Generate personalized study recommendations
- FR-06.2: Identify weak subjects automatically
- FR-06.3: Suggest attendance improvement strategies
- FR-06.4: Recommend assignment completion tactics

#### FR-07: Dashboard & Analytics
- FR-07.1: Real-time statistics with 30-second refresh
- FR-07.2: Interactive charts (line, bar, pie, scatter, radar)
- FR-07.3: Risk heatmap by department
- FR-07.4: Attendance trend visualization

#### FR-08: Reports
- FR-08.1: Generate PDF student report cards
- FR-08.2: Department-level analytics reports
- FR-08.3: Faculty performance reports

#### FR-09: Notifications
- FR-09.1: Email alerts for risk-level changes
- FR-09.2: Attendance drop alerts (< 75%)
- FR-09.3: Assignment deadline reminders
- FR-09.4: In-app notification center

### 3.2 Non-Functional Requirements

| ID | Requirement | Metric |
|----|-------------|--------|
| NFR-01 | Performance | API response < 500ms (95th percentile) |
| NFR-02 | ML Accuracy | Prediction accuracy ≥ 92% |
| NFR-03 | Availability | 99.5% uptime |
| NFR-04 | Scalability | Support 10,000 concurrent users |
| NFR-05 | Security | OWASP Top-10 compliance |
| NFR-06 | Usability | Mobile-responsive, WCAG 2.1 AA |
| NFR-07 | Data Privacy | FERPA-compliant data handling |

---

## 4. External Interface Requirements

### 4.1 API Endpoints (Key)
```
POST   /api/v1/auth/login
GET    /api/v1/students
POST   /api/v1/students
PUT    /api/v1/students/{id}
DELETE /api/v1/students/{id}
GET    /api/v1/students/{id}/attendance-summary
POST   /api/v1/predictions/predict
GET    /api/v1/predictions/student/{id}
GET    /api/v1/predictions/risk-report
GET    /api/v1/dashboard/stats
GET    /api/v1/dashboard/performance-trends
GET    /api/v1/dashboard/risk-heatmap
POST   /api/v1/attendance/bulk
GET    /api/v1/analytics/correlation
POST   /api/v1/reports/generate
```

### 4.2 Database Interface
PostgreSQL 16+ with AsyncPG driver. Schema normalized to 3NF with 15+ tables including audit triggers and materialized views.

---

## 5. Appendices

### 5.1 Grading Scale
| Grade | Marks Range | Grade Points |
|-------|-------------|--------------|
| O (Outstanding) | 91-100 | 10 |
| A+ (Excellent) | 81-90 | 9 |
| A (Very Good) | 71-80 | 8 |
| B+ (Good) | 61-70 | 7 |
| B (Average) | 51-60 | 6 |
| C (Pass) | 41-50 | 5 |
| F (Fail) | < 40 | 0 |
