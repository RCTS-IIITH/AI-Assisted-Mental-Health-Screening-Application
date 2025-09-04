from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import Runnable
from langchain_core.output_parsers import StrOutputParser
import os
from dotenv import load_dotenv

load_dotenv()

def get_chain(llm, chat_history: dict = None, age: int = 15, question: str = "") -> Runnable:

    conversation = chat_history.get('conversation', [])
    
    # Format chat history for display
    conversation_text = "\n".join([f"- {conv}" for conv in conversation]) if conversation else "No previous conversation"
    
    # Fixed template with proper variable names and better structure
    prompt = ChatPromptTemplate.from_template(
        "You are a compassionate and thoughtful mental health professional.\n"
        "Your role is to gently guide the user through self-reflection and emotional awareness.\n\n"
        
        "Here is the previous conversation:\n{conversation_text}\n\n"
        
        "Additional context (if any):\n{context}\n\n"
        
        "The user's latest input was:\n{input}\n - Add a sentence of consolidation before asking the next question avoid doing this when user's input is '/start'.\n\n"
        
        "Now, based on everything above, **ask** the following question as a mental health professional would:\n\"{question}\"\n\n"
        "For Example: How do you feel about having relationships with others?\n"
        "For Example: Are you obedient with your eldrs?\n ect.\n\n"
        "Instructions:\n"
        "- Rephrase the question in an empathetic and non-intrusive way but **DONT LOSE THE MEANING**.\n"
        "- Avoid giving advice or answering the question yourself.\n"
        "- Keep it short, simple and emathatic.\n\n"
    )

    # Create the chain with proper variable binding
    def format_inputs(inputs):
        """Format inputs to match template variables"""
        return {
            "age": inputs.get("age", age),
            "conversation_text": conversation_text,
            "context": inputs.get("context", ""),
            "input": inputs.get("input", ""),
            "question": inputs.get("question", question)
        }
    
    # Create a runnable that formats inputs and passes them to the chain
    chain = (
        format_inputs |
        prompt | 
        llm | 
        StrOutputParser()
    )

    return chain