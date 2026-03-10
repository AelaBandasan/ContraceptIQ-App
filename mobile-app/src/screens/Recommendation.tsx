import { StyleSheet, Text, TouchableOpacity, View, Alert, useWindowDimensions } from 'react-native';
import React, { useState } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DrawerScreenProps } from '../types/navigation';
import { colors, shadows } from '../theme';
import Animated, { FadeInDown, FadeInRight, FadeInUp } from 'react-native-reanimated';
import { useAssessment } from '../context/AssessmentContext';
// Context is read-only here; selectedAgeIndex initialises the local chip state.
import { CalendarDays, Check } from 'lucide-react-native';

type Props = DrawerScreenProps<'Recommendation'>;

const AGE_RANGES = [
  { label: '< 18',  fullLabel: 'Menarche to < 18 years', numericAge: 16 },
  { label: '18–19', fullLabel: '18 – 19 years',           numericAge: 18 },
  { label: '20–39', fullLabel: '20 – 39 years',           numericAge: 30 },
  { label: '40–45', fullLabel: '40 – 45 years',           numericAge: 42 },
  { label: '≥ 46',  fullLabel: '≥ 46 years',              numericAge: 50 },
];

const STEPS = [
  { id: 1, label: 'Age' },
  { id: 2, label: 'Preferences' },
  { id: 3, label: 'Results' },
];

const Recommendation: React.FC<Props> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // Read context only to pre-fill from a previously saved session selection.
  // We do NOT write back to context here — saving happens explicitly in Step 3.
  const { selectedAgeIndex } = useAssessment();
  const [localAgeIndex, setLocalAgeIndex] = useState<number | null>(selectedAgeIndex);
  const horizontalPadding = width < 360 ? 14 : 20;
  const ageChipWidth = width < 360 ? '47%' : width < 430 ? '31%' : '23%';

  const handleSelectAge = (index: number) => {
    setLocalAgeIndex(index);
  };

  const handleNext = () => {
    if (localAgeIndex === null) {
      Alert.alert('Select Age', 'Please select your age group before continuing.');
      return;
    }
    const numericAge = AGE_RANGES[localAgeIndex].numericAge;
    (navigation as any).navigate('GuestMecPreferences', { age: numericAge });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Animated.View
        entering={FadeInDown.duration(600).withInitialValues({ opacity: 1 })}
        style={[styles.header, { paddingTop: insets.top + 10 }]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <View style={styles.headerBtnInner}>
            <Ionicons name="chevron-back" size={26} color="#FFF" />
          </View>
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>What's Right for Me?</Text>
        </View>
        <TouchableOpacity
          onPress={() => (navigation as any).navigate('ColorMapping')}
          style={styles.headerBtn}
        >
          <View style={styles.headerBtnInner}>
            <Ionicons name="information-circle-outline" size={26} color="#FFF" />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Stepper */}
      <View style={styles.stepperWrap}>
        {STEPS.map((step) => {
          const isActive = step.id === 1;
          return (
            <View key={step.id} style={styles.stepItem}>
              <View style={[styles.stepDot, isActive && styles.stepDotActive]}>
                <Text style={[styles.stepDotText, isActive && styles.stepDotTextActive]}>
                  {step.id}
                </Text>
              </View>
              <Text style={[styles.stepLabel, isActive && styles.stepLabelActive]}>
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <View style={[styles.content, { paddingHorizontal: horizontalPadding }]}>
          <Animated.View entering={FadeInDown.delay(200).duration(800).withInitialValues({ opacity: 1 })}>
            <Text style={styles.introTitle}>Select Your Age Group</Text>
            <Text style={styles.introText}>
              This tool uses WHO Medical Eligibility Criteria (5th Ed.) to recommend contraceptive methods based on your age. No medical history is required.
            </Text>
          </Animated.View>

          {/* Age Selection */}
          <Animated.View entering={FadeInDown.delay(400).duration(800).withInitialValues({ opacity: 1 })} style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.meIconContainer}>
                <View style={styles.meIconCircle}>
                  <CalendarDays size={20} color={colors.primary} />
                  <View style={styles.plusIconBadge}>
                    <Text style={styles.plusIconText}>•</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.cardTitle}>Age Group</Text>
            </View>

            <View style={styles.ageChipsWrapper}>
              {AGE_RANGES.map((range, index) => {
                const isSelected = localAgeIndex === index;
                return (
                  <Animated.View
                    key={index}
                    entering={FadeInRight.delay(600 + index * 100).duration(500).withInitialValues({ opacity: 1 })}
                  >
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={[styles.ageChip, { width: ageChipWidth }, isSelected && styles.ageChipSelected]}
                      onPress={() => handleSelectAge(index)}
                    >
                      <Text style={[styles.ageChipLabel, isSelected && styles.ageChipLabelSelected]}>
                        {range.label}
                      </Text>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </View>

            {localAgeIndex !== null && (
              <Animated.View entering={FadeInDown.duration(400).withInitialValues({ opacity: 1 })} style={styles.selectedAgeBadge}>
                <Check size={14} color={colors.primary} />
                <Text style={styles.selectedAgeText}>
                  {AGE_RANGES[localAgeIndex].fullLabel}
                </Text>
              </Animated.View>
            )}
          </Animated.View>

          {/* Info note */}
          <Animated.View entering={FadeInDown.delay(900).duration(800).withInitialValues({ opacity: 1 })} style={styles.noteCard}>
            <Ionicons name="shield-checkmark-outline" size={18} color="#0369A1" />
            <Text style={styles.noteText}>
              Your privacy is protected. We only use your age group — no personal medical history is collected.
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInUp.delay(1100).duration(800).withInitialValues({ opacity: 1 })}>
            <TouchableOpacity
              style={[styles.nextBtn, localAgeIndex === null && styles.nextBtnDisabled]}
              onPress={handleNext}
              activeOpacity={0.9}
              disabled={localAgeIndex === null}
            >
              <Text style={styles.nextBtnText}>Next: Preferences</Text>
              <Ionicons name="arrow-forward" size={18} color="rgba(255,255,255,0.9)" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Recommendation;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  headerBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
  },
  headerBtnInner: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: {
    flex: 1,
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: -0.5,
  },
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
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F3E8EF',
    borderWidth: 1,
    borderColor: '#E4CFDB',
  },
  stepDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepDotText: { fontSize: 15, fontWeight: '700', color: '#8A7A83' },
  stepDotTextActive: { color: '#FFFFFF' },
  stepLabel: { marginTop: 4, fontSize: 13, fontWeight: '600', color: '#8A7A83' },
  stepLabelActive: { color: colors.primary },
  scroll: { flex: 1 },
  content: { paddingTop: 20 },
  introTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1B211A',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  introText: {
    fontSize: 15,
    color: '#64748B',
    lineHeight: 22,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3DCE8',
    ...shadows.md,
    shadowColor: colors.primary,
    shadowOpacity: 0.08,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
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
  cardTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: '#1B211A',
  },
  ageChipsWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center',
  },
  ageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
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
  ageChipLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  ageChipLabelSelected: {
    color: '#FFF',
  },
  selectedAgeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F3DCE8',
  },
  selectedAgeText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '600',
  },
  noteCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F0F9FF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 24,
  },
  noteText: {
    flex: 1,
    fontSize: 14,
    color: '#0C4A6E',
    lineHeight: 20,
  },
  nextBtn: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
  },
  nextBtnDisabled: {
    opacity: 0.55,
  },
  nextBtnText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
