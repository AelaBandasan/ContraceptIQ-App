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
import type { UserTabScreenProps } from '../types/navigation';
import { colors, spacing, typography } from '../theme';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

type Props = UserTabScreenProps<'Home'>;

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

        {/* ... Infographic above ... */}

        {/* 3️⃣ Primary Call-to-Action */}
        <View style={styles.ctaContainer}>
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={() => navigation.navigate("What's Right for Me?")}
          >
            <View style={styles.primaryButtonContent}>
              <Ionicons name="sparkles" size={20} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>Find What Works for Me</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.primaryButtonSubtext}>Takes about 2–3 minutes</Text>
        </View>

        {/* 4️⃣ Secondary Action Cards */}
        <View style={styles.secondaryActionsContainer}>
          <TouchableOpacity
            style={styles.secondaryCard}
            onPress={() => navigation.navigate('Contraceptive Methods')}
          >
            <Ionicons name="list-outline" size={22} color={colors.primary} />
            <Text style={styles.secondaryCardText}>Browse Methods</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryCard}
            onPress={() => navigation.navigate('Did You Know?')}
          >
            <Ionicons name="book-outline" size={22} color={colors.primary} />
            <Text style={styles.secondaryCardText}>Learn Hub</Text>
          </TouchableOpacity>
        </View>

        {/* 5️⃣ Contraceptive methods carousel (Existing + See All) */}
        <View style={styles.containerFour}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={styles.headerTitle}>Contraceptive Methods</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Contraceptive Methods')}>
              <Text style={{ color: colors.primary, fontSize: hp('1.5%') }}>See all →</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.methodsScrollView}
            contentContainerStyle={styles.methodsContainer}
          >
            {contraceptiveMethods.map((method) => (
              <TouchableOpacity key={method.id} style={styles.methodItem} onPress={() => navigation.navigate('Contraceptive Methods')}>
                <Image source={method.image} style={styles.methodPics} />
                <Text style={styles.methodName}>{method.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 6️⃣ Educational Preview (Converted to Cards) */}
        <View style={styles.infoSection}>
          <Text style={styles.headerTitle}>Did You Know?</Text>

          <TouchableOpacity style={styles.eduCard} onPress={() => navigation.navigate('Did You Know?')}>
            <Ionicons name="help-circle-outline" size={24} color={colors.primary} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.eduCardTitle}>What is contraception?</Text>
              <Text style={styles.eduCardText}>Contraception is the use of medicines, devices, or surgery to prevent pregnancy.</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.eduCard} onPress={() => navigation.navigate('Did You Know?')}>
            <Ionicons name="book-outline" size={24} color={colors.primary} style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.eduCardTitle}>Guide to birth control</Text>
              <Text style={styles.eduCardText}>Learn about different types of birth control and their effectiveness.</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* 7️⃣ Emergency Contraception */}
        <TouchableOpacity
          style={styles.emergencyCard}
          onPress={() => navigation.navigate('Emergency Contraception')}
        >
          <Ionicons name="warning-outline" size={24} color="#D97706" />
          <Text style={styles.emergencyText}>Need emergency contraception?</Text>
          <Ionicons name="chevron-forward" size={20} color="#D97706" />
        </TouchableOpacity>

        {/* 8️⃣ Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>About ContraceptIQ</Text>
          <Text style={styles.footerText}>Privacy & Disclaimer</Text>
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
    marginTop: hp('0.5%'), // Reduced from 2.5%
    marginBottom: hp('1%'), // Reduced from 4%
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
    paddingHorizontal: wp('1%'),
    marginBottom: hp('2%'),
  },

  // New Styles
  ctaContainer: {
    alignItems: 'center',
    marginTop: hp('2%'),
    marginBottom: hp('3%'),
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingVertical: hp('1.5%'),
    paddingHorizontal: wp('8%'),
    borderRadius: 999, // Round
    width: '100%',
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: hp('2.2%'),
    fontWeight: 'bold',
  },
  primaryButtonSubtext: {
    marginTop: hp('1%'),
    color: colors.text.secondary,
    fontSize: hp('1.5%'),
  },
  secondaryActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp('3%'),
  },
  secondaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: hp('1.5%'),
    width: '48%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border.light,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  secondaryCardText: {
    marginTop: hp('0.5%'),
    color: colors.text.primary,
    fontWeight: '600',
    fontSize: hp('1.6%'),
  },
  eduCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: hp('1.5%'),
    borderRadius: 12,
    marginBottom: hp('1.5%'),
    borderWidth: 1,
    borderColor: colors.border.light,
  },
  eduCardTitle: {
    fontSize: hp('1.8%'),
    fontWeight: '600',
    color: colors.text.primary,
  },
  eduCardText: {
    fontSize: hp('1.5%'),
    color: colors.text.secondary,
    marginTop: 2,
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    padding: hp('1.5%'),
    borderRadius: 12,
    marginBottom: hp('3%'),
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  emergencyText: {
    flex: 1,
    color: '#92400E',
    fontWeight: '600',
    marginLeft: wp('2%'),
    fontSize: hp('1.8%'),
  },
  footer: {
    alignItems: 'center',
    paddingBottom: hp('2%'),
  },
  footerText: {
    color: colors.text.disabled,
    fontSize: hp('1.2%'),
    marginBottom: 4,
  },
});