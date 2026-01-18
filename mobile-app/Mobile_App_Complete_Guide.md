#ContraceptIQ Mobile App - Complete Guide

#COMPLETED COMPONENTS

#Core UI Components
- contraceptive card (contraceptive method)

#Screens
-

#REMAINING SCREENS TO CREATE
1. Landing Page
Features/display:
- App name and tagline
- Continue as guest
- Login as OB Professional (sign up)
- Admin

// USER SCREENS //
2. HomeScreen.tsx
Features/display:
- App name and tagline
- Image about contraception
- Contraceptive Methods (horizontal slider)
- Educational information about What is Contraception and A Guide to Birth Control
- Left navbar (to finalize)
- Bottom navbar (to finalize)

3. Left Navigation Bar
Features/display: (to finalize)
- App logo and name
- HomeScreen.tsx
- What's Right for Me?
- Contraceptive Methods
- Did You Know?
- Contraceptive FAQs
- About Us
- Log out(?)

4. Whatsrightforme.tsx
Features/display:
- 3 dots informational onboarding screen
- Get started button 
- Disclaimer modal
- Age Slider for contraceptive recommendation
- Conditions
- Add preferences button
- Bottom sheet with
|--> View recommendation button (-> Recommendation.tsx)
|--> Age display
|--> 6 contraceptive recommendation based on input age 
- Left navbar

5. Preferences.tsx
Features/display:
- 7 contraceptive preferences 
- At least 3 preferences
- View recommendation button (-> Recommendation.tsx)

6. Recommendations.tsx
Features/display:
- Display the recommended contraceptive 
|-> Display all the contraceptives
|-> color coded:
|--> Green '#22C55E' → Safe / Highly recommended
|--> Yellow '#FACC15' → Moderate / Acceptable with caution
|--> Orange '#F59E0B' → Higher caution / Limited suitability
|--> Red  '#EF4444'→ Not recommended / High risk
- Display the selected preferences
- Add notes to obgyne (for question?)
- Contraceptive cards
- Discontinuation risk (low risk or high risk)
- Contraceptive recommendation color coding meaning in modal form
- Back button
- Display the most recommended with color coded and discontinuation risk 
- share to obygne button (to finalize)
- left navbar

7. Contraceptivemethods.tsx
Features/display:
- Display all contraceptive types (in card component)
|-> Inside the card are the following:
|--> contraceptive image
|--> contraceptive name, definition
|--> contraceptive brands
|--> effectiveness 
|--> how to use - display where the contraceptive to put in body
|--> estimated price
|--> how often to remember it - display contraceptive image in calendar form
|--> side effects (benefits, advantage and disadvantage)
|--> What if i decide to get pregnant
- back button

8. Diduknow.tsx
Features/display:
- Menstruation and fertility awareness/faq (5 each)

9. Contrafaqs.tsx
Features/display:
- display contraceptive faqs (at least 10)

10. Additional info
Features/display:
- Display emergency contraception

11. AboutUs.tsx
- about us

12. Feedback
- give feedback through email's app




#DESIGN SYSTEM CONSTANTS
 background: '#FFFFFF',
  surface: '#F8FAFC',
  primary: '#E45A92',
  primaryDark: '#D94F00',
  textPrimary: '#0F172A',
  textSecondary: '#6B7280',
  textMuted: '#9CA3AF',
  border: '#E5E7EB',
  star: '#FACC15',
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',

  export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
  };

  export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  };

### Colors
- **Primary**: #FF5722 (bright orange) - Used for trending icons, clear all button
- **Background**: #FFFFFF (pure white)
- **Text Primary**: #1F2937 (dark grey)
- **Text Secondary**: #9CA3AF (medium grey)
- **Icons**: #9CA3AF (grey for clock), #FF5722 (orange for trending)

### Typography
- **Section Titles**: 18px, weight 800, letterSpacing -0.3
- **Search Terms**: 15px, weight 500, letterSpacing -0.1
- **Clear All**: 14px, weight 700, letterSpacing 0.2
- **Cancel**: 15px, weight 600, letterSpacing -0.2

### Spacing & Layout
- **Section padding**: 20px horizontal, 20px top, 8px bottom
- **Item spacing**: 14px vertical padding, 14px gap between icon and text
- **Card spacing**: 12px gap in horizontal scroll

# COMPELETE FEATURE CHECKLIST
- 

# Data Flows
- 

# SCREEN FLOWS

# NEXT STEPS TO COMPLETE
1. 
