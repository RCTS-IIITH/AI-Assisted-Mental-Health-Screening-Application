from fastapi import APIRouter, HTTPException
from models.children import AddChildRequest, ChildRequest, GetChildren
from utils.utils import MODELS, db
import logging
from datetime import datetime
from bson import ObjectId

router = APIRouter()
logger = logging.getLogger(__name__)

@router.post("/add-child")
async def addChild(request: AddChildRequest):
    existing = await router.dbc.children.find_one({"name": request.name, "dob": request.dob})
    if existing:
        raise HTTPException(status_code=400, detail="Child with this name and date of birth already exists")
    
    child_data = request.dict()
    # dob = yyyy-mm-dd
    child_data["age"] = datetime.now().year - int(child_data["dob"].split("-")[0])
    child_data["created_at"] = child_data["updated_at"] = datetime.now()
    await router.dbc.children.insert_one(child_data)
    return {"message": "Child added successfully", "child_id": str(child_data["_id"])}

@router.post("/children")
async def getChildren(req: GetChildren):
    mobile = req.mobile
    children = await router.dbc.children.find(
        {"parent_mobile": mobile},
    ).to_list(length=None)

    for child in children:
        child["_id"] = str(child["_id"])
    
    return {"children": children}

@router.post("/delete-child")
async def deleteChild(req: ChildRequest):
    child_id = req.child_id
    if not child_id:
        raise HTTPException(status_code=400, detail="Child ID is required")
    
    result = await router.dbc.children.delete_one({"_id": ObjectId(child_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail=f"Child with ID '{child_id}' not found")
    
    return {"message": "Child deleted successfully"}
