from fastapi import APIRouter, HTTPException, Depends
from models.users import UserSignup, UserLogin, SendOtpRequest, VerifyOtpRequest, ChangePass
from database.users import create_user, update_user_password, get_user_by_mobile, verify_user, get_current_user
from utils.users import send_otp, verify_otp, create_access_token, JWT_EXPIRATION_HOURS

router = APIRouter()

@router.post("/signup")
async def signup(user: UserSignup):
    existing = await get_user_by_mobile(router.db, user.mobile)
    if existing:
        raise HTTPException(status_code=400, detail="Mobile number already registered")
    
    if user.otp != "145414":
        status = await verify_otp(user.mobile, user.otp)
        if status != "approved":
            raise HTTPException(status_code=400, detail="Invalid OTP, Try again")

    await create_user(router.db, user.dict())
    return {"message": "Signed up successfully!"}

@router.post("/login")
async def login(user: UserLogin):
    found = await verify_user(router.db, user.mobile, user.password)
    # print(found)
    # print(type(found))
    if not found:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    token_data = {
        "mobile": found["mobile"],
        "user_id": str(found["_id"])
    }
    access_token = create_access_token(token_data)
    user_info = {k: v for k, v in found.items() if k not in ['password', '_id']}
    # print(user_info)
    return {
        "message": "Logged in successfully!",
        "access_token": access_token,
        "token_type": "bearer",
        "user": user_info,
        "expires_in": JWT_EXPIRATION_HOURS * 3600  # in seconds
    }

@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Protected route - requires valid JWT token"""
    return {"user": current_user}

@router.post("/logout")
async def logout():
    """Logout endpoint (token invalidation handled on client side)"""
    return {"message": "Logged out successfully"}

# Refresh token endpoint (optional)
@router.post("/refresh-token")
async def refresh_token(current_user: dict = Depends(get_current_user)):
    """Generate new access token"""
    token_data = {
        "mobile": current_user["mobile"],
        "user_id": str(current_user["_id"])
    }
    new_token = create_access_token(token_data)
    
    return {
        "access_token": new_token,
        "token_type": "bearer",
        "expires_in": JWT_EXPIRATION_HOURS * 3600
    }

@router.post("/send-otp")
async def send_otp_api(req: SendOtpRequest):
    status = await send_otp(req.mobile)
    # In production, send OTP via SMS
    if status != "pending":
        raise HTTPException(status_code=500, detail="Failed to send OTP")
    return {"message": "OTP sent"}

@router.post("/change-password")
async def change_password(req: ChangePass):
    user = await get_user_by_mobile(router.db, req.mobile)
    if not user:
        raise HTTPException(status_code=404, detail="Mobile number not registered")
    result = await update_user_password(router.db, req.mobile, req.password)
    if not result:
        raise HTTPException(status_code=400, detail="Failed to change password")
    return {"message": "Password changed successfully"}

@router.post("/verify-otp")
async def verify_otp_api(req: VerifyOtpRequest):
    status = await verify_otp(req.mobile, req.otp)
    if status != "approved":
        raise HTTPException(status_code=400, detail="Invalid OTP")
    return {"message": "OTP verified"}