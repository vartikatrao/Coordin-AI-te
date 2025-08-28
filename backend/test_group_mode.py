#!/usr/bin/env python3
"""
Command Line Interface for testing Group Mode functionality
Allows dynamic input from terminal for each group member
Works with any city/location - no hardcoded values
"""

import asyncio
import json
import sys
import os
from typing import List, Dict, Any
from datetime import datetime

# Add parent directory to path to import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from app.agents.group_agent import GroupAgent, GroupMember, GroupConstraints
    from app.core.config import settings
except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're running from the correct directory and have installed requirements")
    sys.exit(1)


class GroupModeTestCLI:
    """Command line interface for testing group coordination"""
    
    def __init__(self):
        self.group_agent = None
        self.members: List[GroupMember] = []
        self.group_constraints = GroupConstraints()
    
    def print_banner(self):
        """Print welcome banner"""
        print("\n" + "="*60)
        print("🤝 COORDIN-AI-TE GROUP MODE TEST INTERFACE")
        print("   Coordinate better. Meet faster. Travel safer.")
        print("="*60 + "\n")
    
    def check_configuration(self):
        """Check if required API keys are configured"""
        missing_keys = []
        
        if not getattr(settings, 'GEMINI_API_KEY', None):
            missing_keys.append('GEMINI_API_KEY')
        
        if not getattr(settings, 'FSQ_API_KEY', None):
            missing_keys.append('FSQ_API_KEY')
        
        if missing_keys:
            print("⚠️  WARNING: Missing API keys:")
            for key in missing_keys:
                print(f"   - {key}")
            print("\nSome features may not work properly.")
            print("Please add these to your .env file.\n")
            
            response = input("Continue anyway? (y/n): ").strip().lower()
            return response in ['y', 'yes']
        
        return True
    
    def get_group_size(self) -> int:
        """Get the number of group members"""
        while True:
            try:
                size = input("👥 How many people in your group? (2-8): ")
                size = int(size)
                if 2 <= size <= 8:
                    return size
                else:
                    print("❌ Group size must be between 2 and 8 people")
            except ValueError:
                print("❌ Please enter a valid number")
            except KeyboardInterrupt:
                print("\n👋 Goodbye!")
                sys.exit(0)
    
    def get_member_info(self, member_num: int) -> GroupMember:
        """Collect information for a single group member"""
        print(f"\n📝 MEMBER {member_num} DETAILS:")
        print("-" * 30)
        
        try:
            # Basic info
            name = input(f"Name for Member {member_num}: ").strip()
            if not name:
                name = f"Member{member_num}"
            
            # Location with flexible input
            print(f"\n📍 Where is {name} currently located?")
            print("   You can enter:")
            print("   • Full address: '123 Main St, New York, NY'")
            print("   • Area/neighborhood: 'Downtown Seattle', 'Manhattan'")
            print("   • Landmark: 'Near Central Park', 'Close to airport'")
            print("   • Coordinates: '40.7128,-74.0060'")
            
            location = input(f"{name}'s location: ").strip()
            if not location:
                location = "City center"  # Generic fallback
            
            # Preferences with examples
            print(f"\n🎯 What does {name} prefer for this meetup?")
            print("   Examples:")
            print("   • Food: 'loves Italian food, vegetarian options'")
            print("   • Atmosphere: 'quiet places, outdoor seating'")
            print("   • Activities: 'games available, live music'")
            print("   • General: 'casual atmosphere, good coffee'")
            
            preferences = input(f"{name}'s preferences: ").strip()
            if not preferences:
                preferences = "flexible, open to suggestions"
            
            # Constraints with examples
            print(f"\n⏰ Any constraints or requirements for {name}?")
            print("   Examples:")
            print("   • Time: 'must be back by 10 PM', 'available after 3 PM'")
            print("   • Budget: 'under $25', 'budget-friendly options'")
            print("   • Transport: 'coming by car, needs parking', 'using public transit'")
            print("   • Special needs: 'wheelchair accessible', 'kid-friendly'")
            
            constraints = input(f"{name}'s constraints: ").strip()
            if not constraints:
                constraints = "flexible timing and budget"
            
            # Optional demographics
            demographics = None
            demo_input = input(f"\n👤 Any special considerations for {name}? (age group, accessibility needs, etc.) [Enter to skip]: ").strip()
            if demo_input:
                demographics = {"notes": demo_input}
            
            return GroupMember(
                id=str(member_num),
                name=name,
                current_location=location,
                preferences=preferences,
                constraints=constraints,
                demographics=demographics
            )
            
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            sys.exit(0)
    
    def get_group_constraints(self) -> GroupConstraints:
        """Collect group-level constraints and preferences"""
        print(f"\n🎯 GROUP SETTINGS:")
        print("-" * 30)
        
        try:
            # Purpose with flexible input
            print("What's the main purpose of this meetup?")
            print("Common purposes: dinner, lunch, coffee, study, work, fun, entertainment, shopping")
            print("Or describe in your own words...")
            
            purpose = input("Purpose: ").strip().lower()
            if not purpose:
                purpose = 'general'
            
            # Budget
            budget_input = input(f"\n💰 Maximum budget per person? (e.g., 25.00) [Enter to skip]: ").strip()
            max_budget = None
            if budget_input:
                try:
                    max_budget = float(budget_input)
                except ValueError:
                    print("❌ Invalid budget format, skipping...")
            
            # Safety preference
            print(f"\n🛡️ Safety preference level?")
            print("  1. Low (prioritize convenience and options)")
            print("  2. Medium (balanced approach)")  
            print("  3. High (safety is top priority)")
            
            safety_choice = input("Choose (1-3) [default: 2]: ").strip()
            safety_map = {'1': 'low', '2': 'medium', '3': 'high'}
            safety_pref = safety_map.get(safety_choice, 'medium')
            
            # Duration
            duration_input = input(f"\n⏱️ How long do you plan to spend? (hours, e.g., 2.5) [default: 2]: ").strip()
            duration = 2.0
            if duration_input:
                try:
                    duration = float(duration_input)
                except ValueError:
                    print("❌ Invalid duration, using default 2 hours")
            
            return GroupConstraints(
                purpose=purpose,
                max_budget_per_person=max_budget,
                safety_preference=safety_pref,
                group_size=len(self.members),
                duration_hours=duration
            )
            
        except KeyboardInterrupt:
            print("\n👋 Goodbye!")
            sys.exit(0)
    
    def display_summary(self):
        """Display input summary before processing"""
        print(f"\n📋 MEETUP SUMMARY:")
        print("=" * 50)
        
        print(f"👥 Group Size: {len(self.members)} people")
        print(f"🎯 Purpose: {self.group_constraints.purpose}")
        if self.group_constraints.max_budget_per_person:
            print(f"💰 Budget: ${self.group_constraints.max_budget_per_person}/person")
        print(f"🛡️ Safety Level: {self.group_constraints.safety_preference}")
        print(f"⏱️ Duration: {self.group_constraints.duration_hours} hours")
        
        print(f"\n👤 MEMBERS:")
        for i, member in enumerate(self.members, 1):
            print(f"  {i}. {member.name}")
            print(f"     📍 Location: {member.current_location}")
            print(f"     🎯 Wants: {member.preferences}")
            print(f"     ⚠️ Needs: {member.constraints}")
            if member.demographics:
                print(f"     👤 Notes: {member.demographics}")
            print()
    
    def confirm_proceed(self) -> bool:
        """Ask user to confirm before processing"""
        while True:
            try:
                response = input("🚀 Proceed with coordination? (y/n): ").strip().lower()
                if response in ['y', 'yes']:
                    return True
                elif response in ['n', 'no']:
                    return False
                else:
                    print("❌ Please enter 'y' or 'n'")
            except KeyboardInterrupt:
                print("\n👋 Goodbye!")
                sys.exit(0)
    
    async def process_coordination(self):
        """Process the group coordination"""
        print(f"\n🤖 PROCESSING WITH AI AGENTS...")
        print("⏳ This may take a moment while we:")
        print("   • Resolve all member locations")
        print("   • Analyze group preferences") 
        print("   • Calculate optimal meeting point")
        print("   • Search for suitable venues")
        print("   • Generate personalized recommendations")
        print()
        
        try:
            # Initialize group agent
            if not self.group_agent:
                self.group_agent = GroupAgent()
            
            result = await self.group_agent.coordinate_meetup(
                self.members, 
                self.group_constraints
            )
            
            self.display_results(result)
            
        except Exception as e:
            print(f"❌ ERROR: {str(e)}")
            print("💡 This might be due to:")
            print("   • Missing or invalid API keys")
            print("   • Network connectivity issues")
            print("   • Invalid location inputs")
            print("   • Service temporarily unavailable")
    
    def display_results(self, result: Dict[str, Any]):
        """Display the coordination results"""
        print("🎉 COORDINATION COMPLETE!")
        print("=" * 60)
        
        if not result.get('success'):
            print(f"❌ Coordination failed: {result.get('error', 'Unknown error')}")
            return
        
        # Meeting center
        if result.get('meeting_center'):
            center = result['meeting_center']
            print(f"📍 OPTIMAL MEETING AREA:")
            print(f"   Coordinates: {center.get('lat', 0):.4f}, {center.get('lng', 0):.4f}")
            print(f"   This location minimizes travel time for everyone!")
            print()
        
        # Group analysis
        if result.get('group_intent'):
            intent = result['group_intent']
            print(f"🎯 GROUP ANALYSIS:")
            print(f"   Purpose: {intent.get('purpose', 'general meetup')}")
            print(f"   Vibe: {intent.get('vibe', 'casual atmosphere')}")
            if intent.get('cuisine_preferences'):
                print(f"   Food preferences: {', '.join(intent['cuisine_preferences'])}")
            if intent.get('success_factors'):
                print(f"   Success factors: {intent['success_factors']}")
            print()
        
        # Recommendations
        recommendations = result.get('recommendations', [])
        if recommendations:
            print(f"🏆 TOP RECOMMENDATIONS:")
            print("-" * 40)
            
            for i, rec in enumerate(recommendations, 1):
                print(f"{i}. {rec.get('name', 'Recommended Venue')}")
                if rec.get('address'):
                    print(f"   📍 {rec.get('address')}")
                if rec.get('category'):
                    print(f"   🏷️ Category: {rec.get('category')}")
                if rec.get('rating'):
                    print(f"   ⭐ Rating: {rec.get('rating')}/5")
                if rec.get('price_level'):
                    price_symbols = "$" * rec.get('price_level', 1)
                    print(f"   💰 Price: {price_symbols}")
                if rec.get('total_score'):
                    print(f"   #!/usr/bin/env python3")

import asyncio
import json
import sys
import os
from typing import List, Dict, Any
from datetime import datetime

# Add parent directory to path to import our modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.agents.group_agent import GroupAgent, GroupMember, GroupConstraints


class GroupModeTestCLI:
    """Command line interface for testing group coordination"""
    
    def __init__(self):
        self.group_agent = GroupAgent()
        self.members: List[GroupMember] = []
        self.group_constraints = GroupConstraints()
    
    def print_banner(self):
        """Print welcome banner"""
        print("\n" + "="*60)
        print("🤝 COORDIN-AI-TE GROUP MODE TEST INTERFACE")
        print("   Coordinate better. Meet faster. Travel safer.")
        print("="*60 + "\n")
    
    def get_group_size(self) -> int:
        """Get the number of group members"""
        while True:
            try:
                size = input("👥 How many people in your group? (2-8): ")
                size = int(size)
                if 2 <= size <= 8:
                    return size
                else:
                    print("❌ Group size must be between 2 and 8 people")
            except ValueError:
                print("❌ Please enter a valid number")
    
    def get_member_info(self, member_num: int) -> GroupMember:
        """Collect information for a single group member"""
        print(f"\n📝 MEMBER {member_num} DETAILS:")
        print("-" * 30)
        
        # Basic info
        name = input(f"Name for Member {member_num}: ").strip()
        if not name:
            name = f"Member{member_num}"
        
        # Location
        print("\n📍 Location (choose one):")
        print("  1. Enter address (e.g., 'Downtown Seattle')")
        print("  2. Enter coordinates (e.g., '47.6062,-122.3321')")
        
        location = input("Current location: ").strip()
        if not location:
            location = "Seattle, WA"  # Default
        
        # Preferences
        print(f"\n🎯 What are {name}'s preferences?")
        print("   Examples: 'loves Italian food, vegetarian', 'quiet places, good wifi'")
        preferences = input("Preferences: ").strip()
        if not preferences:
            preferences = "flexible, casual"
        
        # Constraints
        print(f"\n⏰ Any constraints for {name}?")
        print("   Examples: 'must be back by 10 PM', 'budget under $20', 'needs parking'")
        constraints = input("Constraints: ").strip()
        if not constraints:
            constraints = "flexible timing"
        
        # Optional demographics
        demographics = None
        demo_input = input(f"\n👤 Any demographics to consider for {name}? (age, accessibility needs) [Enter to skip]: ").strip()
        if demo_input:
            try:
                # Simple parsing - in production you'd want more sophisticated handling
                if 'age' in demo_input.lower():
                    age_match = [int(s) for s in demo_input.split() if s.isdigit()]
                    demographics = {"age": age_match[0] if age_match else None}
                
                if 'wheelchair' in demo_input.lower() or 'accessible' in demo_input.lower():
                    if not demographics:
                        demographics = {}
                    demographics['accessibility'] = 'wheelchair'
            except:
                demographics = None
        
        return GroupMember(
            id=str(member_num),
            name=name,
            current_location=location,
            preferences=preferences,
            constraints=constraints,
            demographics=demographics
        )
    
    def get_group_constraints(self) -> GroupConstraints:
        """Collect group-level constraints and preferences"""
        print(f"\n🎯 GROUP SETTINGS:")
        print("-" * 30)
        
        # Purpose
        print("What's the purpose of this meetup?")
        print("  1. Dinner/Food")
        print("  2. Study/Work")
        print("  3. Fun/Entertainment")
        print("  4. Shopping")
        print("  5. General/Other")
        
        purpose_choice = input("Choose (1-5) or type custom purpose: ").strip()
        
        purpose_map = {
            '1': 'dinner',
            '2': 'study', 
            '3': 'fun',
            '4': 'shopping',
            '5': 'general'
        }
        
        if purpose_choice in purpose_map:
            purpose = purpose_map[purpose_choice]
        elif purpose_choice:
            purpose = purpose_choice
        else:
            purpose = 'general'
        
        # Budget
        budget_input = input(f"\n💰 Maximum budget per person? (e.g., 25.00) [Enter to skip]: ").strip()
        max_budget = None
        if budget_input:
            try:
                max_budget = float(budget_input)
            except ValueError:
                print("❌ Invalid budget, skipping...")
        
        # Safety preference
        print(f"\n🛡️ Safety preference level?")
        print("  1. Low (prioritize convenience)")
        print("  2. Medium (balanced approach)")  
        print("  3. High (safety first)")
        
        safety_choice = input("Choose (1-3) [default: 2]: ").strip()
        safety_map = {'1': 'low', '2': 'medium', '3': 'high'}
        safety_pref = safety_map.get(safety_choice, 'medium')
        
        # Duration
        duration_input = input(f"\n⏱️ How long do you plan to stay? (hours, e.g., 2.5) [default: 2]: ").strip()
        duration = 2.0
        if duration_input:
            try:
                duration = float(duration_input)
            except ValueError:
                print("❌ Invalid duration, using default 2 hours")
        
        return GroupConstraints(
            purpose=purpose,
            max_budget_per_person=max_budget,
            safety_preference=safety_pref,
            group_size=len(self.members),
            duration_hours=duration
        )
    
    def display_summary(self):
        """Display input summary before processing"""
        print(f"\n📋 MEETUP SUMMARY:")
        print("=" * 50)
        
        print(f"👥 Group Size: {len(self.members)} people")
        print(f"🎯 Purpose: {self.group_constraints.purpose}")
        if self.group_constraints.max_budget_per_person:
            print(f"💰 Budget: ${self.group_constraints.max_budget_per_person}/person")
        print(f"🛡️ Safety Level: {self.group_constraints.safety_preference}")
        print(f"⏱️ Duration: {self.group_constraints.duration_hours} hours")
        
        print(f"\n👤 MEMBERS:")
        for i, member in enumerate(self.members, 1):
            print(f"  {i}. {member.name}")
            print(f"     📍 Location: {member.current_location}")
            print(f"     🎯 Wants: {member.preferences}")
            print(f"     ⚠️ Needs: {member.constraints}")
            if member.demographics:
                print(f"     👤 Notes: {member.demographics}")
            print()
    
    def confirm_proceed(self) -> bool:
        """Ask user to confirm before processing"""
        while True:
            response = input("🚀 Proceed with coordination? (y/n): ").strip().lower()
            if response in ['y', 'yes']:
                return True
            elif response in ['n', 'no']:
                return False
            else:
                print("❌ Please enter 'y' or 'n'")
    
    async def process_coordination(self):
        """Process the group coordination"""
        print(f"\n🤖 PROCESSING WITH CREWAI AGENTS...")
        print("⏳ This may take a moment...\n")
        
        try:
            result = await self.group_agent.coordinate_meetup(
                self.members, 
                self.group_constraints
            )
            
            self.display_results(result)
            
        except Exception as e:
            print(f"❌ ERROR: {str(e)}")
            print("💡 This might be due to missing API keys or network issues")
    
    def display_results(self, result: Dict[str, Any]):
        """Display the coordination results"""
        print("🎉 COORDINATION COMPLETE!")
        print("=" * 60)
        
        if not result.get('success'):
            print(f"❌ Failed: {result.get('error', 'Unknown error')}")
            return
        
        # Meeting center
        if result.get('meeting_center'):
            center = result['meeting_center']
            print(f"📍 OPTIMAL MEETING AREA:")
            print(f"   Coordinates: {center.get('lat', 0):.4f}, {center.get('lng', 0):.4f}")
            print()
        
        # Group intent
        if result.get('group_intent'):
            intent = result['group_intent']
            print(f"🎯 GROUP ANALYSIS:")
            print(f"   Purpose: {intent.get('purpose', 'general')}")
            print(f"   Vibe: {intent.get('vibe', 'casual')}")
            if intent.get('cuisine_preferences'):
                print(f"   Cuisine: {', '.join(intent['cuisine_preferences'])}")
            print()
        
        # Recommendations
        recommendations = result.get('recommendations', [])
        if recommendations:
            print(f"🏆 TOP RECOMMENDATIONS:")
            print("-" * 40)
            
            for i, rec in enumerate(recommendations, 1):
                print(f"{i}. {rec.get('name', 'Unknown Place')}")
                print(f"   📍 {rec.get('address', 'Address not available')}")
                if rec.get('category'):
                    print(f"   🏷️ Category: {rec.get('category')}")
                if rec.get('rating'):
                    print(f"   ⭐ Rating: {rec.get('rating')}/5")
                if rec.get('price_level'):
                    price_symbols = "$" * rec.get('price_level', 1)
                    print(f"   💰 Price: {price_symbols}")
                if rec.get('total_score'):
                    print(f"   🎯 Match Score: {rec.get('total_score')}/10")
                
                # Member explanations
                explanations = rec.get('member_explanations', {})
                if explanations:
                    print(f"   👥 Why it works:")
                    for member_id, explanation in explanations.items():
                        member_name = next((m.name for m in self.members if m.id == member_id), f"Member {member_id}")
                        print(f"      • {member_name}: {explanation}")
                
                print()
        else:
            print("❌ No recommendations found")
        
        # Summary
        if result.get('member_summary'):
            print(f"📝 SUMMARY: {result['member_summary']}")
    
    def offer_retry(self) -> bool:
        """Ask if user wants to try again"""
        while True:
            response = input("\n🔄 Try another coordination? (y/n): ").strip().lower()
            if response in ['y', 'yes']:
                return True
            elif response in ['n', 'no']:
                return False
            else:
                print("❌ Please enter 'y' or 'n'")
    
    async def run_interactive_test(self):
        """Main interactive test loop"""
        while True:
            self.print_banner()
            
            # Reset for new test
            self.members = []
            
            # Get group size
            group_size = self.get_group_size()
            
            # Collect member information
            for i in range(1, group_size + 1):
                member = self.get_member_info(i)
                self.members.append(member)
            
            # Get group constraints
            self.group_constraints = self.get_group_constraints()
            
            # Display summary and confirm
            self.display_summary()
            
            if self.confirm_proceed():
                await self.process_coordination()
            else:
                print("❌ Coordination cancelled")
            
            # Ask if they want to try again
            if not self.offer_retry():
                break
        
        print("\n👋 Thanks for testing Coordin-AI-te Group Mode!")
        print("   Have a great meetup! 🎉\n")


def run_quick_test():
    """Run a quick test with predefined data"""
    print("\n🚀 QUICK TEST MODE")
    print("-" * 30)
    
    # Predefined test data
    test_members = [
        GroupMember(
            id="1",
            name="Alice",
            current_location="Downtown Seattle",
            preferences="loves coffee, quiet places for chatting",
            constraints="needs to be back by 9 PM"
        ),
        GroupMember(
            id="2", 
            name="Bob",
            current_location="Capitol Hill, Seattle",
            preferences="enjoys good food, casual atmosphere",
            constraints="budget under $25"
        ),
        GroupMember(
            id="3",
            name="Charlie",
            current_location="University District, Seattle", 
            preferences="vegetarian options, outdoor seating preferred",
            constraints="has car, can drive others"
        )
    ]
    
    test_constraints = GroupConstraints(
        purpose="dinner",
        max_budget_per_person=30.0,
        safety_preference="medium",
        group_size=3,
        duration_hours=2.0
    )
    
    async def run_quick():
        agent = GroupAgent()
        print("⏳ Running coordination...")
        result = await agent.coordinate_meetup(test_members, test_constraints)
        
        print(f"✅ Success: {result.get('success')}")
        if result.get('recommendations'):
            print(f"📍 Found {len(result['recommendations'])} recommendations")
            for i, rec in enumerate(result['recommendations'][:3], 1):
                print(f"  {i}. {rec.get('name', 'Unknown')}")
        else:
            print("❌ No recommendations found")
            if result.get('error'):
                print(f"   Error: {result['error']}")
    
    asyncio.run(run_quick())


def main():
    """Main entry point"""
    print("\nCoordinate Better. Meet Faster. Travel Safer.")
    print("Choose test mode:")
    print("  1. Interactive Mode (input your own data)")
    print("  2. Quick Test Mode (predefined data)")
    print("  3. Exit")
    
    choice = input("\nEnter choice (1-3): ").strip()
    
    if choice == '1':
        cli = GroupModeTestCLI()
        asyncio.run(cli.run_interactive_test())
    elif choice == '2':
        run_quick_test()
    elif choice == '3':
        print("👋 Goodbye!")
    else:
        print("❌ Invalid choice")


if __name__ == "__main__":
    main()