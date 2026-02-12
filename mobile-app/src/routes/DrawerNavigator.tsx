import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import SideMenu from "../components/SideMenu";
import HomeScreen from "../screens/HomeScreen";
import Whatsrightforme from "../screens/Whatsrightforme";
import Contraceptivemethods from "../screens/Contraceptivemethods";
import Diduknow from "../screens/Diduknow";
import Contrafaqs from "../screens/Contrafaqs";
import AboutUs from "../screens/AboutUs";
import Preferences from "../screens/Preferences";
import Recommendation from "../screens/Recommendation";
import EmergencyContraception from "../screens/EmergencyContraception";
import PrivacyDisclaimerScreen from "../screens/PrivacyDisclaimerScreen";
import UserTabNavigator from "./UserTabNavigator";
import { DrawerParamList } from "../types/navigation";

const Drawer = createDrawerNavigator<DrawerParamList>();

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      initialRouteName="MainTabs"
      drawerContent={(props) => <SideMenu {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: "80%",
        },
      }}
    >
      <Drawer.Screen name="MainTabs" component={UserTabNavigator} />
      {/* 
          MainTabs covers Home, Find Method, Methods, Learn. 
          We only need to add screens that are NOT in the tabs but accessible via Drawer 
      */}
      <Drawer.Screen name="Contraceptive FAQs" component={Contrafaqs} />
      <Drawer.Screen name="About Us" component={AboutUs} />
      <Drawer.Screen name="Preferences" component={Preferences} />
      <Drawer.Screen name="Recommendation" component={Recommendation} />
      <Drawer.Screen
        name="Emergency Contraception"
        component={EmergencyContraception}
      />
      <Drawer.Screen
        name="PrivacyDisclaimer"
        component={PrivacyDisclaimerScreen}
      />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
