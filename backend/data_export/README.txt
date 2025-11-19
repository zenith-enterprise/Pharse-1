================================================================================
MF360 - EXPORTED DATA FILES
================================================================================

📂 LOCATION: /app/backend/data_export/

📄 FILES IN THIS DIRECTORY:

1. mf360_investors.json (12.65 MB)
   - 300 complete investor records
   - Includes portfolios, transactions, and financial data
   - Realistic Indian names and PAN numbers

2. mf360_users.json (1.96 KB)
   - 8 registered user accounts
   - Includes hashed passwords and user details

3. mf360_analyses.json (166.33 KB)
   - 31 AI analysis records
   - ChatGPT summaries and analysis data

4. mf360_complete_export.json (13.61 MB)
   - Combined export of all above files
   - Includes metadata (export date, counts, database name)

================================================================================
HOW TO ACCESS/DOWNLOAD THESE FILES
================================================================================

METHOD 1: Using Code Editor (If Available)
-------------------------------------------
1. Look for "Code Editor" or "VSCode" in your Emergent interface
2. Navigate to: /app/backend/data_export/
3. Right-click on any file → Download

METHOD 2: Using Terminal Commands
----------------------------------
# View file contents in terminal:
cat /app/backend/data_export/mf360_investors.json | head -100

# Copy files to a different location:
cp /app/backend/data_export/*.json /path/to/your/location/

METHOD 3: Direct File Path (For Emergent Platform)
---------------------------------------------------
Files are stored at these absolute paths:
- /app/backend/data_export/mf360_investors.json
- /app/backend/data_export/mf360_users.json
- /app/backend/data_export/mf360_analyses.json
- /app/backend/data_export/mf360_complete_export.json

You can access these through the Emergent file browser or download them.

================================================================================
TO IMPORT TO PRODUCTION MONGODB ATLAS
================================================================================

Run the import script:
   cd /app/backend
   python3 import_to_production.py

The script will automatically load files from this directory.

Target Database: mongodb+srv://mf360:***@cluster0.a9htphs.mongodb.net/
Database Name: mf360_production

IMPORTANT: Before running import script:
1. Ensure MongoDB Atlas cluster is running (not paused)
2. Configure Network Access: Add IP whitelist (0.0.0.0/0 or your IP)
3. Verify credentials are correct

================================================================================
ALTERNATIVE IMPORT METHODS
================================================================================

If automatic import fails, use MongoDB Compass:
1. Download: https://www.mongodb.com/products/compass
2. Connect to: mongodb+srv://mf360:t6hhcvDbvWaOCz9X@cluster0.a9htphs.mongodb.net/
3. Create database: mf360_production
4. Import each JSON file to respective collections

Or use mongoimport CLI:
   mongoimport --uri "mongodb+srv://mf360:t6hhcvDbvWaOCz9X@cluster0.a9htphs.mongodb.net/mf360_production" \
     --collection investors \
     --file /app/backend/data_export/mf360_investors.json \
     --jsonArray

================================================================================

For complete documentation, see: /app/DATA_EXPORT_README.md
