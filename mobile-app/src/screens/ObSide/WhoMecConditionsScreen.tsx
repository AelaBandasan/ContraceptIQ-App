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
  WHO_MEC_CONDITIONS, getParentConditions, buildConditionTree,
  type ConditionTreeNode,
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
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});
  const [expandedSubs, setExpandedSubs] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  const tree = useMemo(() => buildConditionTree(), []);
  const parentConditions = useMemo(() => getParentConditions(), []);

  // Filter parents by search
  const filteredParents = useMemo(() => {
    if (!searchQuery.trim()) return parentConditions;
    const q = searchQuery.toLowerCase();
    return parentConditions.filter(name => name.toLowerCase().includes(q));
  }, [searchQuery, parentConditions]);

  const toggleParent = (name: string) => {
    setExpandedParents(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const toggleSub = (key: string) => {
    setExpandedSubs(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleCondition = (id: string) => {
    setSelectedConditions(prev => {
      if (prev.includes(id)) return prev.filter(c => c !== id);
      if (prev.length >= MAX_CONDITIONS) {
        Alert.alert('Maximum Conditions', `You can select up to ${MAX_CONDITIONS} conditions.`);
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
    let label = entry.condition;
    if (entry.subCondition) label += ` — ${entry.subCondition}`;
    if (entry.variant) label += ` (${entry.variant === 'I' ? 'Initiation' : 'Continuation'})`;
    return label;
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

  const isDisabled = (id: string) =>
    !selectedConditions.includes(id) && selectedConditions.length >= MAX_CONDITIONS;

  const renderCheckbox = (id: string, label: string, indent: number) => {
    const isSelected = selectedConditions.includes(id);
    const disabled = isDisabled(id);

    return (
      <TouchableOpacity
        key={id}
        style={[
          styles.leafItem,
          { paddingLeft: 16 + indent * 16 },
          isSelected && styles.leafItemSelected,
          disabled && styles.leafItemDisabled,
        ]}
        onPress={() => toggleCondition(id)}
        disabled={disabled}
      >
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Check size={12} color="#fff" />}
        </View>
        <Text style={[styles.leafLabel, isSelected && styles.leafLabelSelected]} numberOfLines={2}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderNode = (condName: string, node: ConditionTreeNode) => {
    const subKeys = Object.keys(node.subs);
    const hasContent = node.directEntry || node.initiation || subKeys.length > 0;

    // Parent-level direct entry (no subs, no I/C) — e.g. "Epilepsy"
    if (node.directEntry && subKeys.length === 0 && !node.initiation) {
      return renderCheckbox(node.directEntry.id, condName, 0);
    }

    // Parent has I/C only (no subs) — e.g. "Stroke"
    if (!node.directEntry && subKeys.length === 0 && node.initiation) {
      return (
        <View key={condName + '_ic'}>
          {node.initiation && renderCheckbox(node.initiation.id, 'Initiation', 1)}
          {node.continuation && renderCheckbox(node.continuation.id, 'Continuation', 1)}
        </View>
      );
    }

    // Parent has sub-conditions
    return (
      <View key={condName + '_subs'}>
        {subKeys.map(subKey => {
          const sub = node.subs[subKey];
          const subExpandKey = `${condName}::${subKey}`;

          // Sub has I/C
          if (sub.initiation || sub.continuation) {
            const isSubExpanded = expandedSubs[subExpandKey];
            return (
              <View key={subExpandKey}>
                <TouchableOpacity
                  style={[styles.subHeader, { paddingLeft: 32 }]}
                  onPress={() => toggleSub(subExpandKey)}
                >
                  {isSubExpanded
                    ? <ChevronDown size={14} color={colors.text.secondary} />
                    : <ChevronRight size={14} color={colors.text.secondary} />}
                  <Text style={styles.subLabel} numberOfLines={2}>{subKey}</Text>
                </TouchableOpacity>
                {isSubExpanded && (
                  <View>
                    {sub.initiation && renderCheckbox(sub.initiation.id, 'Initiation', 3)}
                    {sub.continuation && renderCheckbox(sub.continuation.id, 'Continuation', 3)}
                  </View>
                )}
              </View>
            );
          }

          // Sub is a direct leaf
          if (sub.directEntry) {
            return renderCheckbox(sub.directEntry.id, subKey, 1);
          }

          return null;
        })}

        {/* Parent-level I/C (in addition to subs) */}
        {node.initiation && renderCheckbox(node.initiation.id, 'Initiation', 1)}
        {node.continuation && renderCheckbox(node.continuation.id, 'Continuation', 1)}
      </View>
    );
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
                style={[styles.ageChip, selectedAge === opt.value && styles.ageChipSelected]}
                onPress={() => setSelectedAge(opt.value)}
              >
                <Text style={[styles.ageChipText, selectedAge === opt.value && styles.ageChipTextSelected]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Selected Conditions */}
        {selectedConditions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Selected ({selectedConditions.length}/{MAX_CONDITIONS})
            </Text>
            {selectedConditions.map(id => (
              <View key={id} style={styles.selectedChip}>
                <Text style={styles.selectedChipText} numberOfLines={2}>
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

        {/* Alphabetical Condition List */}
        {filteredParents.map(condName => {
          const node = tree[condName];
          if (!node) return null;

          const subKeys = Object.keys(node.subs);
          const isSimple = node.directEntry && subKeys.length === 0 && !node.initiation;

          // Simple condition (no subs, no I/C) — show as direct selectable row
          if (isSimple) {
            return (
              <View key={condName} style={styles.parentContainer}>
                {renderCheckbox(node.directEntry!.id, condName, 0)}
              </View>
            );
          }

          // Complex condition — expandable
          const isExpanded = expandedParents[condName];
          return (
            <View key={condName} style={styles.parentContainer}>
              <TouchableOpacity
                style={styles.parentHeader}
                onPress={() => toggleParent(condName)}
              >
                {isExpanded
                  ? <ChevronDown size={18} color={colors.text.primary} />
                  : <ChevronRight size={18} color={colors.text.primary} />}
                <Text style={styles.parentLabel}>{condName}</Text>
              </TouchableOpacity>
              {isExpanded && renderNode(condName, node)}
            </View>
          );
        })}

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

  parentContainer: {
    marginBottom: 2,
    borderBottomWidth: 1, borderBottomColor: colors.border.light + '60',
  },
  parentHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 14, paddingHorizontal: 8,
  },
  parentLabel: { fontSize: 15, fontWeight: '600', color: colors.text.primary, flex: 1, marginLeft: 6 },

  subHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10,
  },
  subLabel: { fontSize: 14, fontWeight: '500', color: colors.text.secondary, flex: 1, marginLeft: 6 },

  leafItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingRight: 12,
  },
  leafItemSelected: { backgroundColor: colors.primary + '08' },
  leafItemDisabled: { opacity: 0.4 },
  checkbox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 1.5,
    borderColor: colors.border.main, alignItems: 'center', justifyContent: 'center',
    marginRight: 10, backgroundColor: '#fff',
  },
  checkboxSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  leafLabel: { fontSize: 14, color: colors.text.primary, flex: 1 },
  leafLabelSelected: { color: colors.primary, fontWeight: '500' },

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
