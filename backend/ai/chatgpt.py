"""ChatGPT Integration with Caching"""
import os
import json
import asyncio
from pathlib import Path
from datetime import datetime, timedelta
from emergentintegrations.llm.chat import LlmChat, UserMessage

CACHE_DIR = Path(__file__).parent / 'cache'
CACHE_DIR.mkdir(exist_ok=True)

def cache_get(key: str) -> dict:
    """Get cached response"""
    cache_file = CACHE_DIR / f"{key}.json"
    if not cache_file.exists():
        return None
    
    try:
        with open(cache_file, 'r') as f:
            obj = json.load(f)
        
        ttl_seconds = int(os.getenv('CACHE_TTL_SECONDS', 86400))
        cache_age = datetime.now().timestamp() - obj.get('_ts', 0)
        
        if cache_age > ttl_seconds:
            return None
        
        return obj.get('data')
    except:
        return None

def cache_set(key: str, data: dict):
    """Set cached response"""
    cache_file = CACHE_DIR / f"{key}.json"
    obj = {
        '_ts': datetime.now().timestamp(),
        'data': data
    }
    with open(cache_file, 'w') as f:
        json.dump(obj, f, indent=2)

async def get_ai_summary(analysis_result: dict) -> dict:
    """Get AI summary using Emergent LLM integration"""
    key = f"ai_{analysis_result.get('investor_id', 'unknown')}"
    
    # Check cache first
    cached = cache_get(key)
    if cached:
        return cached
    
    # Get API key
    api_key = os.getenv('EMERGENT_LLM_KEY')
    if not api_key:
        return {'summary': 'EMERGENT_LLM_KEY not configured'}
    
    # Prepare compact payload for token optimization
    payload = {
        'investor_id': analysis_result.get('investor_id'),
        'aum': analysis_result.get('performance', {}).get('value'),
        'gain_loss': analysis_result.get('performance', {}).get('gainLoss'),
        'alerts': [
            *[f"{a.get('type')}:{a.get('amc')}:{a.get('pct')}" 
              for a in analysis_result.get('concentration', {}).get('alerts', [])],
            *[a.get('scheme', '') for a in analysis_result.get('underperf_alert', [])]
        ],
        'diversification': analysis_result.get('diversification', {}).get('diversificationScore'),
        'risk_mismatch': analysis_result.get('risk_mismatch', {}).get('alert'),
        'churn_risk': analysis_result.get('churn_risk', {}).get('churnRisk')
    }
    
    prompt = f"""You are an AI financial assistant for mutual fund distributors. Given this compact JSON, produce:
1) A 2-3 line plain English summary of portfolio health
2) 2 actionable recommendations for the distributor to suggest to the client

JSON:
{json.dumps(payload, indent=2)}

Provide concise, professional advice focused on risk management and growth."""
    
    try:
        # Initialize LLM Chat
        chat = LlmChat(
            api_key=api_key,
            session_id=f"mf360_{analysis_result.get('investor_id')}",
            system_message="You are a financial advisor for mutual fund distributors."
        ).with_model("openai", os.getenv('AI_MODEL', 'gpt-4o-mini'))
        
        # Send message
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        result = {'summary': response}
        cache_set(key, result)
        return result
        
    except Exception as e:
        print(f"ChatGPT error: {str(e)}")
        return {'summary': f'AI temporarily unavailable: {str(e)}'}
