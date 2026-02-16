import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView, Dimensions, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackScreenProps } from '../types/navigation';
import { openDrawer } from '../navigation/NavigationService';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMECColor, getMECLabel, MECCategory, calculateMatchScore, calculateMEC } from '../services/mecService';
import { colors } from '../theme';
import { useAssessment } from '../context/AssessmentContext';

const prefLabels: Record<string, string> = {
  effectiveness: "Effectiveness",
  sti: "STI Prevention",
  nonhormonal: "Non-hormonal",
  regular: "Regular Bleeding",
  privacy: "Privacy",
  client: "Client controlled",
  longterm: "Long-term protection",
};

type Props = RootStackScreenProps<'ViewRecommendation'>;

const ViewRecom: React.FC<Props> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const { assessmentResult, setAssessmentResult, selectedAgeIndex, selectedPrefs: contextPrefs } = useAssessment();
  const { ageLabel, ageValue, prefs, mecResults, isDoctorAssessment } = route.params || {};

  // For Guest mode, we might not have route.params if navigated from side menu
  const finalPrefs = prefs || contextPrefs || [];
  const finalAgeValue = ageValue ?? (selectedAgeIndex !== null ? selectedAgeIndex : 2); // Default to index 2 (20-39)

  const ageNumericValues = [16, 18, 30, 42, 50];
  const currentNumericAge = ageNumericValues[finalAgeValue] || 30;

  const finalMecResults = useMemo(() => {
    if (mecResults) return mecResults;
    return calculateMEC({ age: currentNumericAge });
  }, [mecResults, currentNumericAge]);

  // Define contraceptives with their MEC key mapping
  const baseContraceptives = [
    {
      name: 'Implant',
      mecKey: 'Implant' as const,
      image: require('../../assets/image/implantt.png'),
      description: 'Long-acting, highly effective',
    },
    {
      name: 'DMPA (Injectable)',
      mecKey: 'DMPA' as const,
      image: require('../../assets/image/injectables.png'),
      description: 'Injection every 3 months',
    },
    {
      name: 'CHC (Patch/Pills/Ring)',
      mecKey: 'CHC' as const,
      image: require('../../assets/image/patchh.png'),
      description: 'Combined hormonal methods',
    },
    {
      name: 'Cu-IUD (Copper)',
      mecKey: 'Cu-IUD' as const,
      image: require('../../assets/image/copperiud.png'),
      description: 'Non-hormonal, long-acting',
    },
    {
      name: 'POP (Progestin-Only Pills)',
      mecKey: 'POP' as const,
      image: require('../../assets/image/pillss.png'),
      description: 'Daily progestin pill',
    },
    {
      name: 'LNG-IUD (Hormonal)',
      mecKey: 'LNG-IUD' as const,
      image: require('../../assets/image/leviud.png'),
      description: 'Hormonal IUD, long-acting',
    },
  ];

  // Sort by MEC category (safest first) and add color
  // Sort by MEC category (safest first) AND Preference Match (highest first)
  const contraceptives = useMemo(() => {
    if (!mecResults) {
      return baseContraceptives.map(c => ({
        ...c,
        mecCategory: 1 as MECCategory,
        color: getMECColor(1),
        matchScore: calculateMatchScore(c.mecKey, prefs || [])
      })).sort((a, b) => b.matchScore - a.matchScore);
    }

    return baseContraceptives
      .map(c => ({
        ...c,
        mecCategory: mecResults[c.mecKey] as MECCategory,
        color: getMECColor(mecResults[c.mecKey]),
        matchScore: calculateMatchScore(c.mecKey, prefs || [])
      }))
      .sort((a, b) => {
        // 1. Primary Sort: Safety (MEC Category Ascending: 1 is best)
        if (a.mecCategory !== b.mecCategory) {
          return a.mecCategory - b.mecCategory;
        }
        // 2. Secondary Sort: Preference Match (Score Descending: 100% is best)
        return b.matchScore - a.matchScore;
      });
  }, [mecResults, prefs]);

  const [selected, setSelected] = useState(contraceptives[0]);

  const nextMethod = () => {
    const currentIndex = contraceptives.findIndex((c) => c.name === selected.name);
    if (currentIndex < contraceptives.length - 1) setSelected(contraceptives[currentIndex + 1]);
  };

  const prevMethod = () => {
    const currentIndex = contraceptives.findIndex((c) => c.name === selected.name);
    if (currentIndex > 0) setSelected(contraceptives[currentIndex - 1]);
  };

  const handleSave = () => {
    // Save the selection to context
    setAssessmentResult({
      riskLevel: "LOW", // Default for guest recommendation
      confidence: 1,
      recommendation: `Recommended method: ${selected.name}`,
      contraceptiveMethod: selected.name,
      timestamp: new Date().toISOString(),
    });

    Alert.alert(
      "Result Saved",
      "Your recommendation has been saved to your preferences.",
      [{ text: "OK", onPress: () => navigation.navigate("MainDrawer") }]
    );
  };

  return (
    <View style={styles.safeArea}>
      <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
          <LinearGradient
            colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)']}
            style={styles.gradient}
          >
            <Ionicons name="menu" size={24} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerAppTitle}>ContraceptIQ</Text>
          <Text style={styles.headerText}>Recommendations</Text>
        </View>
      </View>

      <ScrollView
        style={styles.containerOne}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 90 }}
      >

        {/* Display Selected Age */}
        <View style={{ alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ fontSize: 16, color: '#E45A92', fontWeight: 'bold' }}>
            Selected Age: {ageLabel || 'N/A'}
          </Text>
        </View>

        <View style={styles.mainCircleWrapper}>
          <TouchableOpacity onPress={prevMethod} style={styles.sideButton}>
            <Ionicons name="chevron-back" size={28} color="#555" />
          </TouchableOpacity>

          <View style={[styles.mainCircle, { borderColor: selected.color }]}>
            <Image source={selected.image} style={styles.mainImage} />
          </View>

          <TouchableOpacity onPress={nextMethod} style={styles.sideButton}>
            <Ionicons name="chevron-forward" size={28} color="#555" />
          </TouchableOpacity>
        </View>

        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{selected.name}</Text>
          <Text style={styles.preferencesText}>
            <Text style={{ fontStyle: 'italic' }}>{selected.description}</Text>
          </Text>
          {/* Selected Preferences Chips */}
          {finalPrefs && finalPrefs.length > 0 && (
            <View style={styles.prefsChipContainer}>
              {finalPrefs.map((p) => (
                <View key={p} style={styles.prefChip}>
                  <Text style={styles.prefChipText}>{prefLabels[p] || p}</Text>
                </View>
              ))}
            </View>
          )}

          {/* MEC Category Badge */}
          <View style={[styles.mecBadge, { backgroundColor: selected.color }]}>
            <Text style={styles.mecBadgeText}>{getMECLabel(selected.mecCategory)}</Text>
          </View>

          {/* Match Score Badge (Secondary) */}
          {(selected as any).matchScore > 0 && (
            <View style={styles.matchBadge}>
              <Ionicons name="thumbs-up" size={12} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.matchBadgeText}>{(selected as any).matchScore}% Match</Text>
            </View>
          )}
        </View>

        {/* CONSULT WITH DOCTOR BUTTON - Only show in OB/Doctor mode */}
        {isDoctorAssessment ? (
          <TouchableOpacity
            style={styles.consultButton}
            onPress={() => {
              const preFilledData = {
                AGE: ageValue ? ageValue.toString() : '25',
                prefs: prefs || []
              };
              navigation.navigate('GuestAssessment', { preFilledData });
            }}
          >
            <Text style={styles.consultButtonText}>Consult with Doctor (Start Intake)</Text>
            <Ionicons name="arrow-forward-circle" size={24} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.consultButton, { backgroundColor: colors.success }]}
            onPress={handleSave}
          >
            <Text style={styles.consultButtonText}>Save Result</Text>
            <Ionicons name="save-outline" size={24} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        )}

        <View style={styles.listContainer}>
          {contraceptives.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.listItem,
                selected.name === item.name && styles.listItemSelected,
              ]}
              onPress={() => setSelected(item)}
            >
              <Image source={item.image} style={styles.listImage} />
              <Text style={styles.listText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default ViewRecom;

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
    backgroundColor: '#E45A92', // colors.primary
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    marginLeft: 15,
  },
  headerAppTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFDBEB',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#FFF',
  },
  mainCircleWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  sideButton: {
    backgroundColor: '#D9D9D9',
    padding: 10,
    borderRadius: 8,
  },
  mainCircle: {
    height: 160,
    width: 160,
    borderRadius: 80,
    borderWidth: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 25,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  mainImage: {
    height: 80,
    width: 80,
    resizeMode: 'contain',
  },
  deviceInfo: {
    alignItems: 'center',
    marginTop: 15,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
  },
  preferencesText: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  addNotesButton: {
    alignSelf: 'center',
    backgroundColor: '#4A90E2',
    height: 55,
    width: 55,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },
  listContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  listItemSelected: {
    backgroundColor: '#E8F0FF',
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  listImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    marginRight: 15,
  },
  listText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  consultButton: {
    backgroundColor: '#E45A92',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
  },
  consultButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mecBadge: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'center',
  },
  mecBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  matchBadge: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
  },
  matchBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  prefsChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 8,
  },
  prefChip: {
    backgroundColor: '#FFDBEB',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E45A92',
  },
  prefChipText: {
    fontSize: 11,
    color: '#E45A92',
    fontWeight: '700',
  },
});
