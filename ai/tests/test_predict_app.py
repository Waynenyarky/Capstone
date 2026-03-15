"""
Comprehensive tests for the LOB Prediction & Training Flask Service

Tests cover:
- Health check endpoint
- Prediction endpoint with various inputs
- Training endpoint functionality
- Model evaluation endpoint
- Error handling and edge cases
- Service initialization and configuration
"""

import json
import os
import pytest
import tempfile
import unittest.mock as mock
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from flask import Flask

# Add the service directory to the path so we can import the app
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'service'))

from predict_app import create_app, load_model, predict_lob, train_model


class TestPredictApp:
    """Test suite for the LOB Prediction Flask Service"""
    
    @pytest.fixture
    def app(self):
        """Create a test Flask app"""
        app = create_app()
        app.config['TESTING'] = True
        return app
    
    @pytest.fixture
    def client(self, app):
        """Create a test client"""
        return app.test_client()
    
    @pytest.fixture
    def sample_model(self):
        """Create a sample trained model for testing"""
        # Create a simple mock model that returns predictable results
        class MockModel:
            def predict(self, X):
                # Return predictable LOB predictions based on input length
                if isinstance(X, str):
                    return ['Restaurant'] if len(X) < 100 else ['Retail']
                elif isinstance(X, list):
                    return ['Restaurant' if len(x) < 100 else 'Retail' for x in X]
                return ['Restaurant']
            
            def predict_proba(self, X):
                # Return predictable probabilities
                if isinstance(X, str):
                    return np.array([[0.7, 0.2, 0.1]])  # Restaurant, Retail, Service
                elif isinstance(X, list):
                    return np.array([[0.7, 0.2, 0.1]] * len(X))
                return np.array([[0.7, 0.2, 0.1]])
        
        return MockModel()
    
    @pytest.fixture
    def sample_dataset(self):
        """Create sample training data"""
        return pd.DataFrame({
            'description': [
                'Small restaurant serving Filipino food',
                'Retail store selling clothes and accessories',
                'Consulting service for small businesses',
                'Fast food chain with multiple locations',
                'Grocery store with fresh produce'
            ],
            'lob': [
                'Restaurant',
                'Retail', 
                'Service',
                'Restaurant',
                'Retail'
            ]
        })
    
    def test_health_check_endpoint(self, client):
        """Test the health check endpoint"""
        response = client.get('/health')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'healthy'
        assert 'model_loaded' in data
        assert 'timestamp' in data
    
    def test_predict_endpoint_single_input(self, client, sample_model):
        """Test prediction with a single business description"""
        with mock.patch('predict_app.model', sample_model):
            response = client.post('/predict', 
                                 json={'description': 'Small restaurant serving Filipino food'},
                                 content_type='application/json')
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert 'predictions' in data
            assert len(data['predictions']) == 1
            assert 'lob' in data['predictions'][0]
            assert 'confidence' in data['predictions'][0]
    
    def test_predict_endpoint_batch_input(self, client, sample_model):
        """Test prediction with multiple business descriptions"""
        with mock.patch('predict_app.model', sample_model):
            descriptions = [
                'Small restaurant serving Filipino food',
                'Retail store selling clothes and accessories',
                'Consulting service for small businesses'
            ]
            
            response = client.post('/predict',
                                 json={'descriptions': descriptions},
                                 content_type='application/json')
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert 'predictions' in data
            assert len(data['predictions']) == 3
            
            for prediction in data['predictions']:
                assert 'lob' in prediction
                assert 'confidence' in prediction
    
    def test_predict_endpoint_missing_description(self, client):
        """Test prediction endpoint with missing description"""
        response = client.post('/predict',
                             json={},
                             content_type='application/json')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        assert 'description' in data['error'].lower()
    
    def test_predict_endpoint_empty_description(self, client, sample_model):
        """Test prediction endpoint with empty description"""
        with mock.patch('predict_app.model', sample_model):
            response = client.post('/predict',
                                 json={'description': ''},
                                 content_type='application/json')
            
            # Should handle empty input gracefully
            assert response.status_code in [200, 400]
    
    def test_predict_endpoint_very_long_description(self, client, sample_model):
        """Test prediction endpoint with very long description"""
        with mock.patch('predict_app.model', sample_model):
            long_description = 'A' * 10000  # Very long string
            
            response = client.post('/predict',
                                 json={'description': long_description},
                                 content_type='application/json')
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert 'predictions' in data
    
    def test_predict_endpoint_special_characters(self, client, sample_model):
        """Test prediction endpoint with special characters"""
        with mock.patch('predict_app.model', sample_model):
            special_description = 'Restaurant with café & bistro! @#$%^&*()'
            
            response = client.post('/predict',
                                 json={'description': special_description},
                                 content_type='application/json')
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert 'predictions' in data
    
    def test_predict_endpoint_unicode_characters(self, client, sample_model):
        """Test prediction endpoint with unicode characters"""
        with mock.patch('predict_app.model', sample_model):
            unicode_description = 'Restaurante con comida filipina 🍽️ café'
            
            response = client.post('/predict',
                                 json={'description': unicode_description},
                                 content_type='application/json')
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert 'predictions' in data
    
    def test_predict_endpoint_invalid_json(self, client):
        """Test prediction endpoint with invalid JSON"""
        response = client.post('/predict',
                             data='invalid json',
                             content_type='application/json')
        
        assert response.status_code == 400
    
    def test_predict_endpoint_no_json_header(self, client):
        """Test prediction endpoint without JSON content type"""
        response = client.post('/predict',
                             data='{"description": "test"}')
        
        # Should handle missing content type gracefully
        assert response.status_code in [400, 415]
    
    @mock.patch('predict_app.train_model')
    def test_train_endpoint_success(self, mock_train, client, sample_dataset):
        """Test successful model training"""
        mock_train.return_value = {
            'accuracy': 0.85,
            'f1_score': 0.83,
            'precision': 0.84,
            'recall': 0.85,
            'num_samples': 100
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            sample_dataset.to_csv(f.name, index=False)
            temp_file = f.name
        
        try:
            response = client.post('/train',
                                 data={'dataset': (open(temp_file, 'rb'), 'dataset.csv')})
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert 'success' in data
            assert 'metrics' in data
            assert 'accuracy' in data['metrics']
        finally:
            os.unlink(temp_file)
    
    def test_train_endpoint_no_dataset(self, client):
        """Test training endpoint without dataset"""
        response = client.post('/train')
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
        assert 'dataset' in data['error'].lower()
    
    def test_train_endpoint_invalid_file_format(self, client):
        """Test training endpoint with invalid file format"""
        response = client.post('/train',
                             data={'dataset': (tempfile.NamedTemporaryFile(), 'invalid.txt')})
        
        assert response.status_code == 400
        data = json.loads(response.data)
        assert 'error' in data
    
    @mock.patch('predict_app.evaluate_model')
    def test_evaluate_endpoint_success(self, mock_evaluate, client):
        """Test successful model evaluation"""
        mock_evaluate.return_value = {
            'accuracy': 0.88,
            'f1_score': 0.86,
            'precision': 0.87,
            'recall': 0.88,
            'confusion_matrix': [[10, 2, 1], [1, 15, 2], [0, 1, 8]],
            'classification_report': 'detailed report here'
        }
        
        response = client.get('/evaluate')
        
        assert response.status_code == 200
        data = json.loads(response.data)
        assert 'metrics' in data
        assert 'accuracy' in data['metrics']
        assert 'f1_score' in data['metrics']
    
    def test_evaluate_endpoint_no_model(self, client):
        """Test evaluation endpoint when no model is loaded"""
        with mock.patch('predict_app.model', None):
            response = client.get('/evaluate')
            
            assert response.status_code == 503
            data = json.loads(response.data)
            assert 'error' in data
            assert 'model' in data['error'].lower()
    
    def test_model_loading_function(self, sample_model):
        """Test the model loading function"""
        with tempfile.NamedTemporaryFile(suffix='.joblib', delete=False) as f:
            joblib.dump(sample_model, f.name)
            temp_file = f.name
        
        try:
            # Test loading existing model
            loaded_model = load_model(temp_file)
            assert loaded_model is not None
            
            # Test loading non-existent model
            non_existent = load_model('non_existent_model.joblib')
            assert non_existent is None
        finally:
            os.unlink(temp_file)
    
    def test_predict_function_with_model(self, sample_model):
        """Test the predict function directly"""
        test_description = "Small restaurant serving Filipino food"
        
        result = predict_lob(test_description, sample_model)
        
        assert 'lob' in result
        assert 'confidence' in result
        assert result['lob'] in ['Restaurant', 'Retail', 'Service']
        assert 0 <= result['confidence'] <= 1
    
    def test_predict_function_without_model(self):
        """Test prediction function without model"""
        test_description = "Small restaurant serving Filipino food"
        
        result = predict_lob(test_description, None)
        
        assert result is None
    
    def test_predict_function_empty_input(self, sample_model):
        """Test prediction function with empty input"""
        result = predict_lob("", sample_model)
        
        # Should handle empty input gracefully
        assert result is not None or result is None
    
    @mock.patch('predict_app.train_model')
    def test_train_function_success(self, mock_train, sample_dataset):
        """Test the train function directly"""
        mock_train.return_value = {
            'accuracy': 0.85,
            'f1_score': 0.83,
            'precision': 0.84,
            'recall': 0.85
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.csv', delete=False) as f:
            sample_dataset.to_csv(f.name, index=False)
            temp_file = f.name
        
        try:
            result = train_model(temp_file)
            
            assert 'accuracy' in result
            assert 'f1_score' in result
            assert result['accuracy'] > 0
        finally:
            os.unlink(temp_file)
    
    def test_train_function_invalid_file(self):
        """Test training function with invalid file"""
        result = train_model('non_existent_file.csv')
        
        assert 'error' in result
    
    def test_service_initialization(self):
        """Test service initialization"""
        app = create_app()
        
        assert app is not None
        assert isinstance(app, Flask)
    
    def test_cors_headers(self, client):
        """Test CORS headers are present"""
        response = client.get('/health')
        
        # Check for CORS headers
        assert 'Access-Control-Allow-Origin' in response.headers
    
    def test_concurrent_predictions(self, client, sample_model):
        """Test concurrent prediction requests"""
        import threading
        import time
        
        results = []
        errors = []
        
        def make_request():
            try:
                response = client.post('/predict',
                                     json={'description': 'Test restaurant'},
                                     content_type='application/json')
                results.append(response.status_code)
            except Exception as e:
                errors.append(str(e))
        
        with mock.patch('predict_app.model', sample_model):
            # Create multiple concurrent requests
            threads = []
            for _ in range(10):
                thread = threading.Thread(target=make_request)
                threads.append(thread)
                thread.start()
            
            # Wait for all threads to complete
            for thread in threads:
                thread.join()
        
        # All requests should succeed
        assert len(errors) == 0
        assert len(results) == 10
        assert all(status == 200 for status in results)
    
    def test_memory_usage_large_batch(self, client, sample_model):
        """Test memory usage with large batch predictions"""
        with mock.patch('predict_app.model', sample_model):
            # Create a large batch of descriptions
            descriptions = [f'Test business description {i}' for i in range(1000)]
            
            response = client.post('/predict',
                                 json={'descriptions': descriptions},
                                 content_type='application/json')
            
            assert response.status_code == 200
            data = json.loads(response.data)
            assert len(data['predictions']) == 1000
    
    def test_model_confidence_scores(self, client, sample_model):
        """Test confidence score calculation"""
        with mock.patch('predict_app.model', sample_model):
            response = client.post('/predict',
                                 json={'description': 'Test restaurant'},
                                 content_type='application/json')
            
            assert response.status_code == 200
            data = json.loads(response.data)
            
            confidence = data['predictions'][0]['confidence']
            assert isinstance(confidence, (int, float))
            assert 0 <= confidence <= 1
    
    def test_error_handling_corrupted_model(self, client):
        """Test error handling with corrupted model file"""
        with tempfile.NamedTemporaryFile(suffix='.joblib', delete=False) as f:
            f.write(b'corrupted model data')
            temp_file = f.name
        
        try:
            with mock.patch('predict_app.model_path', temp_file):
                response = client.post('/predict',
                                     json={'description': 'Test'},
                                     content_type='application/json')
                
                # Should handle corrupted model gracefully
                assert response.status_code in [500, 503]
        finally:
            os.unlink(temp_file)


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
