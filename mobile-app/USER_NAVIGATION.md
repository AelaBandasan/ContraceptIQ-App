# User Bottom Navigation Documentation

## Overview
The user interface uses a Bottom Navigation bar for quick access to the main sections of the application. This replaces the previous Side Navigation (Drawer).

## Components

### `UserTabNavigator.tsx`
Located in `src/routes/UserTabNavigator.tsx`. This component configures the `createBottomTabNavigator`.

**Key Features:**
- **Branding:** Uses the primary color (`#E45A92`) for the active tab state.
- **Icons:** Uses `lucide-react-native` icons for a modern look.
- **Shadow:** Includes a top border and shadow for visual separation.

## Route Mapping

| Tab Label | Route Name | Screen Component | Icon |
| :--- | :--- | :--- | :--- |
| **Home** | `Home` | `HomeScreen` | `Home` |
| **Find Method** | `Find Method` | `Whatsrightforme` | `Search` |
| **Methods** | `Methods` | `Contraceptivemethods` | `List` |
| **Learn** | `Learn` | `Diduknow` | `BookOpen` |

## Navigation Types
The navigation types are defined in `src/types/navigation.ts` under `UserTabParamList`.
Use `UserTabScreenProps<RouteName>` for typing screen props.
