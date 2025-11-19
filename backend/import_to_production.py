"""
Import script to load exported JSON data into Production MongoDB Atlas

Usage:
    python3 import_to_production.py

Make sure to:
1. Check MongoDB Atlas cluster is running
2. Whitelist your IP address (or use 0.0.0.0/0 for all IPs)
3. Verify credentials are correct
"""

import json
from pymongo import MongoClient

def import_from_json():
    """Import JSON data to production MongoDB Atlas"""
    
    # Production MongoDB Atlas
    prod_mongo_url = "mongodb+srv://mf360:t6hhcvDbvWaOCz9X@cluster0.a9htphs.mongodb.net/?retryWrites=true&w=majority"
    prod_db_name = "mf360_production"
    
    print("=" * 60)
    print("IMPORTING DATA TO PRODUCTION MONGODB ATLAS")
    print("=" * 60)
    
    # Export directory
    export_dir = '/app/backend/data_export'
    
    # Load JSON files
    print("\n1. Loading JSON files...")
    try:
        with open(f'{export_dir}/mf360_investors.json', 'r') as f:
            investors = json.load(f)
        print(f"   ✓ Loaded {len(investors)} investors")
        
        with open(f'{export_dir}/mf360_users.json', 'r') as f:
            users = json.load(f)
        print(f"   ✓ Loaded {len(users)} users")
        
        with open(f'{export_dir}/mf360_analyses.json', 'r') as f:
            analyses = json.load(f)
        print(f"   ✓ Loaded {len(analyses)} AI analyses")
    except FileNotFoundError as e:
        print(f"   ✗ Error: JSON files not found at {export_dir}/")
        print(f"   {e}")
        print(f"\n   Files should be located at:")
        print(f"   - {export_dir}/mf360_investors.json")
        print(f"   - {export_dir}/mf360_users.json")
        print(f"   - {export_dir}/mf360_analyses.json")
        return
    
    # Connect to production MongoDB
    print("\n2. Connecting to production MongoDB Atlas...")
    try:
        prod_client = MongoClient(prod_mongo_url, serverSelectionTimeoutMS=10000)
        prod_db = prod_client[prod_db_name]
        
        # Test connection
        prod_client.admin.command('ping')
        print("   ✓ Connected to production MongoDB Atlas successfully!")
    except Exception as e:
        print(f"   ✗ Failed to connect to production MongoDB: {e}")
        print("\n   Please check:")
        print("   - MongoDB Atlas cluster is running (not paused)")
        print("   - IP address is whitelisted in Network Access (use 0.0.0.0/0 for all IPs)")
        print("   - Username and password are correct")
        print("   - Network connectivity is working")
        return
    
    # Clear production database (optional - comment out if you want to keep existing data)
    print("\n3. Clearing production database collections...")
    prod_db.investors.delete_many({})
    prod_db.users.delete_many({})
    prod_db.ai_analyses.delete_many({})
    print("   ✓ Cleared existing data")
    
    # Import to production
    print("\n4. Importing data to production...")
    if investors:
        prod_db.investors.insert_many(investors)
        print(f"   ✓ Imported {len(investors)} investors")
    
    if users:
        prod_db.users.insert_many(users)
        print(f"   ✓ Imported {len(users)} users")
    
    if analyses:
        prod_db.ai_analyses.insert_many(analyses)
        print(f"   ✓ Imported {len(analyses)} AI analyses")
    
    # Verify data in production
    print("\n5. Verifying data in production...")
    prod_investor_count = prod_db.investors.count_documents({})
    prod_user_count = prod_db.users.count_documents({})
    prod_analysis_count = prod_db.ai_analyses.count_documents({})
    
    print(f"   ✓ Production database now has:")
    print(f"     - {prod_investor_count} investors")
    print(f"     - {prod_user_count} users")
    print(f"     - {prod_analysis_count} AI analyses")
    
    # Close connection
    prod_client.close()
    
    print("\n" + "=" * 60)
    print("DATA IMPORT COMPLETED SUCCESSFULLY!")
    print("=" * 60)
    print(f"\nProduction Database: {prod_db_name}")
    print(f"\n✅ Your production database is now ready!")
    print("\n📝 Next steps:")
    print("   1. Update backend/.env with:")
    print(f"      MONGO_URL={prod_mongo_url.split('?')[0]}")
    print(f"      DB_NAME={prod_db_name}")
    print("   2. Restart backend: sudo supervisorctl restart backend")

if __name__ == '__main__':
    import_from_json()
