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
from datetime import datetime, timezone, timedelta
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

# ==================== Dashboard Analytics Routes ====================

@api_router.get("/dashboard/analytics")
async def get_dashboard_analytics():
    """Get comprehensive dashboard analytics including SIP insights and investor segmentation"""
    try:
        # Fetch all investors with portfolios
        investors = await db.investors.find({}, {'_id': 0}).to_list(None)
        
        if not investors or len(investors) == 0:
            return {
                'success': True,
                'data': {
                    'needsSeeding': True
                }
            }
        
        now = datetime.now(timezone.utc)
        
        # Initialize analytics data
        analytics = {
            'sip_status': {
                'active': 0,
                'paused': 0,
                'stopped': 0
            },
            'monthly_sip_inflow': [],
            'average_sip_ticket_size': 0,
            'top_sip_investors': [],
            'upcoming_sip_expiry': [],
            'profit_loss_split': {
                'profit': 0,
                'loss': 0
            },
            'high_potential_investors': []
        }
        
        # Collect all SIP data and transaction data
        sip_portfolios = []
        sip_transactions_by_month = {}
        investor_sip_totals = {}
        
        for investor in investors:
            investor_sip_value = 0
            investor_redemptions = 0
            
            # Calculate profit/loss split
            if investor.get('gain_loss_pct', 0) >= 0:
                analytics['profit_loss_split']['profit'] += 1
            else:
                analytics['profit_loss_split']['loss'] += 1
            
            if not investor.get('portfolios'):
                continue
                
            for portfolio in investor['portfolios']:
                if portfolio.get('sip_flag'):
                    sip_portfolios.append({
                        'investor_id': investor['investor_id'],
                        'investor_name': investor['name'],
                        'portfolio': portfolio,
                        'investor_onboarding': investor.get('onboarding_date')
                    })
                    investor_sip_value += portfolio.get('current_value', 0)
                    
                    # Determine SIP status
                    last_sip_date_str = portfolio.get('last_sip_payment_date')
                    sip_freq = portfolio.get('sip_freq', 'Monthly')
                    
                    if last_sip_date_str:
                        try:
                            last_sip_date = datetime.fromisoformat(last_sip_date_str.replace('Z', '+00:00'))
                            days_since_last = (now - last_sip_date).days
                            
                            # Determine status based on frequency
                            if sip_freq == 'Monthly':
                                if days_since_last <= 35:
                                    analytics['sip_status']['active'] += 1
                                elif days_since_last <= 180:
                                    analytics['sip_status']['paused'] += 1
                                else:
                                    analytics['sip_status']['stopped'] += 1
                            else:  # Quarterly
                                if days_since_last <= 100:
                                    analytics['sip_status']['active'] += 1
                                elif days_since_last <= 180:
                                    analytics['sip_status']['paused'] += 1
                                else:
                                    analytics['sip_status']['stopped'] += 1
                        except:
                            analytics['sip_status']['stopped'] += 1
                    else:
                        analytics['sip_status']['stopped'] += 1
                    
                    # Check for upcoming expiry (within 3 months)
                    next_due_str = portfolio.get('next_due_date')
                    if next_due_str:
                        try:
                            next_due = datetime.fromisoformat(next_due_str.replace('Z', '+00:00'))
                            days_until_due = (next_due - now).days
                            
                            if 0 <= days_until_due <= 90:
                                analytics['upcoming_sip_expiry'].append({
                                    'investor_id': investor['investor_id'],
                                    'investor_name': investor['name'],
                                    'scheme_name': portfolio.get('scheme_name'),
                                    'next_due_date': next_due_str,
                                    'days_until_due': days_until_due,
                                    'sip_amount': portfolio.get('invested_amount', 0)
                                })
                        except:
                            pass
                
                # Count transactions for high-potential logic and SIP inflow
                if portfolio.get('transactions'):
                    for txn in portfolio['transactions']:
                        if txn.get('txn_type') == 'Sell':
                            investor_redemptions += 1
                        
                        # Track SIP transactions by month
                        if txn.get('txn_type') == 'SIP':
                            try:
                                txn_date = datetime.fromisoformat(txn['txn_date'].replace('Z', '+00:00'))
                                month_key = txn_date.strftime('%Y-%m')
                                sip_transactions_by_month[month_key] = sip_transactions_by_month.get(month_key, 0) + txn.get('txn_amount', 0)
                            except:
                                pass
            
            # Store investor SIP totals
            if investor_sip_value > 0:
                investor_sip_totals[investor['investor_id']] = {
                    'investor_id': investor['investor_id'],
                    'name': investor['name'],
                    'total_sip_value': investor_sip_value,
                    'redemptions': investor_redemptions,
                    'onboarding_date': investor.get('onboarding_date'),
                    'gain_loss_pct': investor.get('gain_loss_pct', 0)
                }
        
        # Calculate average SIP ticket size
        if sip_portfolios:
            total_sip_value = sum(p['portfolio'].get('current_value', 0) for p in sip_portfolios)
            analytics['average_sip_ticket_size'] = round(total_sip_value / len(sip_portfolios), 2)
        
        # Top 10 SIP investors
        top_sip = sorted(investor_sip_totals.values(), key=lambda x: x['total_sip_value'], reverse=True)[:10]
        analytics['top_sip_investors'] = [
            {
                'investor_id': inv['investor_id'],
                'name': inv['name'],
                'total_sip_value': round(inv['total_sip_value'], 2)
            }
            for inv in top_sip
        ]
        
        # Monthly SIP inflow for last 12 months
        monthly_inflow = []
        for i in range(11, -1, -1):
            month_date = now - timedelta(days=i * 30)
            month_key = month_date.strftime('%Y-%m')
            inflow = sip_transactions_by_month.get(month_key, 0)
            monthly_inflow.append({
                'month': month_date.strftime('%b %Y'),
                'inflow': round(inflow, 2)
            })
        analytics['monthly_sip_inflow'] = monthly_inflow
        
        # High-potential investors (long-term, minimal redemptions, positive returns)
        six_months_ago = now - timedelta(days=180)
        for inv_data in investor_sip_totals.values():
            try:
                onboarding = datetime.fromisoformat(inv_data['onboarding_date'].replace('Z', '+00:00'))
                if (onboarding < six_months_ago and 
                    inv_data['redemptions'] <= 2 and 
                    inv_data['gain_loss_pct'] > 0):
                    analytics['high_potential_investors'].append({
                        'investor_id': inv_data['investor_id'],
                        'name': inv_data['name'],
                        'total_sip_value': round(inv_data['total_sip_value'], 2),
                        'gain_loss_pct': inv_data['gain_loss_pct'],
                        'redemptions': inv_data['redemptions']
                    })
            except:
                pass
        
        # Sort high-potential by gain_loss_pct
        analytics['high_potential_investors'] = sorted(
            analytics['high_potential_investors'], 
            key=lambda x: x['gain_loss_pct'], 
            reverse=True
        )[:10]
        
        # Sort upcoming expiry by days
        analytics['upcoming_sip_expiry'] = sorted(
            analytics['upcoming_sip_expiry'],
            key=lambda x: x['days_until_due']
        )[:10]
        
        return {'success': True, 'data': analytics}
        
    except Exception as e:
        logging.error(f"Error calculating dashboard analytics: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating analytics: {str(e)}"
        )

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