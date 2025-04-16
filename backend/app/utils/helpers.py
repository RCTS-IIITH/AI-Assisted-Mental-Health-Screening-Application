from bson.objectid import ObjectId
import datetime

def make_json_serializable(data):
    """
    Convert MongoDB documents to JSON serializable format
    
    Args:
        data (list): List of MongoDB documents
        
    Returns:
        list: JSON serializable documents
    """
    data = [item for item in data if item is not None]
    for item in data:
        if "_id" in item:
            item["_id"] = str(item["_id"])
        if "questionnaire_id" in item:
            item["questionnaire_id"] = str(item["questionnaire_id"])
        if "created_at" in item:
            item["created_at"] = item["created_at"].isoformat()
        if "updated_at" in item:
            item["updated_at"] = item["updated_at"].isoformat()
    return data

def validate_object_id(id_str):
    """
    Validate if a string is a valid MongoDB ObjectId
    
    Args:
        id_str (str): String to validate
        
    Returns:
        bool: True if valid, False otherwise
    """
    try:
        ObjectId(id_str)
        return True
    except:
        return False

def run_function(func_string, funcinput, funcname="my_function"):
    """
    Safely execute a function string with given input
    
    Args:
        func_string (str): String containing function definition
        funcinput: Input to pass to the function
        funcname (str): Name of the function to execute
        
    Returns:
        The result of the function execution
    """
    try:
        # Execute the function definition in a new namespace
        namespace = {}
        exec(func_string, namespace)
        
        # Get and call the function
        if funcname in namespace:
            func = namespace[funcname]
            return func(funcinput)
        else:
            return f"Function '{funcname}' not found."
    except Exception as e:
        return f"Error executing function: {str(e)}" 