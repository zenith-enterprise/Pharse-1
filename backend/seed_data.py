"""Seeding script to generate 300 investors with portfolios and transactions"""
import random
import os
from datetime import datetime, timedelta
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
import asyncio

load_dotenv()

# Constants
INVESTOR_COUNT = 300

AMC_LIST = [
    {'name': 'HDFC Mutual Fund', 'code': 'HDFC'},
    {'name': 'ICICI Prudential', 'code': 'ICICI'},
    {'name': 'SBI Mutual Fund', 'code': 'SBI'},
    {'name': 'Axis Mutual Fund', 'code': 'AXIS'},
    {'name': 'Kotak Mahindra', 'code': 'KOTAK'},
    {'name': 'Nippon India', 'code': 'NIPPON'},
    {'name': 'Aditya Birla Sun Life', 'code': 'ABSL'},
    {'name': 'UTI Mutual Fund', 'code': 'UTI'},
    {'name': 'DSP Mutual Fund', 'code': 'DSP'},
    {'name': 'Franklin Templeton', 'code': 'FRANK'}
]

CATEGORY_LIST = ['Equity', 'Debt', 'Hybrid', 'ELSS', 'Liquid', 'Balanced']
TXN_TYPES = ['Buy', 'Sell', 'Switch', 'Dividend', 'SIP']

# Indian names for realistic data
FIRST_NAMES = [
    'Rajesh', 'Priya', 'Amit', 'Sneha', 'Vikram', 'Ananya', 'Arjun', 'Kavya',
    'Rohan', 'Neha', 'Sanjay', 'Divya', 'Karan', 'Pooja', 'Aditya', 'Riya',
    'Rahul', 'Meera', 'Nikhil', 'Shreya', 'Varun', 'Anjali', 'Harsh', 'Ishita',
    'Sameer', 'Swati', 'Kunal', 'Tanvi', 'Manish', 'Nidhi', 'Deepak', 'Preeti',
    'Gaurav', 'Ritika', 'Ashish', 'Sakshi', 'Prakash', 'Simran', 'Suresh', 'Kritika',
    'Anil', 'Jyoti', 'Ramesh', 'Aarti', 'Manoj', 'Pallavi', 'Vivek', 'Shweta',
    'Akash', 'Nisha', 'Ravi', 'Megha', 'Sunil', 'Tara', 'Naveen', 'Aditi',
    'Vishal', 'Madhuri', 'Ajay', 'Ritu', 'Sandeep', 'Bhavna', 'Yogesh', 'Shilpa'
]

LAST_NAMES = [
    'Sharma', 'Verma', 'Patel', 'Kumar', 'Singh', 'Gupta', 'Reddy', 'Nair',
    'Kapoor', 'Mehta', 'Shah', 'Joshi', 'Rao', 'Desai', 'Chopra', 'Malhotra',
    'Agarwal', 'Bhatia', 'Khanna', 'Sethi', 'Bansal', 'Choudhary', 'Jain', 'Iyer',
    'Kulkarni', 'Pandey', 'Mishra', 'Sinha', 'Saxena', 'Tiwari', 'Trivedi', 'Pillai'
]

def random_int(min_val, max_val):
    return random.randint(min_val, max_val)

def random_float(min_val, max_val):
    return random.uniform(min_val, max_val)

def sample(arr):
    return random.choice(arr)

async def seed_database():
    """Generate and insert seed data"""
    mongo_url = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
    db_name = os.getenv('DB_NAME', 'mf360_database')
    
    client = AsyncIOMotorClient(mongo_url)
    db = client[db_name]
    
    print("Generating seed data...")
    investors = []
    
    for i in range(1, INVESTOR_COUNT + 1):
        investor_id = f"INV{str(i).zfill(4)}"
        
        # Generate random name
        first_name = sample(FIRST_NAMES)
        last_name = sample(LAST_NAMES)
        full_name = f"{first_name} {last_name}"
        email_name = f"{first_name.lower()}.{last_name.lower()}{i}"
        
        # Realistic onboarding date distribution
        # 10% new (0-30 days), 20% recent (31-90 days), 70% established (91+ days)
        if i <= 30:  # 10% new investors
            onboarding_days = random_int(1, 30)
        elif i <= 90:  # 20% recent
            onboarding_days = random_int(31, 90)
        else:  # 70% established
            onboarding_days = random_int(91, 1000)
        
        investor = {
            'investor_id': investor_id,
            'name': full_name,
            'pan': f'PAN{str(i).zfill(5)}X',
            'email': f'{email_name}@example.com',
            'mobile': f'98{random_int(10000000, 99999999)}',
            'onboarding_date': (datetime.now() - timedelta(days=onboarding_days)).isoformat(),
            'risk_profile': sample(['Low', 'Moderate', 'High']),
            'investor_type': sample(['Individual', 'Family']),
            'portfolios': [],
            'total_invested': 0,
            'total_aum': 0,
            'gain_loss_pct': 0
        }
        
        # Generate portfolios (3-8 per investor)
        num_folios = random_int(3, 8)
        for f in range(num_folios):
            amc = sample(AMC_LIST)
            category = sample(CATEGORY_LIST)
            invested_amount = random_int(20000, 300000)
            gain_loss_pct = round(random_float(-5, 20), 2)
            current_value = round(invested_amount * (1 + gain_loss_pct / 100), 2)
            nav = round(random_float(10, 250), 2)
            units = round(current_value / nav, 4)
            
            folio = {
                'folio_id': f"{investor_id}-F{f+1}",
                'amc_name': amc['name'],
                'amc_code': amc['code'],
                'scheme_name': f"{amc['name']} {category} Fund {random_int(100, 999)}",
                'scheme_code': f"{amc['code']}-{random_int(100, 999)}",
                'isin': f"ISIN{random_int(100000, 999999)}",
                'category': category,
                'nav': nav,
                'units': units,
                'invested_amount': invested_amount,
                'current_value': current_value,
                'gain_loss_pct': gain_loss_pct,
                'sip_flag': random.random() > 0.5,
                'sip_freq': sample(['Monthly', 'Quarterly']),
                'next_due_date': (datetime.now() + timedelta(days=random_int(1, 30))).isoformat(),
                'transactions': []
            }
            
            # Generate transactions (20-30 per folio)
            txn_count = random_int(20, 30)
            start_date = datetime.now() - timedelta(days=24 * 30)  # 24 months back
            
            for t in range(txn_count):
                # Calculate transaction date (spread over 24 months)
                days_offset = int((t / txn_count) * (24 * 30))
                txn_date = start_date + timedelta(days=days_offset)
                
                txn_types_pool = TXN_TYPES.copy()
                if folio['sip_flag']:
                    txn_types_pool.append('SIP')  # More SIP likelihood
                
                txn_type = sample(txn_types_pool)
                txn_nav = round(random_float(10, 250), 2)
                amount = random_int(1000, 50000)
                units_txn = round(amount / txn_nav, 4)
                
                folio['transactions'].append({
                    'txn_id': f"{folio['folio_id']}-T{str(t+1).zfill(3)}",
                    'folio_id': folio['folio_id'],
                    'txn_type': txn_type,
                    'txn_date': txn_date.isoformat(),
                    'txn_amount': amount,
                    'nav_at_txn': txn_nav,
                    'units': units_txn
                })
            
            investor['portfolios'].append(folio)
            investor['total_invested'] += invested_amount
            investor['total_aum'] += current_value
        
        # Calculate overall gain/loss
        if investor['total_invested'] > 0:
            investor['gain_loss_pct'] = round(
                ((investor['total_aum'] - investor['total_invested']) / investor['total_invested']) * 100,
                2
            )
        
        investors.append(investor)
    
    print(f"Generated {len(investors)} investors")
    
    # Clear existing data
    await db.investors.delete_many({})
    print("Cleared existing data")
    
    # Insert new data
    if investors:
        await db.investors.insert_many(investors)
        print(f"Inserted {len(investors)} investors into database")
    
    client.close()
    print("Seeding completed successfully!")

if __name__ == '__main__':
    asyncio.run(seed_database())