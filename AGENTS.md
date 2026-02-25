# AGENTS.md - ContraceptIQ Mobile App

## Project Overview

This is an **Expo/React Native** mobile application for contraceptive risk assessment. The app interfaces with a Python backend (FastAPI) and includes on-device ML inference using ONNX models.

### Project Structure
```
mobile-app/
├── src/
│   ├── components/     # Reusable UI components
│   ├── context/        # React Context (AssessmentContext, etc.)
│   ├── data/           # Static data (contraceptiveData.ts)
│   ├── routes/         # Navigation (Stack, Drawer, Tab navigators)
│   ├── screens/        # Screen components (HomeScreen, Assessment, etc.)
│   │   └── ObSide/     # Doctor/OB-specific screens
│   ├── services/       # API services (discontinuationRiskService, etc.)
│   ├── theme/         # Design tokens (colors, typography, spacing)
│   ├── types/         # TypeScript type definitions
│   └── utils/         # Utilities (error handling, logging, network)
├── index.ts           # Entry point
└── package.json
```

---

## Build & Run Commands

### Development
```bash
cd mobile-app

# Start Expo (default localhost:8081)
npm start

# Start with emulator API URL (Android emulator uses 10.0.2.2)
npm run start:emulator

# Start with production API URL
npm run start:prod
```

### Running on Devices/Emulators
```bash
# Android (requires Android SDK)
npm run android

# Android with emulator API URL
npm run android:emulator

# iOS (requires Xcode)
npm run ios

# Web
npm run web
```

### Environment Variables
- `EXPO_PUBLIC_API_URL` - Backend API URL (defaults to `http://localhost:5000`)

### Testing
**No test framework is currently configured.** To add testing:
```bash
# Install Jest and React Native Testing Library
npm install --save-dev jest @testing-library/react-native

# Run tests
npx jest

# Run single test file
npx jest src/services/discontinuationRiskService.test.ts

# Run tests matching pattern
npx jest --testPathPattern="services"
```

---

## Code Style Guidelines

### TypeScript Configuration
- **Strict mode enabled** - Always use explicit types
- **tsconfig.json**: `mobile-app/tsconfig.json`
- Use `strict: true`, `jsx: "react-native"`, `esModuleInterop: true`

### Imports Order
```typescript
// 1. React/Expo imports
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";

// 2. Third-party library imports (alphabetical)
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// 3. Internal imports (relative paths)
import { colors, spacing } from '../theme';
import { createModuleLogger } from '../utils/loggerUtils';
import { createAppError } from '../utils/errorHandler';
```

### Naming Conventions
- **Components & Interfaces**: `PascalCase` (e.g., `ErrorBoundary`, `AssessmentData`)
- **Functions & Variables**: `camelCase` (e.g., `assessDiscontinuationRisk`, `isOnline`)
- **Constants & Enums**: `UPPER_SNAKE_CASE` (e.g., `MAX_RETRIES`, `ErrorType.NetworkError`)
- **Files**: `kebab-case.ts` for utils, `PascalCase.tsx` for components

### File Organization (Services & Utilities)

Use section headers with `// ============================================================================`:
```typescript
/**
 * Service Name
 * 
 * Description of what this service does.
 */

import ...

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface MyInterface { ... }

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_TIMEOUT = 30000;

// ============================================================================
// SERVICE CLASS
// ============================================================================

class MyService { ... }

// ============================================================================
// EXPORTS
// ============================================================================

export const myService = new MyService();
export default MyService;
```

### File Organization (Components)

```typescript
/**
 * Component Description
 * 
 * Usage:
 *   <MyComponent prop1="value" />
 */

import React, { ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";

// ============================================================================
// TYPES
// ============================================================================

interface Props {
  children?: ReactNode;
  onPress?: () => void;
}

// ============================================================================
// DESIGN SYSTEM
// ============================================================================

const COLORS = { ... };
const SPACING = { ... };
const TYPOGRAPHY = { ... };

// ============================================================================
// COMPONENT
// ============================================================================

const MyComponent: React.FC<Props> = ({ children, onPress }) => {
  return (
    <View style={styles.container}>
      <Text>{children}</Text>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: { ... },
});

// ============================================================================
// EXPORTS
// ============================================================================

export default MyComponent;
```

### Error Handling

Always use the custom error handling system in `src/utils/errorHandler.ts`:
```typescript
import { createAppError, ErrorType } from '../utils/errorHandler';

// Throw app errors with context
throw createAppError(error, 'functionName');

// Check error type
if (error.type === ErrorType.ValidationError) { ... }
```

### Logging

Use the module logger for structured logging:
```typescript
import { createModuleLogger } from '../utils/loggerUtils';

const logger = createModuleLogger('MyService');

logger.info('Operation completed', { data: value });
logger.error('Operation failed', undefined, { error });
logger.warn('Warning message', { warning });
```

### Design System

Use constants from `src/theme/index.ts`:
```typescript
import { colors, spacing, typography, borderRadius, shadows } from '../theme';

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background.primary,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    ...shadows.md,
  },
});
```

---

## Common Patterns

### Service Singleton Pattern
```typescript
let instance: MyService | null = null;

export function getMyService(): MyService {
  if (!instance) {
    instance = new MyService();
  }
  return instance;
}
```

### API Service Pattern
```typescript
class ApiService {
  private client: AxiosInstance;
  private readonly API_TIMEOUT = 30000;
  private readonly MAX_RETRIES = 3;

  constructor(baseURL?: string) {
    this.client = axios.create({
      baseURL: baseURL || process.env.EXPO_PUBLIC_API_URL,
      timeout: this.API_TIMEOUT,
    });
  }

  async fetchData(): Promise<Data> {
    const response = await this.client.get<Data>('/endpoint');
    return response.data;
  }
}
```

### Context Pattern
```typescript
const MyContext = createContext<MyContextType | undefined>(undefined);

export const MyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState(initialState);
  
  return (
    <MyContext.Provider value={{ state, setState }}>
      {children}
    </MyContext.Provider>
  );
};

export const useMyContext = () => {
  const context = useContext(MyContext);
  if (!context) throw new Error('useMyContext must be used within MyProvider');
  return context;
};
```

### Navigation
- Use `createNativeStackNavigator` for stack navigation
- Use `createDrawerNavigator` for side menus
- Use `createBottomTabNavigator` for tab navigation
- Define route types in `src/types/navigation.ts`

---

## Important Notes

### No Linting/Formatting Config
Currently no ESLint or Prettier configuration exists. Consider adding:
- ESLint with `eslint-config-expo`
- Prettier for code formatting

### API URL for Emulator
- Android Emulator: `http://10.0.2.2:5000` (maps to host localhost)
- iOS Simulator: `http://localhost:5000`

### On-Device ML
The app supports offline risk assessment using ONNX models. See `src/services/onDeviceRiskService.ts` for implementation.
