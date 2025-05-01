from typing import Dict, List, Optional, Any
from datetime import datetime
from ..services.database import conversations_collection
import json

class ConversationMemory:
    """Memory management for conversation context"""
    
    def __init__(self, user_id: str, conversation_id: Optional[str] = None, max_tokens: int = 4000):
        """
        Initialize conversation memory
        
        Args:
            user_id: User ID
            conversation_id: Optional conversation ID for continuing existing conversations
            max_tokens: Maximum number of tokens to maintain in memory
        """
        self.user_id = user_id
        self.conversation_id = conversation_id or f"conv_{user_id}_{int(datetime.utcnow().timestamp())}"
        self.max_tokens = max_tokens
        self.history = []
        self.token_count = 0
        self.metadata = {
            "started_at": datetime.utcnow().isoformat(),
            "messages_count": 0,
            "categories_discussed": set()
        }
    
    async def load_history(self, limit: int = 20) -> List[Dict]:
        """Load conversation history from database"""
        query = {"user_id": self.user_id}
        
        if self.conversation_id:
            query["conversation_id"] = self.conversation_id
            
        cursor = conversations_collection.find(query).sort("timestamp", -1).limit(limit)
        conversations = await cursor.to_list(length=limit)
        
        # Reverse to get chronological order
        conversations.reverse()
        
        # Format history
        self.history = [
            {
                "user": conv["message"],
                "assistant": conv["response"],
                "timestamp": conv["timestamp"].isoformat() if isinstance(conv["timestamp"], datetime) else conv["timestamp"],
                "metadata": conv.get("metadata", {})
            } 
            for conv in conversations
        ]
        
        # Update metadata
        if conversations:
            self.metadata["messages_count"] = len(self.history)
            categories = set()
            for conv in conversations:
                if "metadata" in conv and "category" in conv["metadata"]:
                    categories.add(conv["metadata"]["category"])
            self.metadata["categories_discussed"] = list(categories)
            
        return self.history
    
    async def add_interaction(self, message: str, response: str, metadata: Optional[Dict] = None) -> None:
        """Add a new interaction to memory and save to database"""
        # Create entry for history
        entry = {
            "user": message,
            "assistant": response,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        if metadata:
            entry["metadata"] = metadata
            
        self.history.append(entry)
        
        # Update metadata
        self.metadata["messages_count"] = len(self.history)
        if metadata and "category" in metadata:
            if isinstance(self.metadata["categories_discussed"], set):
                self.metadata["categories_discussed"].add(metadata["category"])
            else:
                self.metadata["categories_discussed"] = list(set(self.metadata["categories_discussed"] + [metadata["category"]]))
        
        # Save to database
        db_entry = {
            "user_id": self.user_id,
            "conversation_id": self.conversation_id,
            "message": message,
            "response": response,
            "timestamp": datetime.utcnow(),
            "metadata": metadata or {}
        }
        
        await conversations_collection.insert_one(db_entry)
    
    def get_recent_history(self, num_interactions: int = 10) -> List[Dict]:
        """Get the most recent interactions"""
        return self.history[-num_interactions:] if len(self.history) > num_interactions else self.history
    
    def get_formatted_history(self, include_system_prompt: bool = False) -> List[Dict]:
        """Format history for LLM context"""
        formatted = []
        
        if include_system_prompt and self.history and "system_prompt" in self.metadata:
            formatted.append({
                "role": "system",
                "content": self.metadata["system_prompt"]
            })
            
        for entry in self.history:
            formatted.append({
                "role": "user",
                "content": entry["user"]
            })
            formatted.append({
                "role": "assistant",
                "content": entry["assistant"]
            })
            
        return formatted
    
    async def summarize_and_prune(self, llm_adapter) -> None:
        """Summarize older history to maintain context while reducing token count"""
        if len(self.history) < 8:
            # Not enough history to summarize
            return
            
        # Keep the most recent 4 interactions intact
        recent = self.history[-4:]
        to_summarize = self.history[:-4]
        
        # Prepare the conversation for summarization
        conversation_text = ""
        for entry in to_summarize:
            conversation_text += f"User: {entry['user']}\n"
            conversation_text += f"Assistant: {entry['assistant']}\n\n"
            
        # Create a prompt for summarization
        summary_prompt = (
            "Please summarize the following conversation between a user and mental health screening assistant. "
            "Focus on key points about the user's mental state, concerns, and relevant background information. "
            "Keep the summary concise but include all important details that would be needed for continuing the conversation.\n\n"
            f"{conversation_text}"
        )
        
        # Generate summary
        summary = await llm_adapter.generate_response(
            prompt=summary_prompt,
            temperature=0.3,
            max_tokens=300
        )
        
        # Replace old history with summary + recent interactions
        self.history = [{"user": "Previous conversation summary", "assistant": summary}] + recent
        
        # Update metadata
        self.metadata["was_summarized"] = True
        self.metadata["summarized_at"] = datetime.utcnow().isoformat()
    
    def export_conversation(self) -> Dict:
        """Export the full conversation with metadata"""
        return {
            "user_id": self.user_id,
            "conversation_id": self.conversation_id,
            "metadata": {
                k: list(v) if isinstance(v, set) else v 
                for k, v in self.metadata.items()
            },
            "history": self.history
        }
    
    async def save_to_file(self, filepath: str) -> None:
        """Save conversation to a JSON file"""
        with open(filepath, 'w') as f:
            json.dump(self.export_conversation(), f, indent=2)