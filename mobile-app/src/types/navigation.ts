import type { CompositeNavigationProp, CompositeScreenProps, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { BottomTabNavigationProp, BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { DrawerNavigationProp } from '@react-navigation/drawer';

// Root Stack Navigator - handles authentication and main flows
export type RootStackParamList = {
  UserStartingScreen: undefined;
  LoginforOB: undefined;
  SignupforOB: undefined;
  MainDrawer: undefined; // Replaced MainTabs
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

  ObDrawer: { doctorName?: string };
  AssessmentResultScreen: {
    riskResult: any;
    patientData: any;
  };
  ConsultationCodeScreen: {
    patientData: any;
    riskResult?: any;
  };
  GuestAssessment: {
    preFilledData?: {
      AGE: string;
      prefs: string[];
    };
  };
  ObAssessment: {
    patientData: any;
    mec_recommendations?: any;
    consultationId?: string;
    doctorName?: string;
    isDoctorAssessment?: boolean;
  };
};

// Drawer Navigator - main app navigation for authenticated users
export type DrawerParamList = {
  MainTabs: undefined; // The Bottom Tab Navigator
  Preferences: undefined;
  Recommendation: undefined;
  'Emergency Contraception': undefined;
  'Contraceptive FAQs': undefined;
  'About Us': undefined;
};

// User Tab Navigator - main app navigation for authenticated users
export type UserTabParamList = {
  Home: undefined;
  "What's Right for Me?": undefined; // Changed to match SideMenu route name for consistency or keep as 'Find Method'
  'Contraceptive Methods': undefined;
  'Did You Know?': undefined;
};

// OB Drawer Navigator
export type ObDrawerParamList = {
  ObMainTabs: undefined; // The OB Bottom Tab Navigator
  ObHistory: undefined;
  ObMethods: undefined; // Direct link if needed, though it's in tabs too
  ObMecGuide: undefined;
  ObEducation: undefined;
  ObEmergency: undefined;
  ObAbout: undefined;
  ObFeedback: undefined;
  ObSettings: undefined;
  ObAssessment: undefined; // Kept for backward compatibility if needed
};

// OB Tab Navigator
export type ObTabParamList = {
  ObHome: undefined;
  ObAssessment: { isDoctorAssessment: boolean };
  ObRecommendations: { isDoctorAssessment?: boolean };
  ObMethods: { isDoctorAssessment?: boolean };
  ObProfile: undefined;
};

// Navigation prop types for screens in the Root Stack
export type RootStackNavigationProp<T extends keyof RootStackParamList> =
  NativeStackNavigationProp<RootStackParamList, T>;

// Navigation prop types for screens in the User Tabs
export type UserTabScreenNavigationProp<T extends keyof UserTabParamList> =
  CompositeNavigationProp<
    BottomTabNavigationProp<UserTabParamList, T>,
    DrawerNavigationProp<DrawerParamList>
  >;

// Navigation prop types for screens in the Drawer
export type DrawerScreenNavigationProp<T extends keyof DrawerParamList> =
  CompositeNavigationProp<
    DrawerNavigationProp<DrawerParamList, T>,
    NativeStackNavigationProp<RootStackParamList>
  >;

// Screen props for type-safe screen components
export type RootStackScreenProps<T extends keyof RootStackParamList> = {
  navigation: RootStackNavigationProp<T>;
  route: RouteProp<RootStackParamList, T>;
};

export type UserTabScreenProps<T extends keyof UserTabParamList> = {
  navigation: UserTabScreenNavigationProp<T>;
  route: RouteProp<UserTabParamList, T>;
};

export type DrawerScreenProps<T extends keyof DrawerParamList> = {
  navigation: DrawerScreenNavigationProp<T>;
  route: RouteProp<DrawerParamList, T>;
};

// Navigation prop types for screens in the OB Drawer
export type ObDrawerScreenNavigationProp<T extends keyof ObDrawerParamList> =
  CompositeNavigationProp<
    DrawerNavigationProp<ObDrawerParamList, T>,
    NativeStackNavigationProp<RootStackParamList>
  >;

export type ObDrawerScreenProps<T extends keyof ObDrawerParamList> = {
  navigation: ObDrawerScreenNavigationProp<T>;
  route: RouteProp<ObDrawerParamList, T>;
};

// Screen props for OB Tabs
export type ObTabScreenProps<T extends keyof ObTabParamList> = CompositeScreenProps<
  BottomTabScreenProps<ObTabParamList, T>,
  ObDrawerScreenProps<'ObMainTabs'>
>;
