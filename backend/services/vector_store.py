import numpy as np
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any, Optional
from .database import vector_collection, sync_vector_collection

# Initialize the embedding model
model = SentenceTransformer('paraphrase-MiniLM-L6-v2')

class VectorStore:
    """Service for managing vector embeddings in MongoDB"""
    
    @staticmethod
    def get_embedding(text: str) -> List[float]:
        """Generate embedding vector for text"""
        if not text.strip():
            return np.zeros(384).tolist()  # Return zero vector for empty text
        embedding = model.encode(text)
        return embedding.tolist()
    
    @staticmethod
    async def store_document(text: str, metadata: Dict[Any, Any]) -> str:
        """Store document with its embedding vector in MongoDB"""
        embedding = VectorStore.get_embedding(text)
        document = {
            "text": text,
            "vector": embedding,
            "metadata": metadata
        }
        result = await vector_collection.insert_one(document)
        return str(result.inserted_id)
    
    @staticmethod
    async def similar_documents(query: str, limit: int = 5, filters: Optional[Dict] = None) -> List[Dict]:
        """Retrieve documents similar to the query"""
        query_embedding = VectorStore.get_embedding(query)
        
        # Prepare the aggregation pipeline
        pipeline = [
            {
                "$search": {
                    "index": "vector_index",
                    "knnBeta": {
                        "vector": query_embedding,
                        "path": "vector",
                        "k": limit
                    }
                }
            }
        ]
        
        # Add filter if provided
        if filters:
            pipeline.append({"$match": filters})
            
        pipeline.extend([
            {"$limit": limit},
            {
                "$project": {
                    "text": 1,
                    "metadata": 1,
                    "score": {"$meta": "searchScore"}
                }
            }
        ])
        
        cursor = vector_collection.aggregate(pipeline)
        results = await cursor.to_list(length=limit)
        return results
    
    @staticmethod
    def bulk_insert(documents: List[Dict[str, Any]]) -> List[str]:
        """Bulk insert documents with embeddings (synchronous)"""
        docs_with_vectors = []
        
        for doc in documents:
            if "vector" not in doc:
                embedding = VectorStore.get_embedding(doc["text"])
                doc["vector"] = embedding
            docs_with_vectors.append(doc)
            
        if docs_with_vectors:
            result = sync_vector_collection.insert_many(docs_with_vectors)
            return [str(id) for id in result.inserted_ids]
        return []
    
    @staticmethod
    async def delete_document(doc_id: str) -> bool:
        """Delete a document from the vector store"""
        from bson.objectid import ObjectId
        result = await vector_collection.delete_one({"_id": ObjectId(doc_id)})
        return result.deleted_count > 0
        
    @staticmethod
    async def update_document(doc_id: str, text: str, metadata: Optional[Dict] = None) -> bool:
        """Update a document in the vector store"""
        from bson.objectid import ObjectId
        embedding = VectorStore.get_embedding(text)
        
        update_fields = {
            "text": text,
            "vector": embedding
        }
        
        if metadata:
            update_fields["metadata"] = metadata
            
        result = await vector_collection.update_one(
            {"_id": ObjectId(doc_id)},
            {"$set": update_fields}
        )
        
        return result.modified_count > 0