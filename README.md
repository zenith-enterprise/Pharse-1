# MF360 - Mutual Fund Analytics Platform

A production-ready SaaS MVP for mutual fund distributors featuring AI-powered portfolio analysis, comprehensive CRM, and intelligent recommendations.

## 🚀 Features

### Core Functionality
- **CRM Dashboard**: Manage 300+ investors with detailed portfolio tracking
- **20 AI Algorithms**: Comprehensive portfolio analysis
- **ChatGPT Integration**: Automated portfolio summaries with Emergent LLM Key
- **Interactive Visualizations**: Pie charts, bar charts, and detailed breakdowns
- **Seeded Database**: 300 investors with realistic portfolios and transactions

### Tech Stack
- **Frontend**: React + Tailwind CSS + Shadcn UI
- **Backend**: FastAPI (Python) 
- **Database**: MongoDB
- **AI**: Emergent LLM Key (GPT-4o-mini)
- **Charts**: Recharts

## 🎨 Design System
- **Primary**: #1E3A8A (Blue 900)
- **Headings**: Space Grotesk
- **Body**: Manrope

## 🔧 Quick Start

### Database Seeding
```bash
cd /app/backend
python3 seed_data.py
```

### Access the Application
- Frontend: https://wealth-insights-13.preview.emergentagent.com
- Login with credentials created during signup

## 📊 Key Features

1. **Dashboard**: View total AUM, investors, and avg returns
2. **Investors**: Browse, filter, and search 300 investors
3. **Investor Detail**: View portfolios, charts, and run AI analysis
4. **AI Insights**: Run comprehensive analysis with 20 algorithms + ChatGPT

## 🤖 AI Algorithms

All 20 algorithms implemented:
1. Portfolio Performance Summary
2. Asset Allocation Analysis
3. Fund Concentration Check
4. Underperforming Scheme Detection
5. SIP Health Tracking
6. Diversification Quality Score
7. Risk Mismatch Detection
8. Category Imbalance Alert
9. AUM Concentration Risk
10. Underperformance Alerts
11. Liquidity Flagging
12. SIP Discontinuation Prediction
13. Redemption Likelihood
14. AUM Growth Forecast
15. Churn Risk Detection
16. Goal Achievement Forecast
17. Portfolio Rebalancing Recommendations
18. Performance Improvement Suggestions
19. Goal-Based Rebalancing Advice
20. AI-Generated Summary

**Plus ChatGPT summarization with caching!**

---

**Built with FastAPI + React + MongoDB + Emergent LLM Key**
