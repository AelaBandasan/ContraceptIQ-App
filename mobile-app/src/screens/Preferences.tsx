import { StyleSheet, Text, TouchableOpacity, View, Image, Dimensions } from 'react-native';
import React from 'react';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { ScrollView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { openDrawer } from '../navigation/NavigationService';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackScreenProps } from '../types/navigation';
import { typography, spacing, colors } from '../theme';
import { useAssessment } from '../context/AssessmentContext';
import { calculateMEC, calculateMatchScore, MECCategory, getMECColor } from '../services/mecService';

const prefLabels: Record<string, string> = {
  effectiveness: "Effectiveness",
  sti: "STI Prevention",
  nonhormonal: "Non-hormonal",
  regular: "Regular Bleeding",
  privacy: "Privacy",
  client: "Client controlled",
  longterm: "Long-term protection",
};

type Props = RootStackScreenProps<"Preferences">;

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

  // Base methods for calculation
  const baseContraceptives = [
    { name: 'Implant', mecKey: 'Implant' as const, image: require('../../assets/image/implantt.png') },
    { name: 'DMPA (Injectable)', mecKey: 'DMPA' as const, image: require('../../assets/image/injectables.png') },
    { name: 'CHC (Patch/Pills/Ring)', mecKey: 'CHC' as const, image: require('../../assets/image/patchh.png') },
    { name: 'Cu-IUD (Copper)', mecKey: 'Cu-IUD' as const, image: require('../../assets/image/copperiud.png') },
    { name: 'POP (Progestin-Only Pills)', mecKey: 'POP' as const, image: require('../../assets/image/pillss.png') },
    { name: 'LNG-IUD (Hormonal)', mecKey: 'LNG-IUD' as const, image: require('../../assets/image/leviud.png') },
  ];

  // Calculate recommendations
  const topRecommendations = React.useMemo(() => {
    const age = selectedAgeIndex !== null ? ageRanges[selectedAgeIndex].numericAge : 25;
    const mecResults = calculateMEC({ age });

    return baseContraceptives
      .map(c => ({
        ...c,
        mecCategory: mecResults[c.mecKey] as MECCategory,
        color: getMECColor(mecResults[c.mecKey]),
        matchScore: calculateMatchScore(c.mecKey, chosenPrefs)
      }))
      .sort((a, b) => {
        if (a.mecCategory !== b.mecCategory) return a.mecCategory - b.mecCategory;
        return b.matchScore - a.matchScore;
      })
      .slice(0, 3); // Get top 3
  }, [selectedAgeIndex, chosenPrefs]);

  const handleEdit = () => {
    navigation.navigate("Recommendation");
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
          <Text style={styles.headerText}>What's Right for Me?</Text>
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
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Selected Preferences</Text>
            <View style={styles.prefsChipContainer}>
              {chosenPrefs.length > 0 ? chosenPrefs.map((p) => (
                <View key={p} style={styles.prefChip}>
                  <Text style={styles.prefChipText}>{prefLabels[p] || p}</Text>
                </View>
              )) : <Text style={styles.emptyText}>No preferences selected.</Text>}
            </View>

            <View style={styles.ageRow}>
              <Text style={styles.ageLabel}>Age Range:</Text>
              <Text style={styles.ageValue}>{selectedAgeIndex !== null ? ageRanges[selectedAgeIndex].label : 'Not set'}</Text>
            </View>
          </View>

          {/* Top 3 Recommendations */}
          <Text style={[styles.header2, { marginTop: 25 }]}>Top Recommendations</Text>
          <Text style={styles.header3}>Based on your preferences and age</Text>

          {topRecommendations.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.recomCard}
              onPress={() => navigation.navigate('ViewRecommendation', {
                ageLabel: selectedAgeIndex !== null ? ageRanges[selectedAgeIndex].fullLabel : '',
                prefs: chosenPrefs,
                // Passing current mec results
              })}
            >
              <View style={[styles.rankBadge, { backgroundColor: item.color }]}>
                <Text style={styles.rankText}>#{index + 1}</Text>
              </View>
              <Image source={item.image} style={styles.recomIcon} />
              <View style={styles.recomInfo}>
                <Text style={styles.recomName}>{item.name}</Text>
                <Text style={styles.matchText}>{item.matchScore}% Match</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CCC" />
            </TouchableOpacity>
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
    fontSize: 12,
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
  screenCont: {
    paddingHorizontal: 20,
  },
  header2: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.medium,
  },
  header3: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#444',
    marginTop: 5,
    marginBottom: 15,
  },
  prefCont: {
    elevation: 10,
    backgroundColor: '#FBFBFB',
    width: '100%',
    borderRadius: 10,
    marginTop: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 1, height: 1 },
    alignSelf: 'center',
  },
  prefHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefIcon: {
    resizeMode: "contain",
    height: 35,
    width: 35,
  },
  prefLabel: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    paddingLeft: spacing.sm,
    flex: 1,
  },
  prefDescription: {
    marginTop: 8,
    fontSize: 15,
    fontStyle: 'italic',
    color: '#444',
  },
  prefButton: {
    marginTop: 30,
    width: '100%',
    alignItems: 'center',
    paddingVertical: 15,
  },
  prefRecomButton: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#E45A92',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  editText: {
    color: '#E45A92',
    fontWeight: '600',
    fontSize: 14,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 15,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  prefsChipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 15,
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
  ageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    paddingTop: 10,
  },
  ageLabel: {
    fontSize: 14,
    color: '#666',
    marginRight: 8,
  },
  ageValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#999',
  },
  recomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 15,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rankText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recomIcon: {
    width: 45,
    height: 45,
    resizeMode: 'contain',
    marginRight: 12,
  },
  recomInfo: {
    flex: 1,
  },
  recomName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  matchText: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '600',
    marginTop: 2,
  },
});
