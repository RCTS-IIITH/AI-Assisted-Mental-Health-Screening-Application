import os
import aiohttp
import asyncio
from typing import Dict, List, Optional, Any
from .base import LLMAdapterBase

class GroqAdapter(LLMAdapterBase):
    """Adapter for Groq's API"""
    
    def __init__(self, api_key: Optional[str] = None, model: str = "mixtral-8x7b-32768"):
        """
        Initialize the Groq adapter
        
        Args:
            api_key: Groq API key (if None, reads from environment variable GROQ_API_KEY)
            model: Model name to use (default: mixtral-8x7b-32768)
        """
        self.api_key = api_key or os.getenv("GROQ_API_KEY")
        if not self.api_key:
            raise ValueError("Groq API key is required")
            
        self.base_url = "https://api.groq.com/openai/v1"
        self.model = model
        self.embedding_model = None  # Groq does not support embeddings
        self._tokenizer = None
        
    async def generate_response(self, 
                               prompt: str, 
                               history: Optional[List[Dict[str, str]]] = None,
                               system_prompt: Optional[str] = None,
                               temperature: float = 0.7,
                               max_tokens: int = 1000) -> str:
        """Generate a response using Groq's chat completion API"""
        messages = []
        
        # Add system prompt if provided
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        # Add conversation history
        if history:
            for entry in history:
                messages.append({"role": "user", "content": entry["user"]})
                if "assistant" in entry:
                    messages.append({"role": "assistant", "content": entry["assistant"]})
        
        # Add current prompt
        messages.append({"role": "user", "content": prompt})
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }
        
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(
                    f"{self.base_url}/chat/completions",
                    headers=headers,
                    json=payload
                ) as response:
                    if response.status != 200:
                        error_text = await response.text()
                        return f"I apologize, but I'm having trouble processing your request. Error: {error_text}"
                    
                    data = await response.json()
                    return data["choices"][0]["message"]["content"]
            except Exception as e:
                print(f"Error generating Groq response: {e}")
                return f"I apologize, but I'm having trouble processing your request. Error: {str(e)}"
    
    async def embed_text(self, text: str) -> List[float]:
        """Generate embedding vector (not supported by Groq API)"""
        print("Warning: Groq API does not support embedding generation")
        # Return zero vector as fallback (dimension is arbitrary since not specified)
        return [0.0] * 1024  # Placeholder dimension
    
    def get_tokenizer(self):
        """Get a pseudo-tokenizer for Groq models (approximation)"""
        if not self._tokenizer:
            # Groq doesn't provide a specific tokenizer like tiktoken
            # Using a simple word-based approximation
            self._tokenizer = lambda text: text.split()
        return self._tokenizer
    
    def count_tokens(self, text: str) -> int:
        """Approximate the number of tokens in the text"""
        tokenizer = self.get_tokenizer()
        # Approximate tokens as words + 20% for subword tokenization
        return int(len(tokenizer(text)) * 1.2)