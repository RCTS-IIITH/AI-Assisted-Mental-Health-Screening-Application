from models.children import AddChildRequest, ChildRequest
import os
from motor.motor_asyncio import AsyncIOMotorClient
from typing import List, Optional
from dotenv import load_dotenv
load_dotenv()


async def connect_children_db():
    """Connect to MongoDB database for users"""
    try:
        connection_string = os.getenv("CONNECTION_STRING")
        if not connection_string:
            raise Exception("CONNECTION_STRING environment variable not set.")

        client = AsyncIOMotorClient(connection_string)
        db = client["children_db"]
        # Test connection
        await db.command('ping')
        return db

    except Exception as e:
        raise Exception(f"Error connecting to users database: {e}")


def get_child_by_id(db, child_id: str):
    """Fetch a child record by ID."""
    try:
        child = db.children.find_one({"_id": child_id})
        if not child:
            return None
        return {
            "id": str(child["_id"]),
            "name": child.get("name"),
            "dob": child.get("dob"),
            "school": child.get("school"),
            "parent_name": child.get("parent_name"),
            "parent_mobile": child.get("parent_mobile"),
            "teacher_name": child.get("teacher_name") or None,
        }
    except Exception as e:
        raise Exception(f"Error fetching child by ID {child_id}: {str(e)}")

def get_all_school_children(db):
    """Fetch all children records."""
    try:
        children = db.children.find()
        if not children:
            raise Exception("No children found in the database.")
        all_children = [child for child in children if child.get("school") is not None]
        return all_children
    except Exception as e:
        raise Exception(f"Error fetching all children: {str(e)}")

def get_child_by_school(db, school: str):
    """Fetch children records by school."""
    try:
        children = db.children.find({"school": school})
        if not children:
            raise Exception(f"No children found for school: {school}")
        return children
    except Exception as e:
        raise Exception(f"Error fetching children by school {school}: {str(e)}")