# MF360 Data Export & Production Setup Guide

## 📊 Exported Data Summary

Your local MongoDB data has been successfully exported to JSON files:

### Exported Files Location: `/tmp/`

1. **mf360_investors.json** (12.65 MB)
   - 300 investors with complete profiles
   - Portfolios and transactions for each investor
   - Realistic Indian names and data

2. **mf360_users.json** (1.71 KB)
   - 7 registered users
   - Login credentials (hashed passwords)

3. **mf360_analyses.json** (166.33 KB)
   - 31 AI analysis records
   - ChatGPT summaries

4. **mf360_complete_export.json**
   - Combined export of all above data
   - Includes metadata

---

## 🔄 Import to Production MongoDB Atlas

### Option 1: Automated Script (Recommended)

**File:** `/app/backend/import_to_production.py`

**Steps:**
```bash
cd /app/backend
python3 import_to_production.py
```

**Prerequisites:**
- MongoDB Atlas cluster must be running (not paused)
- Network Access configured:
  - Go to MongoDB Atlas → Network Access
  - Add IP: `0.0.0.0/0` (allow from anywhere)
  - Or add your specific IP address
- Verify credentials are correct

**What the script does:**
1. Connects to production MongoDB Atlas
2. Clears existing data (optional - can be commented out)
3. Imports all 300 investors
4. Imports all users
5. Imports AI analyses
6. Verifies data integrity

---

### Option 2: Manual Import via MongoDB Compass

1. **Download MongoDB Compass**: https://www.mongodb.com/products/compass

2. **Connect to Production:**
   ```
   mongodb+srv://mf360:t6hhcvDbvWaOCz9X@cluster0.a9htphs.mongodb.net/
   ```

3. **Create Database:**
   - Database Name: `mf360_production`
   - Collection Name: `investors`

4. **Import JSON Files:**
   - Click on "investors" collection → "ADD DATA" → "Import JSON or CSV file"
   - Select `/tmp/mf360_investors.json`
   - Repeat for users and ai_analyses collections

---

### Option 3: Manual Import via mongoimport

```bash
# Install MongoDB tools if not already installed
# Then run:

mongoimport --uri "mongodb+srv://mf360:t6hhcvDbvWaOCz9X@cluster0.a9htphs.mongodb.net/mf360_production" \
  --collection investors \
  --file /tmp/mf360_investors.json \
  --jsonArray

mongoimport --uri "mongodb+srv://mf360:t6hhcvDbvWaOCz9X@cluster0.a9htphs.mongodb.net/mf360_production" \
  --collection users \
  --file /tmp/mf360_users.json \
  --jsonArray

mongoimport --uri "mongodb+srv://mf360:t6hhcvDbvWaOCz9X@cluster0.a9htphs.mongodb.net/mf360_production" \
  --collection ai_analyses \
  --file /tmp/mf360_analyses.json \
  --jsonArray
```

---

## ⚙️ Update Application Configuration

### Update Backend Environment Variables

**File:** `/app/backend/.env`

```env
# Production MongoDB Atlas
MONGO_URL=mongodb+srv://mf360:t6hhcvDbvWaOCz9X@cluster0.a9htphs.mongodb.net/?retryWrites=true&w=majority
DB_NAME=mf360_production

# Keep other variables as is
OPENAI_API_KEY=your_key_here
PORT=8001
AI_MODEL=gpt-4o-mini
CACHE_TTL_SECONDS=3600
```

### Restart Backend

```bash
sudo supervisorctl restart backend
```

### Verify Connection

```bash
# Check backend logs
tail -f /var/log/supervisor/backend.out.log

# You should see successful MongoDB connection
```

---

## ✅ Verify Production Data

1. **Login to Application:**
   - Email: demo2@test.com
   - Password: password123

2. **Check Dashboard:**
   - Navigate to Dashboard
   - Verify 300 investors are loaded
   - Check analytics are displaying

3. **Test CRUD Operations:**
   - Go to Investors page
   - Click "Add New Investor" → Create test investor
   - Click Edit button → Modify details
   - Click Delete button → Remove test investor

---

## 🆕 CRUD Operations Implemented

### Frontend (Investors Page)

**Add New Investor:**
- Click "Add New Investor" button
- Fill form: Name, Email, Mobile, PAN, Risk Profile, Investor Type
- Validation on all fields
- Success/error notifications

**Edit Investor:**
- Click Edit (pencil icon) in Actions column
- Modify investor details
- Update investor in database

**Delete Investor:**
- Click Delete (trash icon) in Actions column
- Confirmation dialog with warning
- Permanently removes investor and all associated data

### Backend API Endpoints

```
POST   /api/investors              - Create new investor
GET    /api/investors              - List all investors (with filters)
GET    /api/investors/:investorId  - Get single investor
PUT    /api/investors/:investorId  - Update investor
DELETE /api/investors/:investorId  - Delete investor (and AI analyses)
```

---

## 📝 Data Structure

### Investor Document
```json
{
  "investor_id": "INV0001",
  "name": "Rohan Bansal",
  "pan": "PANXXX1X",
  "email": "rohan.bansal@example.com",
  "mobile": "9876543210",
  "onboarding_date": "2024-08-15T10:30:00+00:00",
  "risk_profile": "Moderate",
  "investor_type": "Individual",
  "portfolios": [...],
  "total_invested": 1125336,
  "total_aum": 1027926,
  "gain_loss_pct": -8.66
}
```

---

## 🔒 Security Notes

1. **Change Production Password:**
   - The current MongoDB Atlas credentials are visible in this guide
   - Strongly recommend changing the password after import
   - Update .env file with new credentials

2. **IP Whitelist:**
   - For security, restrict to specific IPs instead of 0.0.0.0/0
   - Add only your application server IPs

3. **Environment Variables:**
   - Never commit .env files to Git
   - Use .env.sample for templates

---

## 📞 Support

**If you encounter SSL/TLS errors:**
- Check if MongoDB Atlas cluster is paused (unpause it)
- Verify network connectivity
- Try using MongoDB Compass for manual import

**If import fails:**
- Check MongoDB Atlas logs
- Verify credentials are correct
- Ensure database user has read/write permissions

---

## ✨ What's New

### Enhanced Dashboard Analytics (in AI Insights → Aggregate Dashboard)
- SIP Status: Active/Paused/Stopped tracking
- Monthly SIP Inflow Trend (12 months)
- Average SIP Ticket Size
- Top 10 SIP Investors
- Upcoming SIP Expiry Alerts
- High-Potential Investors
- Profit/Loss Split visualization

### Full CRUD Operations
- Add, Edit, Delete investors from UI
- Form validation
- Confirmation dialogs
- Real-time data updates

---

**Your MF360 application is now production-ready with complete data management capabilities!** 🎉
