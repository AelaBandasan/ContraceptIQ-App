# OB Navigation Documentation

## Overview
The Obstetrician (OB) side of the application uses a **Bottom Tab Navigation** layout to provide quick access to key workflows. This layout replaces or sits within the existing Drawer navigation structure.

## Branding
- **Primary Color**: `#E45A92` (Pink) - Consistent with the brand palette.
- **Inactive Color**: `#94A3B8` (Slate Gray)
- **Background**: White

## Navigation Structure

### `ObTabNavigator`
Located in `src/routes/ObTabNavigator.tsx`.

**Tabs:**
1.  **Home** (Dashboard)
    - **Icon**: `home` (Ionicons) or `LayoutDashboard` (Lucide)
    - **Component**: `ObHomeScreen` (or `DoctorDashboardScreen`)
    - **Purpose**: Overview of tasks, recent patients, or quick actions.
2.  **Assessment** (New Assessment)
    - **Icon**: `clipboard` (Ionicons) or `ClipboardList` (Lucide)
    - **Component**: `Whatsrightforme` (with `isDoctorAssessment: true`)
    - **Purpose**: Start a new MEC assessment for a patient.
3.  **Recommendations**
    - **Icon**: `ribbon` (Ionicons) or `Award` (Lucide)
    - **Component**: `Recommendation`
    - **Purpose**: View recommendations for the current session/patient.
4.  **Methods** (Methods Guide)
    - **Icon**: `medkit` (Ionicons) or `Book` (Lucide)
    - **Component**: `Contraceptivemethods`
    - **Purpose**: Reference guide for counseling.
5.  **Profile**
    - **Icon**: `person` (Ionicons) or `User` (Lucide)
    - **Component**: `ObProfileScreen`
    - **Purpose**: Manage account settings and profile.

## Drawer Navigation (Side Menu)
Located in `src/routes/ObDrawerNavigator.tsx`.

**Items:**
1.  **Patient Sessions / History** (Recent Assessments)
    - **Icon**: `history` (Ionicons) or `History` (Lucide)
    - **Component**: `ObHistoryScreen` (New/Placeholder)
2.  **Contraceptive Methods** (Guide)
    - **Icon**: `book` (Ionicons) or `BookOpen` (Lucide)
    - **Component**: `Contraceptivemethods`
3.  **MEC Guide / Color Legend**
    - **Icon**: `color-palette` (Ionicons) or `Palette` (Lucide)
    - **Component**: `MecGuideScreen` (Modal/Screen)
4.  **FAQs / Patient Education**
    - **Icon**: `help-circle` (Ionicons) or `HelpCircle` (Lucide)
    - **Component**: `Contrafaqs` + `Diduknow` (Composite or Menu)
5.  **Emergency Contraception**
    - **Icon**: `alert-circle` (Ionicons) or `AlertTriangle` (Lucide)
    - **Component**: `EmergencyContraception` (Reuse existing)
6.  **About Us**
    - **Icon**: `information-circle` (Ionicons) or `Info` (Lucide)
    - **Component**: `AboutUs` (Reuse existing)
7.  **Send Feedback**
    - **Icon**: `mail` (Ionicons) or `MessageSquare` (Lucide)
    - **Component**: `FeedbackScreen` (New/Placeholder)
8.  **Account Settings**
    - **Icon**: `settings` (Ionicons) or `Settings` (Lucide)
    - **Component**: `SettingsScreen` (Reuse `ObProfileScreen` or new)
9.  **Log Out**
    - **Icon**: `log-out` (Ionicons) or `LogOut` (Lucide)
    - **Action**: Signs out the user.

## API Integration Notes
- **Assessment**: The `Whatsrightforme` screen will need to handle saving assessments to the `consultations` table in Supabase.
- **Profile**: Will fetch doctor details from the `profiles` table.
- **Dashboard**: Will eventually fetch recent activity/patients.
- **History**: Will fetch past patient sessions from `consultations`.
