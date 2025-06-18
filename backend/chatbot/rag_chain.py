from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain.chains import create_retrieval_chain
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import Runnable
from langchain_core.output_parsers import StrOutputParser
import os
from dotenv import load_dotenv

load_dotenv()

def get_chain(llm, chat_history = dict, age=15) -> Runnable:
    # retriever = vector_index.vectorstore.as_retriever()
    responses = chat_history['responses']
    follow_up_responses = chat_history['follow_up_responses']
    conversation = chat_history['conversation']
    # Modified prompt to include chat history for context
    prompt = ChatPromptTemplate.from_template(
        "You are a friendly and knowledgeable AI assistant designed to answer user's queries.\n\n"
        "The Users are of age {age} so answer accordingly.\n\n"
        
        "Responses so far:\n{{responses}}\n\n"
        "follow up Responses so far:\n{{follow_up_responses}}[can be empty]\n\n"
        "Previous conversation:\n{{conversation}} [can be empty]\n\n"
        "<context>\n{context}\n</context>\n\n"
        "User says: {input}\n\n"
        "Respond empathetically. Don't ask same question again consider your chat_history"
    )

    # Use modern LangChain syntax: prompt | llm | parser
    chain = prompt | llm | StrOutputParser()

    return chain