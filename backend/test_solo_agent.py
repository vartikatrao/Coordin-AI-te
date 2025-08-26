import json
import sys
import os
from datetime import datetime

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.agents.solo_agent import create_solo_agent


def print_separator(title=""):
    """Print a visual separator"""
    print("\n" + "="*60)
    if title:
        print(f"  {title}")
        print("="*60)
    print()


def format_response(response):
    """Format and print response nicely"""
    if response.get("status") == "error":
        print(f"❌ Error: {response.get('error')}")
        return
    
    print(f"✅ Status: {response.get('status')}")
    print(f"🕐 Timestamp: {response.get('timestamp')}")
    print(f"❓ Query: {response.get('query')}")
    
    if "recommendations" in response:
        recs = response["recommendations"]
        if isinstance(recs, dict):
            print("\n📋 Recommendations:")
            print(json.dumps(recs, indent=2))
        else:
            print(f"\n📋 Response: {recs}")
    elif "response" in response:
        print(f"\n📋 Response: {response['response']}")


def test_cases():
    """Define test cases"""
    return [
        {
            "name": "Study Places",
            "query": "study places nearby",
            "expected": "Should suggest libraries, quiet cafes with wifi"
        },
        {
            "name": "Family Dinner",
            "query": "hey I wanna go to family dinner near jayanagar, with family of 4, 2 parents and 2 kids. suggest me places which is affordable and has good ambience",
            "expected": "Should suggest family-friendly restaurants, avoid bars"
        },
        {
            "name": "Fun Tonight",
            "query": "I wanna have fun tonight",
            "expected": "Should suggest entertainment venues appropriate for current time"
        },
        {
            "name": "Coffee Meeting",
            "query": "need a good cafe for business meeting near MG Road",
            "expected": "Should suggest professional cafes with good ambience"
        },
        {
            "name": "Budget Lunch",
            "query": "cheap lunch places around here",
            "expected": "Should focus on budget-friendly dining options"
        }
    ]


def main():
    """Main test function"""
    print_separator("COORDINATE APP - SOLO AGENT TESTING")
    
    # Initialize the solo agent
    print("🤖 Initializing Solo Agent...")
    try:
        solo_agent = create_solo_agent(default_location="12.9716,77.5946")  # Bangalore
        print("✅ Solo Agent initialized successfully!")
    except Exception as e:
        print(f"❌ Failed to initialize Solo Agent: {e}")
        return
    
    # Get test cases
    test_cases_list = test_cases()
    
    print(f"\n📝 Running {len(test_cases_list)} test cases...\n")
    
    # Option to run specific test or all
    if len(sys.argv) > 1:
        try:
            test_index = int(sys.argv[1]) - 1
            if 0 <= test_index < len(test_cases_list):
                test_cases_list = [test_cases_list[test_index]]
                print(f"Running single test case: {test_cases_list[0]['name']}")
            else:
                print(f"Invalid test index. Choose 1-{len(test_cases_list)}")
                return
        except ValueError:
            # Treat as custom query
            custom_query = " ".join(sys.argv[1:])
            test_cases_list = [{
                "name": "Custom Query",
                "query": custom_query,
                "expected": "User provided query"
            }]
    
    # Run test cases
    results = []
    for i, test_case in enumerate(test_cases_list, 1):
        print_separator(f"TEST {i}: {test_case['name']}")
        
        print(f"📝 Query: {test_case['query']}")
        print(f"🎯 Expected: {test_case['expected']}")
        print("\n🔄 Processing query...")
        
        try:
            # Process the query
            start_time = datetime.now()
            response = solo_agent.process_query(test_case['query'])
            end_time = datetime.now()
            
            duration = (end_time - start_time).total_seconds()
            print(f"⏱️  Processing time: {duration:.2f} seconds")
            
            # Format and display response
            print("\n📤 Agent Response:")
            format_response(response)
            
            results.append({
                "test_case": test_case['name'],
                "success": response.get('status') == 'success',
                "duration": duration,
                "response": response
            })
            
        except Exception as e:
            print(f"❌ Test failed with error: {e}")
            results.append({
                "test_case": test_case['name'],
                "success": False,
                "error": str(e)
            })
        
        if i < len(test_cases_list):
            input("\n⏸️  Press Enter to continue to next test...")
    
    # Summary
    print_separator("TEST SUMMARY")
    
    successful = sum(1 for r in results if r.get('success', False))
    total = len(results)
    
    print(f"✅ Successful: {successful}/{total}")
    print(f"❌ Failed: {total - successful}/{total}")
    
    if successful > 0:
        avg_time = sum(r.get('duration', 0) for r in results if r.get('success', False)) / successful
        print(f"⏱️  Average processing time: {avg_time:.2f} seconds")
    
    print("\n📊 Detailed Results:")
    for result in results:
        status = "✅" if result.get('success', False) else "❌"
        duration = f" ({result.get('duration', 0):.2f}s)" if 'duration' in result else ""
        print(f"  {status} {result['test_case']}{duration}")
        if 'error' in result:
            print(f"    Error: {result['error']}")


def interactive_mode():
    """Interactive testing mode"""
    print_separator("INTERACTIVE MODE")
    
    try:
        solo_agent = create_solo_agent()
        print("🤖 Solo Agent ready! Type your queries below.")
        print("💡 Try queries like:")
        print("   - 'study places nearby'")
        print("   - 'family dinner in jayanagar'") 
        print("   - 'fun places for tonight'")
        print("   - 'quiet cafe for work'")
        print("\nType 'quit' to exit.\n")
        
        while True:
            query = input("🔍 Query: ").strip()
            
            if query.lower() in ['quit', 'exit', 'q']:
                print("👋 Goodbye!")
                break
            
            if not query:
                continue
                
            print("\n🔄 Processing...")
            try:
                start_time = datetime.now()
                response = solo_agent.process_query(query)
                end_time = datetime.now()
                
                duration = (end_time - start_time).total_seconds()
                print(f"⏱️  Processing time: {duration:.2f} seconds")
                
                format_response(response)
                
            except Exception as e:
                print(f"❌ Error: {e}")
            
            print("\n" + "-"*40 + "\n")
            
    except Exception as e:
        print(f"❌ Failed to initialize: {e}")


if __name__ == "__main__":
    # Check if interactive mode requested
    if len(sys.argv) > 1 and sys.argv[1] == "interactive":
        interactive_mode()
    else:
        print("🚀 Starting automated tests...")
        print("💡 For interactive mode, run: python test_solo_agent.py interactive")
        print("💡 For specific test, run: python test_solo_agent.py <test_number>")
        print("💡 For custom query, run: python test_solo_agent.py 'your query here'")
        
        main()