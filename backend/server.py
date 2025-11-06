from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional
import uuid
from datetime import datetime, timezone
import bcrypt
from ai.analysis import run_all_analysis
from ai.chatgpt import get_ai_summary
import subprocess

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI(title="MF360 API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# ==================== Models ====================

class UserSignup(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    name: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class InvestorListItem(BaseModel):
    investor_id: str
    name: str
    pan: str
    email: str
    mobile: str
    total_aum: float
    total_invested: float
    gain_loss_pct: float
    risk_profile: str

class AIAnalysisRequest(BaseModel):
    investor_id: str

class RunSeedResponse(BaseModel):
    success: bool
    message: str
    count: Optional[int] = None

# ==================== Auth Routes ====================

@api_router.post("/auth/signup")
async def signup(user_data: UserSignup):
    """Sign up a new user (MFD)"""
    # Check if user exists
    existing = await db.users.find_one({'email': user_data.email}, {'_id': 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_pw = bcrypt.hashpw(user_data.password.encode('utf-8'), bcrypt.gensalt())
    
    user = {
        'id': str(uuid.uuid4()),
        'email': user_data.email,
        'name': user_data.name,
        'password': hashed_pw.decode('utf-8'),
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.users.insert_one(user)
    
    return {
        'success': True,
        'data': {
            'id': user['id'],
            'email': user['email'],
            'name': user['name']
        }
    }

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    """Login user"""
    user = await db.users.find_one({'email': login_data.email}, {'_id': 0})
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Verify password
    if not bcrypt.checkpw(login_data.password.encode('utf-8'), user['password'].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {
        'success': True,
        'data': {
            'id': user['id'],
            'email': user['email'],
            'name': user['name'],
            'token': f"token_{user['id']}"  # Simple token for MVP
        }
    }

# ==================== Investor Routes ====================

@api_router.get("/investors")
async def get_investors(
    q: Optional[str] = Query(None, description="Search query"),
    minAum: Optional[float] = Query(None, description="Minimum AUM"),
    maxAum: Optional[float] = Query(None, description="Maximum AUM"),
    risk: Optional[str] = Query(None, description="Risk profile"),
    include_portfolios: Optional[bool] = Query(False, description="Include portfolio details")
):
    """Get list of investors with optional filters"""
    query = {}
    
    if q:
        query['$or'] = [
            {'name': {'$regex': q, '$options': 'i'}},
            {'email': {'$regex': q, '$options': 'i'}},
            {'pan': {'$regex': q, '$options': 'i'}}
        ]
    
    if minAum is not None:
        query['total_aum'] = query.get('total_aum', {})
        query['total_aum']['$gte'] = minAum
    
    if maxAum is not None:
        query['total_aum'] = query.get('total_aum', {})
        query['total_aum']['$lte'] = maxAum
    
    if risk:
        query['risk_profile'] = risk
    
    # Projection based on include_portfolios parameter
    if include_portfolios:
        projection = {'_id': 0}  # Include everything except _id
    else:
        projection = {
            '_id': 0,
            'investor_id': 1,
            'name': 1,
            'pan': 1,
            'email': 1,
            'mobile': 1,
            'total_aum': 1,
            'total_invested': 1,
            'gain_loss_pct': 1,
            'risk_profile': 1,
            'onboarding_date': 1
        }
    
    investors = await db.investors.find(query, projection).to_list(1000)
    
    return {'success': True, 'data': investors, 'count': len(investors)}

@api_router.get("/investors/{investor_id}")
async def get_investor_detail(investor_id: str):
    """Get detailed investor information"""
    investor = await db.investors.find_one(
        {'investor_id': investor_id},
        {'_id': 0}
    )
    
    if not investor:
        raise HTTPException(status_code=404, detail="Investor not found")
    
    return {'success': True, 'data': investor}

# ==================== AI Routes ====================

@api_router.post("/ai/run/{investor_id}")
async def run_ai_analysis(investor_id: str):
    """Run AI analysis for a single investor"""
    investor = await db.investors.find_one(
        {'investor_id': investor_id},
        {'_id': 0}
    )
    
    if not investor:
        raise HTTPException(status_code=404, detail="Investor not found")
    
    # Run all 20 AI algorithms
    analysis_result = run_all_analysis(investor)
    
    # Get ChatGPT summary
    ai_summary = await get_ai_summary(analysis_result)
    
    # Store analysis result
    analysis_doc = {
        'investor_id': investor_id,
        'analysis_result': analysis_result,
        'ai_summary': ai_summary,
        'created_at': datetime.now(timezone.utc).isoformat()
    }
    
    await db.ai_analyses.update_one(
        {'investor_id': investor_id},
        {'$set': analysis_doc},
        upsert=True
    )
    
    return {
        'success': True,
        'data': {
            'analysis': analysis_result,
            'summary': ai_summary
        }
    }

@api_router.post("/ai/run-bulk")
async def run_bulk_analysis(
    limit: Optional[int] = Query(10, description="Max investors to analyze")
):
    """Run AI analysis for multiple investors (with rate limiting)"""
    investors = await db.investors.find({}, {'_id': 0}).to_list(limit)
    
    results = []
    for investor in investors:
        try:
            analysis_result = run_all_analysis(investor)
            ai_summary = await get_ai_summary(analysis_result)
            
            results.append({
                'investor_id': investor['investor_id'],
                'status': 'success',
                'analysis': analysis_result,
                'summary': ai_summary
            })
            
            # Store result
            await db.ai_analyses.update_one(
                {'investor_id': investor['investor_id']},
                {'$set': {
                    'investor_id': investor['investor_id'],
                    'analysis_result': analysis_result,
                    'ai_summary': ai_summary,
                    'created_at': datetime.now(timezone.utc).isoformat()
                }},
                upsert=True
            )
        except Exception as e:
            results.append({
                'investor_id': investor.get('investor_id', 'unknown'),
                'status': 'error',
                'error': str(e)
            })
    
    return {'success': True, 'data': results, 'count': len(results)}

@api_router.get("/ai/summary/{investor_id}")
async def get_ai_summary_cached(investor_id: str):
    """Get cached AI summary for investor"""
    analysis = await db.ai_analyses.find_one(
        {'investor_id': investor_id},
        {'_id': 0}
    )
    
    if not analysis:
        raise HTTPException(status_code=404, detail="No analysis found. Run analysis first.")
    
    return {'success': True, 'data': analysis}

# ==================== Seed Routes ====================

@api_router.post("/seed/run", response_model=RunSeedResponse)
async def run_seed():
    """Run seeding script to generate 300 investors"""
    try:
        result = subprocess.run(
            ['python3', str(ROOT_DIR / 'seed_data.py')],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        if result.returncode == 0:
            count = await db.investors.count_documents({})
            return RunSeedResponse(
                success=True,
                message='Seeding completed successfully',
                count=count
            )
        else:
            raise HTTPException(
                status_code=500,
                detail=f"Seeding failed: {result.stderr}"
            )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error running seed script: {str(e)}"
        )

@api_router.get("/seed/status")
async def get_seed_status():
    """Check if database is seeded"""
    count = await db.investors.count_documents({})
    return {
        'success': True,
        'data': {
            'seeded': count > 0,
            'investor_count': count
        }
    }

# ==================== Root Route ====================

@api_router.get("/")
async def root():
    return {'message': 'MF360 API - Mutual Fund Analytics Platform'}

@api_router.get("/health")
async def health_check():
    return {'status': 'healthy', 'service': 'MF360'}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()