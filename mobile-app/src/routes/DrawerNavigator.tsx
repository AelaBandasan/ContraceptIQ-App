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

// LoginforOB removed from drawer

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


    </Drawer.Navigator>
  );
};

export default DrawerNavigator;
