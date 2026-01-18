import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { CompositeNavigationProp } from '@react-navigation/native';

// Root Stack Navigator - handles authentication and main flows
export type RootStackParamList = {
  UserStartingScreen: undefined;
  LoginforOB: undefined;
  MainDrawer: undefined;
  Recommendation: undefined;
  Preferences: undefined;
  ViewRecommendation: undefined;
  ObRecom: undefined;
  ObPref: undefined;
  ObViewRecom: undefined;
};

// Drawer Navigator - main app navigation for authenticated users
export type DrawerParamList = {
  Home: undefined;
  "What's Right for Me?": undefined;
  'Contraceptive Methods': undefined;
  'Did You Know?': undefined;
  'Contraceptive FAQs': undefined;
  'About Us': undefined;
};

// Navigation prop types for screens in the Root Stack
export type RootStackNavigationProp<T extends keyof RootStackParamList> = 
  NativeStackNavigationProp<RootStackParamList, T>;

// Navigation prop types for screens in the Drawer
export type DrawerScreenNavigationProp<T extends keyof DrawerParamList> = 
  CompositeNavigationProp<
    DrawerNavigationProp<DrawerParamList, T>,
    NativeStackNavigationProp<RootStackParamList>
  >;

// Screen props for type-safe screen components
export type RootStackScreenProps<T extends keyof RootStackParamList> = {
  navigation: RootStackNavigationProp<T>;
};

export type DrawerScreenProps<T extends keyof DrawerParamList> = {
  navigation: DrawerScreenNavigationProp<T>;
};
