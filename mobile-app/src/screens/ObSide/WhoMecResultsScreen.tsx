import React, { useMemo } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView, Image, Alert,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ChevronLeft, ChevronRight, CheckCircle, Check, AlertTriangle, XCircle, Info, Palette,
} from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, shadows, spacing, borderRadius } from '../../theme';
import { WHO_MEC_CONDITIONS } from '../../data/whoMecData';
import {
  calculateWhoMecTool, getMECColor, getMECLabel,
  type WhoMecMethodResult, type MECCategory,
} from '../../services/mecService';
import ObHeader from '../../components/ObHeader';

const PREF_LABELS: Record<string, string> = {
  regular: 'Regular Bleeding',
  effectiveness: 'Highly Effective',
  longterm: 'Long Lasting',
  privacy: 'Privacy',
  client: 'Client Controlled',
  nonhormonal: 'No Hormones',
  sti: 'STI Prevention',
};

const METHOD_IMAGES: Record<string, any> = {
  'Combined Hormonal': require('../../../assets/image/sq_chcpills.png'),
  'Progestin-Only Pill': require('../../../assets/image/sq_poppills.png'),
  'Injectable': require('../../../assets/image/sq_dmpainj.png'),
  'Implant': require('../../../assets/image/sq_lngetg.png'),
  'Copper IUD': require('../../../assets/image/sq_cuiud.png'),
  'Hormonal IUD': require('../../../assets/image/sq_lngiud.png'),
};

const CategoryIcon = ({ category }: { category: MECCategory }) => {
  switch (category) {
    case 1: return <CheckCircle size={18} color="#22C55E" />;
    case 2: return <Info size={18} color="#EAB308" />;
    case 3: return <AlertTriangle size={18} color="#F97316" />;
    case 4: return <XCircle size={18} color="#EF4444" />;
  }
};

const WhoMecResultsScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const { age, conditionIds, preferences } = route.params as {
    age: number;
    conditionIds: string[];
    preferences: string[];
  };

  const ageLabel =
    age < 18 ? '< 18' :
    age === 18 ? '18-19' :
    age === 30 ? '20-39' :
    age === 42 ? '40-45' :
    '≥ 46';
  const steps = [
    { id: 1, label: 'Conditions' },
    { id: 2, label: 'Preferences' },
    { id: 3, label: 'Results' },
  ];

  // Calculate results
  const result = useMemo(() =>
    calculateWhoMecTool({ age, conditionIds, preferences }),
    [age, conditionIds, preferences]
  );

  // Condition labels
  const conditionLabels = useMemo(() =>
    conditionIds.map(id => {
      const entry = WHO_MEC_CONDITIONS.find(c => c.id === id);
      if (!entry) return id;
      let label = entry.condition;
      if (entry.subCondition) label += ` — ${entry.subCondition}`;
      if (entry.variant) label += ` (${entry.variant === 'I' ? 'Initiation' : 'Continuation'})`;
      return label;
    }),
    [conditionIds]
  );

  const handleStartOver = () => {
    navigation.navigate('ObWhoMecConditions');
  };

  const handleReturnToDashboard = () => {
    Alert.alert(
      'Return to Dashboard?',
      'You will leave the WHO MEC tool and go back to dashboard.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Return to Dashboard', onPress: () => navigation.navigate('ObHome') },
      ]
    );
  };

  const renderMethodCard = (method: WhoMecMethodResult) => {
    const bgColor = getMECColor(method.mecCategory);

    return (
      <View key={method.id} style={[styles.methodCard, { borderLeftColor: bgColor }]}>
        <View style={styles.methodHeader}>
          <View style={styles.methodTitleRow}>
            <CategoryIcon category={method.mecCategory} />
            <Text style={styles.methodName}>{method.name}</Text>
          </View>
        </View>

        <Text style={styles.categoryLabel}>
          {getMECLabel(method.mecCategory)}
        </Text>

        {preferences.length > 0 && (
          <View style={styles.matchRow}>
            <Text style={styles.matchLabel}>Preference Match:</Text>
            <View style={styles.matchBarContainer}>
              <View style={[styles.matchBarFill, { width: `${method.matchScore}%`, backgroundColor: bgColor }]} />
            </View>
            <Text style={[styles.matchScore, { color: bgColor }]}>{method.matchScore}%</Text>
          </View>
        )}
      </View>
    );
  };

  const renderEligibleCard = (method: WhoMecMethodResult) => {
    const bgColor = getMECColor(method.mecCategory);
    const methodImage = METHOD_IMAGES[method.name];

    return (
      <TouchableOpacity key={method.id} style={styles.recomCard} activeOpacity={0.8}>
        <View style={[styles.rankIndicator, { backgroundColor: bgColor }]} />
        <View style={styles.recomIconContainer}>
          {methodImage ? (
            <Image source={methodImage} style={styles.recomIcon} />
          ) : null}
        </View>
        <View style={styles.recomInfo}>
          <Text style={styles.recomName}>{method.name}</Text>
          <View style={styles.matchBadge}>
            <Ionicons name="sparkles" size={12} color={colors.primary} />
            <Text style={styles.matchText}>{method.matchScore}% Match</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <ObHeader
        title="WHO MEC Tool"
        subtitle="Step 3: Results"
        showBack
        onBackPress={() => navigation.navigate('ObWhoMecPreferences', { age, conditionIds, preferences })}
      />

      <View style={styles.stepperWrap}>
        {steps.map((step) => {
          const isDone = step.id < 3;
          const isActive = step.id === 3;
          return (
            <View key={step.id} style={styles.stepItem}>
              <View style={[styles.stepDot, isDone && styles.stepDotDone, isActive && styles.stepDotActive]}>
                {isDone ? <Check size={16} color="#FFFFFF" strokeWidth={3} /> : <Text style={[styles.stepDotText, isActive && styles.stepDotTextActive]}>{step.id}</Text>}
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
        {/* Input Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Step 1: Patient Summary</Text>

          <Text style={styles.summarySectionLabel}>Age Group</Text>
          <Text style={styles.summaryAgeValue}>{ageLabel}</Text>

          <Text style={styles.summarySectionLabel}>Conditions Identified ({conditionIds.length})</Text>
          {conditionLabels.length > 0 ? (
            conditionLabels.map((label, i) => (
              <Text key={i} style={styles.summaryCondition}>• {label}</Text>
            ))
          ) : (
            <Text style={styles.summaryCondition}>• None</Text>
          )}

          {preferences.length > 0 && (
            <>
              <Text style={styles.summarySectionLabel}>Preferences</Text>
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

        {/* MEC Categories (Dashboard-style dropdown) */}
        <View style={styles.mecCard}>
          <View style={styles.mecHeaderRow}>
            <View style={styles.mecHeaderLeft}>
              <View style={styles.mecIconWrap}>
                <Palette size={18} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.mecTitle}>MEC Color Guide</Text>
                <Text style={styles.mecSubtitle}>WHO quick category legend</Text>
              </View>
            </View>
          </View>

          <View style={styles.mecPreviewRow}>
            <View style={styles.mecPreviewItem}><View style={[styles.mecPreviewDot, { backgroundColor: getMECColor(1) }]} /><Text style={styles.mecPreviewText}>Safe</Text></View>
            <View style={styles.mecPreviewItem}><View style={[styles.mecPreviewDot, { backgroundColor: getMECColor(2) }]} /><Text style={styles.mecPreviewText}>Generally safe</Text></View>
            <View style={styles.mecPreviewItem}><View style={[styles.mecPreviewDot, { backgroundColor: getMECColor(3) }]} /><Text style={styles.mecPreviewText}>Caution</Text></View>
            <View style={styles.mecPreviewItem}><View style={[styles.mecPreviewDot, { backgroundColor: getMECColor(4) }]} /><Text style={styles.mecPreviewText}>Avoid</Text></View>
          </View>

        </View>

        {/* Recommended Methods */}
        {result.recommended.length > 0 && (
          <View style={styles.resultsSectionCard}>
            <Text style={styles.resultsSectionTitle}>
              Eligible Methods ({result.recommended.length})
            </Text>
            {result.recommended.map(renderEligibleCard)}
          </View>
        )}

        {/* Not Recommended Methods */}
        {result.notRecommended.length > 0 && (
          <View style={styles.resultsSectionCard}>
            <Text style={[styles.resultsSectionTitle, { color: colors.error }]}> 
              Not Recommended ({result.notRecommended.length})
            </Text>
            {result.notRecommended.map(renderMethodCard)}
          </View>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimerCard}>
          <View style={styles.disclaimerHeader}>
            <Info size={16} color="#A16207" />
            <Text style={styles.disclaimerTitle}>Clinical Reminder</Text>
          </View>
          <Text style={styles.disclaimerText}>
            Based on WHO Medical Eligibility Criteria, 5th Edition (2015). This output is for decision support and does not replace provider clinical judgement.
          </Text>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleStartOver}>
          <Text style={styles.startOverButtonText}>Start New Assessment</Text>
          <ChevronRight size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryBtn} onPress={handleReturnToDashboard}>
          <ChevronLeft size={16} color="#6B4254" />
          <Text style={styles.secondaryBtnText}>Back to Dashboard</Text>
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
    backgroundColor: '#FFFFFF', borderRadius: 16,
    padding: 16, marginBottom: spacing.md,
    borderWidth: 1, borderColor: '#F3DCE8',
    ...shadows.sm,
    shadowColor: colors.primary,
    shadowOpacity: 0.08,
  },
  summaryTitle: { fontSize: 17, fontWeight: '800', color: colors.text.primary, marginBottom: 10 },
  summarySectionLabel: {
    fontSize: 12,
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
  summaryCondition: { fontSize: 13, color: colors.text.secondary, marginBottom: 8, lineHeight: 18 },
  prefChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  prefChip: {
    backgroundColor: colors.primary + '15', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  prefChipText: { fontSize: 13, color: colors.primary, fontWeight: '500' },

  mecCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#F1F5F9', marginBottom: spacing.lg, ...shadows.sm },
  mecCardExpanded: { borderColor: '#F8D6E5', backgroundColor: '#FFF9FC' },
  mecHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mecHeaderLeft: { flexDirection: 'row', alignItems: 'center' },
  mecIconWrap: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#FFE4F1', alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  mecTitle: { fontSize: 17, fontWeight: '800', color: '#1E293B' },
  mecSubtitle: { fontSize: 13, color: '#64748B', marginTop: 1, fontWeight: '500' },
  mecTogglePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, borderWidth: 1, borderColor: '#E2E8F0' },
  mecPreviewRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10, gap: 8 },
  mecPreviewItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  mecPreviewDot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  mecPreviewText: { fontSize: 13, color: '#475569', fontWeight: '600' },
  mecContent: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  mecItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  mecDot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  mecLabel: { fontSize: 13, color: colors.text.secondary, fontWeight: '600' },
  mecFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  mecFullBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },

  resultsSection: { marginBottom: spacing.lg },
  resultsSectionCard: {
    marginBottom: spacing.lg,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F3DCE8',
    padding: 14,
    ...shadows.sm,
  },
  resultsSectionTitle: {
    fontSize: 16, fontWeight: '800', color: colors.text.primary,
    marginBottom: 12,
  },

  methodCard: {
    backgroundColor: '#fff', borderRadius: 14,
    padding: 14, marginBottom: 10,
    borderLeftWidth: 5, borderWidth: 1, borderColor: '#F3DCE8',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  recomCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  rankIndicator: {
    width: 6,
    height: '100%',
    borderRadius: 3,
    marginRight: 16,
  },
  recomIconContainer: {
    width: 62,
    height: 62,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  recomIcon: {
    width: 70,
    height: 70,
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
  methodHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 6,
  },
  methodTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  methodName: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
  categoryLabel: { fontSize: 12, color: colors.text.disabled, marginBottom: 10, marginLeft: 26, fontWeight: '600' },

  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  matchLabel: { fontSize: 12, color: colors.text.secondary },
  matchBarContainer: {
    flex: 1, height: 6, backgroundColor: colors.border.light,
    borderRadius: 3, overflow: 'hidden',
  },
  matchBarFill: { height: '100%', borderRadius: 3 },
  matchScore: { fontSize: 13, fontWeight: '700', minWidth: 36, textAlign: 'right' },

  disclaimerCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 14,
    padding: 14,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  disclaimerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  disclaimerText: { fontSize: 12.5, color: '#92400E', lineHeight: 18 },

  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 55,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 7,
    elevation: 4,
  },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    justifyContent: 'center',
    height: 55,
    marginTop: 12,
    borderRadius: 12,
    backgroundColor: '#FFF8FC',
    borderWidth: 1,
    borderColor: '#EFD8E5',
  },
  startOverButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  secondaryBtnText: { color: '#6B4254', fontSize: 17, fontWeight: '700' },
});

export default WhoMecResultsScreen;
