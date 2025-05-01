from enum import Enum
from typing import Dict, List, Optional, Union, Any
from pydantic import BaseModel
from datetime import datetime
from .database import assessments_collection
from .age_based_query import AgeGroup

class SeverityLevel(str, Enum):
    MINIMAL = "minimal"
    MILD = "mild"
    MODERATE = "moderate"
    SEVERE = "severe"

class Category(str, Enum):
    ANXIETY = "anxiety"
    DEPRESSION = "depression"
    STRESS = "stress"
    GENERAL = "general"
    
class AssessmentScore(BaseModel):
    category: Category
    raw_score: float
    normalized_score: float  # 0-100 scale
    severity: SeverityLevel
    confidence: float  # 0-1 scale
    
class Assessment(BaseModel):
    user_id: str
    timestamp: datetime
    age_group: AgeGroup
    scores: Dict[str, AssessmentScore]
    overall_severity: SeverityLevel
    recommendations: List[str]
    conversation_id: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    
class ScoringSystem:
    """Service for scoring mental health assessments"""
    
    @staticmethod
    def _determine_severity(score: float, category: Category) -> SeverityLevel:
        """Determine severity level based on normalized score and category"""
        # Different thresholds for different categories
        thresholds = {
            Category.ANXIETY: {
                SeverityLevel.MINIMAL: 25,
                SeverityLevel.MILD: 50,
                SeverityLevel.MODERATE: 75
            },
            Category.DEPRESSION: {
                SeverityLevel.MINIMAL: 25,
                SeverityLevel.MILD: 50,
                SeverityLevel.MODERATE: 75
            },
            Category.STRESS: {
                SeverityLevel.MINIMAL: 30,
                SeverityLevel.MILD: 55,
                SeverityLevel.MODERATE: 80
            },
            Category.GENERAL: {
                SeverityLevel.MINIMAL: 25,
                SeverityLevel.MILD: 50,
                SeverityLevel.MODERATE: 75
            }
        }
        
        category_thresholds = thresholds.get(category, thresholds[Category.GENERAL])
        
        if score < category_thresholds[SeverityLevel.MINIMAL]:
            return SeverityLevel.MINIMAL
        elif score < category_thresholds[SeverityLevel.MILD]:
            return SeverityLevel.MILD
        elif score < category_thresholds[SeverityLevel.MODERATE]:
            return SeverityLevel.MODERATE
        else:
            return SeverityLevel.SEVERE
    
    @staticmethod
    def score_response(response: str, category: Category, age_group: AgeGroup) -> AssessmentScore:
        """
        Score a user response for a particular category
        
        In a production system, this would use NLP or ML models to analyze responses.
        For this implementation, we'll use a simplified rule-based approach.
        """
        # Keywords associated with different severity levels for each category
        keywords = {
            Category.ANXIETY: {
                SeverityLevel.MINIMAL: ["occasionally", "sometimes", "bit", "slightly", "minor"],
                SeverityLevel.MILD: ["worried", "nervous", "concerned", "uneasy"],
                SeverityLevel.MODERATE: ["anxious", "fear", "panic", "stress", "worried"],
                SeverityLevel.SEVERE: ["terrified", "paralyzed", "overwhelming", "debilitating", "severe"]
            },
            Category.DEPRESSION: {
                SeverityLevel.MINIMAL: ["blue", "down", "sad", "occasional"],
                SeverityLevel.MILD: ["unhappy", "low", "unmotivated", "tired"],
                SeverityLevel.MODERATE: ["depressed", "hopeless", "worthless", "empty"],
                SeverityLevel.SEVERE: ["suicidal", "desperate", "can't go on", "giving up"]
            },
            Category.STRESS: {
                SeverityLevel.MINIMAL: ["busy", "challenged", "pressured"],
                SeverityLevel.MILD: ["stressed", "tense", "overwhelmed"],
                SeverityLevel.MODERATE: ["burnout", "exhausted", "breaking point"],
                SeverityLevel.SEVERE: ["crisis", "breakdown", "can't cope", "falling apart"]
            }
        }
        
        # Default to general if category-specific keywords not available
        category_keywords = keywords.get(category, keywords.get(Category.ANXIETY))
        
        # Calculate a basic score based on keyword matches
        # This is a simplified approach - a real system would use NLP
        response_lower = response.lower()
        severity_counts = {level: 0 for level in SeverityLevel}
        
        for level, words in category_keywords.items():
            for word in words:
                if word in response_lower:
                    severity_counts[level] += 1
        
        # Calculate weighted score
        weights = {
            SeverityLevel.MINIMAL: 1,
            SeverityLevel.MILD: 2,
            SeverityLevel.MODERATE: 3,
            SeverityLevel.SEVERE: 4
        }
        
        weighted_sum = sum(count * weights[level] for level, count in severity_counts.items())
        total_matches = sum(severity_counts.values())
        
        # If no keywords matched, assume minimal severity with low confidence
        if total_matches == 0:
            return AssessmentScore(
                category=category,
                raw_score=0,
                normalized_score=10,  # Low baseline score
                severity=SeverityLevel.MINIMAL,
                confidence=0.3  # Low confidence
            )
            
        # Calculate raw score (1-4 scale)
        raw_score = weighted_sum / total_matches if total_matches > 0 else 1
        
        # Normalize to 0-100
        normalized_score = (raw_score - 1) / 3 * 100
        
        # Determine severity
        severity = ScoringSystem._determine_severity(normalized_score, category)
        
        # Calculate confidence (simplified)
        confidence = min(0.3 + (total_matches / 10), 0.9)
        
        return AssessmentScore(
            category=category,
            raw_score=raw_score,
            normalized_score=normalized_score,
            severity=severity,
            confidence=confidence
        )
    
    @staticmethod
    def generate_recommendations(scores: Dict[str, AssessmentScore], age_group: AgeGroup) -> List[str]:
        """Generate recommendations based on assessment scores and age group"""
        recommendations = []
        
        # Helper to get recommended resources based on severity and category
        def get_resources(category: Category, severity: SeverityLevel) -> List[str]:
            resources = {
                (Category.ANXIETY, SeverityLevel.MINIMAL): [
                    "Practice deep breathing exercises daily",
                    "Try mindfulness meditation apps"
                ],
                (Category.ANXIETY, SeverityLevel.MILD): [
                    "Consider reading self-help books on anxiety management",
                    "Join online support communities"
                ],
                (Category.ANXIETY, SeverityLevel.MODERATE): [
                    "Consider consulting with a mental health professional",
                    "Try cognitive-behavioral techniques"
                ],
                (Category.ANXIETY, SeverityLevel.SEVERE): [
                    "Please speak with a mental health professional as soon as possible",
                    "Contact a crisis helpline if you're in distress"
                ],
                (Category.DEPRESSION, SeverityLevel.MINIMAL): [
                    "Maintain regular physical activity",
                    "Ensure adequate sleep"
                ],
                (Category.DEPRESSION, SeverityLevel.MILD): [
                    "Consider a mood journal to track patterns",
                    "Increase social connections and support"
                ],
                (Category.DEPRESSION, SeverityLevel.MODERATE): [
                    "Consult with a mental health professional",
                    "Explore both therapy and lifestyle adjustments"
                ],
                (Category.DEPRESSION, SeverityLevel.SEVERE): [
                    "Please seek immediate help from a mental health professional",
                    "Contact a crisis helpline if you're experiencing thoughts of self-harm"
                ]
            }
            
            return resources.get((category, severity), ["Consider discussing your feelings with a trusted person"])
        
        # Age-specific general recommendations
        age_recommendations = {
            AgeGroup.CHILD: [
                "Talk to a parent, teacher or school counselor about your feelings",
                "Remember that sharing your feelings is brave and helpful"
            ],
            AgeGroup.ADOLESCENT: [
                "Consider sharing your feelings with a trusted adult or school counselor",
                "Remember that many teens experience similar challenges"
            ],
            AgeGroup.ADULT: [
                "Consider speaking with your primary care provider about mental health resources",
                "Remember that seeking help is a sign of strength, not weakness"
            ]
        }
        
        # Add age-specific recommendations
        recommendations.extend(age_recommendations.get(age_group, []))
        
        # Add category-specific recommendations based on severity
        for category, score in scores.items():
            category_recs = get_resources(Category(category), score.severity)
            recommendations.extend(category_recs)
        
        # Deduplicate recommendations
        return list(set(recommendations))
    
    @staticmethod
    async def save_assessment(assessment: Assessment) -> str:
        """Save assessment results to the database"""
        assessment_dict = assessment.dict()
        result = await assessments_collection.insert_one(assessment_dict)
        return str(result.inserted_id)
    
    @staticmethod
    async def get_user_assessments(user_id: str, limit: int = 10) -> List[Assessment]:
        """Retrieve previous assessments for a user"""
        cursor = assessments_collection.find({"user_id": user_id}).sort("timestamp", -1).limit(limit)
        assessments = await cursor.to_list(length=limit)
        return [Assessment(**a) for a in assessments]
    
    @staticmethod
    async def calculate_overall_assessment(user_id: str, 
                                          responses: Dict[str, str], 
                                          age_group: AgeGroup,
                                          conversation_id: Optional[str] = None) -> Assessment:
        """Calculate an overall assessment based on all user responses"""
        scores = {}
        
        # Score each category based on relevant responses
        for category, response in responses.items():
            score = ScoringSystem.score_response(response, Category(category), age_group)
            scores[category] = score
        
        # Determine overall severity (highest severity from any category)
        severity_values = {
            SeverityLevel.MINIMAL: 1,
            SeverityLevel.MILD: 2,
            SeverityLevel.MODERATE: 3,
            SeverityLevel.SEVERE: 4
        }
        
        max_severity = max(scores.values(), key=lambda x: severity_values[x.severity]).severity
        
        # Generate recommendations
        recommendations = ScoringSystem.generate_recommendations(scores, age_group)
        
        # Create assessment object
        assessment = Assessment(
            user_id=user_id,
            timestamp=datetime.utcnow(),
            age_group=age_group,
            scores=scores,
            overall_severity=max_severity,
            recommendations=recommendations,
            conversation_id=conversation_id
        )
        
        # Save to database
        await ScoringSystem.save_assessment(assessment)
        
        return assessment