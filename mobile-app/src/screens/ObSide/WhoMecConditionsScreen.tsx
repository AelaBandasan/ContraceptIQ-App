import React, { useState, useMemo } from 'react';
import {
  StyleSheet, View, Text, TouchableOpacity, ScrollView,
  TextInput, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import {
  Search, ChevronDown, ChevronRight, X, ArrowRight, Check,
} from 'lucide-react-native';
import { colors, shadows, spacing, borderRadius } from '../../theme';
import {
  WHO_MEC_CONDITIONS, CONDITION_GROUPS, getConditionsByGroup,
  type MecConditionEntry, type MecConditionGroup,
} from '../../data/whoMecData';
import ObHeader from '../../components/ObHeader';

const AGE_OPTIONS = [
  { label: '< 18', value: 16 },
  { label: '18 – 39', value: 25 },
  { label: '≥ 40', value: 45 },
];

const MAX_CONDITIONS = 3;

const WhoMecConditionsScreen = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [selectedAge, setSelectedAge] = useState<number | null>(null);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const groupedConditions = useMemo(() => getConditionsByGroup(), []);

  // Filter conditions by search
  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groupedConditions;
    const q = searchQuery.toLowerCase();
    const filtered = {} as Record<MecConditionGroup, MecConditionEntry[]>;
    for (const group of CONDITION_GROUPS) {
      const items = groupedConditions[group].filter(
        c =>
          c.condition.toLowerCase().includes(q) ||
          (c.subCondition && c.subCondition.toLowerCase().includes(q)) ||
          c.description.toLowerCase().includes(q)
      );
      if (items.length > 0) filtered[group] = items;
    }
    return filtered;
  }, [searchQuery, groupedConditions]);

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const toggleCondition = (id: string) => {
    setSelectedConditions(prev => {
      if (prev.includes(id)) {
        return prev.filter(c => c !== id);
      }
      if (prev.length >= MAX_CONDITIONS) {
        Alert.alert('Maximum Conditions', `You can select up to ${MAX_CONDITIONS} conditions, matching the WHO MEC Tool limit.`);
        return prev;
      }
      return [...prev, id];
    });
  };

  const removeCondition = (id: string) => {
    setSelectedConditions(prev => prev.filter(c => c !== id));
  };

  const getConditionLabel = (id: string) => {
    const entry = WHO_MEC_CONDITIONS.find(c => c.id === id);
    if (!entry) return id;
    return entry.subCondition
      ? `${entry.condition}: ${entry.subCondition}`
      : entry.condition;
  };

  const handleNext = () => {
    if (selectedAge === null) {
      Alert.alert('Select Age', 'Please select an age group before continuing.');
      return;
    }
    navigation.navigate('ObWhoMecPreferences', {
      age: selectedAge,
      conditionIds: selectedConditions,
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ObHeader title="WHO MEC Tool" subtitle="Step 1: Conditions" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Age Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Age Group</Text>
          <View style={styles.ageRow}>
            {AGE_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.ageChip,
                  selectedAge === opt.value && styles.ageChipSelected,
                ]}
                onPress={() => setSelectedAge(opt.value)}
              >
                <Text style={[
                  styles.ageChipText,
                  selectedAge === opt.value && styles.ageChipTextSelected,
                ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Selected Conditions Summary */}
        {selectedConditions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Selected Conditions ({selectedConditions.length}/{MAX_CONDITIONS})
            </Text>
            {selectedConditions.map(id => (
              <View key={id} style={styles.selectedChip}>
                <Text style={styles.selectedChipText} numberOfLines={1}>
                  {getConditionLabel(id)}
                </Text>
                <TouchableOpacity onPress={() => removeCondition(id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={16} color={colors.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Search */}
        <View style={styles.searchContainer}>
          <Search size={18} color={colors.text.disabled} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search conditions..."
            placeholderTextColor={colors.text.disabled}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color={colors.text.disabled} />
            </TouchableOpacity>
          )}
        </View>

        {/* Condition Groups */}
        {(Object.keys(filteredGroups) as MecConditionGroup[]).map(group => (
          <View key={group} style={styles.groupContainer}>
            <TouchableOpacity
              style={styles.groupHeader}
              onPress={() => toggleGroup(group)}
            >
              <Text style={styles.groupTitle}>{group}</Text>
              <View style={styles.groupHeaderRight}>
                <Text style={styles.groupCount}>
                  {filteredGroups[group].length}
                </Text>
                {expandedGroups[group]
                  ? <ChevronDown size={20} color={colors.text.secondary} />
                  : <ChevronRight size={20} color={colors.text.secondary} />
                }
              </View>
            </TouchableOpacity>

            {expandedGroups[group] && filteredGroups[group].map(entry => {
              const isSelected = selectedConditions.includes(entry.id);
              const isDisabled = !isSelected && selectedConditions.length >= MAX_CONDITIONS;

              return (
                <TouchableOpacity
                  key={entry.id}
                  style={[
                    styles.conditionItem,
                    isSelected && styles.conditionItemSelected,
                    isDisabled && styles.conditionItemDisabled,
                  ]}
                  onPress={() => toggleCondition(entry.id)}
                  disabled={isDisabled}
                >
                  <View style={styles.conditionCheckbox}>
                    {isSelected && <Check size={14} color="#fff" />}
                  </View>
                  <View style={styles.conditionInfo}>
                    <Text style={[
                      styles.conditionLabel,
                      isSelected && styles.conditionLabelSelected,
                    ]}>
                      {entry.subCondition
                        ? `${entry.condition} — ${entry.subCondition}`
                        : entry.condition}
                    </Text>
                    <Text style={styles.conditionDesc} numberOfLines={2}>
                      {entry.description}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.bottomInfo}>
          <Text style={styles.bottomInfoText}>
            {selectedAge !== null ? `Age: ${AGE_OPTIONS.find(a => a.value === selectedAge)?.label}` : 'No age selected'}
          </Text>
          <Text style={styles.bottomInfoText}>
            {selectedConditions.length} condition{selectedConditions.length !== 1 ? 's' : ''}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.nextButton, selectedAge === null && styles.nextButtonDisabled]}
          onPress={handleNext}
          disabled={selectedAge === null}
        >
          <Text style={styles.nextButtonText}>Next: Preferences</Text>
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

  section: { marginBottom: spacing.lg },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text.primary, marginBottom: spacing.sm },

  ageRow: { flexDirection: 'row', gap: spacing.sm },
  ageChip: {
    flex: 1, paddingVertical: 12, borderRadius: borderRadius.md,
    borderWidth: 1.5, borderColor: colors.border.light,
    alignItems: 'center', backgroundColor: '#fff',
  },
  ageChipSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
  ageChipText: { fontSize: 15, fontWeight: '500', color: colors.text.secondary },
  ageChipTextSelected: { color: colors.primary, fontWeight: '600' },

  selectedChip: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.primary + '12', borderRadius: borderRadius.sm,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 6,
    borderWidth: 1, borderColor: colors.primary + '30',
  },
  selectedChipText: { flex: 1, fontSize: 13, color: colors.primary, fontWeight: '500', marginRight: 8 },

  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.background.card, borderRadius: borderRadius.md,
    paddingHorizontal: 12, marginBottom: spacing.md,
    borderWidth: 1, borderColor: colors.border.light,
  },
  searchInput: { flex: 1, paddingVertical: 12, paddingHorizontal: 8, fontSize: 14, color: colors.text.primary },

  groupContainer: { marginBottom: spacing.sm },
  groupHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 14, paddingHorizontal: 12,
    backgroundColor: colors.background.card, borderRadius: borderRadius.md,
    ...shadows.sm,
  },
  groupTitle: { fontSize: 15, fontWeight: '600', color: colors.text.primary, flex: 1 },
  groupHeaderRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  groupCount: { fontSize: 12, color: colors.text.disabled, fontWeight: '500' },

  conditionItem: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingVertical: 12, paddingHorizontal: 12,
    marginLeft: 8, borderBottomWidth: 1, borderBottomColor: colors.border.light + '60',
  },
  conditionItemSelected: { backgroundColor: colors.primary + '08' },
  conditionItemDisabled: { opacity: 0.4 },
  conditionCheckbox: {
    width: 22, height: 22, borderRadius: 4, borderWidth: 1.5,
    borderColor: colors.border.main, alignItems: 'center', justifyContent: 'center',
    marginRight: 10, marginTop: 1, backgroundColor: '#fff',
  },
  conditionInfo: { flex: 1 },
  conditionLabel: { fontSize: 14, fontWeight: '500', color: colors.text.primary, marginBottom: 2 },
  conditionLabelSelected: { color: colors.primary },
  conditionDesc: { fontSize: 12, color: colors.text.disabled, lineHeight: 16 },

  bottomBar: {
    paddingHorizontal: spacing.lg, paddingTop: 12,
    backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: colors.border.light,
    ...shadows.lg,
  },
  bottomInfo: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  bottomInfoText: { fontSize: 13, color: colors.text.secondary, fontWeight: '500' },
  nextButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: colors.primary, borderRadius: borderRadius.md,
    paddingVertical: 14, gap: 8,
  },
  nextButtonDisabled: { opacity: 0.5 },
  nextButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});

export default WhoMecConditionsScreen;
