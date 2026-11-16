"""
Data utilities for ML preprocessing
Handles missing values, outliers, feature scaling
"""
import numpy as np
import pandas as pd
from typing import List, Dict, Tuple, Optional
import logging

logger = logging.getLogger(__name__)

def handle_missing_values(df: pd.DataFrame, strategy: str = 'smart') -> pd.DataFrame:
    """
    Handle missing values with multiple strategies:
    - 'median': fill numerical with median, categorical with mode
    - 'smart': use domain knowledge (e.g., 0 backlogs for missing)
    - 'interpolate': time-series interpolation
    """
    df = df.copy()
    
    numerical_cols = df.select_dtypes(include=[np.number]).columns
    categorical_cols = df.select_dtypes(include=['object', 'category']).columns
    
    if strategy == 'smart':
        # Domain-specific filling
        zero_fill_cols = ['backlogs', 'assignments_completed', 'assignments_total']
        median_fill_cols = ['sgpa', 'cgpa', 'attendance_pct', 'assignment_rate', 'credit_completion_rate']
        
        for col in zero_fill_cols:
            if col in df.columns:
                df[col].fillna(0, inplace=True)
        
        for col in median_fill_cols:
            if col in df.columns:
                df[col].fillna(df[col].median(), inplace=True)
        
        # Remaining numerical → median
        for col in numerical_cols:
            if df[col].isnull().any():
                df[col].fillna(df[col].median(), inplace=True)
    
    elif strategy == 'median':
        for col in numerical_cols:
            df[col].fillna(df[col].median(), inplace=True)
    
    elif strategy == 'interpolate':
        for col in numerical_cols:
            df[col] = df.groupby('student_id')[col].transform(
                lambda x: x.interpolate(method='linear', limit_direction='both')
            )
            df[col].fillna(df[col].median(), inplace=True)
    
    # Categorical → mode
    for col in categorical_cols:
        if df[col].isnull().any():
            df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else 'unknown', inplace=True)
    
    missing_after = df.isnull().sum().sum()
    if missing_after > 0:
        logger.warning(f"Still {missing_after} missing values after imputation")
    
    return df


def detect_and_handle_outliers(df: pd.DataFrame, method: str = 'iqr',
                                 cols: Optional[List[str]] = None) -> Tuple[pd.DataFrame, Dict]:
    """
    Detect and clip outliers
    Returns: cleaned df + outlier report
    """
    df = df.copy()
    report = {}
    
    target_cols = cols or ['sgpa', 'cgpa', 'attendance_pct', 'backlogs']
    target_cols = [c for c in target_cols if c in df.columns]
    
    for col in target_cols:
        if method == 'iqr':
            Q1 = df[col].quantile(0.25)
            Q3 = df[col].quantile(0.75)
            IQR = Q3 - Q1
            lower = Q1 - 1.5 * IQR
            upper = Q3 + 1.5 * IQR
        elif method == 'zscore':
            mean, std = df[col].mean(), df[col].std()
            lower = mean - 3 * std
            upper = mean + 3 * std
        
        # Apply domain constraints
        domain_bounds = {
            'sgpa': (0, 10), 'cgpa': (0, 10),
            'attendance_pct': (0, 100), 'backlogs': (0, 20)
        }
        if col in domain_bounds:
            lower = max(lower, domain_bounds[col][0])
            upper = min(upper, domain_bounds[col][1])
        
        outliers = df[(df[col] < lower) | (df[col] > upper)]
        report[col] = {
            'outlier_count': len(outliers),
            'lower_bound': lower,
            'upper_bound': upper
        }
        
        df[col] = df[col].clip(lower=lower, upper=upper)
    
    total_outliers = sum(r['outlier_count'] for r in report.values())
    logger.info(f"Outlier detection: {total_outliers} values clipped across {len(target_cols)} columns")
    return df, report


def engineer_time_series_features(df: pd.DataFrame, student_id_col: str = 'student_id',
                                    semester_col: str = 'semester') -> pd.DataFrame:
    """
    Engineer time-series features from semester data:
    - Rolling averages
    - Trend slopes
    - Lag features
    - Cumulative stats
    """
    df = df.copy().sort_values([student_id_col, semester_col])
    
    for col in ['sgpa', 'attendance_pct', 'assignment_rate', 'backlogs']:
        if col not in df.columns:
            continue
        
        grp = df.groupby(student_id_col)[col]
        
        # Lag features
        df[f'{col}_lag1'] = grp.shift(1)
        df[f'{col}_lag2'] = grp.shift(2)
        
        # Rolling mean (window=3)
        df[f'{col}_roll3'] = grp.transform(lambda x: x.rolling(3, min_periods=1).mean())
        
        # Trend (linear slope over last 3 semesters)
        def calc_slope(series):
            vals = series.dropna().values[-3:]
            if len(vals) >= 2:
                return float(np.polyfit(range(len(vals)), vals, 1)[0])
            return 0.0
        
        df[f'{col}_trend'] = grp.transform(lambda x: x.expanding().apply(calc_slope, raw=False))
        
        # Cumulative stats
        df[f'{col}_cummax'] = grp.cummax()
        df[f'{col}_cummin'] = grp.cummin()
    
    # Derived features
    if 'assignments_completed' in df.columns and 'assignments_total' in df.columns:
        df['assignment_rate'] = df['assignments_completed'] / df['assignments_total'].replace(0, 1)
    
    if 'credits_earned' in df.columns and 'credits_attempted' in df.columns:
        df['credit_completion_rate'] = df['credits_earned'] / df['credits_attempted'].replace(0, 1)
    
    df['performance_volatility'] = df.groupby(student_id_col)['sgpa'].transform(
        lambda x: x.rolling(4, min_periods=2).std().fillna(0)
    )
    
    # Fill NaN lag/roll columns with column medians
    for col in df.columns:
        if df[col].isnull().any():
            df[col].fillna(df[col].median() if df[col].dtype in [np.float64, np.int64] else 0, inplace=True)
    
    return df


def create_lstm_sequences(df: pd.DataFrame, feature_cols: List[str],
                           target_col: str, seq_len: int = 4,
                           student_id_col: str = 'student_id') -> Tuple[np.ndarray, np.ndarray]:
    """
    Create overlapping sequences for LSTM training
    Returns: (X_sequences, y_targets)
    """
    sequences, targets = [], []
    
    for student_id, group in df.groupby(student_id_col):
        group = group.sort_values('semester' if 'semester' in group.columns else group.columns[0])
        feat = group[feature_cols].values
        tgt = group[target_col].values
        
        if len(feat) < seq_len + 1:
            continue
        
        for i in range(len(feat) - seq_len):
            sequences.append(feat[i:i + seq_len])
            targets.append(tgt[i + seq_len])
    
    if not sequences:
        return np.array([]).reshape(0, seq_len, len(feature_cols)), np.array([])
    
    return np.array(sequences, dtype=np.float32), np.array(targets, dtype=np.float32)


def compute_class_weights(y: np.ndarray) -> Dict:
    """Compute class weights for imbalanced risk classification"""
    from sklearn.utils.class_weight import compute_class_weight
    classes = np.unique(y)
    weights = compute_class_weight('balanced', classes=classes, y=y)
    return dict(zip(classes.tolist(), weights.tolist()))


def validate_prediction_input(timeseries_data: List[Dict]) -> Tuple[bool, str]:
    """Validate input data for prediction pipeline"""
    if not timeseries_data:
        return False, "No time-series data provided"
    if len(timeseries_data) < 2:
        return False, "Need at least 2 semesters of data"
    
    required_fields = ['semester', 'sgpa', 'attendance_pct']
    for i, record in enumerate(timeseries_data):
        for field in required_fields:
            if field not in record:
                return False, f"Missing field '{field}' in record {i+1}"
        if not (0 <= float(record.get('sgpa', 0)) <= 10):
            return False, f"Invalid SGPA value {record['sgpa']} in record {i+1}"
        if not (0 <= float(record.get('attendance_pct', 0)) <= 100):
            return False, f"Invalid attendance {record['attendance_pct']} in record {i+1}"
    
    return True, "Valid"
