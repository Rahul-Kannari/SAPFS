# 🎓 Smart Academic Performance Forecasting System (SAPFS)

> **Final Year Project** | Computer Science Engineering | Batch 2021-2025
> 
> AI-powered academic analytics platform using Multi-Agent Stacking Ensemble (XGBoost, LightGBM, CatBoost, Random Forest, BiLSTM-Attention) with SHAP Explainability

[![Python](https://img.shields.io/badge/Python-3.11+-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.109-green)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.2-blue)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue)](https://postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-ready-blue)](https://docker.com)
[![ML Accuracy](https://img.shields.io/badge/ML_Accuracy-99.9%25-brightgreen)]()
[![R2 Score](https://img.shields.io/badge/R%C2%B2_Score-0.979-blue)]()

---

## 🚀 Quick Start

### Option 1: Docker (Recommended)
```bash
# Clone / navigate to project
cd deployment/docker

# Start all services
docker-compose up -d

# App runs at:
# Frontend: http://localhost:3000
# API Docs: http://localhost:8000/api/docs
# Database: localhost:5432
```

### Option 2: Local Development

**Backend:**
```bash
cd backend
python -m venv venv
.\venv\Scripts\activate          # Linux/macOS: source venv/bin/activate
pip install -r requirements.txt

#or

cd backend
.\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000

# Create .env file (copy .env.example)
cp .env.example .env

# Run migrations
psql -U sapfs_user -d sapfs_db -f ../database/migrations/001_initial_schema.sql
psql -U sapfs_user -d sapfs_db -f ../database/seeds/001_seed_data.sql

# Start backend
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm start         # runs on http://localhost:3000
```

**Machine Learning Service (Training & Testing):**
```bash
cd ml_service
pip install -r requirements.txt

# Train full ensemble (5 base models + meta-learner + BiLSTM):
python train_ensemble.py

# Run comprehensive test suite across fresh unseen data:
python test_models.py
```

---

## 📁 Project Structure

```
smart-academic-forecasting/
├── backend/
│   ├── app/
│   │   ├── api/endpoints/      # FastAPI route handlers
│   │   │   ├── auth.py         # JWT authentication
│   │   │   ├── students.py     # Student CRUD
│   │   │   ├── predictions.py  # ML predictions
│   │   │   └── dashboard.py    # Analytics
│   │   ├── core/
│   │   │   ├── config.py       # App settings (Pydantic)
│   │   │   ├── security.py     # JWT, password hashing
│   │   │   └── dependencies.py # Auth dependencies
│   │   ├── db/database.py      # AsyncPG connection
│   │   ├── models/models.py    # SQLAlchemy ORM models
│   │   ├── schemas/schemas.py  # Pydantic request/response
│   │   ├── ml/
│   │   │   └── pipelines/prediction_pipeline.py  # Inference pipeline
│   │   └── main.py             # FastAPI entrypoint
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx       # Multi-role login
│   │   │   ├── DashboardPage.jsx   # Main analytics dashboard
│   │   │   ├── StudentsPage.jsx    # Student management
│   │   │   ├── PredictionsPage.jsx # ML predictions + SHAP
│   │   │   └── AnalyticsPage.jsx   # Deep analytics
│   │   ├── components/shared/Layout.jsx  # App shell
│   │   ├── services/api.js     # Axios API client
│   │   └── store/authStore.js  # Zustand auth state
│   └── package.json
├── ml_service/
│   ├── agents/                 # 7 Autonomous ML Agents
│   │   ├── feature_engineering_agent.py  # Agent 1: 29 engineered features
│   │   ├── ensemble_prediction_agent.py  # Agent 2: Stacking Ensemble
│   │   ├── optimization_agent.py         # Agent 3: Optuna HPO
│   │   ├── risk_warning_agent.py         # Agent 4: 4-tier risk classification
│   │   ├── explainability_agent.py       # Agent 5: TreeSHAP / KernelSHAP
│   │   ├── intervention_agent.py         # Agent 6: Prescriptive recommendations
│   │   └── forecasting_agent.py          # Agent 7: BiLSTM-Attention trajectory
│   ├── models/                 # Serialized weights (*.pkl, *.keras, metrics.json)
│   ├── evaluation/             # Model evaluation & benchmark suite
│   ├── research/               # LaTeX / Markdown publication exporters
│   ├── agent_orchestrator.py   # Multi-agent central coordinator
│   ├── train_ensemble.py       # Automated end-to-end training pipeline
│   └── test_models.py          # Validation & evaluation test suite
├── database/
│   ├── migrations/001_initial_schema.sql  # Full database schema
│   └── seeds/001_seed_data.sql            # Seed dataset
├── docs/
│   ├── SRS.md                  # Software Requirements Specification
│   └── PROJECT_DOCUMENTATION.md # Complete technical documentation
└── deployment/
    ├── docker/docker-compose.yml
    └── nginx/nginx.conf
```

---

## 🤖 Machine Learning Architecture

The system utilizes an autonomous **7-Agent Stacking Ensemble Architecture** designed for high precision, temporal awareness, and full explainability:

```
                      Student Academic & Behavioral Data
                                       │
                                       ▼
                     ┌───────────────────────────────────┐
                     │ Agent 1: Feature Engineering Agent│
                     │ ───────────────────────────────── │
                     │ • 29 Engineered Indicators        │
                     │ • Momentum, Habit, Course Ratios  │
                     └─────────────────┬─────────────────┘
                                       │
             ┌─────────────────────────┼─────────────────────────┐
             │                         │                         │
             ▼                         ▼                         ▼
      ┌──────────────┐          ┌──────────────┐          ┌──────────────┐
      │   XGBoost    │          │   LightGBM   │          │   CatBoost   │
      │  R² = 0.979  │          │  R² = 0.979  │          │  R² = 0.979  │
      └──────┬───────┘          └──────┬───────┘          └──────┬───────┘
             │                         │                         │
             │           ┌─────────────┴─────────────┐           │
             │           ▼                           ▼           │
             │    ┌──────────────┐            ┌──────────────┐   │
             │    │Random Forest │            │BiLSTM-Attn   │   │
             │    │  R² = 0.979  │            │  R² = 0.926  │   │
             │    └──────┬───────┘            └──────┬───────┘   │
             │           │                           │           │
             └───────────┼───────────────────────────┼───────────┘
                         │                           │
                         ▼                           ▼
            ┌──────────────────────────┐    ┌──────────────────────────┐
            │ Agent 2: Meta-Learner    │    │ Agent 7: BiLSTM Forecast │
            │ Ridge Stacking Ensemble  │    │ 4-Semester Trajectory    │
            │ R² = 0.9792, MAE = 0.116 │    │ Future Trend Projection  │
            └────────────┬─────────────┘    └────────────┬─────────────┘
                         │                               │
             ┌───────────┴───────────────────────────────┴───────────┐
             │                                                       │
             ▼                                                       ▼
┌──────────────────────────┐                               ┌──────────────────────────┐
│ Agent 4: Risk Detection  │                               │ Agent 5: Explainability  │
│ Safe / Moderate / High / │                               │ SHAP Local & Global      │
│ Critical Classifications │                               │ Feature Attribution      │
└────────────┬─────────────┘                               └─────────────┬────────────┘
             │                                                           │
             └───────────────────────────┬───────────────────────────────┘
                                         ▼
                           ┌──────────────────────────┐
                           │ Agent 6: Intervention Plan│
                           │ Tailored Student & HOD   │
                           │ Corrective Action Steps  │
                           └──────────────────────────┘
```

---

## 📈 Performance Metrics

### 1. Regression Metrics (SGPA Prediction)
*Measured on project validation and test sets:*

| Model | MAE | RMSE | R² Score | Accuracy (±1.0 SGPA) | MAPE |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **XGBoost Regressor** | 0.1167 | 0.1479 | 0.9789 | **99.89%** | 2.20% |
| **LightGBM Regressor** | 0.1168 | 0.1475 | 0.9790 | **99.93%** | 2.21% |
| **CatBoost Regressor** | 0.1177 | 0.1488 | 0.9787 | **99.93%** | 2.23% |
| **Random Forest** | 0.1169 | 0.1483 | 0.9788 | **99.93%** | 2.21% |
| 🏆 **Stacking Ensemble (Meta-Ridge)** | **0.1161** | **0.1471** | **0.9792** | **99.93%** | **2.18%** |
| 🧠 **BiLSTM with Attention** | **0.2321** | 0.2785 | **0.9257** | **100.0%** | 3.80% |

### 2. Classification Metrics (Pass ≥ 6.0 vs. At-Risk < 6.0)

| Model Architecture | Precision | Recall | Specificity | F1 Score | ROC-AUC |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **XGBoost** | 95.79% | 93.20% | 97.97% | 94.48% | 0.9946 |
| **LightGBM** | 95.57% | 93.10% | 97.86% | 94.32% | 0.9944 |
| **CatBoost** | 95.32% | 92.23% | 97.76% | 93.75% | 0.9945 |
| **Random Forest** | 95.67% | 92.99% | 97.92% | 94.31% | 0.9947 |
| 🏆 **Stacking Ensemble** | **95.84%** | **93.30%** | **98.01%** | **94.55%** | **0.9948** |

---

## 🔑 Demo Credentials

| Role | Email | Password | Student Details (from Dataset) |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@sapfs.edu` | `Admin@123` | Institutional Administrator |
| **Faculty** | `dr.sharma@sapfs.edu` | `Faculty@123` | Dr. Sharma (CSE Faculty Advisor) |
| **Student (Primary)** | `ananya.gupta@student.sapfs.edu` | `Student@123` | **Student ID: 1 (Ananya Gupta)** · CGPA: 2.45 · Att: 91.3% |
| **Student (Alt 1)** | `rohan.kumar@student.sapfs.edu` | `Student@123` | **Student ID: 2 (Rohan Kumar)** · CGPA: 3.03 · Att: 96.2% |
| **Student (Alt 2)** | `aditya.chowdhury@student.sapfs.edu` | `Student@123` | **Student ID: 4 (Aditya Chowdhury)** · CGPA: 1.15 · Att: 51.7% |

---

## 📊 Key Features

- **99.9% Prediction Accuracy** — Stacking ensemble combining Gradient Boosting, Random Forests, and BiLSTM
- **Multi-Agent Orchestration** — 7 autonomous agents managing ingestion, tuning, prediction, risk, and explainability
- **SHAP Explainability** — Every GPA forecast provides localized feature impact breakdown
- **4-Level Risk Warning System** — Early alerts categorized into Low, Moderate, High, and Critical
- **Trajectory Forecasting** — Future semester trajectory projection across Semesters 1 to 8
- **Role-Based Access** — Tailored portals for Administrators, Faculty Advisors, and Students
- **Real-Time Analytics & PDF Reporting** — Instant dashboards and exportable academic performance evaluations

---

## 🏗️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Recharts, Tailwind CSS, Zustand, Lucide Icons |
| **Backend** | FastAPI, SQLAlchemy, Pydantic, AsyncPG |
| **Machine Learning** | XGBoost, LightGBM, CatBoost, Scikit-learn, TensorFlow/Keras, SHAP, Optuna |
| **Database** | PostgreSQL 16, Redis |
| **Deployment** | Docker, Nginx, Uvicorn |
| **Authentication** | JWT (RS256/HS256), bcrypt |

---

## 📚 Documentation

| Document | Location |
| :--- | :--- |
| Software Requirements Specification (SRS) | [`docs/SRS.md`](docs/SRS.md) |
| Technical Documentation (ER, DFD, UML, Architecture) | [`docs/PROJECT_DOCUMENTATION.md`](docs/PROJECT_DOCUMENTATION.md) |
| Interactive API Reference | `http://localhost:8000/api/docs` |

---

*Final Year Project — Smart Academic Performance Forecasting System (SAPFS) — Batch 2021-2025*
