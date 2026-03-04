import React, { useMemo } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import {
  ArrowLeft, RotateCcw, CheckCircle, AlertTriangle, XCircle, Info,
} from 'lucide-react-native';
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
  const insets = useSafeAreaInsets();

  const { age, conditionIds, preferences } = route.params as {
    age: number;
    conditionIds: string[];
    preferences: string[];
  };

  const ageLabel = age < 18 ? '< 18' : age <= 39 ? '18 – 39' : '≥ 40';

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
      return entry.subCondition
        ? `${entry.condition}: ${entry.subCondition}`
        : entry.condition;
    }),
    [conditionIds]
  );

  const handleStartOver = () => {
    navigation.navigate('ObWhoMecConditions');
  };

  const renderMethodCard = (method: WhoMecMethodResult) => {
    const bgColor = getMECColor(method.mecCategory);
    const isRecommended = method.mecCategory <= 2;

    return (
      <View key={method.id} style={[styles.methodCard, { borderLeftColor: bgColor }]}>
        <View style={styles.methodHeader}>
          <View style={styles.methodTitleRow}>
            <CategoryIcon category={method.mecCategory} />
            <Text style={styles.methodName}>{method.name}</Text>
          </View>
          <View style={[styles.categoryBadge, { backgroundColor: bgColor }]}>
            <Text style={styles.categoryBadgeText}>Cat {method.mecCategory}</Text>
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

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ObHeader title="WHO MEC Tool" subtitle="Results" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Input Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Patient Profile</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Age Group:</Text>
            <Text style={styles.summaryValue}>{ageLabel}</Text>
          </View>

          {conditionLabels.length > 0 && (
            <>
              <Text style={styles.summarySubhead}>Conditions:</Text>
              {conditionLabels.map((label, i) => (
                <Text key={i} style={styles.summaryCondition}>  - {label}</Text>
              ))}
            </>
          )}

          {preferences.length > 0 && (
            <>
              <Text style={styles.summarySubhead}>Preferences:</Text>
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

        {/* MEC Legend */}
        <View style={styles.legendCard}>
          <Text style={styles.legendTitle}>MEC Categories</Text>
          {([1, 2, 3, 4] as MECCategory[]).map(cat => (
            <View key={cat} style={styles.legendRow}>
              <View style={[styles.legendDot, { backgroundColor: getMECColor(cat) }]} />
              <Text style={styles.legendText}>
                <Text style={styles.legendCat}>Cat {cat}</Text> — {getMECLabel(cat)}
              </Text>
            </View>
          ))}
        </View>

        {/* Recommended Methods */}
        {result.recommended.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={styles.resultsSectionTitle}>
              Eligible Methods ({result.recommended.length})
            </Text>
            {result.recommended.map(renderMethodCard)}
          </View>
        )}

        {/* Not Recommended Methods */}
        {result.notRecommended.length > 0 && (
          <View style={styles.resultsSection}>
            <Text style={[styles.resultsSectionTitle, { color: colors.error }]}>
              Not Recommended ({result.notRecommended.length})
            </Text>
            {result.notRecommended.map(renderMethodCard)}
          </View>
        )}

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Text style={styles.disclaimerText}>
            Based on WHO Medical Eligibility Criteria, 5th Edition (2015).
            This tool is for healthcare provider guidance only.
            Clinical judgement should always be applied.
          </Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={18} color={colors.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.startOverButton} onPress={handleStartOver}>
          <RotateCcw size={18} color="#fff" />
          <Text style={styles.startOverButtonText}>New Assessment</Text>
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
    padding: 16, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border.light,
  },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: colors.text.primary, marginBottom: 10 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  summaryLabel: { fontSize: 13, color: colors.text.secondary },
  summaryValue: { fontSize: 13, fontWeight: '600', color: colors.text.primary },
  summarySubhead: { fontSize: 13, color: colors.text.secondary, marginTop: 8, marginBottom: 4 },
  summaryCondition: { fontSize: 12, color: colors.text.disabled, marginBottom: 2 },
  prefChipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  prefChip: {
    backgroundColor: colors.primary + '15', borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  prefChipText: { fontSize: 11, color: colors.primary, fontWeight: '500' },

  legendCard: {
    backgroundColor: '#FAFAFA', borderRadius: borderRadius.md,
    padding: 14, marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.border.light,
  },
  legendTitle: { fontSize: 13, fontWeight: '600', color: colors.text.secondary, marginBottom: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  legendDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendText: { fontSize: 12, color: colors.text.secondary, flex: 1 },
  legendCat: { fontWeight: '600' },

  resultsSection: { marginBottom: spacing.lg },
  resultsSectionTitle: {
    fontSize: 16, fontWeight: '700', color: colors.text.primary,
    marginBottom: spacing.sm,
  },

  methodCard: {
    backgroundColor: '#fff', borderRadius: borderRadius.md,
    padding: 16, marginBottom: 10,
    borderLeftWidth: 4, borderWidth: 1, borderColor: colors.border.light,
    ...shadows.sm,
  },
  methodHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: 6,
  },
  methodTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  methodName: { fontSize: 16, fontWeight: '700', color: colors.text.primary },
  categoryBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
  },
  categoryBadgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  categoryLabel: { fontSize: 12, color: colors.text.disabled, marginBottom: 10, marginLeft: 26 },

  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  matchLabel: { fontSize: 12, color: colors.text.secondary },
  matchBarContainer: {
    flex: 1, height: 6, backgroundColor: colors.border.light,
    borderRadius: 3, overflow: 'hidden',
  },
  matchBarFill: { height: '100%', borderRadius: 3 },
  matchScore: { fontSize: 13, fontWeight: '700', minWidth: 36, textAlign: 'right' },

  disclaimer: {
    backgroundColor: '#FFF8E1', borderRadius: borderRadius.md,
    padding: 14, marginBottom: spacing.lg,
    borderWidth: 1, borderColor: '#FFE082',
  },
  disclaimerText: { fontSize: 12, color: '#795548', lineHeight: 18 },

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
  startOverButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primary, borderRadius: borderRadius.md,
    paddingVertical: 14, paddingHorizontal: 20,
  },
  startOverButtonText: { fontSize: 15, fontWeight: '600', color: '#fff' },
});

export default WhoMecResultsScreen;
