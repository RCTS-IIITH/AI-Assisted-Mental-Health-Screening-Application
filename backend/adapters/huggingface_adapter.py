import os
import requests
from typing import Dict, List, Optional, Any
from transformers import AutoTokenizer, AutoModel
import torch
import numpy as np
from .base import LLMAdapterBase

class HuggingFaceAdapter(LLMAdapterBase):
    """Adapter for HuggingFace's models and API"""
    
    def __init__(self, api_key: Optional[str] = None, model: str = "google/flan-t5-xl"):
        """
        Initialize the HuggingFace adapter
        
        Args:
            api_key: HuggingFace API key (if None, reads from environment variable HF_API_KEY)
            model: Model name to use (default: google/flan-t5-xl)
        """
        self.api_key = api_key or os.getenv("HF_API_KEY")
        self.model_name = model
        self.api_url = f"https://api-inference.huggingface.co/models/{model}"
        self.embedding_model_name = "sentence-transformers/all-MiniLM-L6-v2"
        self._tokenizer = None
        self._embedding_model = None
        self._embedding_tokenizer = None
        
    async def generate_response(self, 
                               prompt: str, 
                               history: Optional[List[Dict[str, str]]] = None,
                               system_prompt: Optional[str] = None,
                               temperature: float = 0.7,
                               max_tokens: int = 1000) -> str:
        """Generate a response using HuggingFace Inference API"""
        headers = {"Authorization": f"Bearer {self.api_key}"} if self.api_key else {}
        
        # Format prompt with history and system prompt if provided
        formatted_prompt = ""
        if system_prompt:
            formatted_prompt += f"{system_prompt}\n\n"
            
        if history:
            for entry in history:
                formatted_prompt += f"User: {entry['user']}\n"
                if "assistant" in entry:
                    formatted_prompt += f"Assistant: {entry['assistant']}\n"
                    
        formatted_prompt += f"User: {prompt}\nAssistant:"
        
        # Prepare payload
        payload = {
            "inputs": formatted_prompt,
            "parameters": {
                "temperature": temperature,
                "max_new_tokens": max_tokens,
                "return_full_text": False
            }
        }
        
        try:
            response = requests.post(self.api_url, headers=headers, json=payload)
            response.raise_for_status()
            result = response.json()
            
            if isinstance(result, list) and len(result) > 0:
                return result[0].get("generated_text", "")
            else:
                return result.get("generated_text", "")
        except Exception as e:
            print(f"Error generating HuggingFace response: {e}")
            return f"I apologize, but I'm having trouble processing your request. Error: {str(e)}"
    
    async def embed_text(self, text: str) -> List[float]:
        """Generate embedding vector using a sentence transformer model"""
        try:
            # Load the model if it's not already loaded
            if self._embedding_model is None:
                self._embedding_model = AutoModel.from_pretrained(self.embedding_model_name)
                self._embedding_tokenizer = AutoTokenizer.from_pretrained(self.embedding_model_name)
                
            # Tokenize and compute embedding
            inputs = self._embedding_tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
            with torch.no_grad():
                model_output = self._embedding_model(**inputs)
                
            # Mean pooling
            attention_mask = inputs["attention_mask"]
            token_embeddings = model_output[0]
            input_mask_expanded = attention_mask.unsqueeze(-1).expand(token_embeddings.size()).float()
            sum_embeddings = torch.sum(token_embeddings * input_mask_expanded, 1)
            sum_mask = torch.clamp(input_mask_expanded.sum(1), min=1e-9)
            embedding = (sum_embeddings / sum_mask).squeeze().tolist()
            
            return embedding
        except Exception as e:
            print(f"Error generating embedding: {e}")
            # Return zero vector as fallback
            return [0.0] * 384  # Sentence transformer dimension
    
    def get_tokenizer(self):
        """Get the tokenizer for the current model"""
        if not self._tokenizer:
            self._tokenizer = AutoTokenizer.from_pretrained(self.model_name)
        return self._tokenizer
    
    def count_tokens(self, text: str) -> int:
        """Count the number of tokens in the text"""
        tokenizer = self.get_tokenizer()
        return len(tokenizer.encode(text))