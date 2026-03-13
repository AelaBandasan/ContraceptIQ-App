// src/screens/HomeScreen.tsx
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import type { UserTabScreenProps, DrawerScreenProps } from '../types/navigation';
import { colors, spacing, shadows, borderRadius as themeRadius } from '../theme';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { useAlert } from '../context/AlertContext';

type Props = UserTabScreenProps<'Home'> | DrawerScreenProps<'Home'>;

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();

  const contraceptiveMethods = [
    { id: 'pop', name: 'POP', image: require('../../assets/image/sq_poppills.png') },
    { id: 'chc', name: 'CHC', image: require('../../assets/image/sq_chcpills.png') },
    { id: 'cu-iud', name: 'Cu-IUD', image: require('../../assets/image/sq_cuiud.png') },
    { id: 'lng-ius', name: 'Lng-IUD', image: require('../../assets/image/sq_lngiud.png') },
    { id: 'implant', name: 'Implants', image: require('../../assets/image/sq_lngetg.png') },
    { id: 'dmpa', name: 'DMPA', image: require('../../assets/image/sq_dmpainj.png') },
  ];

  // Animation values
  const floatValue = useSharedValue(0);
  const pulseValue = useSharedValue(1);

  useEffect(() => {
    // Floating animation for infographic
    floatValue.value = withRepeat(
      withTiming(1, { duration: 2000 }),
      -1,
      true
    );

    // Pulse animation for CTA button
    pulseValue.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
  }, []);

  const animatedHeroStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatValue.value * 10 - 5 }],
  }));

  const animatedPulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseValue.value }],
  }));

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />


      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: hp('12%') }}
      >
        {/* Premium Header */}
        <Animated.View
          entering={FadeInDown.duration(800).withInitialValues({ opacity: 1 })}
          style={[styles.header, { paddingTop: insets.top + 10 }]}
        >
          <TouchableOpacity
            onPress={() => (navigation as any).toggleDrawer()}
            style={styles.menuButton}
            activeOpacity={0.7}
          >
            <View
              style={[styles.menuButton, styles.menuButtonSolid]}
            >
              <Ionicons name="menu" size={24} color="#FFF" />
            </View>
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerAppTitle}>ContraceptIQ</Text>
            <Text style={styles.headerTagline}>Smart Support, Informed Choices.</Text>
          </View>
        </Animated.View>

        {/* 1 Hero Section - Infographic in a Premium Card */}
        <Animated.View
          entering={FadeInDown.delay(200).duration(1000).withInitialValues({ opacity: 1 })}
          style={[styles.infographicCard, animatedHeroStyle]}
        >
          <Image
            source={require('../../assets/image/infographic1.png')}
            style={styles.infographic}
          />
        </Animated.View>

        {/* 2 Primary Call-to-Action */}
        <Animated.View
          entering={FadeInUp.delay(400).duration(1000).withInitialValues({ opacity: 1 })}
          style={[styles.ctaContainer, animatedPulseStyle]}
        >
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.primaryButtonShadow}
            onPress={() => {
              showAlert(
                "Disclaimer",
                "This tool provides general guidance based on WHO Medical Eligibility Criteria. It is not a substitute for professional medical advice. Please consult with a healthcare professional before starting any contraceptive method.",
                [
                  { text: "Cancel", style: "cancel" },
                  { 
                    text: "Proceed", 
                    onPress: () => (navigation as any).navigate("Recommendation") 
                  }
                ]
              );
            }}
          >
            <View
              style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            >
              <View style={styles.primaryButtonContent}>
                <Ionicons name="sparkles" size={20} color="#FFF" style={{ marginRight: 10 }} />
                <Text style={styles.primaryButtonText}>Find What Works for Me</Text>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" style={{ marginLeft: 8 }} />
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.primaryButtonSubtext}>Takes about 2–3 minutes • Personalized for you</Text>
        </Animated.View>

        {/* 3 Secondary Action Grid */}
        <Animated.View
          entering={FadeInUp.delay(600).duration(1000).withInitialValues({ opacity: 1 })}
          style={styles.secondaryActionsRow}
        >
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => (navigation as any).navigate('Contraceptive Methods')}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#FDF2F8' }]}>
              <Ionicons name="grid" size={22} color={colors.primary} />
            </View>
            <Text style={styles.actionCardText}>Browse Methods</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => (navigation as any).navigate('LearnHub')}
          >
            <View style={[styles.iconCircle, { backgroundColor: '#F0FDFA' }]}>
              <Ionicons name="book" size={22} color="#0D9488" />
            </View>
            <Text style={styles.actionCardText}>Learn Hub</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* 4 Contraceptive Methods Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Contraceptive Methods</Text>
          <TouchableOpacity onPress={() => (navigation as any).navigate('Contraceptive Methods')}>
            <Text style={styles.seeAllText}>See all →</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.methodsScrollView}
          contentContainerStyle={styles.methodsContentContainer}
        >
          {contraceptiveMethods.map((method, index) => (
            <Animated.View
              key={method.id}
              entering={FadeInUp.delay(800 + index * 100).duration(500).withInitialValues({ opacity: 1 })}
            >
              <TouchableOpacity
                style={styles.methodCard}
                onPress={() => (navigation as any).navigate('MethodDetail', { methodId: method.id })}
                activeOpacity={0.7}
              >
                <View style={styles.methodImageWrapper}>
                  <Image source={method.image} style={styles.methodImage} />
                </View>
                <Text style={styles.methodName}>{method.name}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>

        {/* 5 Educational Preview */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Did You Know?</Text>
        </View>

        <View style={styles.eduSection}>
          <TouchableOpacity
            style={styles.eduCard}
            onPress={() => (navigation as any).navigate('WhatIsContraception')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#FFF5F8', '#FFFFFF']}
              style={styles.eduCardInner}
            >
              <View style={[styles.eduIconContainer, { backgroundColor: '#FCE7F3' }]}>
                <Ionicons name="help-circle" size={24} color={colors.primary} />
              </View>
              <View style={styles.eduCardContent}>
                <Text style={styles.eduCardTitle}>What is contraception?</Text>
                <Text style={styles.eduCardText}>Contraception is the use of medicines, devices, or surgery to prevent pregnancy.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.eduCard}
            onPress={() => (navigation as any).navigate('LearnHub')}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={['#F0FDFA', '#FFFFFF']}
              style={styles.eduCardInner}
            >
              <View style={[styles.eduIconContainer, { backgroundColor: '#CCFBF1' }]}>
                <Ionicons name="book" size={24} color="#0D9488" />
              </View>
              <View style={styles.eduCardContent}>
                <Text style={styles.eduCardTitle}>Guide to birth control</Text>
                <Text style={styles.eduCardText}>Detailed insights into effectiveness, side effects, and correct usage.</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* 6 Emergency Section */}
        <Animated.View entering={FadeInUp.delay(1000).duration(1000).withInitialValues({ opacity: 1 })}>
          <TouchableOpacity
            style={styles.emergencyCard}
            onPress={() => (navigation as any).navigate('Emergency Contraception')}
            activeOpacity={0.9}
          >
            <View style={styles.emergencyIconWrapper}>
              <Ionicons name="warning" size={24} color="#D97706" />
            </View>
            <View style={styles.emergencyContent}>
              <Text style={styles.emergencyTitle}>Need emergency contraception?</Text>
              <Text style={styles.emergencySubtext}>Quick action is important within 72 hours.</Text>
            </View>
            <Ionicons name="arrow-forward" size={20} color="#B45309" />
          </TouchableOpacity>
        </Animated.View>

        {/* 7 Footer */}
        <View style={styles.footer}>
          <View style={styles.footerLinks}>
            <Text style={styles.footerLink}>About ContraceptIQ</Text>
            <Text style={styles.footerDot}>•</Text>
            <Text style={styles.footerLink}>Privacy Policy</Text>
          </View>
          <Text style={styles.footerCopyright}>© 2026 ContraceptIQ. All rights reserved.</Text>
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuButtonSolid: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    marginLeft: 16,
    flex: 1,
  },
  headerAppTitle: {
    fontSize: hp('2.8%'),
    fontWeight: '900',
    color: '#FFF',
    letterSpacing: -0.5,
  },
  headerTagline: {
    fontSize: hp('1.6%'),
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
    marginTop: 2,
  },
  infographicCard: {
    backgroundColor: '#FFF',
    marginHorizontal: wp('4%'),
    marginTop: hp('2.5%'),
    borderRadius: 15,
    padding: 12,
    ...shadows.md,
  },
  infographic: {
    width: '100%',
    height: hp('30%'),
    borderRadius: 16,
    resizeMode: 'cover',
  },
  ctaContainer: {
    paddingHorizontal: wp('5%'),
    marginTop: hp('3%'),
    alignItems: 'center',
  },
  primaryButtonShadow: {
    width: '100%',
    ...shadows.lg,
    shadowColor: colors.primary,
  },
  primaryButton: {
    height: hp('7.5%'),
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFF',
    fontSize: hp('2.2%'),
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  primaryButtonSubtext: {
    marginTop: hp('1.2%'),
    color: '#64748B',
    fontSize: hp('1.6%'),
    fontWeight: '500',
  },
  secondaryActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp('4%'),
    marginTop: hp('2%'),
  },
  actionCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    width: '48%',
    padding: hp('2%'),
    alignItems: 'center',
    ...shadows.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  iconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionCardText: {
    fontSize: hp('1.8%'),
    fontWeight: '700',
    color: '#1E293B',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: wp('4%'),
    marginTop: hp('2.5%'),
    marginBottom: hp('1%'),
  },
  sectionTitle: {
    fontSize: hp('2.4%'),
    fontWeight: '800',
    color: '#1E293B',
  },
  seeAllText: {
    fontSize: hp('1.7%'),
    fontWeight: '700',
    color: colors.primary,
  },
  methodsScrollView: {
    paddingLeft: wp('5%'),
  },
  methodsContentContainer: {
    paddingRight: wp('10%'),
    paddingVertical: 8,
  },
  methodCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 12,
    marginRight: 16,
    alignItems: 'center',
    width: wp('28%'),
    ...shadows.sm,
    borderWidth: 1,
    borderColor: '#F8FAFC',
  },
  methodImageWrapper: {
    width: wp('18%'),
    height: wp('18%'),
    borderRadius: 15,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  methodImage: {
    width: '110%',
    height: '110%',
    resizeMode: 'contain',
  },
  methodName: {
    fontSize: hp('1.7%'),
    fontWeight: '700',
    color: '#475569',
  },
  eduSection: {
    paddingBottom: 5,
  },
  eduCard: {
    marginHorizontal: wp('4%'),
    marginBottom: 12,
    borderRadius: 20,
    backgroundColor: '#FFF',
    ...shadows.sm,
    overflow: 'hidden',
  },
  eduCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    minHeight: 80,
  },
  eduIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  eduCardContent: {
    flex: 1,
  },
  eduCardTitle: {
    fontSize: hp('2%'),
    fontWeight: '800',
    color: '#1E293B',
  },
  eduCardText: {
    fontSize: hp('1.6%'),
    color: '#64748B',
    marginTop: 2,
    lineHeight: 20,
  },
  emergencyCard: {
    backgroundColor: '#FFF7ED',
    marginHorizontal: wp('4%'),
    marginTop: hp('1%'),
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    ...shadows.sm,
  },
  emergencyIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFEDD5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  emergencyContent: {
    flex: 1,
  },
  emergencyTitle: {
    fontSize: hp('2%'),
    fontWeight: '800',
    color: '#9A3412',
  },
  emergencySubtext: {
    fontSize: hp('1.5%'),
    color: '#C2410C',
    marginTop: 2,
  },
  footer: {
    marginTop: hp('2%'),
    paddingHorizontal: wp('4%'),
    paddingBottom: hp('1%'),
    alignItems: 'center',
  },
  footerLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  footerLink: {
    fontSize: hp('1.6%'),
    color: '#94A3B8',
    fontWeight: '600',
  },
  footerDot: {
    marginHorizontal: 12,
    color: '#CBD5E1',
  },
  footerCopyright: {
    fontSize: hp('1.4%'),
    color: '#CBD5E1',
    fontWeight: '500',
  },
});
