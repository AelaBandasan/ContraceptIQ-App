import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import SideMenu from '../components/SideMenu';
import HomeScreen from '../screens/HomeScreen';
import Whatsrightforme from '../screens/Whatsrightforme';
import Contraceptivemethods from '../screens/ObSide/Contraceptivemethods';
import Contrafaqs from '../screens/Contrafaqs';
import AboutUs from '../screens/AboutUs';
import Recommendation from '../screens/Recommendation';
import Preferences from '../screens/Preferences';
import ViewRecommendation from '../screens/ViewRecom';
import ColorMapping from '../screens/ColorMapping';
import UserTabNavigator from './UserTabNavigator';
import EmergencyContraception from '../screens/EmergencyContraception';
import PrivacyDisclaimer from '../screens/PrivacyDisclaimerScreen';
import LearnHub, { LearnHubDetail } from '../screens/LearnHub';
import WhatIsContraception from '../screens/WhatIsContraception';
import { DrawerParamList } from '../types/navigation';

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
      <Drawer.Screen name="Recommendation" component={Recommendation} />
      <Drawer.Screen name="Preferences" component={Preferences} />
      <Drawer.Screen name="ViewRecommendation" component={ViewRecommendation} />
      <Drawer.Screen name="ColorMapping" component={ColorMapping} />
      <Drawer.Screen name="Emergency Contraception" component={EmergencyContraception} />
      <Drawer.Screen name="Contraceptive FAQs" component={Contrafaqs} />
      <Drawer.Screen name="About Us" component={AboutUs} />
      <Drawer.Screen name="PrivacyDisclaimer" component={PrivacyDisclaimer} />
      <Drawer.Screen name="LearnHub" component={LearnHub} />
      <Drawer.Screen name="LearnHubDetail" component={LearnHubDetail} />
      <Drawer.Screen name="WhatIsContraception" component={WhatIsContraception} />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
