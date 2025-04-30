from enum import Enum
from typing import Dict, List, Optional, Union
from pydantic import BaseModel
from .database import questions_collection

class AgeGroup(str, Enum):
    CHILD = "child"        # Age 8-12
    ADOLESCENT = "adolescent"  # Age 13-17
    ADULT = "adult"        # Age 18+
    
class Question(BaseModel):
    id: str
    text: str
    age_group: AgeGroup
    category: str
    follow_ups: Optional[List[str]] = None
    
class QueryGenerator:
    """Service for generating age-appropriate queries"""
    
    @staticmethod
    def determine_age_group(age: int) -> AgeGroup:
        """Determine the appropriate age group based on user age"""
        if age < 13:
            return AgeGroup.CHILD
        elif age < 18:
            return AgeGroup.ADOLESCENT
        else:
            return AgeGroup.ADULT
    
    @staticmethod
    async def get_questions_by_age_group(age_group: AgeGroup, category: Optional[str] = None) -> List[Question]:
        """Retrieve questions appropriate for the specified age group"""
        query = {"age_group": age_group}
        
        if category:
            query["category"] = category
            
        cursor = questions_collection.find(query)
        questions = await cursor.to_list(length=100)  # Limit to 100 questions
        
        return [Question(**q) for q in questions]
    
    @staticmethod
    async def get_question_by_id(question_id: str) -> Optional[Question]:
        """Retrieve a specific question by ID"""
        question = await questions_collection.find_one({"id": question_id})
        if question:
            return Question(**question)
        return None
    
    @staticmethod
    async def generate_initial_query(age: int, context: Optional[Dict] = None) -> Question:
        """Generate an appropriate initial query based on user age and context"""
        age_group = QueryGenerator.determine_age_group(age)
        
        # Default to general category for initial question
        category = "general"
        if context and "category" in context:
            category = context["category"]
            
        questions = await QueryGenerator.get_questions_by_age_group(age_group, category)
        
        if not questions:
            # Fallback questions if no matching questions found
            fallback_questions = {
                AgeGroup.CHILD: Question(
                    id="child_general_1",
                    text="How are you feeling today? You can tell me if you're happy, sad, or something else.",
                    age_group=AgeGroup.CHILD,
                    category="general"
                ),
                AgeGroup.ADOLESCENT: Question(
                    id="adolescent_general_1",
                    text="How would you describe your mood today? What's on your mind?",
                    age_group=AgeGroup.ADOLESCENT,
                    category="general"
                ),
                AgeGroup.ADULT: Question(
                    id="adult_general_1", 
                    text="How would you describe your mental and emotional state recently?",
                    age_group=AgeGroup.ADULT,
                    category="general"
                )
            }
            return fallback_questions[age_group]
            
        # In a real implementation, you might have logic to select the most appropriate
        # question based on the context. For simplicity, we're returning the first one.
        return questions[0]
    
    @staticmethod
    async def generate_follow_up(previous_question: Question, response: str, age: int) -> Question:
        """Generate a follow-up question based on the previous question and response"""
        age_group = QueryGenerator.determine_age_group(age)
        
        # If the previous question has predefined follow-ups, use those
        if previous_question.follow_ups and len(previous_question.follow_ups) > 0:
            follow_up_id = previous_question.follow_ups[0]  # Use the first follow-up for simplicity
            follow_up = await QueryGenerator.get_question_by_id(follow_up_id)
            if follow_up:
                return follow_up
        
        # Otherwise, get a question from the same category
        questions = await QueryGenerator.get_questions_by_age_group(age_group, previous_question.category)
        filtered_questions = [q for q in questions if q.id != previous_question.id]
        
        if filtered_questions:
            return filtered_questions[0]
            
        # Fallback follow-up questions
        fallback_follow_ups = {
            AgeGroup.CHILD: Question(
                id="child_followup_1",
                text="Can you tell me more about that? It's okay to share your feelings.",
                age_group=AgeGroup.CHILD,
                category=previous_question.category
            ),
            AgeGroup.ADOLESCENT: Question(
                id="adolescent_followup_1",
                text="That's interesting. Could you elaborate more on what you just shared?",
                age_group=AgeGroup.ADOLESCENT,
                category=previous_question.category
            ),
            AgeGroup.ADULT: Question(
                id="adult_followup_1",
                text="Thank you for sharing. Can you provide more details about your experience?",
                age_group=AgeGroup.ADULT,
                category=previous_question.category
            )
        }
        
        return fallback_follow_ups[age_group]
        
    @staticmethod
    async def prepare_seed_questions():
        """Seed the database with initial questions"""
        questions = [
            # Child questions (Ages 8-12)
            {
                "id": "child_general_1",
                "text": "How are you feeling today? You can tell me if you're happy, sad, or something else.",
                "age_group": AgeGroup.CHILD,
                "category": "general",
                "follow_ups": ["child_general_2"]
            },
            {
                "id": "child_general_2",
                "text": "What things make you feel happy?",
                "age_group": AgeGroup.CHILD,
                "category": "general",
                "follow_ups": ["child_anxiety_1"]
            },
            {
                "id": "child_anxiety_1",
                "text": "Do you ever feel worried or scared about things? What kinds of things?",
                "age_group": AgeGroup.CHILD,
                "category": "anxiety",
                "follow_ups": ["child_anxiety_2"]
            },
            {
                "id": "child_anxiety_2",
                "text": "When you feel worried, what helps you feel better?",
                "age_group": AgeGroup.CHILD,
                "category": "anxiety",
                "follow_ups": ["child_depression_1"]
            },
            {
                "id": "child_depression_1",
                "text": "Do you ever feel really sad? What makes you feel that way?",
                "age_group": AgeGroup.CHILD,
                "category": "depression",
                "follow_ups": ["child_depression_2"]
            },
            {
                "id": "child_depression_2",
                "text": "What do you do when you feel sad?",
                "age_group": AgeGroup.CHILD,
                "category": "depression"
            },
            
            # Adolescent questions (Ages 13-17)
            {
                "id": "adolescent_general_1",
                "text": "How would you describe your mood today? What's on your mind?",
                "age_group": AgeGroup.ADOLESCENT,
                "category": "general",
                "follow_ups": ["adolescent_general_2"]
            },
            {
                "id": "adolescent_general_2",
                "text": "What activities do you enjoy or find meaningful?",
                "age_group": AgeGroup.ADOLESCENT,
                "category": "general",
                "follow_ups": ["adolescent_anxiety_1"]
            },
            {
                "id": "adolescent_anxiety_1",
                "text": "Do you experience anxiety or stress? What situations trigger these feelings?",
                "age_group": AgeGroup.ADOLESCENT,
                "category": "anxiety",
                "follow_ups": ["adolescent_anxiety_2"]
            },
            {
                "id": "adolescent_anxiety_2",
                "text": "How do you cope with stress or anxiety when it arises?",
                "age_group": AgeGroup.ADOLESCENT,
                "category": "anxiety",
                "follow_ups": ["adolescent_depression_1"]
            },
            {
                "id": "adolescent_depression_1",
                "text": "Have you been feeling down, sad, or hopeless recently? Can you tell me more about these feelings?",
                "age_group": AgeGroup.ADOLESCENT,
                "category": "depression",
                "follow_ups": ["adolescent_depression_2"]
            },
            {
                "id": "adolescent_depression_2",
                "text": "Have you noticed any changes in your sleep, appetite, or energy levels?",
                "age_group": AgeGroup.ADOLESCENT,
                "category": "depression"
            },
            
            # Adult questions (Ages 18+)
            {
                "id": "adult_general_1",
                "text": "How would you describe your mental and emotional state recently?",
                "age_group": AgeGroup.ADULT,
                "category": "general",
                "follow_ups": ["adult_general_2"]
            },
            {
                "id": "adult_general_2",
                "text": "What aspects of your life bring you fulfillment or joy? Have there been any changes in these areas lately?",
                "age_group": AgeGroup.ADULT,
                "category": "general",
                "follow_ups": ["adult_anxiety_1"]
            },
            {
                "id": "adult_anxiety_1",
                "text": "Do you experience anxiety, worry, or panic? Can you describe the nature and frequency of these experiences?",
                "age_group": AgeGroup.ADULT,
                "category": "anxiety",
                "follow_ups": ["adult_anxiety_2"]
            },
            {
                "id": "adult_anxiety_2",
                "text": "How do these feelings of anxiety impact your daily functioning and quality of life?",
                "age_group": AgeGroup.ADULT,
                "category": "anxiety",
                "follow_ups": ["adult_depression_1"]
            },
            {
                "id": "adult_depression_1",
                "text": "Have you experienced persistent feelings of sadness, emptiness, or hopelessness? How long have these feelings lasted?",
                "age_group": AgeGroup.ADULT,
                "category": "depression",
                "follow_ups": ["adult_depression_2"]
            },
            {
                "id": "adult_depression_2",
                "text": "Have you noticed changes in your sleep patterns, appetite, energy levels, or ability to concentrate?",
                "age_group": AgeGroup.ADULT,
                "category": "depression"
            }
        ]
        
        # Use bulk write to insert questions
        await questions_collection.delete_many({})  # Clear existing questions
        if questions:
            await questions_collection.insert_many(questions)
            print(f"Seeded {len(questions)} questions")