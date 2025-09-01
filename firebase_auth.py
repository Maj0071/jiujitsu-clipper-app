# firebase_auth.py
import os
import json
import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional, Dict, Any

# Initialize Firebase Admin SDK
def initialize_firebase():
    """Initialize Firebase Admin SDK with service account"""
    try:
        # Try to get service account from environment variable
        service_account_key = os.getenv("FIREBASE_SERVICE_ACCOUNT_KEY")
        
        if service_account_key:
            # If it's a JSON string, parse it
            if isinstance(service_account_key, str):
                service_account_info = json.loads(service_account_key)
                cred = credentials.Certificate(service_account_info)
            else:
                cred = credentials.Certificate(service_account_key)
        else:
            # Try to load from file
            service_account_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH", "firebase-service-account.json")
            if os.path.exists(service_account_path):
                cred = credentials.Certificate(service_account_path)
            else:
                print("Warning: No Firebase service account found. Using application default credentials.")
                cred = credentials.ApplicationDefault()
        
        # Initialize Firebase Admin SDK
        if not firebase_admin._apps:
            firebase_admin.initialize_app(cred)
            print("Firebase Admin SDK initialized successfully")
        
        return True
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
        print("JWT validation will be disabled in development mode")
        return False

# Initialize Firebase when module loads
FIREBASE_INITIALIZED = initialize_firebase()

# Security bearer token
security = HTTPBearer(auto_error=False)

class FirebaseUser:
    """Represents an authenticated Firebase user"""
    def __init__(self, uid: str, email: str, custom_claims: Dict[str, Any] = None):
        self.uid = uid
        self.email = email
        self.custom_claims = custom_claims or {}
        
    @property
    def is_coach(self) -> bool:
        """Check if user has coach role"""
        return self.custom_claims.get("role") == "coach"
    
    @property
    def is_student(self) -> bool:
        """Check if user has student role"""
        return self.custom_claims.get("role") == "student"

async def verify_firebase_token(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[FirebaseUser]:
    """
    Verify Firebase JWT token and return user info
    Returns None in development mode if Firebase is not configured
    """
    if not credentials:
        raise HTTPException(
            status_code=401,
            detail="Authorization header missing"
        )
    
    if not FIREBASE_INITIALIZED:
        # Development mode - return a mock user
        print("Development mode: Skipping JWT validation")
        return FirebaseUser(
            uid="dev-user-123",
            email="dev@example.com",
            custom_claims={"role": "coach"}  # Default to coach in dev mode
        )
    
    try:
        # Verify the token
        decoded_token = auth.verify_id_token(credentials.credentials)
        
        # Get user info
        uid = decoded_token.get("uid")
        email = decoded_token.get("email", "")
        
        # Get custom claims (roles, permissions, etc.)
        custom_claims = decoded_token.get("custom_claims", {})
        
        return FirebaseUser(
            uid=uid,
            email=email,
            custom_claims=custom_claims
        )
        
    except auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=401,
            detail="Token has expired"
        )
    except auth.RevokedIdTokenError:
        raise HTTPException(
            status_code=401,
            detail="Token has been revoked"
        )
    except auth.InvalidIdTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )
    except Exception as e:
        print(f"Token verification error: {e}")
        raise HTTPException(
            status_code=401,
            detail="Token verification failed"
        )

async def require_coach(user: FirebaseUser = Depends(verify_firebase_token)) -> FirebaseUser:
    """Require user to be a coach"""
    if not user.is_coach and FIREBASE_INITIALIZED:
        raise HTTPException(
            status_code=403,
            detail="Coach access required"
        )
    return user

async def require_student(user: FirebaseUser = Depends(verify_firebase_token)) -> FirebaseUser:
    """Require user to be a student"""
    if not user.is_student and FIREBASE_INITIALIZED:
        raise HTTPException(
            status_code=403,
            detail="Student access required"
        )
    return user

async def require_coach_or_student(user: FirebaseUser = Depends(verify_firebase_token)) -> FirebaseUser:
    """Allow both coaches and students"""
    return user

def verify_coach_access(user: FirebaseUser, coach_id: str) -> bool:
    """Verify that the user can access this coach's resources"""
    if not FIREBASE_INITIALIZED:
        return True  # Allow in development mode
        
    # User can access their own resources
    if user.uid == coach_id:
        return True
    
    # TODO: Add logic for admin users or collaboration permissions
    
    return False

def verify_student_access(user: FirebaseUser, student_id: str) -> bool:
    """Verify that the user can access this student's resources"""
    if not FIREBASE_INITIALIZED:
        return True  # Allow in development mode
        
    # User can access their own resources
    if user.uid == student_id:
        return True
    
    # TODO: Add logic for coaches who have students
    
    return False