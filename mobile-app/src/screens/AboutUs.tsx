import React, { useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, Heart, CheckCircle, ArrowRight, Instagram, Twitter } from 'lucide-react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  FadeInUp,
} from 'react-native-reanimated';
import { colors } from '../theme';

const AnimatedView = Animated.createAnimatedComponent(View);

const AboutUs = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {/* Header (Same styling as ContraFAQs and HomeScreen) */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => (navigation as any).toggleDrawer()} style={styles.menuButton}>
          <View
            style={styles.menuButtonSolid}
          >
            <Ionicons name="menu" size={24} color="#FFF" />
          </View>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerText}>About ContraceptIQ</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Hero Section */}
        <AnimatedView entering={FadeInUp.delay(100).duration(600)} style={styles.heroSection}>
          <Text style={styles.heroTitle}>Empowering Your</Text>
          <Text style={styles.heroTitleHighlight}>Reproductive Journey</Text>
          <Text style={styles.heroSubtitle}>
            Dedicated to providing transparent, science-backed guidance for contraceptive management.
          </Text>
        </AnimatedView>

        {/* The Story */}
        <AnimatedView entering={FadeInUp.delay(200).duration(600)} style={styles.storySection}>
          <Text style={styles.storyTitle}>Why ContraceptIQ?</Text>
          <Text style={styles.storyText}>
            Navigating family planning can be overwhelming. We built ContraceptIQ to bridge the gap between
            clinical guidelines and everyday accessibility. Our goal is to bring World Health Organization (WHO)
            Medical Eligibility Criteria (MEC) safely into your hands.
          </Text>
        </AnimatedView>

        {/* Value Grid */}
        <View style={styles.valueGrid}>
          {/* Card 1 */}
          <AnimatedView entering={FadeInUp.delay(300).duration(600)} style={styles.valueCard}>
            <View style={styles.iconContainer}>
              <CheckCircle size={28} color="#0D9488" />
            </View>
            <Text style={styles.valueCardTitle}>Medical Accuracy</Text>
            <Text style={styles.valueCardText}>
              Powered by real WHO MEC guidelines to match you with the safest contraceptive methods.
            </Text>
          </AnimatedView>

          {/* Card 2 */}
          <AnimatedView entering={FadeInUp.delay(400).duration(600)} style={styles.valueCard}>
            <View style={styles.iconContainer}>
              <Shield size={28} color="#0D9488" />
            </View>
            <Text style={styles.valueCardTitle}>Privacy First</Text>
            <Text style={styles.valueCardText}>
              Your data is yours. We use end-to-end encryption to ensure your health history remains strictly private.
            </Text>
          </AnimatedView>

          {/* Card 3 */}
          <AnimatedView entering={FadeInUp.delay(500).duration(600)} style={styles.valueCard}>
            <View style={styles.iconContainer}>
              <Heart size={28} color="#0D9488" />
            </View>
            <Text style={styles.valueCardTitle}>User Empowerment</Text>
            <Text style={styles.valueCardText}>
              Delivering education and insights that equip you to have confident conversations with your OB-GYN.
            </Text>
          </AnimatedView>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default AboutUs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF9', // Cream/Off-white
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
  },
  menuButtonSolid: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    marginLeft: 15,
  },
  headerAppTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerTagline: {
    fontSize: 14,
    color: '#FFDBEB',
    fontStyle: 'italic',
  },
  titleContainer: {
    marginLeft: 15,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scrollContent: {
    padding: 24,
  },
  heroSection: {
    marginTop: 10,
    marginBottom: 32,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E293B',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  heroTitleHighlight: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0D9488', // Teal
    textAlign: 'center',
    letterSpacing: -0.5,
    marginTop: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#475569',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  storySection: {
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: '#FFF',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  storyTitle: {
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    fontStyle: 'italic',
    fontSize: 24,
    color: '#0F172A',
    marginBottom: 12,
  },
  storyText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#334155',
    textAlign: 'center',
  },
  valueGrid: {
    gap: 16,
    marginBottom: 40,
  },
  valueCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 1)',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
    // Note: Glassmorphism blur is restricted in raw RN, using low-opacity cream background with sharp border to simulate it
  },
  iconContainer: {
    width: 56,
    height: 56,
    backgroundColor: '#F0FDFA', // Light teal
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  valueCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 8,
  },
  valueCardText: {
    fontSize: 14.5,
    lineHeight: 22,
    color: '#475569',
  }
});