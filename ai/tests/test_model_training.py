"""
Test suite for AI/ML model training pipeline
Tests data preprocessing, model training, hyperparameter tuning, and model validation
"""

import pytest
import numpy as np
import pandas as pd
from unittest.mock import patch, MagicMock
import json
import os
from pathlib import Path

# Import the training modules
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'scripts'))
from train_lob_model import LOBModelTrainer
from bootstrap_lob_dataset import DatasetBootstrapper
from augment_lob_dataset import DatasetAugmenter


class TestModelTraining:
    """Test the complete model training pipeline"""
    
    @pytest.fixture
    def sample_dataset(self):
        """Create a sample dataset for testing"""
        return pd.DataFrame({
            'business_name': ['Test Restaurant', 'Sample Store', 'Demo Shop'],
            'business_description': [
                'A restaurant serving Filipino cuisine',
                'Retail store selling various products',
                'Small shop with local items'
            ],
            'lob': ['restaurant', 'retail', 'retail']
        })
    
    @pytest.fixture
    def trainer(self):
        """Create a model trainer instance"""
        return LOBModelTrainer()
    
    def test_data_preprocessing(self, trainer, sample_dataset):
        """Test data preprocessing pipeline"""
        # Test basic preprocessing
        processed_data = trainer.preprocess_data(sample_dataset)
        
        assert isinstance(processed_data, pd.DataFrame)
        assert len(processed_data) > 0
        assert 'processed_text' in processed_data.columns
        assert 'lob_encoded' in processed_data.columns
        
    def test_feature_extraction(self, trainer, sample_dataset):
        """Test feature extraction from text"""
        features = trainer.extract_features(sample_dataset['business_description'])
        
        assert isinstance(features, np.ndarray)
        assert features.shape[0] == len(sample_dataset)
        assert features.shape[1] > 0  # Should have feature vectors
        
    def test_model_initialization(self, trainer):
        """Test model initialization"""
        model = trainer.initialize_model()
        
        assert model is not None
        assert hasattr(model, 'fit')
        assert hasattr(model, 'predict')
        
    def test_hyperparameter_tuning(self, trainer, sample_dataset):
        """Test hyperparameter tuning"""
        # Mock the grid search to speed up testing
        with patch.object(trainer, 'grid_search') as mock_search:
            mock_search.return_value = {
                'best_params': {'C': 1.0, 'kernel': 'rbf'},
                'best_score': 0.85
            }
            
            results = trainer.tune_hyperparameters(sample_dataset)
            
            assert 'best_params' in results
            assert 'best_score' in results
            assert mock_search.called
            
    def test_model_training(self, trainer, sample_dataset):
        """Test model training process"""
        # Mock training to avoid actual computation
        with patch.object(trainer, 'train_model') as mock_train:
            mock_train.return_value = {
                'model': MagicMock(),
                'training_score': 0.92,
                'validation_score': 0.88
            }
            
            results = trainer.train(sample_dataset)
            
            assert 'model' in results
            assert 'training_score' in results
            assert 'validation_score' in results
            assert mock_train.called
            
    def test_model_validation(self, trainer, sample_dataset):
        """Test model validation metrics"""
        # Mock validation to avoid actual computation
        with patch.object(trainer, 'validate_model') as mock_validate:
            mock_validate.return_value = {
                'accuracy': 0.89,
                'precision': 0.87,
                'recall': 0.91,
                'f1_score': 0.89,
                'confusion_matrix': np.array([[10, 2], [1, 7]])
            }
            
            results = trainer.validate(sample_dataset)
            
            assert 'accuracy' in results
            assert 'precision' in results
            assert 'recall' in results
            assert 'f1_score' in results
            assert 'confusion_matrix' in results
            assert mock_validate.called
            
    def test_model_persistence(self, trainer):
        """Test saving and loading models"""
        # Mock model persistence
        mock_model = MagicMock()
        
        with patch('joblib.dump') as mock_dump, \
             patch('joblib.load') as mock_load:
            
            # Test saving
            trainer.save_model(mock_model, 'test_model.joblib')
            mock_dump.assert_called_once()
            
            # Test loading
            mock_load.return_value = mock_model
            loaded_model = trainer.load_model('test_model.joblib')
            
            assert loaded_model is not None
            mock_load.assert_called_once()
            
    def test_training_pipeline_integration(self, trainer, sample_dataset):
        """Test complete training pipeline integration"""
        # Mock the entire pipeline for integration testing
        with patch.object(trainer, 'preprocess_data') as mock_preprocess, \
             patch.object(trainer, 'train_model') as mock_train, \
             patch.object(trainer, 'validate_model') as mock_validate, \
             patch.object(trainer, 'save_model') as mock_save:
            
            mock_preprocess.return_value = sample_dataset
            mock_train.return_value = {
                'model': MagicMock(),
                'training_score': 0.92
            }
            mock_validate.return_value = {'accuracy': 0.89}
            
            results = trainer.run_training_pipeline(sample_dataset, 'test_model.joblib')
            
            assert 'training_score' in results
            assert 'validation_metrics' in results
            assert mock_preprocess.called
            assert mock_train.called
            assert mock_validate.called
            assert mock_save.called


class TestDatasetBootstrapping:
    """Test dataset bootstrapping functionality"""
    
    @pytest.fixture
    def bootstrapper(self):
        """Create a dataset bootstrapper instance"""
        return DatasetBootstrapper()
    
    def test_bootstrap_generation(self, bootstrapper):
        """Test bootstrap dataset generation"""
        # Mock bootstrapping to avoid actual computation
        with patch.object(bootstrapper, 'generate_bootstrap') as mock_generate:
            mock_generate.return_value = {
                'original_size': 100,
                'bootstrap_size': 1000,
                'augmentation_factor': 10
            }
            
            results = bootstrapper.create_bootstrap_dataset(
                original_data=[],
                target_size=1000
            )
            
            assert 'bootstrap_size' in results
            assert 'augmentation_factor' in results
            assert mock_generate.called
            
    def test_bootstrap_validation(self, bootstrapper):
        """Test bootstrap dataset validation"""
        # Mock validation
        with patch.object(bootstrapper, 'validate_bootstrap') as mock_validate:
            mock_validate.return_value = {
                'is_valid': True,
                'quality_score': 0.95,
                'diversity_score': 0.88
            }
            
            results = bootstrapper.validate_bootstrap_quality([])
            
            assert 'is_valid' in results
            assert 'quality_score' in results
            assert mock_validate.called


class TestDatasetAugmentation:
    """Test dataset augmentation functionality"""
    
    @pytest.fixture
    def augmenter(self):
        """Create a dataset augmenter instance"""
        return DatasetAugmenter()
    
    def test_text_augmentation(self, augmenter):
        """Test text augmentation methods"""
        # Mock augmentation
        with patch.object(augmenter, 'augment_text') as mock_augment:
            mock_augment.return_value = [
                'Original restaurant description',
                'Restaurant serving Filipino food',
                'Filipino cuisine restaurant'
            ]
            
            results = augmenter.augment_dataset(
                ['Original restaurant description'],
                augmentation_factor=2
            )
            
            assert len(results) == 3  # Original + 2 augmented
            assert mock_augment.called
            
    def test_augmentation_quality(self, augmenter):
        """Test augmentation quality metrics"""
        # Mock quality assessment
        with patch.object(augmenter, 'assess_quality') as mock_assess:
            mock_assess.return_value = {
                'semantic_similarity': 0.85,
                'diversity_score': 0.78,
                'readability_score': 0.92
            }
            
            results = augmenter.evaluate_augmentation_quality(
                original=['Original text'],
                augmented=['Augmented text 1', 'Augmented text 2']
            )
            
            assert 'semantic_similarity' in results
            assert 'diversity_score' in results
            assert mock_assess.called


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
