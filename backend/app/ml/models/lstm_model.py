"""
LSTM Time-Series Model for Academic Performance Forecasting
Architecture: 2-layer LSTM with Batch Normalization and Dropout
Input: 4-semester rolling window of student features
Output: Next semester SGPA prediction
"""
import numpy as np
import logging
from typing import Tuple, Optional, Dict

logger = logging.getLogger(__name__)

class LSTMConfig:
    SEQ_LEN = 4
    HIDDEN_SIZE_1 = 128
    HIDDEN_SIZE_2 = 64
    DROPOUT = 0.3
    LEARNING_RATE = 0.001
    BATCH_SIZE = 64
    EPOCHS = 100
    PATIENCE = 15

def build_lstm_model(seq_len: int, n_features: int):
    """Build LSTM model architecture"""
    try:
        import tensorflow as tf
        from tensorflow.keras.models import Sequential
        from tensorflow.keras.layers import LSTM, Dense, Dropout, BatchNormalization, Bidirectional
        from tensorflow.keras.optimizers import Adam
        from tensorflow.keras.regularizers import l2

        model = Sequential([
            Bidirectional(LSTM(LSTMConfig.HIDDEN_SIZE_1, return_sequences=True,
                              kernel_regularizer=l2(1e-4)),
                         input_shape=(seq_len, n_features)),
            BatchNormalization(),
            Dropout(LSTMConfig.DROPOUT),

            LSTM(LSTMConfig.HIDDEN_SIZE_2, return_sequences=False,
                 kernel_regularizer=l2(1e-4)),
            BatchNormalization(),
            Dropout(0.2),

            Dense(32, activation='relu', kernel_regularizer=l2(1e-4)),
            Dense(16, activation='relu'),
            Dense(1, activation='linear')
        ])

        model.compile(
            optimizer=Adam(LSTMConfig.LEARNING_RATE),
            loss='huber',
            metrics=['mae', 'mse']
        )
        return model

    except ImportError:
        logger.warning("TensorFlow not available — LSTM model cannot be built")
        return None


def train_lstm(X_train: np.ndarray, y_train: np.ndarray,
               X_val: np.ndarray, y_val: np.ndarray) -> Tuple[Optional[object], Dict]:
    """Train LSTM model with early stopping"""
    model = build_lstm_model(X_train.shape[1], X_train.shape[2])
    if model is None:
        return None, {}

    try:
        from tensorflow.keras.callbacks import EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
        import tempfile, os

        callbacks = [
            EarlyStopping(patience=LSTMConfig.PATIENCE, restore_best_weights=True,
                         monitor='val_mae', mode='min'),
            ReduceLROnPlateau(factor=0.5, patience=8, min_lr=1e-6, monitor='val_loss'),
        ]

        history = model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=LSTMConfig.EPOCHS,
            batch_size=LSTMConfig.BATCH_SIZE,
            callbacks=callbacks,
            verbose=0
        )

        from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
        y_pred = model.predict(X_val, verbose=0).flatten()
        mae = mean_absolute_error(y_val, y_pred)
        rmse = np.sqrt(mean_squared_error(y_val, y_pred))
        r2 = r2_score(y_val, y_pred)
        accuracy = np.mean(np.abs(y_pred - y_val) < 0.5)

        metrics = {
            'mae': float(mae), 'rmse': float(rmse),
            'r2': float(r2), 'accuracy': float(accuracy),
            'epochs_trained': len(history.history['loss']),
            'best_val_mae': float(min(history.history.get('val_mae', [mae])))
        }

        logger.info(f"LSTM trained: MAE={mae:.4f}, R²={r2:.4f}, Accuracy={accuracy*100:.2f}%")
        return model, metrics

    except Exception as e:
        logger.error(f"LSTM training failed: {e}")
        return None, {}


def predict_sequence(model, sequence: np.ndarray, scaler=None) -> Tuple[float, float]:
    """
    Predict next semester GPA from input sequence
    Returns: (predicted_gpa, uncertainty)
    """
    if model is None:
        return 0.0, 1.0

    try:
        seq = sequence.reshape(1, sequence.shape[0], sequence.shape[1]).astype(np.float32)

        # Monte Carlo Dropout for uncertainty estimation
        predictions = []
        for _ in range(20):
            pred = float(model(seq, training=True).numpy()[0][0])
            predictions.append(pred)

        mean_pred = np.mean(predictions)
        uncertainty = np.std(predictions)

        if scaler is not None:
            mean_pred = float(scaler.inverse_transform([[mean_pred]])[0][0])

        return float(np.clip(mean_pred, 0, 10)), float(uncertainty)

    except Exception as e:
        logger.error(f"LSTM prediction failed: {e}")
        return 0.0, 1.0
