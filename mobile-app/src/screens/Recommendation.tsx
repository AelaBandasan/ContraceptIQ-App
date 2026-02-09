import { StyleSheet, Text, TouchableOpacity, View, Image, Modal, Animated, PanResponder, Dimensions, ActivityIndicator, Alert } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { openDrawer } from '../navigation/NavigationService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackScreenProps, ObTabScreenProps } from '../types/navigation';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { calculateMEC } from '../services/mecService';
import ObHeader from '../components/ObHeader';

type Props = RootStackScreenProps<"Recommendation"> | ObTabScreenProps<'ObRecommendations'>;

const Recommendation: React.FC<Props> = ({ navigation, route }) => {
  const [selectedAgeIndex, setSelectedAgeIndex] = useState<number | null>(null);
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const translateY = useRef(new Animated.Value(500)).current;

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
      icon: require("../../assets/image/star.png"),
    },
    {
      key: "sti",
      label: "STI Prevention",
      description: "Protection against STIs/HIV",
      icon: require("../../assets/image/shield.png"),
    },
    {
      key: "nonhormonal",
      label: "Non-hormonal",
      description: "Hormone-free option",
      icon: require("../../assets/image/forbidden.png"),
    },
    {
      key: "regular",
      label: "Regular Bleeding",
      description: "Helps with cramps or heavy bleeding",
      icon: require("../../assets/image/blood.png"),
    },
    {
      key: "privacy",
      label: "Privacy",
      description: "Can be used without others knowing",
      icon: require("../../assets/image/privacy.png"),
    },
    {
      key: "client",
      label: "Client controlled",
      description: "Can start or stop it myself",
      icon: require("../../assets/image/responsibility.png"),
    },
    {
      key: "longterm",
      label: "Long-term protection",
      description: "Lasts for years with little action",
      icon: require("../../assets/image/calendar.png"),
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
          Animated.timing(translateY, {
            toValue: 500,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(500);
            setModalVisible(false);
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (modalVisible) {
      Animated.timing(translateY, {
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
      mecResults
    });
  };

  const selectedAgeLabel = selectedAgeIndex !== null ? ageRanges[selectedAgeIndex].fullLabel : '';

  return (
    <SafeAreaView style={styles.safeArea} edges={isDoctorAssessment ? ['left', 'right', 'bottom'] : undefined}>
      {isDoctorAssessment && <ObHeader title="Recommendations" subtitle="Results" />}

      <ScrollView
        style={styles.containerOne}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 120 }}
      >
        {!isDoctorAssessment && (
          <View style={styles.headerContainer}>
            <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
              <Ionicons name="menu" size={35} color={'#000'} />
            </TouchableOpacity>
            <Text style={styles.headerText}>What's Right for Me?</Text>
            <View style={{ width: 35 }} />
          </View>
        )}

        <View style={styles.screenCont}>
          {/* Age Section */}
          <Text style={styles.header2}>Tell us about you</Text>
          <Text style={styles.header3}>
            Enter your age to personalize recommendations.
          </Text>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Image
                source={require('../../assets/image/age.png')}
                style={styles.sectionIcon}
              />
              <Text style={styles.sectionLabel}>Age</Text>
            </View>

            <View style={styles.chipsContainer}>
              {ageRanges.map((range, index) => {
                const isSelected = selectedAgeIndex === index;
                return (
                  <TouchableOpacity
                    key={index}
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
                );
              })}
            </View>
          </View>

          {/* Preferences Section */}
          <View style={[styles.sectionContainer, { marginTop: 30 }]}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionHeader}>
                <Image
                  source={require('../../assets/image/star.png')}
                  style={styles.sectionIcon}
                />
                <Text style={styles.sectionLabel}>Preferences</Text>
              </View>
              <Text style={styles.optionalBadge}>(Optional)</Text>
            </View>

            <Text style={styles.subText}>Select up to 3 characteristics that matter to you.</Text>

            <View style={styles.prefsList}>
              {preferences.map((pref) => {
                const selected = selectedPrefs.includes(pref.key);
                return (
                  <TouchableOpacity
                    key={pref.key}
                    activeOpacity={0.8}
                    onPress={() => togglePreference(pref.key)}
                    style={[
                      styles.prefItem,
                      selected && styles.prefItemSelected
                    ]}
                  >
                    <View style={styles.prefItemContent}>
                      <Image source={pref.icon} style={styles.prefItemIcon} />
                      <View style={styles.prefTextContainer}>
                        <Text style={styles.prefItemLabel}>{pref.label}</Text>
                        <Text style={styles.prefItemDesc}>{pref.description}</Text>
                      </View>
                      <Ionicons
                        name={selected ? "checkmark-circle" : "ellipse-outline"}
                        size={24}
                        color={selected ? "#2E8B57" : "#ccc"}
                      />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TouchableOpacity style={styles.viewRecButton} onPress={handleViewRecommendation}>
            <Text style={styles.viewRecButtonText}>View Recommendation</Text>
          </TouchableOpacity>

        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Recommendation;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerOne: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  menuButton: {
    padding: 5,
  },
  headerText: {
    fontSize: 21,
    fontWeight: '600',
    textAlign: 'center',
  },
  screenCont: {
    paddingHorizontal: 20,
  },
  header2: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.medium,
  },
  header3: {
    fontSize: typography.sizes.sm,
    fontStyle: "italic",
    color: colors.text.secondary,
  },
  sectionContainer: {
    backgroundColor: '#FBFBFB',
    borderRadius: 12,
    marginTop: 20,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionIcon: {
    resizeMode: "contain",
    height: 30,
    width: 30,
  },
  sectionLabel: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    paddingLeft: spacing.sm,
  },
  optionalBadge: {
    fontSize: 12,
    color: '#888',
    fontStyle: 'italic'
  },
  subText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 15,
    marginTop: -10
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  chipSelected: {
    backgroundColor: '#E45A92',
    borderColor: '#E45A92',
  },
  chipText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  prefsList: {
    gap: 12
  },
  prefItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  prefItemSelected: {
    borderColor: '#2E8B57',
    backgroundColor: '#F0FDF4'
  },
  prefItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefItemIcon: {
    width: 30,
    height: 30,
    marginRight: 12,
    resizeMode: 'contain'
  },
  prefTextContainer: {
    flex: 1,
    textAlignVertical: 'center',
  },
  prefItemLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  prefItemDesc: {
    fontSize: 12,
    color: '#666',
    marginTop: 2
  },
  viewRecButton: {
    marginTop: 40,
    width: '100%',
    backgroundColor: '#E45A92',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#E45A92',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5
  },
  viewRecButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  // Modal styles omitted for brevity as they were not changed
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    alignItems: 'center',
    height: '60%',
    elevation: 15,
  },
  modalHandle: {
    // ...
  },
  modalBox: { // Added back to match usage
    backgroundColor: colors.background.primary,
    padding: spacing.xl,
    borderRadius: borderRadius.md,
    width: "85%",
    ...shadows.md,
  },
});
