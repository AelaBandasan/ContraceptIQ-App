// src/screens/HomeScreen.tsx
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { DrawerScreenProps } from '../types/navigation';
import { colors, spacing, typography } from '../theme';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

type Props = DrawerScreenProps<'Home'>;


const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const contraceptiveMethods = [
    { id: '1', name: 'Pills', image: require('../../assets/image/pillss.png') },
    { id: '2', name: 'Patch', image: require('../../assets/image/patchh.png') },
    { id: '3', name: 'IUD', image: require('../../assets/image/copperiud.png') },
    { id: '4', name: 'Implants', image: require('../../assets/image/implantt.png') },
    { id: '5', name: 'Injections', image: require('../../assets/image/injectables.png') },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.containerOne}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: hp('1.2%'), paddingBottom: hp('11%') }}
      >
        {/* Header with menu button */}
        <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={styles.menuButton}>
          <Ionicons name="menu" size={hp('4%')} color="#000" />
        </TouchableOpacity>

        {/* Title section */}
        <View style={styles.containerTwo}>
          <Text style={styles.title}>ContraceptIQ</Text>
          <Text style={styles.tagline}>Smart Support, Informed Choices.</Text>
        </View>

        {/* Infographic */}
        <View style={styles.containerThree}>
          <Image
            source={require('../../assets/image/infographic.jpg')}
            style={styles.infographic}
          />
        </View>

        {/* Contraceptive methods carousel */}
        <View style={styles.containerFour}>
          <Text style={styles.headerTitle}>Contraceptive Methods</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.methodsScrollView}
            contentContainerStyle={styles.methodsContainer}
          >
            {contraceptiveMethods.map((method) => (
              <TouchableOpacity key={method.id} style={styles.methodItem}>
                <Image source={method.image} style={styles.methodPics} />
                <Text style={styles.methodName}>{method.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Informational sections */}
        <View style={styles.infoSection}>
          <Text style={styles.headerTitle}>What is Contraception?</Text>
          <Text style={styles.info}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua.
          </Text>

          <Text style={styles.headerTitle}>A Guide to Birth Control</Text>
          <Text style={styles.info}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerOne: {
    flex: 1,
    paddingHorizontal: wp('5%'),
    backgroundColor: '#fff',
  },
  menuButton: {
    marginTop: hp('1.2%'),
    alignSelf: 'flex-start',
    marginBottom: hp('1.2%'),
  },
  title: {
    fontSize: hp('3%'), // Resized
    fontWeight: '600',
    textAlign: 'left',
    marginTop: hp('1.2%'),
  },
  tagline: {
    fontSize: hp('2%'), // Resized
    fontStyle: 'italic',
    textAlign: 'left',
    marginTop: hp('0.5%'),
    paddingBottom: hp('1.5%'),
  },
  infographicContainer: {
    paddingBottom: spacing.md,
  },
  infographic: {
    width: '100%',
    height: undefined,
    aspectRatio: 1,
    resizeMode: 'contain',
    borderRadius: 10,
    alignSelf: 'center',
  },
  containerTwo: {
    alignItems: 'center',
    marginTop: hp('2.5%'),
    marginBottom: hp('4%'),
  },
  containerThree: {
    paddingBottom: hp('1.5%'),
  },
  containerFour: {
    marginTop: hp('2%'),
  },
  headerTitle: {
    fontSize: hp('2.5%'), // Resized
    fontWeight: '500',
    paddingBottom: hp('0.5%'),
    marginTop: hp('1.2%'),
  },
  info: {
    fontSize: hp('1.8%'), // Resized
    paddingTop: hp('0.5%'),
    paddingBottom: hp('0.5%'),
    textAlign: 'justify',
  },
  methodsScrollView: {
    marginTop: hp('1%'),
  },
  methodsContainer: {
    paddingHorizontal: wp('2%'),
  },
  methodItem: {
    alignItems: 'center',
    marginRight: wp('5%'),
  },
  methodPics: {
    width: wp('20%'),
    height: wp('20%'),
    borderRadius: wp('10%'),
    marginBottom: hp('1%'),
    backgroundColor: '#eee',
  },
  methodName: {
    fontSize: hp('2%'),
    lineHeight: hp('2.5%'),
    marginTop: hp('1%'),
    marginBottom: hp('1.2%'),
  },
  infoSection: {
    marginTop: hp('2%'),
    paddingHorizontal: wp('3%'),
  },
});