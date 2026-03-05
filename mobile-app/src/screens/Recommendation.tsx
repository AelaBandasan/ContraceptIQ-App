import { StyleSheet, Text, TouchableOpacity, View, Image, Modal, Animated as RNAnimated, PanResponder, Dimensions, ActivityIndicator, Alert } from 'react-native';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { openDrawer } from '../navigation/NavigationService';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackScreenProps, ObTabScreenProps, DrawerScreenProps } from '../types/navigation';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { calculateMEC } from '../services/mecService';
import ObHeader from '../components/ObHeader';
import Animated, { FadeInDown, FadeInRight, ZoomIn, FadeIn, FadeInUp } from 'react-native-reanimated';

import { useAssessment } from '../context/AssessmentContext';

type Props = ObTabScreenProps<'ObRecommendations'> | DrawerScreenProps<'Recommendation'>;

const Recommendation: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const {
    selectedAgeIndex,
    setSelectedAgeIndex,
    selectedPrefs,
    setSelectedPrefs,
    reset
  } = useAssessment();
  const [modalVisible, setModalVisible] = useState(false);
  const translateY = useRef(new RNAnimated.Value(500)).current;

  // Check if we are in Doctor/OB mode
  const { isDoctorAssessment } = (route?.params as any) || {};

  // Age ranges with actual numeric age for MEC calculation
  const ageRanges = [
    { label: "< 18", value: 0, fullLabel: "Menarche to < 18 years", numericAge: 16 },
    { label: "18-19", value: 1, fullLabel: "18 - 19 years", numericAge: 18 },
    { label: "20-39", value: 2, fullLabel: "20 - 39 years", numericAge: 30 },
    { label: "40-45", value: 3, fullLabel: "40 - 45 years", numericAge: 42 },
    { label: "≥ 46", value: 4, fullLabel: "≥ 46 years", numericAge: 50 },
  ];

  const preferences = [
    {
      key: "effectiveness",
      label: "Effectiveness",
      description: "Most reliable at preventing pregnancy",
      icon: "sparkles",
    },
    {
      key: "sti",
      label: "STI Prevention",
      description: "Protection against STIs/HIV",
      icon: "shield-checkmark",
    },
    {
      key: "nonhormonal",
      label: "Non-hormonal",
      description: "Hormone-free option",
      icon: "leaf",
    },
    {
      key: "regular",
      label: "Regular Bleeding",
      description: "Helps with cramps or heavy bleeding",
      icon: "water",
    },
    {
      key: "privacy",
      label: "Privacy",
      description: "Can be used without others knowing",
      icon: "eye-off",
    },
    {
      key: "client",
      label: "Client controlled",
      description: "Can start or stop it myself",
      icon: "hand-left",
    },
    {
      key: "longterm",
      label: "Long-term protection",
      description: "Lasts for years with little action",
      icon: "infinite",
    },
  ];

  const colorMap: Record<number, string> = {
    1: '#4CAF50',
    2: '#FFEB3B',
    3: '#FF9800',
    4: '#F44336',
    5: '#bbb', // Default gray
  };

  const recommendations: Record<number, Record<string, number>> = {
    // Using 0 as fallback if nothing selected, or handle check before modal
    0: { pills: 1, patch: 1, copperIUD: 2, levIUD: 2, implant: 2, injectables: 2 },
    1: { pills: 1, patch: 1, copperIUD: 2, levIUD: 2, implant: 1, injectables: 1 },
    2: { pills: 1, patch: 1, copperIUD: 1, levIUD: 1, implant: 1, injectables: 1 },
    3: { pills: 1, patch: 2, copperIUD: 1, levIUD: 1, implant: 1, injectables: 1 },
    4: { pills: 1, patch: 2, copperIUD: 1, levIUD: 1, implant: 1, injectables: 2 },
  };

  const getColor = (method: string) => {
    // Default to index 0 logic if no age selected, or handle specifically
    const index = selectedAgeIndex ?? 0;
    const code = recommendations[index][method];
    return colorMap[code] || "#ccc";
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 20,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          RNAnimated.timing(translateY, {
            toValue: 500,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(500);
            setModalVisible(false);
          });
        } else {
          RNAnimated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (modalVisible) {
      RNAnimated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [modalVisible]);

  const togglePreference = (key: string) => {
    const isSelected = selectedPrefs.includes(key);

    if (isSelected) {
      setSelectedPrefs(selectedPrefs.filter((item) => item !== key));
    } else {
      if (selectedPrefs.length >= 3) {
        Alert.alert('Limit Reached', 'You can only select up to 3 characteristics.');
        return;
      }
      setSelectedPrefs([...selectedPrefs, key]);
    }
  };

  const handleViewRecommendation = () => {
    if (selectedAgeIndex === null) {
      Alert.alert('Required', 'Please select your age range first.');
      return;
    }

    // Calculate MEC categories based on age
    const numericAge = ageRanges[selectedAgeIndex].numericAge;
    const mecResults = calculateMEC({ age: numericAge });

    // Navigate to ViewRecommendation with MEC results
    (navigation as any).navigate('ViewRecommendation', {
      ageLabel: ageRanges[selectedAgeIndex].fullLabel,
      ageValue: ageRanges[selectedAgeIndex].value,
      prefs: selectedPrefs,
      mecResults,
      isDoctorAssessment // Pass flag to next screen
    });
  };

  // Auto-reset removed to fix selection issues. 
  // State now persists during the session but resets on app relaunch.

  const selectedAgeLabel = selectedAgeIndex !== null ? ageRanges[selectedAgeIndex].fullLabel : '';

  return (
    <View style={styles.safeArea}>
      {isDoctorAssessment && <ObHeader title="Recommendations" subtitle="Results" />}

      {!isDoctorAssessment && (
        <Animated.View
          entering={FadeInDown.duration(600)}
          style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}
        >
          <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
            <View style={styles.menuButtonSolid}>
              <Ionicons name="menu" size={26} color="#FFF" />
            </View>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerText}>What's Right for Me?</Text>
          </View>

          <TouchableOpacity onPress={() => (navigation as any).navigate('ColorMapping')} style={styles.infoButton}>
            <View style={styles.menuButtonSolid}>
              <Ionicons name="information-circle-outline" size={26} color="#FFF" />
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}

      <ScrollView
        style={styles.containerOne}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 120 }}
      >
        <View style={styles.screenCont}>
          {/* Age Section */}
          <Animated.View entering={FadeInDown.delay(200).duration(800)}>
            <Text style={styles.header2}>Tell us about you</Text>
            <Text style={styles.header3}>
              Enter your age to personalize recommendations.
            </Text>
          </Animated.View>

          <Animated.View
            entering={FadeInDown.delay(400).duration(800)}
            style={styles.sectionContainer}
          >
            <View style={styles.sectionHeader}>
              <View style={[styles.iconCircle, { backgroundColor: '#F0FDFA' }]}>
                <Image
                  source={require('../../assets/image/age.png')}
                  style={styles.sectionIcon}
                />
              </View>
              <Text style={styles.sectionLabel}>Age Range</Text>
            </View>

            <View style={styles.chipsContainer}>
              {ageRanges.map((range, index) => {
                const isSelected = selectedAgeIndex === index;
                return (
                  <Animated.View
                    key={index}
                    entering={ZoomIn.delay(600 + (index * 100)).duration(500)}
                  >
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[
                        styles.chip,
                        isSelected && styles.chipSelected
                      ]}
                      onPress={() => setSelectedAgeIndex(index)}
                    >
                      <Text style={[
                        styles.chipText,
                        isSelected && styles.chipTextSelected
                      ]}>
                        {range.label}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>

          {/* Preferences Section */}
          <Animated.View
            entering={FadeInDown.delay(1000).duration(800)}
            style={[styles.sectionContainer, { marginTop: 24 }]}
          >
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeader}>
                <View style={[styles.iconCircle, { backgroundColor: '#FDF2F8' }]}>
                  <Image
                    source={require('../../assets/image/star.png')}
                    style={styles.sectionIcon}
                  />
                </View>
                <Text style={styles.sectionLabel}>Preferences</Text>
              </View>
              <View style={styles.optionalBadgeContainer}>
                <Text style={styles.optionalBadge}>Optional</Text>
              </View>
            </View>

            <Text style={styles.subText}>Select up to 3 characteristics that matter to you most.</Text>

            <View style={styles.prefsList}>
              {preferences.map((pref, index) => {
                const selected = selectedPrefs.includes(pref.key);
                return (
                  <Animated.View
                    key={pref.key}
                    entering={FadeInRight.delay(1200 + (index * 100)).duration(500)}
                  >
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => togglePreference(pref.key)}
                      style={[
                        styles.prefItem,
                        selected && styles.prefItemSelected
                      ]}
                    >
                      <View style={styles.prefItemContent}>
                        <View style={styles.prefIconWrapper}>
                          <Ionicons name={pref.icon as any} size={22} color={colors.primary} />
                        </View>
                        <View style={styles.prefTextContainer}>
                          <Text style={[
                            styles.prefItemLabel,
                            selected && { color: colors.green.dark }
                          ]}>{pref.label}</Text>
                          <Text style={styles.prefItemDesc}>{pref.description}</Text>
                        </View>
                        <View style={styles.checkWrapper}>
                          <Ionicons
                            name={selected ? "checkmark-circle" : "ellipse-outline"}
                            size={26}
                            color={selected ? colors.green.main : "#E2E8F0"}
                          />
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(2000).duration(800)}>
            <TouchableOpacity
              style={styles.viewRecButton}
              onPress={handleViewRecommendation}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={[colors.primary, '#D22E73']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.viewRecGradient}
              >
                <Ionicons name="sparkles" size={22} color="#FFF" style={{ marginRight: 10 }} />
                <Text style={styles.viewRecButtonText}>View Recommendations</Text>
                <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.7)" style={{ marginLeft: 8 }} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Recommendation;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  containerOne: {
    flex: 1,
  },
  headerContainer: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  titleContainer: {
    flex: 1,
    marginLeft: 15,
  },
  headerText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
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
  infoButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
  },
  screenCont: {
    paddingHorizontal: 20,
  },
  header2: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  header3: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
    marginBottom: 20,
  },
  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    ...shadows.md,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionIcon: {
    height: 20,
    width: 20,
    resizeMode: "contain",
  },
  sectionLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#334155',
    marginLeft: 12,
  },
  optionalBadgeContainer: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  optionalBadge: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  subText: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 20,
    lineHeight: 20,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  chipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  chipText: {
    fontSize: 15,
    color: '#475569',
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '700',
  },
  prefsList: {
    gap: 14,
  },
  prefItem: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  prefItemSelected: {
    borderColor: colors.green.main,
    backgroundColor: '#FFFFFF',
  },
  prefItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  prefItemIcon: {
    width: 24,
    height: 24,
    resizeMode: 'contain',
  },
  prefTextContainer: {
    flex: 1,
  },
  prefItemLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  prefItemDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  checkWrapper: {
    marginLeft: 10,
  },
  viewRecButton: {
    marginTop: 32,
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
  },
  viewRecGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  viewRecButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
