# Side Navigation Documentation

## Overview
The application uses a **Side Navigation Drawer** to provide access to the user's main features and support options. The drawer is accessible via a "hamburger" menu icon on the top-left of the main screens or by swiping from the left edge.

## Components

### `DrawerNavigator.tsx`
Located in `src/routes/DrawerNavigator.tsx`. This component defines the `Drawer.Navigator` and registers all available screens.

**Routes:**
- **Home**: Main dashboard (`HomeScreen`)
- **Find Method**: MEC Assessment (`Whatsrightforme`)
- **My Preferences**: User preferences (Visible only after assessment start)
- **Recommendations**: Assessment results (Visible only after assessment completion)
- **Methods**: Contraceptive information (`Contraceptivemethods`)
- **Learn**: Educational content (`Diduknow`)
- **Emergency Contraception**: EC Information (`EmergencyContraception`)
- **FAQs**: Frequently Asked Questions (`Contrafaqs`)
- **About Us**: App information (`AboutUs`)

### `SideMenu.tsx`
Located in `src/components/SideMenu.tsx`. This is a custom drawer content component that handles the rendering of menu items.

**Key Features:**
- **Conditional Visibility**: Uses `AssessmentContext` to show/hide "My Preferences" and "Recommendations" based on whether user data exists.
- **Support Section**: Separate section for FAQs, About Us, Feedback, and Privacy.
- **Special Actions**:
    - **Send Feedback**: Opens the user's email client.
    - **Exit App**: Uses `BackHandler` to exit the application (Android).

## Branding
- **Active Color**: `#E45A92` (Primary Pink)
- **Icons**: `Ionicons` (Outline for inactive, Filled for active)

## Usage
To navigate to a screen:
```typescript
navigation.navigate('ScreenName');
```

To toggle the drawer:
```typescript
navigation.toggleDrawer();
```
