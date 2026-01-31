"""
Base Model Interface

Defines the interface that all AI model modules should implement.
"""
from abc import ABC, abstractmethod
from typing import Dict, Any


class BaseModelService(ABC):
    """Abstract base class for AI model services."""
    
    @abstractmethod
    def load_model(self) -> bool:
        """
        Load the model.
        
        Returns:
            True if model loaded successfully, False otherwise.
        """
        pass
    
    @abstractmethod
    def is_model_loaded(self) -> bool:
        """Check if the model is loaded."""
        pass
    
    @abstractmethod
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the loaded model."""
        pass
