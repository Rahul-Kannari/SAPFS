"""Test suite for SAPFS Prediction Engine"""
import pytest
import asyncio
import numpy as np

# ─── Unit tests for ML Pipeline ─────────────────────────────

def test_feature_engineering_basic():
    """Test feature engineering with minimal data"""
    from app.ml.pipelines.prediction_pipeline import PredictionPipeline
    pipeline = PredictionPipeline()
    
    ts_data = [
        {'semester':1,'sgpa':7.5,'cgpa':7.5,'attendance_pct':82,'assignments_total':12,'assignments_completed':10,'credits_attempted':20,'credits_earned':20,'backlogs':0},
        {'semester':2,'sgpa':8.0,'cgpa':7.75,'attendance_pct':85,'assignments_total':14,'assignments_completed':12,'credits_attempted':20,'credits_earned':20,'backlogs':0},
    ]
    student_features = {'cgpa':7.75,'current_semester':3,'batch_year':2022}
    
    features = pipeline._engineer_features(ts_data, student_features)
    
    assert 'cgpa' in features
    assert 'avg_sgpa_last2' in features
    assert 'attendance_trend' in features
    assert 'assignment_rate' in features
    assert float(features['cgpa']) == 7.75

@pytest.mark.asyncio
async def test_rule_based_prediction_high_risk():
    """Test that poor academic data yields high/critical risk"""
    from app.ml.pipelines.prediction_pipeline import PredictionPipeline
    pipeline = PredictionPipeline()
    
    student_features = {'cgpa': 5.0, 'current_semester': 4}
    ts_data = [{'attendance_pct': 55.0, 'backlogs': 5, 'sgpa': 5.0, 'assignments_total': 10, 'assignments_completed': 4}]
    result = await pipeline.predict("test_student", ts_data, student_features)
    assert result['risk_level'] in ['high', 'critical']
    assert result['predicted_gpa'] < 7.0

@pytest.mark.asyncio
async def test_rule_based_prediction_low_risk():
    """Test that strong academic data yields low risk"""
    from app.ml.pipelines.prediction_pipeline import PredictionPipeline
    pipeline = PredictionPipeline()
    
    student_features = {'cgpa': 9.0, 'current_semester': 4}
    ts_data = [{'attendance_pct': 92.0, 'backlogs': 0, 'sgpa': 9.2, 'assignments_total': 10, 'assignments_completed': 9}]
    result = await pipeline.predict("test_student", ts_data, student_features)
    assert result['risk_level'] == 'low'
    assert result['predicted_gpa'] >= 8.0

def test_shap_values_generated():
    """Test that SHAP values are returned as dict"""
    from app.ml.pipelines.prediction_pipeline import PredictionPipeline
    pipeline = PredictionPipeline()
    
    features = {'cgpa':7.5,'last_attendance':80,'assignment_rate':0.8,'performance_momentum':0.1,'backlog_count':0,'credit_completion_rate':0.9}
    shap = pipeline._generate_shap_values(features)
    
    assert isinstance(shap, dict)
    assert len(shap) > 0
    assert all(isinstance(v, float) for v in shap.values())

def test_recommendations_generated():
    """Test recommendations for different risk levels"""
    from app.ml.pipelines.prediction_pipeline import PredictionPipeline
    pipeline = PredictionPipeline()
    
    for risk, att, gpa in [('high',55,5.5),('medium',72,6.8),('low',88,8.5)]:
        features = {'last_attendance':att,'assignment_rate':0.7,'backlog_count':2 if risk=='high' else 0,'cgpa':gpa}
        recs = pipeline._generate_recommendations(features, risk, gpa)
        
        assert isinstance(recs, dict)
        assert 'study_tips' in recs
        assert 'attendance' in recs
        if att < 75:
            assert len(recs['attendance']) > 0

@pytest.mark.asyncio
async def test_gpa_clipped_to_valid_range():
    """Predicted GPA must be in [0, 10]"""
    from app.ml.pipelines.prediction_pipeline import PredictionPipeline
    pipeline = PredictionPipeline()
    
    # Extreme features
    for cgpa in [0.0, 5.0, 10.0]:
        student_features = {'cgpa': cgpa, 'current_semester': 4}
        result = await pipeline.predict("test_student", [], student_features)
        assert 0.0 <= result['predicted_gpa'] <= 10.0

@pytest.mark.asyncio
async def test_predict_pipeline_end_to_end():
    """Integration test: full prediction pipeline"""
    from app.ml.pipelines.prediction_pipeline import PredictionPipeline
    pipeline = PredictionPipeline()
    
    ts_data = [
        {'semester':s,'sgpa':7.0+s*0.2,'cgpa':7.0+s*0.15,'attendance_pct':78+s,'assignments_total':12,'assignments_completed':10,'credits_attempted':20,'credits_earned':20,'backlogs':0}
        for s in range(1, 5)
    ]
    student_features = {'cgpa':7.8,'current_semester':5,'batch_year':2021}
    
    result = await pipeline.predict('test-student', ts_data, student_features, 'comprehensive')
    
    assert 'predicted_gpa' in result
    assert 'risk_level' in result
    assert 'confidence' in result
    assert 'recommendations' in result
    assert 'shap_values' in result
    assert 0 <= result['predicted_gpa'] <= 10
    assert result['risk_level'] in ['low','medium','high','critical']
    assert 0 <= result['confidence'] <= 1
