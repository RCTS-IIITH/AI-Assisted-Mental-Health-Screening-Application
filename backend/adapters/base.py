from abc import ABC, abstractmethod
from typing import Dict, List, Optional, Any

class LLMAdapterBase(ABC):
    """Base adapter interface for LLM providers"""
    
    @abstractmethod
    async def generate_response(self, 
                               prompt: str, 
                               history: Optional[List[Dict[str, str]]] = None,
                               system_prompt: Optional[str] = None,
                               temperature: float = 0.7,
                               max_tokens: int = 1000) -> str:
        """
        Generate a response from the LLM provider
        
        Args:
            prompt: User input prompt
            history: Previous conversation history
            system_prompt: System instructions for the model
            temperature: Sampling temperature (0.0 to 1.0)
            max_tokens: Maximum response length
            
        Returns:
            Generated text response
        """
        pass
    
    @abstractmethod
    async def embed_text(self, text: str) -> List[float]:
        """
        Generate embedding vector for text
        
        Args:
            text: Text to embed
            
        Returns:
            Vector embedding as a list of floats
        """
        pass
    
    @abstractmethod
    def get_tokenizer(self):
        """
        Get the tokenizer for this model
        
        Returns:
            Tokenizer object appropriate for this model
        """
        pass
    
    @abstractmethod
    def count_tokens(self, text: str) -> int:
        """
        Count the number of tokens in the text
        
        Args:
            text: Text to count tokens for
            
        Returns:
            Number of tokens
        """
        pass