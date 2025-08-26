#!/usr/bin/env python3
"""
Interactive Test Script for Solo Agent
Run this to test the agentic workflow with dynamic user input
"""

import json
import sys
import os
from datetime import datetime
import time

# Add the backend directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.agents.solo_agent import create_solo_agent


class Colors:
    """ANSI color codes for better terminal output"""
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


def print_colored(text, color=Colors.ENDC):
    """Print colored text"""
    print(f"{color}{text}{Colors.ENDC}")


def print_separator(title="", char="=", length=60):
    """Print a visual separator"""
    print(f"\n{char * length}")
    if title:
        print(f"  {title}")
        print(char * length)
    print()


def print_loading_animation(text="Processing", duration=2):
    """Show a loading animation"""
    animation = "|/-\\"
    for i in range(duration * 4):
        time.sleep(0.25)
        sys.stdout.write(f"\r{text}... {animation[i % len(animation)]}")
        sys.stdout.flush()
    sys.stdout.write(f"\r{text}... Done!   \n")


def format_response(response):
    """Format and print response nicely"""
    if response.get("status") == "error":
        print_colored(f"❌ Error: {response.get('error')}", Colors.FAIL)
        return
    
    print_colored(f"✅ Status: {response.get('status')}", Colors.OKGREEN)
    print_colored(f"🕐 Timestamp: {response.get('timestamp')}", Colors.OKCYAN)
    print_colored(f"❓ Query: {response.get('query')}", Colors.OKBLUE)
    
    if "recommendations" in response:
        recs = response["recommendations"]
        if isinstance(recs, dict):
            print_colored("\n📋 AI Response:", Colors.HEADER)
            
            # Try to format as readable text if it's JSON
            if "recommendations" in recs:
                rec_list = recs["recommendations"]
                for i, rec in enumerate(rec_list, 1):
                    print_colored(f"\n🏪 {i}. {rec.get('place_name', 'Unknown Place')}", Colors.BOLD)
                    print(f"   ⭐ Score: {rec.get('ranking_score', 'N/A')}/10")
                    print(f"   💡 Why: {rec.get('why_recommended', 'No explanation')}")
                    print(f"   🎯 Best for: {rec.get('best_for', 'General use')}")
                    if rec.get('timing_advice'):
                        print(f"   ⏰ Timing: {rec['timing_advice']}")
                    if rec.get('tags'):
                        print(f"   🏷️  Tags: {', '.join(rec['tags'])}")
                
                if recs.get('overall_summary'):
                    print_colored(f"\n📝 Summary: {recs['overall_summary']}", Colors.OKGREEN)
                
                if recs.get('contextual_tips'):
                    print_colored(f"\n💡 Tips:", Colors.WARNING)
                    for tip in recs['contextual_tips']:
                        print(f"   • {tip}")
            else:
                print(json.dumps(recs, indent=2))
        else:
            print_colored(f"\n📋 Response: {recs}", Colors.OKGREEN)
    elif "response" in response:
        print_colored(f"\n📋 Response: {response['response']}", Colors.OKGREEN)


def get_user_location():
    """Get user's preferred location"""
    print_colored("🌍 Location Settings:", Colors.HEADER)
    print("1. Use default location (Bangalore)")
    print("2. Enter custom coordinates (lat,lng)")
    print("3. Skip (use system default)")
    
    choice = input("\nSelect option (1-3): ").strip()
    
    if choice == "1":
        return "12.9716,77.5946"
    elif choice == "2":
        coords = input("Enter coordinates (lat,lng): ").strip()
        if coords and "," in coords:
            return coords
        else:
            print_colored("Invalid format, using default", Colors.WARNING)
            return "12.9716,77.5946"
    else:
        return None


def chat_mode():
    """Interactive chat mode"""
    print_separator("🤖 COORDINATE AI CHAT MODE", "=")
    
    print_colored("Welcome to Coordinate AI! I'll help you find amazing places.", Colors.HEADER)
    print_colored("💬 Just tell me what you're looking for in natural language!", Colors.OKGREEN)
    
    # Example queries
    examples = [
        "study places nearby",
        "family dinner in jayanagar with kids",
        "fun places for tonight",
        "quiet cafe for work meeting",
        "affordable lunch around here"
    ]
    
    print_colored("\n💡 Try queries like:", Colors.WARNING)
    for example in examples:
        print(f"   • \"{example}\"")
    
    print_colored("\n📍 Commands:", Colors.OKCYAN)
    print("   • 'quit' or 'exit' - Leave chat")
    print("   • 'examples' - Show more example queries")
    print("   • 'location' - Change your location")
    print("   • 'help' - Show this help")
    
    # Initialize agent
    try:
        print_colored("\n🔄 Initializing AI Agent...", Colors.WARNING)
        solo_agent = create_solo_agent()
        print_colored("✅ AI Agent ready!", Colors.OKGREEN)
    except Exception as e:
        print_colored(f"❌ Failed to initialize: {e}", Colors.FAIL)
        return
    
    # Get user location
    user_location = get_user_location()
    if user_location:
        print_colored(f"📍 Using location: {user_location}", Colors.OKCYAN)
    
    # Chat loop
    conversation_count = 0
    print_separator("🗣️ START CHATTING", "-")
    
    while True:
        try:
            # Get user input
            query = input(f"\n{Colors.BOLD}You:{Colors.ENDC} ").strip()
            
            if not query:
                continue
                
            # Handle commands
            if query.lower() in ['quit', 'exit', 'q', 'bye']:
                print_colored("\n👋 Thanks for using Coordinate AI! Goodbye!", Colors.HEADER)
                break
                
            elif query.lower() == 'help':
                print_colored("\n💡 Help:", Colors.WARNING)
                print("   • Ask for places in natural language")
                print("   • Be specific about your needs (group size, budget, time)")
                print("   • Examples: 'coffee shop for meeting', 'family restaurant'")
                continue
                
            elif query.lower() == 'examples':
                print_colored("\n📝 More Examples:", Colors.WARNING)
                more_examples = [
                    "romantic dinner for date night",
                    "gym near MG Road for workout",
                    "bookstore with cafe for reading",
                    "kid-friendly restaurant with playground",
                    "cozy place for catch up with friends",
                    "business lunch venue near Koramangala"
                ]
                for ex in more_examples:
                    print(f"   • \"{ex}\"")
                continue
                
            elif query.lower() == 'location':
                user_location = get_user_location()
                if user_location:
                    print_colored(f"📍 Location updated: {user_location}", Colors.OKCYAN)
                continue
            
            # Process the query
            conversation_count += 1
            print_colored(f"\n🤖 Coordinate AI: Let me find the perfect places for you...", Colors.HEADER)
            
            # Show loading animation
            print_loading_animation("Analyzing your request", 1)
            
            start_time = datetime.now()
            response = solo_agent.process_query(query, user_location)
            end_time = datetime.now()
            
            duration = (end_time - start_time).total_seconds()
            
            # Format and display response
            print_colored(f"⏱️ Processing time: {duration:.2f} seconds", Colors.OKCYAN)
            format_response(response)
            
            # Ask for feedback
            if conversation_count % 3 == 0:
                feedback = input(f"\n{Colors.WARNING}💭 How are the recommendations? (good/bad/skip): {Colors.ENDC}").strip()
                if feedback.lower() in ['bad', 'poor', 'not good']:
                    print_colored("Thanks for feedback! I'm learning to improve.", Colors.OKCYAN)
                elif feedback.lower() in ['good', 'great', 'excellent']:
                    print_colored("Awesome! Glad I could help! 😊", Colors.OKGREEN)
            
        except KeyboardInterrupt:
            print_colored("\n\n👋 Chat interrupted. Goodbye!", Colors.WARNING)
            break
        except Exception as e:
            print_colored(f"❌ Error: {e}", Colors.FAIL)
            print_colored("Let's try again...", Colors.WARNING)


def quick_test_mode():
    """Quick test with predefined queries"""
    print_separator("⚡ QUICK TEST MODE", "=")
    
    test_queries = [
        "study places nearby",
        "family dinner with kids in jayanagar", 
        "fun places for tonight",
        "quiet cafe for work",
        "affordable lunch around here"
    ]
    
    try:
        print_colored("🔄 Initializing AI Agent...", Colors.WARNING)
        solo_agent = create_solo_agent()
        print_colored("✅ AI Agent ready!", Colors.OKGREEN)
    except Exception as e:
        print_colored(f"❌ Failed to initialize: {e}", Colors.FAIL)
        return
    
    print_colored(f"🧪 Running {len(test_queries)} test queries...", Colors.HEADER)
    
    for i, query in enumerate(test_queries, 1):
        print_separator(f"TEST {i}: {query}", "-")
        
        try:
            start_time = datetime.now()
            response = solo_agent.process_query(query)
            end_time = datetime.now()
            
            duration = (end_time - start_time).total_seconds()
            print_colored(f"⏱️ Processing time: {duration:.2f} seconds", Colors.OKCYAN)
            
            format_response(response)
            
        except Exception as e:
            print_colored(f"❌ Test failed: {e}", Colors.FAIL)
        
        if i < len(test_queries):
            input(f"\n{Colors.WARNING}⏸️ Press Enter for next test...{Colors.ENDC}")
    
    print_colored("\n✅ All tests completed!", Colors.OKGREEN)


def custom_query_mode():
    """Single custom query mode"""
    print_separator("🎯 CUSTOM QUERY MODE", "=")
    
    try:
        print_colored("🔄 Initializing AI Agent...", Colors.WARNING)
        solo_agent = create_solo_agent()
        print_colored("✅ AI Agent ready!", Colors.OKGREEN)
    except Exception as e:
        print_colored(f"❌ Failed to initialize: {e}", Colors.FAIL)
        return
    
    # Get user location
    user_location = get_user_location()
    
    # Get custom query
    print_colored("\n💬 Enter your query:", Colors.HEADER)
    query = input("Query: ").strip()
    
    if not query:
        print_colored("❌ Empty query provided", Colors.FAIL)
        return
    
    print_colored(f"\n🔄 Processing: \"{query}\"", Colors.WARNING)
    
    try:
        start_time = datetime.now()
        response = solo_agent.process_query(query, user_location)
        end_time = datetime.now()
        
        duration = (end_time - start_time).total_seconds()
        print_colored(f"⏱️ Processing time: {duration:.2f} seconds", Colors.OKCYAN)
        
        format_response(response)
        
    except Exception as e:
        print_colored(f"❌ Query failed: {e}", Colors.FAIL)


def main_menu():
    """Main menu for selecting mode"""
    print_separator("🚀 COORDINATE AI - TESTING INTERFACE", "=")
    
    print_colored("Choose your testing mode:", Colors.HEADER)
    print_colored("1. 🤖 Interactive Chat Mode (Recommended)", Colors.OKGREEN)
    print_colored("2. ⚡ Quick Test Mode (Predefined queries)", Colors.OKBLUE)
    print_colored("3. 🎯 Custom Query Mode (Single query)", Colors.OKCYAN)
    print_colored("4. ❌ Exit", Colors.FAIL)
    
    while True:
        choice = input(f"\n{Colors.BOLD}Select option (1-4): {Colors.ENDC}").strip()
        
        if choice == "1":
            chat_mode()
            break
        elif choice == "2":
            quick_test_mode()
            break
        elif choice == "3":
            custom_query_mode()
            break
        elif choice == "4":
            print_colored("👋 Goodbye!", Colors.WARNING)
            break
        else:
            print_colored("❌ Invalid option. Please choose 1-4", Colors.FAIL)


if __name__ == "__main__":
    # Check command line arguments
    if len(sys.argv) > 1:
        if sys.argv[1] == "chat":
            chat_mode()
        elif sys.argv[1] == "quick":
            quick_test_mode()
        elif sys.argv[1] == "custom":
            custom_query_mode()
        else:
            # Treat as direct query
            custom_query = " ".join(sys.argv[1:])
            print_separator("🎯 DIRECT QUERY MODE", "=")
            try:
                solo_agent = create_solo_agent()
                print_colored(f"🔄 Processing: \"{custom_query}\"", Colors.WARNING)
                response = solo_agent.process_query(custom_query)
                format_response(response)
            except Exception as e:
                print_colored(f"❌ Error: {e}", Colors.FAIL)
    else:
        main_menu()