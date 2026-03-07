import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DrawerNavigator from './DrawerNavigator';
import UserStartingScreen from '../screens/UserStartingScreen';
import LoginforOB from '../screens/ObSide/LoginforOB';
import GuestAssessment from '../screens/GuestAssessment';
import MethodDetail from '../screens/MethodDetail';
import SignupforOB from '../screens/ObSide/SignupforOB';
import PendingVerificationScreen from '../screens/ObSide/PendingVerificationScreen';
import ObTabNavigator from './ObTabNavigator';
import ObAssessment from '../screens/ObSide/ObAssessment';
import PregnancyPlanningScreen from '../screens/PregnancyPlanning';
import WhoMecPreferencesScreen from '../screens/ObSide/WhoMecPreferencesScreen';
import WhoMecResultsScreen from '../screens/ObSide/WhoMecResultsScreen';
import { RootStackParamList } from '../types/navigation';

const Stack = createNativeStackNavigator<RootStackParamList>();
const RootStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="UserStartingScreen"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="UserStartingScreen" component={UserStartingScreen} />
      <Stack.Screen name="LoginforOB" component={LoginforOB} />

      {/* ... other screens ... */}

      <Stack.Screen name="MainDrawer" component={DrawerNavigator} />
      <Stack.Screen name="SignupforOB" component={SignupforOB} />
      <Stack.Screen name="PendingVerification" component={PendingVerificationScreen} />

      {/* Doctor Flow */}
      <Stack.Screen name="ObMainTabs" component={ObTabNavigator} />
      <Stack.Screen name="ObAssessment" component={ObAssessment} />
      <Stack.Screen name="GuestAssessment" component={GuestAssessment} />
      <Stack.Screen name="MethodDetail" component={MethodDetail} />
      <Stack.Screen name="PregnancyPlanning" component={PregnancyPlanningScreen} />

      {/* WHO MEC Steps */}
      <Stack.Screen name="ObWhoMecPreferences" component={WhoMecPreferencesScreen} />
      <Stack.Screen name="ObWhoMecResults" component={WhoMecResultsScreen} />
    </Stack.Navigator>
  );
};

export default RootStack;
