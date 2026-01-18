import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../types/navigation";
import DrawerNavigator from "./DrawerNavigator";
import UserStartingScreen from "../screens/UserStartingScreen";
import LoginforOB from "../screens/LoginforOB";
import Recommendation from "../screens/Recommendation";
import Preferences from "../screens/Preferences";
import ViewRecom from "../screens/ViewRecom";
import ObRecom from "../screens/ObSide/ObRecom";
import ObPref from "../screens/ObSide/ObPref";
import ObViewRecom from "../screens/ObSide/ObViewRecom";

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootStack = () => {
  return (
    <Stack.Navigator
      initialRouteName="UserStartingScreen"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="UserStartingScreen" component={UserStartingScreen} />
      <Stack.Screen name="LoginforOB" component={LoginforOB} />
      <Stack.Screen name="MainDrawer" component={DrawerNavigator} />
      <Stack.Screen name="Recommendation" component={Recommendation} />
      <Stack.Screen name="Preferences" component={Preferences} />
      <Stack.Screen name="ViewRecommendation" component={ViewRecom} />
      <Stack.Screen name="ObRecom" component={ObRecom} />
      <Stack.Screen name="ObPref" component={ObPref} />
      <Stack.Screen name="ObViewRecom" component={ObViewRecom} />
    </Stack.Navigator>
  );
};

export default RootStack;
