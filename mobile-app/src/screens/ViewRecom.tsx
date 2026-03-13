import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackScreenProps, DrawerScreenProps } from '../types/navigation';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { getMECColor, getMECLabel, MECCategory, calculateMatchScore, calculateMEC } from '../services/mecService';
import { colors, shadows } from '../theme';
import { useAssessment } from '../context/AssessmentContext';


const prefLabels: Record<string, string> = {
  effectiveness: "Effectiveness",
  nonhormonal: "Non-hormonal",
  regular: "Regular Bleeding",
  privacy: "Privacy",
  client: "Client controlled",
  longterm: "Long-term protection",
};

type Props = DrawerScreenProps<'ViewRecommendation'>;

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
      name: 'Implant (LNG/ETG)',
      mecKey: 'Implant' as const,
      image: require('../../assets/image/sq_lngetg.png'),
      description: 'Long-acting, highly effective',
    },
    {
      name: 'Injectable (DMPA)',
      mecKey: 'DMPA' as const,
      image: require('../../assets/image/sq_dmpainj.png'),
      description: 'Injection every 3 months',
    },
    {
      name: 'Combined Hormonal Contraceptive (CHC)',
      mecKey: 'CHC' as const,
      image: require('../../assets/image/sq_chcpills.png'),
      description: 'Combined hormonal methods',
    },
    {
      name: 'Copper IUD (Cu-IUD)',
      mecKey: 'Cu-IUD' as const,
      image: require('../../assets/image/sq_cuiud.png'),
      description: 'Non-hormonal, long-acting',
    },
    {
      name: 'Progestogen-only Pill (POP)',
      mecKey: 'POP' as const,
      image: require('../../assets/image/sq_poppills.png'),
      description: 'Daily progestin pill',
    },
    {
      name: 'LNG-IUD (Levonorgestrel-IUD)',
      mecKey: 'LNG-IUD' as const,
      image: require('../../assets/image/sq_lngiud.png'),
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

  useEffect(() => {
    const stillExists = contraceptives.some((c) => c.name === selected?.name);
    if (!stillExists && contraceptives.length > 0) {
      setSelected(contraceptives[0]);
    }
  }, [contraceptives, selected]);

  const currentIndex = contraceptives.findIndex((c) => c.name === selected.name);

  const nextMethod = () => {
    if (currentIndex < contraceptives.length - 1) setSelected(contraceptives[currentIndex + 1]);
  };

  const prevMethod = () => {
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
      [{ text: "OK", onPress: () => navigation.navigate("Preferences") }]
    );
  };

  return (
    <View style={styles.safeArea}>
      <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.menuButton}>
          <View
            style={styles.menuButtonSolid}
          >
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </View>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerText}>Recommended for You</Text>
        </View>

        <TouchableOpacity onPress={() => (navigation as any).navigate('ColorMapping')} style={styles.infoButton}>
          <View
            style={styles.menuButtonSolid}
          >
            <Ionicons name="information-circle-outline" size={24} color="#FFF" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.containerOne}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 90 }}
      >
        <View style={styles.heroCard}>
          <LinearGradient
            colors={['#FFFFFF', '#FFF7FB']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.recommendationShell}
          >
          <View style={styles.recommendationHeader}>
            <Text style={styles.recommendationLabel}>Recommended Card</Text>
            <View style={[styles.recommendationPill, { borderColor: selected.color }]}> 
              <Text style={[styles.recommendationPillText, { color: selected.color }]}>MEC Based</Text>
            </View>
          </View>

          <View style={styles.mainCircleWrapper}>
            <TouchableOpacity
              onPress={prevMethod}
              style={[styles.sideButton, currentIndex === 0 && styles.sideButtonDisabled]}
              disabled={currentIndex === 0}
            >
              <Ionicons name="chevron-back" size={24} color={currentIndex === 0 ? '#94A3B8' : '#475569'} />
            </TouchableOpacity>

            <View style={[styles.mainCircleHalo, { backgroundColor: `${selected.color}22` }]}>
            <View style={[styles.mainCircle, { borderColor: selected.color, shadowColor: selected.color }]}> 
              <Image source={selected.image} style={styles.mainImage} />
            </View>
            </View>

            <TouchableOpacity
              onPress={nextMethod}
              style={[styles.sideButton, currentIndex === contraceptives.length - 1 && styles.sideButtonDisabled]}
              disabled={currentIndex === contraceptives.length - 1}
            >
              <Ionicons
                name="chevron-forward"
                size={24}
                color={currentIndex === contraceptives.length - 1 ? '#94A3B8' : '#475569'}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.deviceInfo}>
            <Text style={styles.deviceName}>{selected.name}</Text>
          </View>

          {finalPrefs && finalPrefs.length > 0 && (
            <View style={styles.prefsChipContainer}>
              {finalPrefs.map((p) => (
                <View key={p} style={styles.prefChip}>
                  <Ionicons name="checkmark-circle" size={12} color={colors.primary} style={{ marginRight: 5 }} />
                  <Text style={styles.prefChipText}>{prefLabels[p] || p}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.badgesRow}>
            <View style={[styles.mecBadge, { backgroundColor: selected.color }]}> 
              <Text style={styles.mecBadgeText}>{getMECLabel(selected.mecCategory)}</Text>
            </View>
            {(selected as any).matchScore > 0 && (
              <View style={styles.matchBadge}>
                <Ionicons name="thumbs-up" size={12} color="#fff" style={{ marginRight: 4 }} />
                <Text style={styles.matchBadgeText}>{(selected as any).matchScore}% Match</Text>
              </View>
            )}
          </View>
          </LinearGradient>
        </View>

        {/* SAVE RESULT BUTTON / DOCTOR ACTION */}
        {isDoctorAssessment ? (
          <TouchableOpacity
            style={[styles.consultButton, { backgroundColor: '#4A90E2' }]}
            onPress={() => {
              const preFilledData = {
                AGE: ageValue ? ageValue.toString() : '25',
                prefs: prefs || []
              };
              navigation.navigate('GuestAssessment', { preFilledData });
            }}
          >
            <Text style={styles.consultButtonText}>Perform Clinical Assessment</Text>
            <Ionicons name="medical-outline" size={24} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.consultButton, { backgroundColor: colors.success }]}
            onPress={handleSave}
          >
            <Text style={styles.consultButtonText}>Save Recommendation</Text>
            <Ionicons name="save-outline" size={24} color="#fff" style={{ marginLeft: 8 }} />
          </TouchableOpacity>
        )}

        <View style={styles.listContainer}>
          <View style={styles.listHeadingRow}>
            <Text style={styles.listHeading}>All Methods</Text>
            <View style={styles.listCountPill}>
              <Text style={styles.listCountText}>{contraceptives.length}</Text>
            </View>
          </View>
          {contraceptives.map((item, index) => (
            <View key={item.name}>
              <TouchableOpacity
                style={[
                  styles.listItem,
                  selected.name === item.name && [styles.listItemSelected, { borderColor: item.color }],
                ]}
                onPress={() => setSelected(item)}
                activeOpacity={0.85}
              >
                <Image source={item.image} style={styles.listImage} />
                <View style={styles.listTextWrap}>
                  <Text style={styles.listText}>{item.name}</Text>
                  <Text style={styles.listSubText}>{item.description}</Text>
                </View>
                {selected.name === item.name && (
                  <Ionicons name="checkmark-circle" size={20} color={item.color} />
                )}
              </TouchableOpacity>
            </View>
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
    backgroundColor: '#F8FAFC',
  },
  containerOne: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerContainer: {
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
    marginBottom: 20,
  },
  titleContainer: {
    flex: 1,
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
  menuButtonSolid: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#FFF',
  },
  heroCard: {
    marginHorizontal: 20,
    borderRadius: 24,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#FCE7F3',
    ...shadows.md,
    overflow: 'hidden',
  },
  recommendationShell: {
    padding: 18,
  },
  recommendationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  recommendationLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  recommendationPill: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FFFFFFE6',
  },
  recommendationPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  mainCircleWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  sideButton: {
    backgroundColor: '#FFFFFF',
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.sm,
  },
  sideButtonDisabled: {
    opacity: 0.5,
  },
  mainCircleHalo: {
    height: 194,
    width: 194,
    borderRadius: 97,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 14,
  },
  mainCircle: {
    height: 170,
    width: 170,
    borderRadius: 85,
    borderWidth: 13,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    shadowOpacity: 0.22,
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
    marginTop: 12,
  },
  deviceName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  preferencesText: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  badgesRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
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
    marginTop: 24,
    paddingHorizontal: 20,
  },
  listHeadingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  listHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 2,
  },
  listCountPill: {
    backgroundColor: '#FCE7F3',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FBCFE8',
  },
  listCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  listItemSelected: {
    backgroundColor: '#F8FAFF',
    borderWidth: 2,
  },
  listImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    marginRight: 15,
  },
  listTextWrap: {
    flex: 1,
  },
  listText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  listSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  consultButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 18,
    paddingVertical: 16,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 2 },
  },
  consultButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  mecBadge: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 14,
    alignSelf: 'center',
  },
  mecBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
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
    gap: 8,
    marginTop: 14,
    marginBottom: 6,
  },
  prefChip: {
    backgroundColor: '#FFF1F7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FBCFE8',
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefChipText: {
    fontSize: 12,
    color: '#E45A92',
    fontWeight: '700',
  },
  infoButton: {
    borderRadius: 12,
    overflow: 'hidden',
    width: 44,
    height: 44,
  },
});
