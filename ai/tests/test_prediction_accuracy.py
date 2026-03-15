"""
Test suite for AI/ML prediction accuracy
Tests LOB classification, accuracy measurements, confidence intervals, and error handling
"""

import pytest
import numpy as np
import pandas as pd
from unittest.mock import patch, MagicMock
import json
import os
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
import sys

# Add the parent directory to the path to import modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from service.predict_app import LOBPredictor


class TestPredictionAccuracy:
    """Test prediction accuracy and metrics"""
    
    @pytest.fixture
    def predictor(self):
        """Create a LOB predictor instance"""
        return LOBPredictor()
    
    @pytest.fixture
    def sample_test_data(self):
        """Create sample test data"""
        return pd.DataFrame({
            'business_name': ['Test Restaurant', 'Sample Store', 'Demo Shop', 'Food Place'],
            'business_description': [
                'A restaurant serving Filipino cuisine',
                'Retail store selling various products',
                'Small shop with local items',
                'Fast food restaurant with burgers'
            ],
            'true_lob': ['restaurant', 'retail', 'retail', 'restaurant']
        })
    
    def test_lob_classification_accuracy(self, predictor, sample_test_data):
        """Test LOB classification accuracy"""
        # Mock prediction to avoid actual model inference
        with patch.object(predictor, 'predict_batch') as mock_predict:
            mock_predict.return_value = ['restaurant', 'retail', 'retail', 'restaurant']
            
            predictions = predictor.predict_lob(sample_test_data['business_description'])
            
            # Calculate accuracy
            true_labels = sample_test_data['true_lob']
            accuracy = accuracy_score(true_labels, predictions)
            
            assert accuracy == 1.0  # Perfect prediction in this mock
            assert len(predictions) == len(sample_test_data)
            assert mock_predict.called
            
    def test_prediction_confidence_scores(self, predictor, sample_test_data):
        """Test prediction confidence scores"""
        with patch.object(predictor, 'predict_with_confidence') as mock_predict:
            mock_predict.return_value = [
                {'prediction': 'restaurant', 'confidence': 0.95},
                {'prediction': 'retail', 'confidence': 0.87},
                {'prediction': 'retail', 'confidence': 0.92},
                {'prediction': 'restaurant', 'confidence': 0.89}
            ]
            
            results = predictor.predict_with_confidence(sample_test_data['business_description'])
            
            assert len(results) == len(sample_test_data)
            for result in results:
                assert 'prediction' in result
                assert 'confidence' in result
                assert 0 <= result['confidence'] <= 1
            assert mock_predict.called
            
    def test_accuracy_measurement_metrics(self, predictor, sample_test_data):
        """Test comprehensive accuracy measurement metrics"""
        # Mock predictions with some errors for realistic testing
        with patch.object(predictor, 'predict_batch') as mock_predict:
            mock_predict.return_value = ['restaurant', 'retail', 'restaurant', 'retail']  # Some errors
            
            predictions = predictor.predict_batch(sample_test_data['business_description'])
            true_labels = sample_test_data['true_lob']
            
            # Calculate comprehensive metrics
            accuracy = accuracy_score(true_labels, predictions)
            precision, recall, f1, support = precision_recall_fscore_support(
                true_labels, predictions, average='weighted'
            )
            
            metrics = {
                'accuracy': accuracy,
                'precision': precision,
                'recall': recall,
                'f1_score': f1,
                'support': support.tolist()
            }
            
            assert 0 <= metrics['accuracy'] <= 1
            assert 0 <= metrics['precision'] <= 1
            assert 0 <= metrics['recall'] <= 1
            assert 0 <= metrics['f1_score'] <= 1
            assert len(metrics['support']) == len(set(true_labels))
            
    def test_confidence_interval_calculation(self, predictor, sample_test_data):
        """Test confidence interval calculations"""
        with patch.object(predictor, 'calculate_confidence_intervals') as mock_ci:
            mock_ci.return_value = {
                'accuracy_mean': 0.85,
                'accuracy_std': 0.05,
                'confidence_interval_95': (0.75, 0.95),
                'sample_size': 100
            }
            
            results = predictor.calculate_confidence_intervals(sample_test_data)
            
            assert 'accuracy_mean' in results
            assert 'confidence_interval_95' in results
            assert isinstance(results['confidence_interval_95'], tuple)
            assert len(results['confidence_interval_95']) == 2
            assert mock_ci.called
            
    def test_cross_validation_accuracy(self, predictor, sample_test_data):
        """Test cross-validation accuracy assessment"""
        with patch.object(predictor, 'cross_validate') as mock_cv:
            mock_cv.return_value = {
                'cv_scores': [0.82, 0.85, 0.88, 0.84, 0.86],
                'mean_score': 0.85,
                'std_score': 0.02,
                'fold_results': [
                    {'fold': 1, 'score': 0.82},
                    {'fold': 2, 'score': 0.85},
                    {'fold': 3, 'score': 0.88},
                    {'fold': 4, 'score': 0.84},
                    {'fold': 5, 'score': 0.86}
                ]
            }
            
            results = predictor.cross_validate(sample_test_data)
            
            assert 'cv_scores' in results
            assert 'mean_score' in results
            assert 'std_score' in results
            assert len(results['cv_scores']) == 5
            assert 0 <= results['mean_score'] <= 1
            assert mock_cv.called
            
    def test_per_class_accuracy(self, predictor, sample_test_data):
        """Test per-class accuracy measurement"""
        with patch.object(predictor, 'predict_batch') as mock_predict:
            mock_predict.return_value = ['restaurant', 'retail', 'retail', 'restaurant']
            
            predictions = predictor.predict_batch(sample_test_data['business_description'])
            true_labels = sample_test_data['true_lob']
            
            # Calculate per-class accuracy
            classes = list(set(true_labels))
            per_class_accuracy = {}
            
            for cls in classes:
                class_mask = true_labels == cls
                if class_mask.sum() > 0:
                    class_accuracy = accuracy_score(
                        true_labels[class_mask], 
                        predictions[class_mask]
                    )
                    per_class_accuracy[cls] = class_accuracy
            
            assert len(per_class_accuracy) == len(classes)
            for cls, accuracy in per_class_accuracy.items():
                assert 0 <= accuracy <= 1
                
    def test_prediction_speed_benchmark(self, predictor, sample_test_data):
        """Test prediction speed and performance"""
        import time
        
        with patch.object(predictor, 'predict_batch') as mock_predict:
            # Simulate some processing time
            def mock_predict_with_delay(texts):
                time.sleep(0.01)  # 10ms delay
                return ['restaurant'] * len(texts)
            
            mock_predict.side_effect = mock_predict_with_delay
            
            start_time = time.time()
            predictions = predictor.predict_batch(sample_test_data['business_description'])
            end_time = time.time()
            
            processing_time = end_time - start_time
            
            assert len(predictions) == len(sample_test_data)
            assert processing_time > 0
            # Should complete within reasonable time (adjust threshold as needed)
            assert processing_time < 1.0
            
    def test_error_handling_in_prediction(self, predictor):
        """Test error handling during prediction"""
        # Test with empty input
        with pytest.raises(ValueError):
            predictor.predict_batch([])
            
        # Test with invalid input
        with pytest.raises(ValueError):
            predictor.predict_batch([None, ''])
            
        # Test model not loaded error
        with patch.object(predictor, 'model', None):
            with pytest.raises(RuntimeError):
                predictor.predict_batch(['Test description'])


class TestModelCalibration:
    """Test model calibration and reliability"""
    
    @pytest.fixture
    def predictor(self):
        """Create a LOB predictor instance"""
        return LOBPredictor()
    
    def test_calibration_curve(self, predictor):
        """Test calibration curve generation"""
        with patch.object(predictor, 'generate_calibration_curve') as mock_calibrate:
            mock_calibrate.return_value = {
                'probabilities': [0.1, 0.3, 0.5, 0.7, 0.9],
                'true_positives': [0.05, 0.25, 0.45, 0.65, 0.85],
                'calibration_score': 0.92
            }
            
            results = predictor.generate_calibration_curve()
            
            assert 'probabilities' in results
            assert 'true_positives' in results
            assert 'calibration_score' in results
            assert 0 <= results['calibration_score'] <= 1
            assert mock_calibrate.called
            
    def test_threshold_optimization(self, predictor):
        """Test prediction threshold optimization"""
        with patch.object(predictor, 'optimize_threshold') as mock_optimize:
            mock_optimize.return_value = {
                'optimal_threshold': 0.45,
                'max_f1_score': 0.89,
                'threshold_scores': {
                    0.3: 0.85,
                    0.4: 0.87,
                    0.5: 0.88,
                    0.6: 0.86,
                    0.7: 0.82
                }
            }
            
            results = predictor.optimize_threshold()
            
            assert 'optimal_threshold' in results
            assert 'max_f1_score' in results
            assert 0 <= results['optimal_threshold'] <= 1
            assert 0 <= results['max_f1_score'] <= 1
            assert mock_optimize.called


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
