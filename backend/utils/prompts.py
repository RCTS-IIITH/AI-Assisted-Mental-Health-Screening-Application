from typing import Dict, List, Optional, Any
from services.age_based_query import AgeGroup  # Changed to direct import

class PromptTemplates:
    """Collection of prompt templates for different contexts and age groups"""
    
    @staticmethod
    def system_prompt(age_group: AgeGroup) -> str:
        """Generate appropriate system prompt based on age group"""
        base_prompt = (
            "You are a mental health screening assistant designed to have supportive, "
            "empathetic conversations about mental health. Your goal is to gather information "
            "to help assess the person's mental well-being while providing a safe, non-judgmental space. "
            "Remember that you are NOT providing therapy or diagnosis, only conducting an initial screening. "
            "If you detect serious concerns, recommend professional help."
        )
        
        age_specific_additions = {
            AgeGroup.CHILD: (
                "You are speaking with a child between 8-12 years old. Use simple, clear language. "
                "Be gentle, supportive, and occasionally use light-hearted elements to keep them engaged. "
                "Focus on feelings, friends, family, and school. Avoid complex psychological terms. "
                "If you detect concerning responses about safety, bullying, or severe distress, remind them "
                "that talking to a trusted adult like a parent, teacher, or school counselor is important."
            ),
            AgeGroup.ADOLESCENT: (
                "You are speaking with an adolescent between 13-17 years old. Use age-appropriate language "
                "that isn't too simplistic or too clinical. Acknowledge the unique challenges of teenage years. "
                "Cover topics like mood, stress, relationships, school, and future concerns. "
                "Validate their feelings and experiences. If you detect concerning responses about "
                "self-harm, substance use, or severe distress, encourage speaking with a trusted adult, "
                "school counselor, or appropriate helpline."
            ),
            AgeGroup.ADULT: (
                "You are speaking with an adult. Use professional but conversational language. "
                "Ask about mood, anxiety, stress, sleep, relationships, work-life balance, and coping mechanisms. "
                "Be respectful of their autonomy while providing evidence-based information. "
                "If you detect concerning responses about self-harm, suicide, or severe impairment in functioning, "
                "recommend immediate professional support and provide crisis resources."
            )
        }
        
        return f"{base_prompt}\n\n{age_specific_additions.get(age_group, '')}"
    
    @staticmethod
    def conversation_starter(age_group: AgeGroup) -> str:
        """Generate a conversation starter based on age group"""
        starters = {
            AgeGroup.CHILD: (
                "Hi there! I'm here to chat with you about how you're feeling. "
                "There are no right or wrong answers - I'm just here to listen and maybe help you understand "
                "your feelings better. Would you like to tell me a bit about how you're feeling today?"
            ),
            AgeGroup.ADOLESCENT: (
                "Hey there! I'm here to chat about how you're doing mentally and emotionally. "
                "Everything we talk about is private, and I'm here to listen without judgment. "
                "Would you feel comfortable sharing a bit about how things have been going for you lately?"
            ),
            AgeGroup.ADULT: (
                "Hello! I'm here to have a conversation about your mental wellbeing. "
                "This is a confidential screening to help understand how you're doing emotionally. "
                "Would you be willing to share how you've been feeling recently, both mentally and emotionally?"
            )
        }
        
        return starters.get(age_group, starters[AgeGroup.ADULT])
    
    @staticmethod
    def follow_up_prompt(category: str, previous_response: str, age_group: AgeGroup) -> str:
        """Generate a follow-up prompt based on category, previous response, and age group"""
        category_prompts = {
            "anxiety": {
                AgeGroup.CHILD: "What kinds of things make you feel worried or scared?",
                AgeGroup.ADOLESCENT: "Can you tell me more about situations that make you feel anxious or overwhelmed?",
                AgeGroup.ADULT: "Could you elaborate on experiences where you feel anxious, and how these affect your daily life?"
            },
            "depression": {
                AgeGroup.CHILD: "Do you ever feel really sad or not want to do fun things anymore?",
                AgeGroup.ADOLESCENT: "Have you been feeling down or hopeless? Has it affected your interest in activities you used to enjoy?",
                AgeGroup.ADULT: "Have you experienced persistent feelings of sadness or emptiness? How has this affected your motivation or interest in activities?"
            },
            "general": {
                AgeGroup.CHILD: "What kinds of things make you happy? And what things make you feel upset?",
                AgeGroup.ADOLESCENT: "What aspects of your life bring you joy, and what aspects have been challenging lately?",
                AgeGroup.ADULT: "Which areas of your life provide fulfillment, and which areas have been sources of stress?"
            }
        }
        
        return category_prompts.get(category, {}).get(age_group, "Can you tell me more about that?")
    
    @staticmethod
    def assessment_instruction(age_group: AgeGroup) -> str:
        """Generate instruction for the LLM to assess responses"""
        base_instruction = (
            "Based on the conversation history, provide an assessment of the person's mental health indicators. "
            "Focus on signs of anxiety, depression, and overall stress. Rate each category on a scale from 1-10, "
            "where 1 is minimal concern and 10 is severe concern. Include brief reasoning for each rating. "
            "This assessment is for screening purposes only and not a clinical diagnosis."
        )
        
        age_specific_additions = {
            AgeGroup.CHILD: (
                "Remember this is a child (8-12), so consider age-appropriate developmental factors. "
                "Look for expressions of worry, sadness, changes in behavior, problems with friends or school, "
                "and impacts on daily activities like play, sleep, or appetite."
            ),
            AgeGroup.ADOLESCENT: (
                "Remember this is an adolescent (13-17), so consider age-appropriate developmental factors. "
                "Look for expressions of anxiety, mood changes, social concerns, academic pressure, "
                "identity issues, and impacts on relationships, school performance, and activities."
            ),
            AgeGroup.ADULT: (
                "Consider adult stressors and functioning across domains like work, relationships, and self-care. "
                "Look for expressions of anxiety, depressed mood, changes in energy or motivation, "
                "difficulty coping, and impacts on daily functioning and quality of life."
            )
        }
        
        return f"{base_instruction}\n\n{age_specific_additions.get(age_group, '')}"
    
    @staticmethod
    def summarize_conversation(age_group: AgeGroup) -> str:
        """Generate prompt to summarize a conversation"""
        return (
            "Please provide a concise summary of this mental health screening conversation. "
            "Include key points discussed, main concerns expressed, and overall impression. "
            "The summary should be professional and objective, suitable for clinical notes."
        )