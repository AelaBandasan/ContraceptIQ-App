import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import type { CompositeNavigationProp } from '@react-navigation/native';

// Root Stack Navigator - handles authentication and main flows
export type RootStackParamList = {
  UserStartingScreen: undefined;
  LoginforOB: undefined;
  SignupforOB: undefined;
  MainDrawer: undefined;
  Recommendation: undefined;
  Preferences: undefined;
  ViewRecommendation: {
    ageLabel?: string;
    ageValue?: number;
    prefs?: string[];
    mecResults?: {
      'Cu-IUD': 1 | 2 | 3 | 4;
      'LNG-IUD': 1 | 2 | 3 | 4;
      'Implant': 1 | 2 | 3 | 4;
      'DMPA': 1 | 2 | 3 | 4;
      'CHC': 1 | 2 | 3 | 4;
      'POP': 1 | 2 | 3 | 4;
    };
  };
  ObRecom: undefined;
  ObPref: undefined;
  ObViewRecom: undefined;
  ObHomeScreen: undefined;
  ObDrawer: { doctorName?: string };
  AssessmentResultScreen: {
    riskResult: any; // Using 'any' to avoid circular dependencies for now, or import type if possible
    patientData: any;
  };
  ConsultationCodeScreen: {
    patientData: any;
  };
  GuestAssessment: {
    preFilledData?: {
      AGE: string;
      prefs: string[];
    };
  };
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

// OB Drawer Navigator
export type ObDrawerParamList = {
  ObHomeScreen: { doctorName?: string };
  ObAssessment: undefined;
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

import type { RouteProp } from '@react-navigation/native';

// Screen props for type-safe screen components
export type RootStackScreenProps<T extends keyof RootStackParamList> = {
  navigation: RootStackNavigationProp<T>;
  route: RouteProp<RootStackParamList, T>;
};

export type DrawerScreenProps<T extends keyof DrawerParamList> = {
  navigation: DrawerScreenNavigationProp<T>;
};
