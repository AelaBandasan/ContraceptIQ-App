import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import HomeScreen from '../screens/HomeScreen';
import Whatsrightforme from '../screens/Whatsrightforme';
import Contraceptivemethods from '../screens/Contraceptivemethods';
import Diduknow from '../screens/Diduknow';
import Contrafaqs from '../screens/Contrafaqs';
import AboutUs from '../screens/AboutUs';
import Recommendation from '../screens/Recommendation';
import Preferences from '../screens/Preferences';
import ViewRecom from '../screens/ViewRecom';
import ObRecom from '../screens/ObSide/ObRecom';
import ObPref from '../screens/ObSide/ObPref';
// LoginforOB removed from drawer
import ObViewRecom from '../screens/ObSide/ObViewRecom';

const Drawer = createDrawerNavigator();

const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      screenOptions={{ headerShown: false }}
    >
      <Drawer.Screen name="Home" component={HomeScreen} />
      <Drawer.Screen name="What's Right for Me?" component={Whatsrightforme} />
      <Drawer.Screen
        name="Contraceptive Methods"
        component={Contraceptivemethods}
      />
      <Drawer.Screen name="Did You Know?" component={Diduknow} />
      <Drawer.Screen name="Contraceptive FAQs" component={Contrafaqs} />
      <Drawer.Screen name="About Us" component={AboutUs} />

      <Drawer.Screen name="Recommendation" component={Recommendation}
        options={{ drawerItemStyle: { display: 'none' }, headerShown: false }} />
      <Drawer.Screen name="Preferences" component={Preferences}
        options={{ drawerItemStyle: { display: 'none' }, headerShown: false }} />
      <Drawer.Screen name="ViewRecommendation" component={ViewRecom}
        options={{ drawerItemStyle: { display: 'none' }, headerShown: false }} />
      <Drawer.Screen name="ObRecom" component={ObRecom}
        options={{ drawerItemStyle: { display: 'none' }, headerShown: false }} />
      <Drawer.Screen name="ObPref" component={ObPref}
        options={{ drawerItemStyle: { display: 'none' }, headerShown: false }} />
      <Drawer.Screen name="ObViewRecom" component={ObViewRecom}
        options={{ drawerItemStyle: { display: 'none' }, headerShown: false }} />
    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
