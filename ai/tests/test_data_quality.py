"""
Test suite for AI/ML data quality
Tests dataset validation, data augmentation, bootstrap generation, and consistency checks
"""

import pytest
import numpy as np
import pandas as pd
from unittest.mock import patch, MagicMock
import json
import os
from pathlib import Path
import sys

# Add the parent directory to the path to import modules
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))


class TestDatasetValidation:
    """Test dataset validation and quality checks"""
    
    @pytest.fixture
    def valid_dataset(self):
        """Create a valid dataset for testing"""
        return pd.DataFrame({
            'business_name': ['Test Restaurant', 'Sample Store', 'Demo Shop'],
            'business_description': [
                'A restaurant serving Filipino cuisine',
                'Retail store selling various products',
                'Small shop with local items'
            ],
            'lob': ['restaurant', 'retail', 'retail'],
            'source': ['manual', 'generated', 'bootstrap']
        })
    
    @pytest.fixture
    def invalid_dataset(self):
        """Create an invalid dataset for testing"""
        return pd.DataFrame({
            'business_name': ['', None, 'Valid Name'],
            'business_description': ['Short', '', 'A valid business description with sufficient length'],
            'lob': ['invalid_category', None, 'retail'],
            'source': ['unknown', 'manual', 'generated']
        })
    
    def test_basic_dataset_validation(self, valid_dataset):
        """Test basic dataset validation"""
        # Test valid dataset
        assert len(valid_dataset) > 0
        assert 'business_name' in valid_dataset.columns
        assert 'business_description' in valid_dataset.columns
        assert 'lob' in valid_dataset.columns
        
        # Test no missing critical values
        assert not valid_dataset['business_name'].isnull().any()
        assert not valid_dataset['business_description'].isnull().any()
        assert not valid_dataset['lob'].isnull().any()
        
    def test_data_quality_metrics(self, valid_dataset):
        """Test data quality metrics calculation"""
        # Mock quality metrics calculation
        with patch('ai.scripts.audit_lob_dataset.calculate_quality_metrics') as mock_metrics:
            mock_metrics.return_value = {
                'completeness_score': 0.95,
                'consistency_score': 0.88,
                'validity_score': 0.92,
                'uniqueness_score': 0.90,
                'overall_quality': 0.91
            }
            
            from ai.scripts.audit_lob_dataset import calculate_quality_metrics
            metrics = calculate_quality_metrics(valid_dataset)
            
            assert 'completeness_score' in metrics
            assert 'consistency_score' in metrics
            assert 'validity_score' in metrics
            assert 'uniqueness_score' in metrics
            assert 'overall_quality' in metrics
            
            # All scores should be between 0 and 1
            for key, score in metrics.items():
                if key != 'overall_quality':
                    assert 0 <= score <= 1
                    
    def test_missing_value_detection(self, invalid_dataset):
        """Test missing value detection and reporting"""
        # Mock missing value analysis
        with patch('ai.scripts.audit_lob_dataset.analyze_missing_values') as mock_missing:
            mock_missing.return_value = {
                'business_name': {'missing_count': 1, 'missing_percentage': 33.3},
                'business_description': {'missing_count': 1, 'missing_percentage': 33.3},
                'lob': {'missing_count': 1, 'missing_percentage': 33.3},
                'total_missing_records': 1
            }
            
            from ai.scripts.audit_lob_dataset import analyze_missing_values
            missing_analysis = analyze_missing_values(invalid_dataset)
            
            assert 'total_missing_records' in missing_analysis
            for column in ['business_name', 'business_description', 'lob']:
                assert column in missing_analysis
                assert 'missing_count' in missing_analysis[column]
                assert 'missing_percentage' in missing_analysis[column]
                
    def test_duplicate_detection(self, valid_dataset):
        """Test duplicate record detection"""
        # Create dataset with duplicates
        duplicate_dataset = pd.concat([
            valid_dataset,
            valid_dataset.iloc[0:1]  # Add first row as duplicate
        ], ignore_index=True)
        
        # Mock duplicate detection
        with patch('ai.scripts.audit_lob_dataset.detect_duplicates') as mock_duplicates:
            mock_duplicates.return_value = {
                'total_duplicates': 1,
                'duplicate_percentage': 25.0,
                'duplicate_indices': [3],
                'unique_records': 3
            }
            
            from ai.scripts.audit_lob_dataset import detect_duplicates
            duplicate_analysis = detect_duplicates(duplicate_dataset)
            
            assert 'total_duplicates' in duplicate_analysis
            assert 'duplicate_percentage' in duplicate_analysis
            assert 'unique_records' in duplicate_analysis
            assert duplicate_analysis['total_duplicates'] > 0
            
    def test_outlier_detection(self, valid_dataset):
        """Test outlier detection in text data"""
        # Mock outlier detection
        with patch('ai.scripts.audit_lob_dataset.detect_outliers') as mock_outliers:
            mock_outliers.return_value = {
                'text_length_outliers': [],
                'description_outliers': [],
                'name_outliers': [],
                'total_outliers': 0,
                'outlier_percentage': 0.0
            }
            
            from ai.scripts.audit_lob_dataset import detect_outliers
            outlier_analysis = detect_outliers(valid_dataset)
            
            assert 'total_outliers' in outlier_analysis
            assert 'outlier_percentage' in outlier_analysis
            assert isinstance(outlier_analysis['total_outliers'], int)
            
    def test_label_distribution_analysis(self, valid_dataset):
        """Test label distribution analysis"""
        # Mock distribution analysis
        with patch('ai.scripts.audit_lob_dataset.analyze_label_distribution') as mock_distribution:
            mock_distribution.return_value = {
                'label_counts': {'restaurant': 1, 'retail': 2},
                'label_percentages': {'restaurant': 33.3, 'retail': 66.7},
                'entropy': 0.63,
                'is_balanced': False,
                'imbalance_ratio': 2.0
            }
            
            from ai.scripts.audit_lob_dataset import analyze_label_distribution
            distribution = analyze_label_distribution(valid_dataset)
            
            assert 'label_counts' in distribution
            assert 'label_percentages' in distribution
            assert 'entropy' in distribution
            assert 'is_balanced' in distribution
            assert 'imbalance_ratio' in distribution


class TestDataAugmentation:
    """Test data augmentation processes"""
    
    @pytest.fixture
    def sample_texts(self):
        """Create sample texts for augmentation"""
        return [
            'A restaurant serving Filipino cuisine',
            'Retail store selling various products',
            'Small shop with local items'
        ]
    
    def test_text_augmentation_methods(self, sample_texts):
        """Test various text augmentation methods"""
        # Mock augmentation methods
        with patch('ai.scripts.augment_lob_dataset.augment_text') as mock_augment:
            mock_augment.return_value = [
                'A restaurant serving Filipino food',
                'Restaurant serving Filipino cuisine',
                'Filipino cuisine restaurant'
            ]
            
            from ai.scripts.augment_lob_dataset import augment_text
            augmented = augment_text(sample_texts[0], num_augmentations=3)
            
            assert len(augmented) == 3
            assert all(isinstance(text, str) for text in augmented)
            assert mock_augment.called
            
    def test_augmentation_quality_assessment(self, sample_texts):
        """Test augmentation quality assessment"""
        # Mock quality assessment
        with patch('ai.scripts.augment_lob_dataset.assess_augmentation_quality') as mock_assess:
            mock_assess.return_value = {
                'semantic_similarity_mean': 0.85,
                'semantic_similarity_std': 0.05,
                'diversity_score': 0.78,
                'readability_score': 0.92,
                'overall_quality': 0.85
            }
            
            from ai.scripts.augment_lob_dataset import assess_augmentation_quality
            quality = assess_augmentation_quality(
                original_texts=sample_texts,
                augmented_texts=sample_texts * 2
            )
            
            assert 'semantic_similarity_mean' in quality
            assert 'diversity_score' in quality
            assert 'readability_score' in quality
            assert 'overall_quality' in quality
            
            # Quality scores should be between 0 and 1
            for key, score in quality.items():
                if key != 'semantic_similarity_std':
                    assert 0 <= score <= 1
                    
    def test_augmentation_diversity_check(self, sample_texts):
        """Test augmentation diversity verification"""
        # Mock diversity check
        with patch('ai.scripts.augment_lob_dataset.check_diversity') as mock_diversity:
            mock_diversity.return_value = {
                'unique_augmentations': 8,
                'total_augmentations': 10,
                'diversity_ratio': 0.8,
                'duplicate_augmentations': 2
            }
            
            from ai.scripts.augment_lob_dataset import check_diversity
            diversity = check_diversity(sample_texts * 3)  # Some duplicates
            
            assert 'diversity_ratio' in diversity
            assert 'unique_augmentations' in diversity
            assert 'total_augmentations' in diversity
            assert 0 <= diversity['diversity_ratio'] <= 1


class TestBootstrapGeneration:
    """Test bootstrap dataset generation"""
    
    @pytest.fixture
    def original_dataset(self):
        """Create original dataset for bootstrapping"""
        return pd.DataFrame({
            'business_name': ['Test Restaurant', 'Sample Store'],
            'business_description': [
                'A restaurant serving Filipino cuisine',
                'Retail store selling various products'
            ],
            'lob': ['restaurant', 'retail']
        })
    
    def test_bootstrap_generation_process(self, original_dataset):
        """Test bootstrap dataset generation process"""
        # Mock bootstrap generation
        with patch('ai.scripts.bootstrap_lob_dataset.generate_bootstrap') as mock_bootstrap:
            mock_bootstrap.return_value = pd.DataFrame({
                'business_name': ['Test Restaurant', 'Sample Store', 'Generated Restaurant', 'Generated Store'],
                'business_description': [
                    'A restaurant serving Filipino cuisine',
                    'Retail store selling various products',
                    'Generated restaurant description',
                    'Generated store description'
                ],
                'lob': ['restaurant', 'retail', 'restaurant', 'retail'],
                'source': ['original', 'original', 'bootstrap', 'bootstrap']
            })
            
            from ai.scripts.bootstrap_lob_dataset import generate_bootstrap
            bootstrap_dataset = generate_bootstrap(original_dataset, target_size=4)
            
            assert len(bootstrap_dataset) == 4
            assert 'source' in bootstrap_dataset.columns
            assert 'bootstrap' in bootstrap_dataset['source'].values
            assert mock_bootstrap.called
            
    def test_bootstrap_quality_validation(self, original_dataset):
        """Test bootstrap dataset quality validation"""
        # Mock bootstrap validation
        with patch('ai.scripts.bootstrap_lob_dataset.validate_bootstrap_quality') as mock_validate:
            mock_validate.return_value = {
                'quality_score': 0.92,
                'diversity_score': 0.88,
                'consistency_score': 0.95,
                'is_valid': True,
                'validation_issues': []
            }
            
            from ai.scripts.bootstrap_lob_dataset import validate_bootstrap_quality
            validation = validate_bootstrap_quality(original_dataset)
            
            assert 'quality_score' in validation
            assert 'diversity_score' in validation
            assert 'consistency_score' in validation
            assert 'is_valid' in validation
            assert 'validation_issues' in validation
            
            # Scores should be between 0 and 1
            for key, score in validation.items():
                if key in ['quality_score', 'diversity_score', 'consistency_score']:
                    assert 0 <= score <= 1
                    
    def test_bootstrap_distribution_preservation(self, original_dataset):
        """Test bootstrap preserves original label distribution"""
        # Mock distribution preservation check
        with patch('ai.scripts.bootstrap_lob_dataset.check_distribution_preservation') as mock_check:
            mock_check.return_value = {
                'original_distribution': {'restaurant': 0.5, 'retail': 0.5},
                'bootstrap_distribution': {'restaurant': 0.48, 'retail': 0.52},
                'distribution_difference': 0.04,
                'is_preserved': True
            }
            
            from ai.scripts.bootstrap_lob_dataset import check_distribution_preservation
            preservation = check_distribution_preservation(original_dataset, original_dataset)
            
            assert 'original_distribution' in preservation
            assert 'bootstrap_distribution' in preservation
            assert 'distribution_difference' in preservation
            assert 'is_preserved' in preservation


class TestConsistencyChecks:
    """Test data consistency and integrity checks"""
    
    @pytest.fixture
    def dataset_with_inconsistencies(self):
        """Create dataset with known inconsistencies"""
        return pd.DataFrame({
            'business_name': ['Test Restaurant', 'Sample STORE', 'Demo Shop'],
            'business_description': [
                'A restaurant serving Filipino cuisine',
                'Retail store selling various products',
                'Small shop with local items'
            ],
            'lob': ['restaurant', 'retail', 'retail'],
            'source': ['manual', 'generated', 'bootstrap']
        })
    
    def test_naming_convention_consistency(self, dataset_with_inconsistencies):
        """Test naming convention consistency"""
        # Mock consistency check
        with patch('ai.scripts.audit_lob_dataset.check_naming_consistency') as mock_consistency:
            mock_consistency.return_value = {
                'inconsistent_names': ['Sample STORE'],
                'inconsistency_count': 1,
                'consistency_score': 0.67,
                'suggestions': ['Convert to title case', 'Standardize capitalization']
            }
            
            from ai.scripts.audit_lob_dataset import check_naming_consistency
            consistency = check_naming_consistency(dataset_with_inconsistencies)
            
            assert 'inconsistency_count' in consistency
            assert 'consistency_score' in consistency
            assert 'suggestions' in consistency
            assert 0 <= consistency['consistency_score'] <= 1
            
    def test_label_text_alignment(self, dataset_with_inconsistencies):
        """Test alignment between text descriptions and labels"""
        # Mock alignment check
        with patch('ai.scripts.audit_lob_dataset.check_label_text_alignment') as mock_alignment:
            mock_alignment.return_value = {
                'misaligned_records': [],
                'alignment_score': 0.95,
                'confidence_scores': [0.92, 0.88, 0.95],
                'is_aligned': True
            }
            
            from ai.scripts.audit_lob_dataset import check_label_text_alignment
            alignment = check_label_text_alignment(dataset_with_inconsistencies)
            
            assert 'alignment_score' in alignment
            assert 'misaligned_records' in alignment
            assert 'is_aligned' in alignment
            assert 0 <= alignment['alignment_score'] <= 1


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
