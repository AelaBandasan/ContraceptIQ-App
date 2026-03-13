import React, { useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  Check, ChevronRight,
  Heart, ShieldCheck, Clock, EyeOff, UserCheck, Leaf, Shield,
} from 'lucide-react-native';
import { colors, shadows, spacing } from '../theme';
import { useAssessment } from '../context/AssessmentContext';
import { useAlert } from '../context/AlertContext';

const PREFERENCES = [
  { key: 'effectiveness', label: 'Highly Effective',       description: 'Most reliable at preventing pregnancy',       icon: ShieldCheck },
  { key: 'nonhormonal',  label: 'No Hormones',            description: 'Hormone-free contraceptive option',           icon: Leaf },
  { key: 'regular',      label: 'Regular Bleeding',       description: 'Helps regulate periods and reduce cramps',    icon: Heart },
  { key: 'privacy',      label: 'Privacy',                description: 'Can be used discreetly without others knowing', icon: EyeOff },
  { key: 'client',       label: 'Client Controlled',      description: 'I can start or stop it myself',              icon: UserCheck },
  { key: 'longterm',     label: 'Long Lasting',           description: 'Lasts for years with minimal maintenance',    icon: Clock },
];

const STEPS = [
  { id: 1, label: 'Age' },
  { id: 2, label: 'Preferences' },
  { id: 3, label: 'Results' },
];

const AGE_LABEL: Record<number, string> = {
  16: '< 18',
  18: '18–19',
  30: '20–39',
  42: '40–45',
  50: '≥ 46',
};

const GuestMecPreferencesScreen = () => {
  const navigation = useNavigation<any>();
  const { showAlert } = useAlert();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  // Read context only to pre-fill from a previously saved selection.
  // We do NOT write back here — saving happens explicitly in Step 3.
  const { selectedPrefs: contextPrefs } = useAssessment();

  const { age } = route.params as { age: number };

  // Initialise from context so "Edit" flow remembers prior selections
  const [selectedPrefs, setLocalPrefs] = useState<string[]>(contextPrefs ?? []);

  const togglePref = (key: string) => {
    setLocalPrefs(prev => {
      if (prev.includes(key)) return prev.filter(k => k !== key);
      if (prev.length >= 3) {
        showAlert('Limit Reached', 'You can select up to 3 preferences only.');
        return prev;
      }
      return [...prev, key];
    });
  };

  const handleViewResults = () => {
    navigation.navigate('GuestMecResults', { age, preferences: selectedPrefs });
  };

  const ageLabel = AGE_LABEL[age] ?? String(age);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <View style={styles.headerBtnInner}>
            <Ionicons name="chevron-back" size={26} color="#FFF" />
          </View>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>What's Right for Me?</Text>
          <Text style={styles.headerSubtitle}>Step 2: Preferences</Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      {/* Stepper */}
      <View style={styles.stepperWrap}>
        {STEPS.map((step) => {
          const isDone = step.id < 2;
          const isActive = step.id === 2;
          return (
            <View key={step.id} style={styles.stepItem}>
              <View style={[styles.stepDot, isDone && styles.stepDotDone, isActive && styles.stepDotActive]}>
                {isDone
                  ? <Check size={15} color="#FFFFFF" />
                  : <Text style={[styles.stepDotText, isActive && styles.stepDotTextActive]}>{step.id}</Text>
                }
              </View>
              <Text style={[styles.stepLabel, (isDone || isActive) && styles.stepLabelActive]}>
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Step 1 Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Step 1 Summary</Text>
          <Text style={styles.summarySectionLabel}>Age Group</Text>
          <Text style={styles.summaryAgeValue}>{ageLabel}</Text>
          
          {selectedPrefs.length > 0 && (
            <>
              <Text style={[styles.summarySectionLabel, { marginTop: 12 }]}>Selected Preferences</Text>
              <View style={styles.prefChipRow}>
                {selectedPrefs.map((key) => {
                  const pref = PREFERENCES.find((p) => p.key === key);
                  return (
                    <View key={key} style={styles.prefChip}>
                      <Text style={styles.prefChipText}>{pref?.label || key}</Text>
                    </View>
                  );
                })}
              </View>
            </>
          )}
        </View>

        {/* Instructions */}
        <Text style={styles.instructionText}>
          Select up to 3 factors that matter most to you (optional):
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
              activeOpacity={0.75}
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
          <Text style={styles.primaryBtnText}>View Results</Text>
          <ChevronRight size={18} color="#fff" />
        </TouchableOpacity>

        <View style={{ height: 28 }} />
      </ScrollView>
    </View>
  );
};

export default GuestMecPreferencesScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FDF7FA' },

  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  headerBtn: { width: 44, height: 44, borderRadius: 14, overflow: 'hidden' },
  headerBtnInner: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: { flex: 1, marginLeft: 15 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  stepperWrap: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFF8FC',
    borderBottomWidth: 1,
    borderBottomColor: '#F8DDE9',
  },
  stepItem: { alignItems: 'center', flex: 1 },
  stepDot: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F3E8EF', borderWidth: 1, borderColor: '#E4CFDB',
  },
  stepDotDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepDotText: { fontSize: 15, fontWeight: '700', color: '#8A7A83' },
  stepDotTextActive: { color: '#FFFFFF' },
  stepLabel: { marginTop: 4, fontSize: 13, fontWeight: '600', color: '#8A7A83' },
  stepLabelActive: { color: colors.primary },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: spacing.md },

  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 16,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: '#F3DCE8',
    ...shadows.sm,
    shadowColor: colors.primary,
    shadowOpacity: 0.08,
  },
  summaryTitle: { fontSize: 16, fontWeight: '800', color: colors.text.primary, marginBottom: 8 },
  summarySectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8A7A83',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginBottom: 4,
  },
  summaryAgeValue: { fontSize: 18, fontWeight: '800', color: '#1E293B' },
  prefChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  prefChip: {
    backgroundColor: colors.primary + '15',
    borderWidth: 1,
    borderColor: colors.primary + '30',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  prefChipText: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },

  instructionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: spacing.md,
  },

  prefCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  prefCardSelected: {
    borderColor: colors.primary,
    backgroundColor: '#FDF2F8',
  },
  prefIcon: {
    width: 45, height: 45, borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  prefIconSelected: { backgroundColor: colors.primary },
  prefInfo: { flex: 1 },
  prefLabel: { fontSize: 15, fontWeight: '600', color: '#1E293B', marginBottom: 2 },
  prefLabelSelected: { color: colors.primary },
  prefDesc: { fontSize: 13, color: '#94A3B8', lineHeight: 16 },
  prefCheck: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, borderColor: colors.border?.main ?? '#E2E8F0',
    alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },
  prefCheckSelected: { backgroundColor: colors.primary, borderColor: colors.primary },

  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16, height: 55,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28, shadowRadius: 7, elevation: 4,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 17, fontWeight: '800' },
});
