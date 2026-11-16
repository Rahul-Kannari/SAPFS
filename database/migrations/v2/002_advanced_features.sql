-- ============================================================
-- SAPFS v2: Advanced Feature Engineering Schema
-- Adds academic, behavioral, and engagement feature tables
-- ============================================================

-- ── Academic Features ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_academic_features (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    semester_number INTEGER NOT NULL,
    academic_year   VARCHAR(10) NOT NULL,
    -- Core academic
    prev_sgpa           DECIMAL(4,2),
    prev_cgpa           DECIMAL(4,2),
    backlog_count       INTEGER DEFAULT 0,
    -- Assessment breakdowns
    avg_assignment_score    DECIMAL(5,2),
    avg_internal_marks      DECIMAL(5,2),
    avg_lab_score           DECIMAL(5,2),
    avg_quiz_score          DECIMAL(5,2),
    -- Subject-wise JSON: {"CSE301": 78, "CSE302": 82, ...}
    subject_scores      JSONB DEFAULT '{}',
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, semester_number, academic_year)
);

-- ── Behavioral Features ────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_behavioral_features (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    semester_number INTEGER NOT NULL,
    academic_year   VARCHAR(10) NOT NULL,
    lms_login_frequency         INTEGER DEFAULT 0,   -- logins per week
    daily_learning_time_mins    INTEGER DEFAULT 0,   -- minutes/day
    assignment_submission_delay DECIMAL(5,2) DEFAULT 0, -- avg days late
    online_course_completion_pct DECIMAL(5,2) DEFAULT 0,
    study_hours_per_week        DECIMAL(5,2) DEFAULT 0,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, semester_number, academic_year)
);

-- ── Engagement Features ────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_engagement_features (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    semester_number INTEGER NOT NULL,
    academic_year   VARCHAR(10) NOT NULL,
    club_participation          INTEGER DEFAULT 0,   -- count
    hackathon_count             INTEGER DEFAULT 0,
    sports_activities           INTEGER DEFAULT 0,
    workshop_attendance         INTEGER DEFAULT 0,
    technical_event_count       INTEGER DEFAULT 0,
    engagement_score            DECIMAL(5,2),        -- computed composite
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, semester_number, academic_year)
);

-- ── Ensemble Model Results ─────────────────────────────────
CREATE TABLE IF NOT EXISTS ensemble_predictions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    semester_number INTEGER NOT NULL,
    -- Base model predictions
    xgb_pred        DECIMAL(4,2),
    lgbm_pred       DECIMAL(4,2),
    catboost_pred   DECIMAL(4,2),
    rf_pred         DECIMAL(4,2),
    bilstm_pred     DECIMAL(4,2),
    -- Meta-learner output
    stacked_pred    DECIMAL(4,2),
    confidence_score DECIMAL(5,4),
    -- Risk
    risk_probability DECIMAL(5,4),
    risk_level      VARCHAR(20),   -- safe/moderate/high/critical
    -- Explainability JSON
    shap_values         JSONB,
    feature_importance  JSONB,
    positive_factors    JSONB,
    negative_factors    JSONB,
    -- Recommendations JSON array
    recommendations JSONB,
    model_version   VARCHAR(20) DEFAULT 'v2.0',
    predicted_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, semester_number)
);

-- ── Early Warning Alerts ───────────────────────────────────
CREATE TABLE IF NOT EXISTS early_warning_alerts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    alert_type      VARCHAR(30) NOT NULL, -- student/faculty/parent
    risk_level      VARCHAR(20) NOT NULL,
    risk_probability DECIMAL(5,4),
    message         TEXT NOT NULL,
    key_factors     JSONB,
    is_resolved     BOOLEAN DEFAULT FALSE,
    resolved_at     TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Model Evaluation Results ───────────────────────────────
CREATE TABLE IF NOT EXISTS model_evaluation_results (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    model_name      VARCHAR(50) NOT NULL,
    model_version   VARCHAR(20) NOT NULL,
    eval_type       VARCHAR(30) NOT NULL, -- regression/classification
    accuracy        DECIMAL(6,4),
    precision_score DECIMAL(6,4),
    recall_score    DECIMAL(6,4),
    specificity     DECIMAL(6,4),
    f1_score        DECIMAL(6,4),
    roc_auc         DECIMAL(6,4),
    mae             DECIMAL(8,4),
    rmse            DECIMAL(8,4),
    r2_score        DECIMAL(6,4),
    confusion_matrix    JSONB,
    classification_report JSONB,
    hyperparameters     JSONB,
    training_samples    INTEGER,
    evaluated_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Semester Forecasts ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS semester_forecasts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    forecast_from   INTEGER NOT NULL,   -- source semester
    forecast_to     INTEGER NOT NULL,   -- target semester
    predicted_sgpa  DECIMAL(4,2),
    predicted_cgpa  DECIMAL(4,2),
    confidence      DECIMAL(5,4),
    forecast_data   JSONB,              -- full trajectory JSON
    model_used      VARCHAR(50) DEFAULT 'BiLSTM-Attention',
    forecasted_at   TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Agent Execution Log ────────────────────────────────────
CREATE TABLE IF NOT EXISTS agent_execution_log (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id      UUID REFERENCES students(id),
    agent_name      VARCHAR(50) NOT NULL,
    status          VARCHAR(20) NOT NULL, -- running/completed/failed
    input_summary   JSONB,
    output_summary  JSONB,
    duration_ms     INTEGER,
    error_message   TEXT,
    executed_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ── Indexes ────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_academic_feat_student   ON student_academic_features(student_id);
CREATE INDEX IF NOT EXISTS idx_behavioral_feat_student ON student_behavioral_features(student_id);
CREATE INDEX IF NOT EXISTS idx_engagement_feat_student ON student_engagement_features(student_id);
CREATE INDEX IF NOT EXISTS idx_ensemble_pred_student   ON ensemble_predictions(student_id);
CREATE INDEX IF NOT EXISTS idx_alerts_student          ON early_warning_alerts(student_id, is_resolved);
CREATE INDEX IF NOT EXISTS idx_agent_log_student       ON agent_execution_log(student_id);

-- ── Triggers: updated_at ───────────────────────────────────
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'student_academic_features','student_behavioral_features','student_engagement_features'
  ] LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%s_upd BEFORE UPDATE ON %s FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      t, t
    );
  END LOOP;
END $$;

-- ── Seed: synthetic enhancement data ──────────────────────
INSERT INTO student_academic_features
    (student_id, semester_number, academic_year, prev_sgpa, prev_cgpa,
     backlog_count, avg_assignment_score, avg_internal_marks,
     avg_lab_score, avg_quiz_score)
SELECT
    s.id, 7, '2024-25',
    ROUND((CAST(s.cgpa AS DECIMAL) + 0.1)::numeric, 2),
    CAST(s.cgpa AS DECIMAL),
    CASE WHEN s.risk_level = 'high' THEN 3
         WHEN s.risk_level = 'medium' THEN 1 ELSE 0 END,
    ROUND((65 + RANDOM()*30)::numeric, 2),
    ROUND((60 + RANDOM()*35)::numeric, 2),
    ROUND((70 + RANDOM()*25)::numeric, 2),
    ROUND((55 + RANDOM()*40)::numeric, 2)
FROM students s
ON CONFLICT (student_id, semester_number, academic_year) DO NOTHING;

INSERT INTO student_behavioral_features
    (student_id, semester_number, academic_year,
     lms_login_frequency, daily_learning_time_mins,
     assignment_submission_delay, online_course_completion_pct,
     study_hours_per_week)
SELECT
    s.id, 7, '2024-25',
    FLOOR(5 + RANDOM()*20)::int,
    FLOOR(45 + RANDOM()*120)::int,
    ROUND((RANDOM()*3)::numeric, 2),
    ROUND((50 + RANDOM()*50)::numeric, 2),
    ROUND((10 + RANDOM()*30)::numeric, 2)
FROM students s
ON CONFLICT (student_id, semester_number, academic_year) DO NOTHING;

INSERT INTO student_engagement_features
    (student_id, semester_number, academic_year,
     club_participation, hackathon_count, sports_activities,
     workshop_attendance, technical_event_count)
SELECT
    s.id, 7, '2024-25',
    FLOOR(RANDOM()*3)::int, FLOOR(RANDOM()*4)::int,
    FLOOR(RANDOM()*3)::int, FLOOR(RANDOM()*5)::int,
    FLOOR(RANDOM()*6)::int
FROM students s
ON CONFLICT (student_id, semester_number, academic_year) DO NOTHING;
