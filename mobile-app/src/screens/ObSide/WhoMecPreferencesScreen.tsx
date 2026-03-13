import React, { useEffect, useState, useMemo } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  Check, Heart, Shield, Clock,
  EyeOff, UserCheck, Leaf, ShieldCheck,
  ChevronRight,
} from 'lucide-react-native';
import { colors, shadows, spacing, borderRadius } from '../../theme';
import { WHO_MEC_CONDITIONS } from '../../data/whoMecData';
import { useAlert } from '../../context/AlertContext';
import ObHeader from '../../components/ObHeader';

const PREFERENCES = [
  { key: 'regular', label: 'Regular Bleeding', description: 'Helps regulate periods and reduce cramps', icon: Heart },
  { key: 'effectiveness', label: 'Highly Effective', description: 'Most reliable at preventing pregnancy', icon: ShieldCheck },
  { key: 'longterm', label: 'Long Lasting', description: 'Lasts for years with minimal maintenance', icon: Clock },
  { key: 'privacy', label: 'Privacy', description: 'Can be used discreetly without others knowing', icon: EyeOff },
  { key: 'client', label: 'Client Controlled', description: 'Patient can start or stop it themselves', icon: UserCheck },
  { key: 'nonhormonal', label: 'No Hormones', description: 'Hormone-free contraceptive option', icon: Leaf },
];

const WhoMecPreferencesScreen = () => {
  const navigation = useNavigation<any>();
  const { showAlert } = useAlert();
  const route = useRoute<any>();

  const { age, conditionIds, preferences: initialPreferences } = route.params as {
    age: number;
    conditionIds: string[];
    preferences?: string[];
  };

  const [selectedPrefs, setSelectedPrefs] = useState<string[]>(initialPreferences || []);

  useEffect(() => {
    if (Array.isArray(initialPreferences)) {
      setSelectedPrefs(initialPreferences);
    }
  }, [initialPreferences]);

  const steps = [
    { id: 1, label: 'Conditions' },
    { id: 2, label: 'Preferences' },
    { id: 3, label: 'Results' },
  ];

  const togglePref = (key: string) => {
    setSelectedPrefs(prev => {
      if (prev.includes(key)) return prev.filter(k => k !== key);
      if (prev.length >= 3) {
        showAlert('Limit Reached', 'You can select up to 3 preferences only.');
        return prev;
      }
      return [...prev, key];
    });
  };

  // Build summary of selected conditions
  const conditionSummary = useMemo(() => {
    return conditionIds.map(id => {
      const entry = WHO_MEC_CONDITIONS.find(c => c.id === id);
      if (!entry) return id;
      return entry.subCondition
        ? `${entry.condition}: ${entry.subCondition}`
        : entry.condition;
    });
  }, [conditionIds]);

  const ageLabel =
    age < 18 ? '< 18' :
    age === 18 ? '18-19' :
    age === 30 ? '20-39' :
    age === 42 ? '40-45' :
    '≥ 46';

  const handleViewResults = () => {
    navigation.navigate('ObWhoMecResults', {
      age,
      conditionIds,
      preferences: selectedPrefs,
    });
  };

  return (
    <View style={styles.container}>
      <ObHeader
        title="WHO MEC Tool"
        subtitle="Step 2: Preferences"
        showBack
        onBackPress={() =>
          navigation.navigate('ObWhoMecConditions', { age, conditionIds, preferences: selectedPrefs })
        }
      />

      <View style={styles.stepperWrap}>
        {steps.map((step) => {
          const isDone = step.id < 2;
          const isActive = step.id === 2;
          return (
            <View key={step.id} style={styles.stepItem}>
              <View style={[styles.stepDot, isDone && styles.stepDotDone, isActive && styles.stepDotActive]}>
                {isDone ? <Check size={16} color="#FFFFFF" /> : <Text style={[styles.stepDotText, isActive && styles.stepDotTextActive]}>{step.id}</Text>}
              </View>
              <Text style={[styles.stepLabel, (isDone || isActive) && styles.stepLabelActive]}>{step.label}</Text>
            </View>
          );
        })}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary of Step 1 */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Step 1: Patient Summary</Text>

          <Text style={styles.summarySectionLabel}>Age Group</Text>
          <Text style={styles.summaryAgeValue}>{ageLabel}</Text>

          <Text style={styles.summarySectionLabel}>Conditions Identified ({conditionIds.length})</Text>
          {conditionSummary.length > 0 ? (
            conditionSummary.map((label, i) => (
              <Text key={i} style={styles.summaryCondition}>• {label}</Text>
            ))
          ) : (
            <Text style={styles.summaryCondition}>• None</Text>
          )}
        </View>

        {/* Instructions */}
         <Text style={styles.instructionText}>
           Select patient preferences (all that apply):
         </Text>

        {/* Preference Cards */}
        {PREFERENCES.map(pref => {
          const isSelected = selectedPrefs.includes(pref.key);
          const IconComponent = pref.icon;

          return (
            <TouchableOpacity
              key={pref.key}
              style={[styles.prefCard, isSelected && styles.prefCardSelected]}
              onPress={() => togglePref(pref.key)}
              activeOpacity={0.7}
            >
              <View style={[styles.prefIcon, isSelected && styles.prefIconSelected]}>
                <IconComponent size={20} color={isSelected ? '#fff' : colors.text.secondary} />
              </View>
              <View style={styles.prefInfo}>
                <Text style={[styles.prefLabel, isSelected && styles.prefLabelSelected]}>
                  {pref.label}
                </Text>
                <Text style={styles.prefDesc}>{pref.description}</Text>
              </View>
              <View style={[styles.prefCheck, isSelected && styles.prefCheckSelected]}>
                {isSelected && <Check size={14} color="#fff" />}
              </View>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={styles.primaryBtn} onPress={handleViewResults}>
          <Text style={styles.resultsButtonText}>View Results</Text>
          <ChevronRight size={18} color="#fff" />
        </TouchableOpacity>
        <View style={{ height: 28 }} />
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
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },

  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 18,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#F3DCE8',
    ...shadows.sm,
    shadowColor: colors.primary,
    shadowOpacity: 0.08,
  },
  summaryTitle: { fontSize: 16.5, fontWeight: '800', color: colors.text.primary, marginBottom: 10 },
  summarySectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#8A7A83',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 4,
    marginBottom: 4,
  },
  summaryAgeValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  summaryCondition: { fontSize: 15, color: colors.text.primary, marginBottom: 5, lineHeight: 19 },

  instructionText: {
    fontSize: 15, fontWeight: '600', color: colors.text.primary,
    marginBottom: spacing.md,
  },

  prefCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: 12,
    padding: 14, marginBottom: 10,
    borderWidth: 1.5, borderColor: '#E2E8F0',
  },
  prefCardSelected: {
    borderColor: colors.primary, backgroundColor: '#FDF2F8',
  },
  prefIcon: {
    width: 45, height: 45, borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  prefIconSelected: { backgroundColor: colors.primary },
  prefInfo: { flex: 1 },
  prefLabel: { fontSize: 15, fontWeight: '600', color: '#1E293B', marginBottom: 2 },
  prefLabelSelected: { color: '#BE185D' },
  prefDesc: { fontSize: 14, color: '#94A3B8', lineHeight: 16 },
  prefCheck: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, borderColor: colors.border.main,
    alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },
  prefCheckSelected: { backgroundColor: colors.primary, borderColor: colors.primary },

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
  resultsButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});

export default WhoMecPreferencesScreen;
