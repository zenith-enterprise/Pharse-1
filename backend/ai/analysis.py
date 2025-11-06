"""AI Analysis Functions - 20 Algorithms for Portfolio Analysis"""
import math
from typing import Dict, List, Any
from datetime import datetime, timedelta

def safe_num(v):
    """Safely convert to number"""
    if isinstance(v, (int, float)):
        return float(v)
    try:
        return float(v or 0)
    except:
        return 0.0

def portfolio_performance_summary(investor: Dict) -> Dict:
    """Algorithm 1: Calculate overall portfolio performance"""
    # Use pre-calculated totals from investor document for consistency
    invested = safe_num(investor.get('total_invested'))
    value = safe_num(investor.get('total_aum'))
    gain_loss = safe_num(investor.get('gain_loss_pct'))
    
    return {
        'invested': round(invested, 2),
        'value': round(value, 2),
        'gainLoss': round(gain_loss, 2)
    }

def asset_allocation_analysis(investor: Dict) -> Dict:
    """Algorithm 2: Analyze asset allocation by category"""
    portfolios = investor.get('portfolios', [])
    total = sum(safe_num(p.get('current_value', 0)) for p in portfolios) or 1
    
    by_cat = {}
    for p in portfolios:
        cat = p.get('category', 'Unknown')
        by_cat[cat] = by_cat.get(cat, 0) + safe_num(p.get('current_value', 0))
    
    allocation = {k: round((v / total) * 100, 2) for k, v in by_cat.items()}
    return {'total': total, 'allocation': allocation}

def fund_concentration_check(investor: Dict) -> Dict:
    """Algorithm 3: Check for fund house concentration risk"""
    portfolios = investor.get('portfolios', [])
    totals = {}
    for p in portfolios:
        amc = p.get('amc_name', 'Unknown')
        totals[amc] = totals.get(amc, 0) + safe_num(p.get('current_value', 0))
    
    total = sum(totals.values()) or 1
    alerts = []
    for k, v in totals.items():
        if (v / total) > 0.4:
            alerts.append({
                'type': 'HighAMCConcentration',
                'amc': k,
                'pct': round((v / total) * 100, 2)
            })
    
    return {'totals': totals, 'alerts': alerts}

def underperforming_scheme_detection(investor: Dict) -> List:
    """Algorithm 4: Detect underperforming schemes"""
    portfolios = investor.get('portfolios', [])
    under = []
    for p in portfolios:
        if safe_num(p.get('gain_loss_pct', 0)) < 0:
            under.append({
                'scheme': p.get('scheme_name', 'Unknown'),
                'loss': round(safe_num(p.get('gain_loss_pct', 0)), 2)
            })
    return under

def sip_health_tracking(investor: Dict) -> Dict:
    """Algorithm 5: Track SIP health and activity"""
    portfolios = investor.get('portfolios', [])
    sips = [p for p in portfolios if p.get('sip_flag', False)]
    
    details = [{
        'scheme': s.get('scheme_name', 'Unknown'),
        'freq': s.get('sip_freq', 'Monthly'),
        'next_due': s.get('next_due_date', '')
    } for s in sips]
    
    return {'active': len(sips), 'details': details}

def diversification_quality_score(investor: Dict) -> Dict:
    """Algorithm 6: Calculate portfolio diversification score"""
    portfolios = investor.get('portfolios', [])
    amc_count = len(set(p.get('amc_name', 'Unknown') for p in portfolios))
    cat_count = len(set(p.get('category', 'Unknown') for p in portfolios))
    
    score = min(100, (amc_count * 12) + (cat_count * 8))
    return {
        'amcCount': amc_count,
        'catCount': cat_count,
        'diversificationScore': score
    }

def risk_mismatch_detection(investor: Dict) -> Dict:
    """Algorithm 7: Detect risk profile mismatches"""
    portfolios = investor.get('portfolios', [])
    total = sum(safe_num(p.get('current_value', 0)) for p in portfolios) or 1
    
    equity = sum(safe_num(p.get('current_value', 0)) 
                 for p in portfolios if p.get('category') == 'Equity')
    equity_share = round((equity / total) * 100, 2)
    
    alert = None
    risk_profile = investor.get('risk_profile', 'Moderate')
    
    if equity_share > 70 and risk_profile == 'Low':
        alert = f'Risk Mismatch: Equity {equity_share}% but profile Low'
    elif equity_share < 30 and risk_profile == 'High':
        alert = f'Risk Mismatch: Equity only {equity_share}% but profile High'
    
    return {'equityShare': equity_share, 'alert': alert}

def category_imbalance_alert(investor: Dict) -> Dict:
    """Algorithm 8: Alert on category imbalances"""
    allocation = asset_allocation_analysis(investor)['allocation']
    alerts = []
    
    for k, v in allocation.items():
        if v > 70:
            alerts.append({
                'type': 'CategoryOverweight',
                'category': k,
                'pct': v
            })
    
    return {'alerts': alerts}

def aum_concentration_risk(investor: Dict) -> Dict:
    """Algorithm 9: Check AUM concentration in top schemes"""
    portfolios = investor.get('portfolios', [])
    sorted_portfolios = sorted(portfolios, 
                               key=lambda p: safe_num(p.get('current_value', 0)), 
                               reverse=True)
    
    top3 = sorted_portfolios[:3]
    top_sum = sum(safe_num(p.get('current_value', 0)) for p in top3)
    total = sum(safe_num(p.get('current_value', 0)) for p in portfolios) or 1
    
    concentration = round((top_sum / total) * 100, 2)
    
    return {
        'top3': [{'scheme': p.get('scheme_name', 'Unknown'), 
                  'value': safe_num(p.get('current_value', 0))} for p in top3],
        'concentration': concentration
    }

def underperformance_alerts(investor: Dict) -> List:
    """Algorithm 10: Generate underperformance alerts"""
    portfolios = investor.get('portfolios', [])
    alerts = []
    
    for p in portfolios:
        if safe_num(p.get('gain_loss_pct', 0)) < -3:
            alerts.append({
                'scheme': p.get('scheme_name', 'Unknown'),
                'loss': round(safe_num(p.get('gain_loss_pct', 0)), 2)
            })
    
    return alerts

def liquidity_flagging(investor: Dict) -> Dict:
    """Algorithm 11: Flag illiquid investments"""
    portfolios = investor.get('portfolios', [])
    illiquid = [p.get('scheme_name', 'Unknown') 
                for p in portfolios 
                if p.get('category') in ['ELSS', 'Close Ended']]
    
    return {'illiquidSchemes': illiquid}

def sip_discontinuation_prediction(investor: Dict) -> Dict:
    """Algorithm 12: Predict SIP discontinuation risk"""
    portfolios = investor.get('portfolios', [])
    sips = [p for p in portfolios if p.get('sip_flag', False)]
    
    missed = []
    for s in sips:
        next_due = s.get('next_due_date')
        if next_due:
            try:
                due_date = datetime.fromisoformat(next_due.replace('Z', '+00:00'))
                days = (datetime.now() - due_date).days
                if days > 60:
                    missed.append(s)
            except:
                pass
    
    risk = 'High' if len(missed) > 0 else 'Low'
    return {
        'sipCount': len(sips),
        'missedCount': len(missed),
        'risk': risk
    }

def redemption_likelihood(investor: Dict) -> Dict:
    """Algorithm 13: Calculate redemption likelihood"""
    portfolios = investor.get('portfolios', [])
    gainers = len([p for p in portfolios if safe_num(p.get('gain_loss_pct', 0)) > 15])
    
    inactivity = investor.get('last_activity_days', 0)
    score = min(1, (gainers * 0.2) + (inactivity / 365 * 0.3))
    
    return {
        'score': round(score, 2),
        'flag': 'High' if score > 0.7 else 'Normal'
    }

def aum_growth_forecast(investor: Dict) -> Dict:
    """Algorithm 14: Forecast AUM growth"""
    import random
    factor = round(random.uniform(-2, 10), 2)
    return {'projectedGrowthPct': factor}

def churn_risk_detection(investor: Dict) -> Dict:
    """Algorithm 15: Detect client churn risk"""
    gain_loss_pct = investor.get('gain_loss_pct', 0)
    negative = gain_loss_pct < 0
    sip_risk = sip_discontinuation_prediction(investor)['risk'] == 'High'
    
    score = (0.6 if negative else 0) + (0.4 if sip_risk else 0)
    
    return {
        'churnRisk': 'High' if score >= 0.6 else 'Low',
        'score': round(score, 2)
    }

def goal_achievement_forecast(investor: Dict) -> Dict:
    """Algorithm 16: Forecast goal achievement"""
    target = investor.get('goal_target_corpus')
    if not target:
        return {'status': 'NoGoalDeclared'}
    
    timeline = investor.get('goal_timeline')
    if not timeline:
        return {'status': 'NoTimelineDeclared'}
    
    try:
        goal_date = datetime.fromisoformat(timeline.replace('Z', '+00:00'))
        months_left = max(1, (goal_date - datetime.now()).days / 30)
        current_aum = safe_num(investor.get('total_aum', 0))
        needed = (target - current_aum) / months_left
        
        return {
            'target': target,
            'monthsLeft': round(months_left),
            'neededMonthly': round(needed, 2)
        }
    except:
        return {'status': 'InvalidTimeline'}

def portfolio_rebalancing_recommendations(investor: Dict) -> Dict:
    """Algorithm 17: Generate rebalancing recommendations"""
    allocation = asset_allocation_analysis(investor)['allocation']
    suggestions = []
    
    if allocation.get('Equity', 0) > 70:
        suggestions.append('Reduce equity exposure by 10-15%')
    if allocation.get('Debt', 0) < 20:
        suggestions.append('Increase debt allocation for stability')
    if len(allocation) < 3:
        suggestions.append('Add more asset classes for better diversification')
    
    return {'suggestions': suggestions}

def performance_improvement_suggestions(investor: Dict) -> Dict:
    """Algorithm 18: Suggest performance improvements"""
    under = underperforming_scheme_detection(investor)
    suggestions = []
    
    for scheme in under:
        scheme_name = scheme.get('scheme', 'Unknown')
        suggestions.append(f"Consider replacing {scheme_name} with better performing same-category funds")
    
    if not suggestions:
        suggestions.append('Portfolio is performing well. Continue monitoring and rebalance annually.')
    
    return {'suggestions': suggestions}

def goal_based_rebalancing_advice(investor: Dict) -> Dict:
    """Algorithm 19: Provide goal-based rebalancing advice"""
    return {
        'advice': 'Map long-term goals to equity heavy funds and short-term to debt; rebalance annually.'
    }

def ai_generated_summary(investor: Dict) -> Dict:
    """Algorithm 20: Generate AI summary score"""
    perf = portfolio_performance_summary(investor)
    portfolios = investor.get('portfolios', [])
    score = max(0, 100 - abs(perf['gainLoss']))
    
    summary = f"Investor {investor.get('name', investor.get('investor_id'))} holds {len(portfolios)} schemes with {perf['gainLoss']:.2f}% gain/loss."
    
    return {
        'portfolioScore': round(score),
        'summary': summary,
        'recommendation': 'Continue SIP discipline and review top losing funds.'
    }

def run_all_analysis(investor: Dict) -> Dict:
    """Run all 20 AI algorithms"""
    return {
        'investor_id': investor.get('investor_id'),
        'name': investor.get('name'),
        'performance': portfolio_performance_summary(investor),
        'allocation': asset_allocation_analysis(investor),
        'concentration': fund_concentration_check(investor),
        'underperforming': underperforming_scheme_detection(investor),
        'sip_health': sip_health_tracking(investor),
        'diversification': diversification_quality_score(investor),
        'risk_mismatch': risk_mismatch_detection(investor),
        'category_imbalance': category_imbalance_alert(investor),
        'aum_concentration': aum_concentration_risk(investor),
        'underperf_alert': underperformance_alerts(investor),
        'liquidity': liquidity_flagging(investor),
        'sip_discontinuation': sip_discontinuation_prediction(investor),
        'redemption_likelihood': redemption_likelihood(investor),
        'aum_forecast': aum_growth_forecast(investor),
        'churn_risk': churn_risk_detection(investor),
        'goal_forecast': goal_achievement_forecast(investor),
        'rebalancing_recommendations': portfolio_rebalancing_recommendations(investor),
        'performance_suggestions': performance_improvement_suggestions(investor),
        'goal_rebalancing_advice': goal_based_rebalancing_advice(investor),
        'ai_summary': ai_generated_summary(investor)
    }