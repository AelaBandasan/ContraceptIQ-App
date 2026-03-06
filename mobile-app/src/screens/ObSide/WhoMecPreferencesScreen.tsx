import React, { useState, useMemo } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowLeft, ArrowRight, Check, Heart, Shield, Clock,
  EyeOff, UserCheck, Leaf, ShieldCheck,
} from 'lucide-react-native';
import { colors, shadows, spacing, borderRadius } from '../../theme';
import { WHO_MEC_CONDITIONS } from '../../data/whoMecData';
import ObHeader from '../../components/ObHeader';

const PREFERENCES = [
  { key: 'regular', label: 'Regular Bleeding', description: 'Helps regulate periods and reduce cramps', icon: Heart },
  { key: 'effectiveness', label: 'Highly Effective', description: 'Most reliable at preventing pregnancy', icon: ShieldCheck },
  { key: 'longterm', label: 'Long Lasting', description: 'Lasts for years with minimal maintenance', icon: Clock },
  { key: 'privacy', label: 'Privacy', description: 'Can be used discreetly without others knowing', icon: EyeOff },
  { key: 'client', label: 'Client Controlled', description: 'Patient can start or stop it themselves', icon: UserCheck },
  { key: 'nonhormonal', label: 'No Hormones', description: 'Hormone-free contraceptive option', icon: Leaf },
  { key: 'sti', label: 'STI Prevention', description: 'Protects against sexually transmitted infections', icon: Shield },
];

const WhoMecPreferencesScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const { age, conditionIds } = route.params as {
    age: number;
    conditionIds: string[];
  };

  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);

  const togglePref = (key: string) => {
    setSelectedPrefs(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
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

  const ageLabel = age < 18 ? '< 18' : age <= 39 ? '18 – 39' : '≥ 40';

  const handleViewResults = () => {
    navigation.navigate('ObWhoMecResults', {
      age,
      conditionIds,
      preferences: selectedPrefs,
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ObHeader title="WHO MEC Tool" subtitle="Step 2: Preferences" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary of Step 1 */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Selected Inputs</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Age Group:</Text>
            <Text style={styles.summaryValue}>{ageLabel}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Conditions:</Text>
            <Text style={styles.summaryValue}>
              {conditionIds.length === 0 ? 'None' : conditionIds.length}
            </Text>
          </View>
          {conditionSummary.map((label, i) => (
            <Text key={i} style={styles.summaryCondition}>  - {label}</Text>
          ))}
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

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={18} color={colors.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.resultsButton} onPress={handleViewResults}>
          <Text style={styles.resultsButtonText}>View Results</Text>
          <ArrowRight size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background.primary },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.md },

  summaryCard: {
    backgroundColor: colors.background.card, borderRadius: borderRadius.md,
    padding: 16, marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.border.light,
  },
  summaryTitle: { fontSize: 14, fontWeight: '600', color: colors.text.secondary, marginBottom: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  summaryLabel: { fontSize: 13, color: colors.text.secondary },
  summaryValue: { fontSize: 13, fontWeight: '600', color: colors.text.primary },
  summaryCondition: { fontSize: 12, color: colors.text.disabled, marginLeft: 4, marginBottom: 2 },

  instructionText: {
    fontSize: 15, fontWeight: '500', color: colors.text.primary,
    marginBottom: spacing.md,
  },

  prefCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#fff', borderRadius: borderRadius.md,
    padding: 14, marginBottom: 10,
    borderWidth: 1.5, borderColor: colors.border.light,
    ...shadows.sm,
  },
  prefCardSelected: {
    borderColor: colors.primary, backgroundColor: colors.primary + '08',
  },
  prefIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: colors.background.card,
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  prefIconSelected: { backgroundColor: colors.primary },
  prefInfo: { flex: 1 },
  prefLabel: { fontSize: 15, fontWeight: '600', color: colors.text.primary, marginBottom: 2 },
  prefLabelSelected: { color: colors.primary },
  prefDesc: { fontSize: 12, color: colors.text.disabled, lineHeight: 16 },
  prefCheck: {
    width: 24, height: 24, borderRadius: 12,
    borderWidth: 1.5, borderColor: colors.border.main,
    alignItems: 'center', justifyContent: 'center', marginLeft: 8,
  },
  prefCheckSelected: { backgroundColor: colors.primary, borderColor: colors.primary },

  bottomBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.lg, paddingTop: 12,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.border.light,
    ...shadows.lg,
  },
  backButton: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 12, paddingHorizontal: 16,
    borderRadius: borderRadius.md, borderWidth: 1.5, borderColor: colors.primary,
  },
  backButtonText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  resultsButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: borderRadius.md,
    paddingVertical: 14, paddingHorizontal: 24,
  },
  resultsButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});

export default WhoMecPreferencesScreen;
