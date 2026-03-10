import { StyleSheet, Text, TouchableOpacity, View, Image, Dimensions } from 'react-native';
import React from 'react';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { ScrollView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { openDrawer } from '../navigation/NavigationService';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackScreenProps, DrawerScreenProps } from '../types/navigation';
import { typography, spacing, colors, borderRadius, shadows } from '../theme';
import { useAssessment } from '../context/AssessmentContext';
import { calculateWhoMecTool, getMECColor } from '../services/mecService';
import Animated, { FadeInDown, FadeInRight, ZoomIn } from 'react-native-reanimated';

const prefLabels: Record<string, string> = {
  effectiveness: "Effectiveness",
  sti: "STI Prevention",
  nonhormonal: "Non-hormonal",
  regular: "Regular Bleeding",
  privacy: "Privacy",
  client: "Client controlled",
  longterm: "Long-term protection",
};

type Props = DrawerScreenProps<"Preferences">;

const Preferences = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const { selectedAgeIndex, selectedPrefs: chosenPrefs } = useAssessment();

  // Age ranges mapping
  const ageRanges = [
    { label: "< 18", value: 0, fullLabel: "Menarche to < 18 years", numericAge: 16 },
    { label: "18-19", value: 1, fullLabel: "18 - 19 years", numericAge: 18 },
    { label: "20-39", value: 2, fullLabel: "20 - 39 years", numericAge: 30 },
    { label: "40-45", value: 3, fullLabel: "40 - 45 years", numericAge: 42 },
    { label: "≥ 46", value: 4, fullLabel: "≥ 46 years", numericAge: 50 },
  ];

  const METHOD_IMAGES: Record<string, any> = {
    'Combined Hormonal':   require('../../assets/image/sq_chcpatch1.png'),
    'Progestin-Only Pill': require('../../assets/image/sq_chcpills.png'),
    'Injectable':          require('../../assets/image/sq_dmpainj.png'),
    'Implant':             require('../../assets/image/sq_lngetg.png'),
    'Copper IUD':          require('../../assets/image/sq_cuiud.png'),
    'Hormonal IUD':        require('../../assets/image/sq_lngiud.png'),
  };

  // Calculate recommendations using the same WHO MEC tool as the Results screen
  const topRecommendations = React.useMemo(() => {
    const age = selectedAgeIndex !== null ? ageRanges[selectedAgeIndex].numericAge : 25;
    const result = calculateWhoMecTool({ age, conditionIds: [], preferences: chosenPrefs });
    return result.recommended.slice(0, 3).map(m => ({
      name: m.name,
      mecCategory: m.mecCategory,
      color: getMECColor(m.mecCategory),
      matchScore: m.matchScore,
      image: METHOD_IMAGES[m.name],
    }));
  }, [selectedAgeIndex, chosenPrefs]);

  const handleEdit = () => {
    navigation.navigate("Recommendation");
  };

  return (
    <View style={styles.safeArea}>
      <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => (navigation as any).toggleDrawer()} style={styles.menuButton}>
          <View style={styles.menuButtonSolid}>
            <Ionicons name="menu" size={24} color="#FFF" />
          </View>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerText}>My Preferences</Text>
        </View>
      </View>

      <ScrollView
        style={styles.containerOne}
        showsVerticalScrollIndicator
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
      >
        <View style={styles.screenCont}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.header2}>My Choices</Text>
            <TouchableOpacity onPress={handleEdit}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* Preferences Summary */}
          <Animated.View
            entering={FadeInDown.delay(200).duration(800).withInitialValues({ opacity: 1 })}
            style={styles.summaryCard}
          >
            <View style={styles.cardHeaderLine} />
            <Text style={styles.summaryTitle}>Selected Preferences</Text>
            <View style={styles.prefsChipContainer}>
              {chosenPrefs.length > 0 ? chosenPrefs.map((p, idx) => (
                <Animated.View
                  key={p}
                  entering={ZoomIn.delay(400 + (idx * 100)).withInitialValues({ opacity: 1 })}
                  style={styles.prefChip}
                >
                  <Text style={styles.prefChipText}>{prefLabels[p] || p}</Text>
                </Animated.View>
              )) : <Text style={styles.emptyText}>No preferences selected.</Text>}
            </View>

            <View style={styles.ageRow}>
              <Ionicons name="calendar-outline" size={18} color="#666" style={{ marginRight: 8 }} />
              <Text style={styles.ageLabel}>Age Range:</Text>
              <Text style={styles.ageValue}>{selectedAgeIndex !== null ? ageRanges[selectedAgeIndex].label : 'Not set'}</Text>
            </View>
          </Animated.View>

          {/* Personalized Recommendations */}
          <Animated.View entering={FadeInDown.delay(400).duration(800).withInitialValues({ opacity: 1 })}>
            <Text style={[styles.header2, { marginTop: 25 }]}>Recommended for You</Text>
            <Text style={styles.header3}>Based on your preferences and age</Text>
          </Animated.View>

          {topRecommendations.map((item, index) => (
            <Animated.View
              key={index}
              entering={FadeInRight.delay(600 + (index * 150)).duration(600).withInitialValues({ opacity: 1 })}
            >
              <TouchableOpacity
                style={styles.recomCard}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('ViewRecommendation', {
                  ageLabel: selectedAgeIndex !== null ? ageRanges[selectedAgeIndex].fullLabel : '',
                  prefs: chosenPrefs,
                })}
              >
                <View style={[styles.rankIndicator, { backgroundColor: item.color }]} />
                <View style={styles.recomIconContainer}>
                  <Image source={item.image} style={styles.recomIcon} />
                </View>
                <View style={styles.recomInfo}>
                  <Text style={styles.recomName}>{item.name}</Text>
                </View>
                <View style={styles.chevronContainer}>
                  <Ionicons name="chevron-forward" size={20} color={colors.primary} />
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

export default Preferences;

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
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  menuButton: {
    zIndex: 10,
  },
  menuButtonSolid: {
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    marginLeft: 15,
  },
  headerText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#FFF',
  },
  screenCont: {
    paddingHorizontal: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  header2: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
  },
  header3: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
    marginBottom: 16,
  },
  editText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 16,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    position: 'relative',
    overflow: 'hidden',
  },
  cardHeaderLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: colors.primary,
  },
  summaryTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#999',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  prefsChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  prefChip: {
    backgroundColor: '#FFF0F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FFD9E8',
  },
  prefChipText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
  },
  ageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
    paddingTop: 16,
  },
  ageLabel: {
    fontSize: 15,
    color: '#555',
    fontWeight: '500',
  },
  ageValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginLeft: 4,
  },
  emptyText: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#999',
    marginBottom: 10,
  },
  recomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  rankIndicator: {
    width: 6,
    height: '100%',
    borderRadius: 3,
    marginRight: 16,
  },
  recomIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#F9F9F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  recomIcon: {
    width: 60,
    height: 60,
    resizeMode: 'contain',
  },
  recomInfo: {
    flex: 1,
  },
  recomName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  matchText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
    marginLeft: 4,
  },
  chevronContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF0F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
