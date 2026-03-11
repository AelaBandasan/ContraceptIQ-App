import React, { useMemo, useState } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  Check, CheckCircle, AlertTriangle, XCircle, Info, Palette,
} from 'lucide-react-native';
import { colors, shadows, spacing } from '../theme';
import {
  calculateWhoMecTool, getMECColor, getMECLabel,
  type WhoMecMethodResult, type MECCategory, METHOD_ATTRIBUTES,
} from '../services/mecService';
import { useAssessment } from '../context/AssessmentContext';

// Maps numeric age value back to its 0-based chip index for context storage
const AGE_TO_INDEX: Record<number, number> = { 16: 0, 18: 1, 30: 2, 42: 3, 50: 4 };

// ─── Constants ───────────────────────────────────────────────────────────────

const PREF_LABELS: Record<string, string> = {
  regular: 'Regular Bleeding',
  effectiveness: 'Highly Effective',
  longterm: 'Long Lasting',
  privacy: 'Privacy',
  client: 'Client Controlled',
  nonhormonal: 'No Hormones',
};

const METHOD_IMAGES: Record<string, any> = {
  'Combined Hormonal Contraceptive (CHC)': require('../../assets/image/sq_chcpatch1.png'),
  'Progestogen-only Pill (POP)': require('../../assets/image/sq_poppills.png'),
  'Injectable (DMPA)': require('../../assets/image/sq_dmpainj.png'),
  'Implant (LNG/ETG)': require('../../assets/image/sq_lngetg.png'),
  'Copper IUD (Cu-IUD)': require('../../assets/image/sq_cuiud.png'),
  'LNG-IUD (Levonorgestrel-IUD)': require('../../assets/image/sq_lngiud.png'),
};

const AGE_LABEL: Record<number, string> = {
  16: '< 18',
  18: '18–19',
  30: '20–39',
  42: '40–45',
  50: '≥ 46',
};

const STEPS = [
  { id: 1, label: 'Age' },
  { id: 2, label: 'Preferences' },
  { id: 3, label: 'Results' },
];

// ─── Category Icon ────────────────────────────────────────────────────────────

const CategoryIcon = ({ category }: { category: MECCategory }) => {
  switch (category) {
    case 1: return <CheckCircle size={18} color="#22C55E" />;
    case 2: return <Info size={18} color="#EAB308" />;
    case 3: return <AlertTriangle size={18} color="#F97316" />;
    case 4: return <XCircle size={18} color="#EF4444" />;
  }
};

// ─── Main Component ───────────────────────────────────────────────────────────

const GuestMecResultsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const { age, preferences } = route.params as {
    age: number;
    preferences: string[];
  };

  const ageLabel = AGE_LABEL[age] ?? String(age);
  const { saveGuestPreferences } = useAssessment();
  const [saved, setSaved] = useState(false);

  // Calculate results using WHO MEC Tool with NO medical conditions
  const result = useMemo(
    () => calculateWhoMecTool({ age, conditionIds: [], preferences }),
    [age, preferences]
  );

  const handleSave = async () => {
    const ageIndex = AGE_TO_INDEX[age] ?? 2;
    await saveGuestPreferences(ageIndex, preferences);
    setSaved(true);
    Alert.alert(
      'Preferences Saved',
      'Your age group and preferences have been saved. They will be remembered the next time you open the app.',
      [{ text: 'View Preferences', onPress: () => navigation.navigate('MainDrawer', { screen: 'MainTabs', params: { screen: 'Preferences' } }) }]
    );
  };

  const handleReturnHome = () => {
    Alert.alert(
      'Return to Home?',
      'You will exit the assessment and return to the home screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Return', onPress: () => navigation.navigate('MainDrawer') },
      ]
    );
  };

  // ── Render helpers ────────────────────────────────────────────────────────

  const getMatchedPreferences = (methodId: string): string[] => {
    if (!preferences || preferences.length === 0) return [];
    const attrs = METHOD_ATTRIBUTES.find((m: any) => m.id === methodId);
    if (!attrs) return [];
    return preferences
      .filter((pref) =>
        (pref === "effectiveness" && attrs.isHighlyEffective) ||
        (pref === "nonhormonal" && attrs.isNonHormonal) ||
        (pref === "regular" && attrs.regulatesBleeding) ||
        (pref === "privacy" && attrs.isPrivate) ||
        (pref === "client" && attrs.isClientControlled) ||
        (pref === "longterm" && attrs.isLongActing)
      )
      .map((pref) => PREF_LABELS[pref] || pref);
  };

  const renderRecommendedCard = (method: WhoMecMethodResult) => {
    const bgColor = getMECColor(method.mecCategory);
    const methodImage = METHOD_IMAGES[method.name];
    const matchedPrefs = getMatchedPreferences(method.id);

    return (
      <View key={method.id} style={styles.recomCard}>
        <View style={[styles.rankIndicator, { backgroundColor: bgColor }]} />
        <View style={styles.recomIconContainer}>
          {methodImage && <Image source={methodImage} style={styles.recomIcon} />}
        </View>
        <View style={styles.recomInfo}>
          <Text style={styles.recomName}>{method.name}</Text>
          {matchedPrefs.length > 0 && (
            <View style={styles.methodPrefRow}>
              {matchedPrefs.map((prefLabel) => (
                <View key={`${method.id}_${prefLabel}`} style={styles.methodPrefChip}>
                  <Text style={styles.methodPrefChipText}>{prefLabel}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderNotRecommendedCard = (method: WhoMecMethodResult) => {
    const bgColor = getMECColor(method.mecCategory);
    const matchedPrefs = getMatchedPreferences(method.id);

    return (
      <View key={method.id} style={[styles.methodCard, { borderLeftColor: bgColor }]}>
        <View style={styles.methodHeader}>
          <View style={styles.methodTitleRow}>
            <CategoryIcon category={method.mecCategory} />
            <Text style={styles.methodName}>{method.name}</Text>
          </View>
        </View>
        {matchedPrefs.length > 0 && (
          <View style={styles.methodPrefRow}>
            {matchedPrefs.map((prefLabel) => (
              <View key={`${method.id}_${prefLabel}`} style={styles.methodPrefChip}>
                <Text style={styles.methodPrefChipText}>{prefLabel}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
        >
          <View style={styles.headerBtnInner}>
            <Ionicons name="chevron-back" size={26} color="#FFF" />
          </View>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>What's Right for Me?</Text>
          <Text style={styles.headerSubtitle}>Step 3: Results</Text>
        </View>
        <View style={styles.headerBtn} />
      </View>

      {/* Stepper — all steps done */}
      <View style={styles.stepperWrap}>
        {STEPS.map((step) => {
          const isDone = step.id < 3;
          const isActive = step.id === 3;
          return (
            <View key={step.id} style={styles.stepItem}>
              <View style={[styles.stepDot, isDone && styles.stepDotDone, isActive && styles.stepDotActive]}>
                {isDone
                  ? <Check size={15} color="#FFFFFF" strokeWidth={3} />
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
        {/* Input Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Your Selection</Text>

          <Text style={styles.summarySectionLabel}>Age Group</Text>
          <Text style={styles.summaryAgeValue}>{ageLabel}</Text>

          {preferences.length > 0 && (
            <>
              <Text style={[styles.summarySectionLabel, { marginTop: 8 }]}>Preferences</Text>
              <View style={styles.prefChipRow}>
                {preferences.map(p => (
                  <View key={p} style={styles.prefChip}>
                    <Text style={styles.prefChipText}>{PREF_LABELS[p] || p}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </View>

        {/* MEC Color Guide */}
        <View style={styles.mecCard}>
          <View style={styles.mecHeaderRow}>
            <View style={styles.mecHeaderLeft}>
              <View style={styles.mecIconWrap}>
                <Palette size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.mecTitle}>MEC Category Guide</Text>
                <Text style={styles.mecSubtitle}>WHO quick category legend</Text>
              </View>
            </View>
          </View>
          <View style={styles.mecPreviewRow}>
            {([1, 2, 3, 4] as MECCategory[]).map(cat => (
              <View key={cat} style={styles.mecPreviewItem}>
                <View style={[styles.mecPreviewDot, { backgroundColor: getMECColor(cat) }]} />
                <Text style={styles.mecPreviewText}>
                  {cat === 1 ? 'Safe' : cat === 2 ? 'Generally safe' : cat === 3 ? 'Caution' : 'Avoid'}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Recommended Methods (MEC 1–2) */}
        {result.recommended.length > 0 && (
          <View style={styles.resultsSectionCard}>
            <Text style={styles.resultsSectionTitle}>
              Eligible Methods ({result.recommended.length})
            </Text>
            {result.recommended.map(renderRecommendedCard)}
          </View>
        )}

        {/* Not Recommended Methods (MEC 3–4) */}
        {result.notRecommended.length > 0 && (
          <View style={styles.resultsSectionCard}>
            <Text style={[styles.resultsSectionTitle, { color: colors.error ?? '#EF4444' }]}>
              Not Recommended ({result.notRecommended.length})
            </Text>
            {result.notRecommended.map(renderNotRecommendedCard)}
          </View>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimerCard}>
          <View style={styles.disclaimerHeader}>
            <Info size={16} color="#A16207" />
            <Text style={styles.disclaimerTitle}>Informational Notice</Text>
          </View>
          <Text style={styles.disclaimerText}>
            This assessment is based solely on your age group using WHO Medical Eligibility Criteria (5th Edition, 2015). It does not consider your personal medical history or clinical conditions. Results are for informational purposes only — please consult a qualified healthcare provider before starting any contraceptive method.
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, saved && styles.primaryBtnSaved]}
          onPress={saved ? undefined : handleSave}
          activeOpacity={saved ? 1 : 0.85}
        >
          <Ionicons
            name={saved ? 'checkmark-circle' : 'bookmark-outline'}
            size={18}
            color="#fff"
          />
          <Text style={styles.primaryBtnText}>
            {saved ? 'Preferences Saved' : 'Save Preferences'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleReturnHome}>
          <Ionicons name="home-outline" size={16} color="#6B4254" />
          <Text style={styles.secondaryBtnText}>Return to Home</Text>
        </TouchableOpacity>

        <View style={{ height: 28 }} />
      </ScrollView>
    </View>
  );
};

export default GuestMecResultsScreen;

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

  // Summary card
  summaryCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 16, marginBottom: spacing.md,
    borderWidth: 1, borderColor: '#F3DCE8',
    ...shadows.sm, shadowColor: colors.primary, shadowOpacity: 0.08,
  },
  summaryTitle: { fontSize: 17, fontWeight: '800', color: colors.text.primary, marginBottom: 10 },
  summarySectionLabel: {
    fontSize: 14, fontWeight: '700', color: '#8A7A83',
    textTransform: 'uppercase', letterSpacing: 0.4,
    marginTop: 4, marginBottom: 4,
  },
  summaryAgeValue: { fontSize: 19, fontWeight: '800', color: '#1E293B', marginBottom: 8 },
  summaryCondition: { fontSize: 13, color: colors.text.secondary, lineHeight: 18 },
  prefChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  prefChip: {
    backgroundColor: colors.primary + '15', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  prefChipText: { fontSize: 13, color: colors.primary, fontWeight: '500' },

  // MEC color guide
  mecCard: {
    backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16,
    borderWidth: 1, borderColor: '#F1F5F9', marginBottom: spacing.md,
    ...shadows.sm,
  },
  mecHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mecHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  mecIconWrap: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: '#FFE4F1', alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  mecTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
  mecSubtitle: { fontSize: 13, color: '#64748B', marginTop: 1, fontWeight: '500' },
  mecPreviewRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 8 },
  mecPreviewItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#F8FAFC', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5,
  },
  mecPreviewDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  mecPreviewText: { fontSize: 13, color: '#475569', fontWeight: '600' },

  // Results sections
  resultsSectionCard: {
    marginBottom: spacing.md,
    backgroundColor: '#FFFFFF', borderRadius: 16,
    borderWidth: 1, borderColor: '#F3DCE8', padding: 14, ...shadows.sm,
  },
  resultsSectionTitle: {
    fontSize: 16, fontWeight: '800', color: colors.text.primary, marginBottom: 12,
  },

  // Recommended card
  recomCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFF', borderRadius: 20,
    padding: 10, marginBottom: 10,
    borderWidth: 1, borderColor: '#F0F0F0',
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  rankIndicator: { width: 6, borderRadius: 3, alignSelf: 'stretch', marginRight: 14 },
  recomIconContainer: {
    width: 58, height: 58, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  recomIcon: { width: 66, height: 66, resizeMode: 'contain' },
  recomInfo: { flex: 1 },
  recomName: { fontSize: 17, fontWeight: '700', color: '#333', marginBottom: 3 },
  mecCategoryLabel: { fontSize: 1, color: '#64748B', marginBottom: 2, fontWeight: '500' },
  methodPrefRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
  },
  methodPrefChip: {
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  methodPrefChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  matchText: { fontSize: 12, color: colors.primary, fontWeight: '700', marginLeft: 4 },
  matchedPrefsText: { fontSize: 12.5, color: '#059669', marginTop: 4, fontWeight: '500' },

  // Not recommended card
  methodCard: {
    backgroundColor: '#fff', borderRadius: 14,
    padding: 14, marginBottom: 10,
    borderLeftWidth: 5, borderWidth: 1, borderColor: '#F3DCE8',
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  methodHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  methodTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  methodName: { fontSize: 15, fontWeight: '700', color: colors.text.primary },
  categoryLabel: { fontSize: 12, color: colors.text.disabled, marginBottom: 8, marginLeft: 26, fontWeight: '600' },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  matchLabel: { fontSize: 12, color: colors.text.secondary },
  matchBarContainer: {
    flex: 1, height: 6, backgroundColor: colors.border?.light ?? '#E2E8F0',
    borderRadius: 3, overflow: 'hidden',
  },
  matchBarFill: { height: '100%', borderRadius: 3 },
  matchScore: { fontSize: 13, fontWeight: '700', minWidth: 36, textAlign: 'right' },

  // Disclaimer
  disclaimerCard: {
    backgroundColor: '#FFFBEB', borderRadius: 14, padding: 14,
    marginBottom: spacing.md, borderWidth: 1, borderColor: '#FDE68A',
  },
  disclaimerHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  disclaimerTitle: { fontSize: 14, fontWeight: '700', color: '#92400E' },
  disclaimerText: { fontSize: 12.5, color: '#92400E', lineHeight: 18 },

  primaryBtn: {
    backgroundColor: colors.primary, borderRadius: 16, height: 55,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28, shadowRadius: 7, elevation: 4,
  },
  primaryBtnSaved: {
    backgroundColor: '#2E7D32', // Green — confirms saved state
    shadowColor: '#2E7D32',
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    justifyContent: 'center', height: 50, marginTop: 10,
    borderRadius: 12, backgroundColor: '#FFF8FC',
    borderWidth: 1, borderColor: '#EFD8E5',
  },
  secondaryBtnText: { color: '#6B4254', fontSize: 16, fontWeight: '700' },
});
