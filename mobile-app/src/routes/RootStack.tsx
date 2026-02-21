import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DrawerNavigator from './DrawerNavigator';
import UserStartingScreen from '../screens/UserStartingScreen';
import LoginforOB from '../screens/ObSide/LoginforOB';
import ConsultationCodeScreen from '../screens/ConsultationCodeScreen';
import GuestAssessment from '../screens/GuestAssessment';
import MethodDetail from '../screens/MethodDetail';
import SignupforOB from '../screens/ObSide/SignupforOB';
import ObDrawerNavigator from './ObDrawerNavigator';
import ObAssessment from '../screens/ObSide/ObAssessment';
import AssessmentResultScreen from '../screens/ObSide/AssessmentResultScreen';
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

      {/* Doctor Flow */}
      <Stack.Screen name="ObDrawer" component={ObDrawerNavigator} />
      <Stack.Screen name="ObAssessment" component={ObAssessment} />
      <Stack.Screen name="AssessmentResultScreen" component={AssessmentResultScreen} />
      <Stack.Screen name="ConsultationCodeScreen" component={ConsultationCodeScreen} />
      <Stack.Screen name="GuestAssessment" component={GuestAssessment} />
      <Stack.Screen name="MethodDetail" component={MethodDetail} />
    </Stack.Navigator>
  );
};

export default RootStack;
