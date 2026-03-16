import React, { useEffect, useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView, useWindowDimensions,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  Check, ChevronRight, CalendarDays,
} from 'lucide-react-native';
import { colors, shadows, spacing } from '../../theme';
import { useAlert } from '../../context/AlertContext';
import ObHeader from '../../components/ObHeader';
import { MecTreeSelector } from '../../components/MecTreeSelector';

const AGE_OPTIONS = [
  { label: '< 18', value: 16 },
  { label: '18-19', value: 18 },
  { label: '20-39', value: 30 },
  { label: '40-45', value: 42 },
  { label: '≥ 46', value: 50 },
];

const MAX_CONDITIONS = 3;

const WhoMecConditionsScreen = () => {
  const navigation = useNavigation<any>();
  const { showAlert } = useAlert();
  const route = useRoute<any>();

  const [selectedAge, setSelectedAge] = useState<number | null>(null);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const { width } = useWindowDimensions();
  const horizontalPadding = width < 360 ? spacing.md : spacing.lg;
  const ageChipWidth = width < 360 ? '47%' : width < 430 ? '31%' : '23%';

  useEffect(() => {
    const ageFromParams = route.params?.age;
    const conditionsFromParams = route.params?.conditionIds;
    if (typeof ageFromParams === 'number') {
      setSelectedAge(ageFromParams);
    } else {
      setSelectedAge(null);
    }
    if (Array.isArray(conditionsFromParams)) {
      setSelectedConditions(conditionsFromParams);
    } else {
      setSelectedConditions([]);
    }
  }, [route.params?.age, route.params?.conditionIds]);

  const steps = [
    { id: 1, label: 'Conditions' },
    { id: 2, label: 'Preferences' },
    { id: 3, label: 'Results' },
  ];

  const toggleCondition = (id: string) => {
    setSelectedConditions(prev => {
      if (prev.includes(id)) return prev.filter(c => c !== id);
      if (prev.length >= MAX_CONDITIONS) {
        showAlert('Maximum Conditions', `You can select up to ${MAX_CONDITIONS} conditions.`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleNext = () => {
    if (selectedAge === null) {
      showAlert('Select Age', 'Please select an age group before continuing.');
      return;
    }
    navigation.navigate('ObWhoMecPreferences', {
      age: selectedAge,
      conditionIds: selectedConditions,
      preferences: route.params?.preferences || [],
    });
  };

  return (
    <View style={styles.container}>
      <ObHeader title="WHO MEC Tool" subtitle="Step 1: Conditions" showBack onBackPress={() => navigation.navigate('ObHome')} />

      <View style={styles.stepperWrap}>
        {steps.map((step) => {
          const isDone = step.id < 1;
          const isActive = step.id === 1;
          return (
            <View key={step.id} style={styles.stepItem}>
              <View style={[styles.stepDot, isDone && styles.stepDotDone, isActive && styles.stepDotActive]}>
                <Text style={[styles.stepDotText, (isDone || isActive) && styles.stepDotTextActive]}>
                  {step.id}
                </Text>
              </View>
              <Text style={[styles.stepLabel, (isDone || isActive) && styles.stepLabelActive]}>
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingHorizontal: horizontalPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Age Selection */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
              <View style={styles.meIconContainer}>
                <View style={styles.meIconCircle}>
                <CalendarDays size={20} color={colors.primary} />
                <View style={styles.plusIconBadge}>
                  <Text style={styles.plusIconText}>•</Text>
                </View>
              </View>
            </View>
            <Text style={styles.sectionTitle}>Age Group</Text>
          </View>
          <View style={styles.ageChipsWrapper}>
            {AGE_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[styles.ageChip, { width: ageChipWidth }, selectedAge === opt.value && styles.ageChipSelected]}
                onPress={() => setSelectedAge(opt.value)}
              >
                <Text style={[styles.ageChipText, selectedAge === opt.value && styles.ageChipTextSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Conditions (match ObAssessment MEC section) */}
        <View style={styles.cardSection}>
          <Text style={styles.conditionsTitle}>Medical Conditions</Text>
          <MecTreeSelector
            selectedConditions={selectedConditions}
            onToggleCondition={toggleCondition}
            maxConditions={MAX_CONDITIONS}
          />
        </View>

        <View style={{ height: 24 }} />

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={handleNext}
          disabled={selectedAge === null}
        >
          <Text style={styles.primaryBtnText}>Next: Preferences</Text>
          <ChevronRight size={18} color="#FFF" />
        </TouchableOpacity>

        <View style={{ height: 36 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF7FA' },
  stepperWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
    backgroundColor: '#FFF8FC',
    borderBottomWidth: 1,
    borderBottomColor: '#F8DDE9',
  },
  stepItem: { alignItems: 'center', flex: 1 },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8EF',
    borderWidth: 1,
    borderColor: '#E4CFDB',
  },
  stepDotDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepDotText: { fontSize: 15, fontWeight: '700', color: '#8A7A83' },
  stepDotTextActive: { color: '#FFFFFF' },
  stepLabel: { marginTop: 4, fontSize: 14, fontWeight: '600', color: '#8A7A83' },
  stepLabelActive: { color: colors.primary },
  scrollView: { flex: 1 },
  scrollContent: { paddingTop: spacing.md },
  section: { marginBottom: spacing.lg },

  sectionContainer: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 18,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#F3DCE8',
    ...shadows.sm,
    shadowColor: colors.primary,
    shadowOpacity: 0.08,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meIconContainer: { marginRight: 12 },
  meIconCircle: {
    width: 45,
    height: 45,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  meText: {
    fontSize: 0,
  },
  plusIconBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusIconText: {
    fontSize: 14,
    color: '#F59E0B',
    fontWeight: '900',
    lineHeight: 14,
  },
  sectionTitle: { fontSize: 19, fontWeight: '700', color: '#1B211A', marginBottom: spacing.sm },

  ageChipsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
    paddingTop: 10,
  },
  ageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    minWidth: 92,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  ageChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    elevation: 4,
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  ageChipText: { fontSize: 15, fontWeight: '700', color: '#1E293B', textAlign: 'center' },
  ageChipTextSelected: { color: '#FFF' },

  cardSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F3DCE8',
    ...shadows.sm,
    shadowColor: colors.primary,
    shadowOpacity: 0.08,
    marginBottom: spacing.lg,
  },
  conditionsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 8,
  },

  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 55,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 7,
    elevation: 4,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
    marginRight: 6,
  },
});

export default WhoMecConditionsScreen;
