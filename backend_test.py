#!/usr/bin/env python3
"""
Backend API Testing for MF360 Dashboard Analytics
Tests the enhanced dashboard analytics endpoint at /api/dashboard/analytics
"""

import requests
import json
from datetime import datetime
import sys

# Load backend URL from frontend .env
def get_backend_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception as e:
        print(f"Error reading frontend .env: {e}")
        return None

def test_dashboard_analytics():
    """Test the /api/dashboard/analytics endpoint comprehensively"""
    
    backend_url = get_backend_url()
    if not backend_url:
        print("❌ CRITICAL: Could not get backend URL from frontend/.env")
        return False
    
    endpoint_url = f"{backend_url}/api/dashboard/analytics"
    print(f"Testing endpoint: {endpoint_url}")
    
    try:
        # Test 1: Endpoint accessibility and status code
        print("\n=== Test 1: Endpoint Accessibility ===")
        response = requests.get(endpoint_url, timeout=30)
        
        if response.status_code != 200:
            print(f"❌ FAILED: Expected status 200, got {response.status_code}")
            print(f"Response: {response.text}")
            return False
        
        print("✅ PASSED: Endpoint returns 200 status")
        
        # Test 2: Response structure validation
        print("\n=== Test 2: Response Structure Validation ===")
        try:
            data = response.json()
        except json.JSONDecodeError as e:
            print(f"❌ FAILED: Invalid JSON response - {e}")
            return False
        
        # Check top-level structure
        if not isinstance(data, dict) or 'success' not in data or 'data' not in data:
            print(f"❌ FAILED: Invalid response structure. Expected {{success, data}}, got: {list(data.keys()) if isinstance(data, dict) else type(data)}")
            return False
        
        if not data.get('success'):
            print(f"❌ FAILED: API returned success=false. Response: {data}")
            return False
        
        analytics_data = data['data']
        
        # Check if needs seeding
        if analytics_data.get('needsSeeding'):
            print("❌ FAILED: Database needs seeding. No investor data available.")
            return False
        
        print("✅ PASSED: Valid JSON response with success=true")
        
        # Test 3: Required fields validation
        print("\n=== Test 3: Required Fields Validation ===")
        required_fields = [
            'sip_status',
            'monthly_sip_inflow', 
            'average_sip_ticket_size',
            'top_sip_investors',
            'upcoming_sip_expiry',
            'profit_loss_split',
            'high_potential_investors'
        ]
        
        missing_fields = []
        for field in required_fields:
            if field not in analytics_data:
                missing_fields.append(field)
        
        if missing_fields:
            print(f"❌ FAILED: Missing required fields: {missing_fields}")
            return False
        
        print("✅ PASSED: All required fields present")
        
        # Test 4: SIP Status Structure
        print("\n=== Test 4: SIP Status Structure ===")
        sip_status = analytics_data['sip_status']
        sip_status_fields = ['active', 'paused', 'stopped']
        
        for field in sip_status_fields:
            if field not in sip_status:
                print(f"❌ FAILED: Missing SIP status field: {field}")
                return False
            if not isinstance(sip_status[field], (int, float)):
                print(f"❌ FAILED: SIP status {field} should be numeric, got {type(sip_status[field])}")
                return False
        
        total_sips = sip_status['active'] + sip_status['paused'] + sip_status['stopped']
        print(f"SIP Status - Active: {sip_status['active']}, Paused: {sip_status['paused']}, Stopped: {sip_status['stopped']}, Total: {total_sips}")
        print("✅ PASSED: SIP status structure valid")
        
        # Test 5: Monthly SIP Inflow Structure
        print("\n=== Test 5: Monthly SIP Inflow Structure ===")
        monthly_inflow = analytics_data['monthly_sip_inflow']
        
        if not isinstance(monthly_inflow, list):
            print(f"❌ FAILED: monthly_sip_inflow should be list, got {type(monthly_inflow)}")
            return False
        
        if len(monthly_inflow) != 12:
            print(f"❌ FAILED: Expected 12 months of data, got {len(monthly_inflow)}")
            return False
        
        for i, month_data in enumerate(monthly_inflow):
            if not isinstance(month_data, dict) or 'month' not in month_data or 'inflow' not in month_data:
                print(f"❌ FAILED: Invalid month data structure at index {i}: {month_data}")
                return False
            if not isinstance(month_data['inflow'], (int, float)):
                print(f"❌ FAILED: Inflow should be numeric at index {i}, got {type(month_data['inflow'])}")
                return False
        
        print(f"Monthly inflow data: {len(monthly_inflow)} months")
        print("✅ PASSED: Monthly SIP inflow structure valid")
        
        # Test 6: Average SIP Ticket Size
        print("\n=== Test 6: Average SIP Ticket Size ===")
        avg_ticket = analytics_data['average_sip_ticket_size']
        
        if not isinstance(avg_ticket, (int, float)):
            print(f"❌ FAILED: Average SIP ticket size should be numeric, got {type(avg_ticket)}")
            return False
        
        print(f"Average SIP ticket size: ₹{avg_ticket:,.2f}")
        print("✅ PASSED: Average SIP ticket size is numeric")
        
        # Test 7: Top SIP Investors Structure
        print("\n=== Test 7: Top SIP Investors Structure ===")
        top_investors = analytics_data['top_sip_investors']
        
        if not isinstance(top_investors, list):
            print(f"❌ FAILED: top_sip_investors should be list, got {type(top_investors)}")
            return False
        
        if len(top_investors) > 10:
            print(f"❌ FAILED: Should have max 10 top investors, got {len(top_investors)}")
            return False
        
        for i, investor in enumerate(top_investors):
            required_inv_fields = ['investor_id', 'name', 'total_sip_value']
            for field in required_inv_fields:
                if field not in investor:
                    print(f"❌ FAILED: Missing field {field} in top investor {i}")
                    return False
            if not isinstance(investor['total_sip_value'], (int, float)):
                print(f"❌ FAILED: total_sip_value should be numeric for investor {i}")
                return False
        
        print(f"Top SIP investors: {len(top_investors)} found")
        print("✅ PASSED: Top SIP investors structure valid")
        
        # Test 8: Profit/Loss Split
        print("\n=== Test 8: Profit/Loss Split ===")
        profit_loss = analytics_data['profit_loss_split']
        
        if 'profit' not in profit_loss or 'loss' not in profit_loss:
            print(f"❌ FAILED: Missing profit or loss fields in profit_loss_split")
            return False
        
        if not isinstance(profit_loss['profit'], (int, float)) or not isinstance(profit_loss['loss'], (int, float)):
            print(f"❌ FAILED: Profit/loss values should be numeric")
            return False
        
        total_investors = profit_loss['profit'] + profit_loss['loss']
        print(f"Profit/Loss split - Profit: {profit_loss['profit']}, Loss: {profit_loss['loss']}, Total: {total_investors}")
        
        # Check if total adds up to expected 300 investors
        if total_investors != 300:
            print(f"⚠️  WARNING: Expected 300 total investors, got {total_investors}")
        else:
            print("✅ PASSED: Profit/loss split adds up to 300 investors")
        
        print("✅ PASSED: Profit/loss split structure valid")
        
        # Test 9: Upcoming SIP Expiry Structure
        print("\n=== Test 9: Upcoming SIP Expiry Structure ===")
        upcoming_expiry = analytics_data['upcoming_sip_expiry']
        
        if not isinstance(upcoming_expiry, list):
            print(f"❌ FAILED: upcoming_sip_expiry should be list, got {type(upcoming_expiry)}")
            return False
        
        for i, expiry in enumerate(upcoming_expiry):
            required_expiry_fields = ['investor_id', 'investor_name', 'scheme_name', 'next_due_date', 'days_until_due', 'sip_amount']
            for field in required_expiry_fields:
                if field not in expiry:
                    print(f"❌ FAILED: Missing field {field} in upcoming expiry {i}")
                    return False
            
            if not isinstance(expiry['days_until_due'], (int, float)) or not isinstance(expiry['sip_amount'], (int, float)):
                print(f"❌ FAILED: Numeric fields should be numbers in upcoming expiry {i}")
                return False
            
            # Validate days_until_due is within 3 months (90 days)
            if expiry['days_until_due'] < 0 or expiry['days_until_due'] > 90:
                print(f"❌ FAILED: days_until_due should be 0-90, got {expiry['days_until_due']} for expiry {i}")
                return False
        
        print(f"Upcoming SIP expiries: {len(upcoming_expiry)} found")
        print("✅ PASSED: Upcoming SIP expiry structure valid")
        
        # Test 10: High Potential Investors Structure
        print("\n=== Test 10: High Potential Investors Structure ===")
        high_potential = analytics_data['high_potential_investors']
        
        if not isinstance(high_potential, list):
            print(f"❌ FAILED: high_potential_investors should be list, got {type(high_potential)}")
            return False
        
        for i, investor in enumerate(high_potential):
            required_hp_fields = ['investor_id', 'name', 'total_sip_value', 'gain_loss_pct', 'redemptions']
            for field in required_hp_fields:
                if field not in investor:
                    print(f"❌ FAILED: Missing field {field} in high potential investor {i}")
                    return False
            
            # Validate numeric fields
            numeric_fields = ['total_sip_value', 'gain_loss_pct', 'redemptions']
            for field in numeric_fields:
                if not isinstance(investor[field], (int, float)):
                    print(f"❌ FAILED: {field} should be numeric for high potential investor {i}")
                    return False
            
            # Validate high potential criteria
            if investor['gain_loss_pct'] <= 0:
                print(f"❌ FAILED: High potential investor should have positive gain_loss_pct, got {investor['gain_loss_pct']} for investor {i}")
                return False
            
            if investor['redemptions'] > 2:
                print(f"❌ FAILED: High potential investor should have <=2 redemptions, got {investor['redemptions']} for investor {i}")
                return False
        
        print(f"High potential investors: {len(high_potential)} found")
        print("✅ PASSED: High potential investors structure valid")
        
        # Test 11: Data Consistency Checks
        print("\n=== Test 11: Data Consistency Checks ===")
        
        # Check that top investors have positive SIP values
        for investor in top_investors:
            if investor['total_sip_value'] <= 0:
                print(f"❌ FAILED: Top SIP investor should have positive value, got {investor['total_sip_value']}")
                return False
        
        # Check that monthly inflow values are non-negative
        for month_data in monthly_inflow:
            if month_data['inflow'] < 0:
                print(f"❌ FAILED: Monthly inflow should be non-negative, got {month_data['inflow']} for {month_data['month']}")
                return False
        
        print("✅ PASSED: Data consistency checks passed")
        
        # Summary
        print("\n" + "="*50)
        print("🎉 ALL TESTS PASSED!")
        print("="*50)
        print(f"✅ Endpoint: {endpoint_url}")
        print(f"✅ Response Status: 200")
        print(f"✅ Total SIPs: {total_sips}")
        print(f"✅ Total Investors: {total_investors}")
        print(f"✅ Average SIP Ticket: ₹{avg_ticket:,.2f}")
        print(f"✅ Top SIP Investors: {len(top_investors)}")
        print(f"✅ Upcoming Expiries: {len(upcoming_expiry)}")
        print(f"✅ High Potential: {len(high_potential)}")
        print(f"✅ Monthly Data Points: {len(monthly_inflow)}")
        
        return True
        
    except requests.exceptions.RequestException as e:
        print(f"❌ FAILED: Network error - {e}")
        return False
    except Exception as e:
        print(f"❌ FAILED: Unexpected error - {e}")
        return False

def main():
    """Main test runner"""
    print("🚀 Starting Backend API Tests for Dashboard Analytics")
    print("="*60)
    
    success = test_dashboard_analytics()
    
    if success:
        print("\n🎉 All backend tests completed successfully!")
        sys.exit(0)
    else:
        print("\n💥 Backend tests failed!")
        sys.exit(1)

if __name__ == "__main__":
    main()