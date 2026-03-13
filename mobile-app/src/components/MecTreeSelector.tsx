import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Search, ChevronDown, ChevronRight, Check, X } from 'lucide-react-native';
import {
    WHO_MEC_CONDITIONS, getParentConditions, buildConditionTree,
    type ConditionTreeNode,
} from '../data/whoMecData';

interface MecTreeSelectorProps {
    selectedConditions: string[];
    onToggleCondition: (id: string) => void;
    maxConditions?: number;
}

const colors = {
    primary: '#E45A92',
    text: { primary: '#1E293B', secondary: '#64748B', disabled: '#94A3B8' },
    border: { light: '#E2E8F0', main: '#CBD5E1' },
    background: { card: '#F8F9FB' }
};

export const MecTreeSelector: React.FC<MecTreeSelectorProps> = ({
    selectedConditions,
    onToggleCondition,
    maxConditions = 3
}) => {
    const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});
    const [expandedSubs, setExpandedSubs] = useState<Record<string, boolean>>({});
    const [searchQuery, setSearchQuery] = useState('');

    const tree = useMemo(() => buildConditionTree(), []);
    const parentConditions = useMemo(() => getParentConditions(), []);

    const filteredParents = useMemo(() => {
        if (!searchQuery.trim()) return parentConditions;
        const q = searchQuery.toLowerCase();
        return parentConditions.filter(name => name.toLowerCase().includes(q));
    }, [searchQuery, parentConditions]);

    const toggleParent = (name: string) => setExpandedParents(p => ({ ...p, [name]: !p[name] }));
    const toggleSub = (key: string) => setExpandedSubs(p => ({ ...p, [key]: !p[key] }));

    const isDisabled = (id: string) =>
        !selectedConditions.includes(id) && selectedConditions.length >= maxConditions;

    const getConditionLabel = (id: string) => {
        const entry = WHO_MEC_CONDITIONS.find(c => c.id === id);
        if (!entry) return id;
        let label = entry.condition;
        if (entry.subCondition) label += ` — ${entry.subCondition}`;
        if (entry.variant) label += ` (${entry.variant === 'I' ? 'Initiation' : 'Continuation'})`;
        return label;
    };

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
                onPress={() => onToggleCondition(id)}
                disabled={disabled}
            >
                <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                    {isSelected && <Check size={12} color="#fff" />}
                </View>
                <Text 
                    style={[
                        styles.leafLabel, 
                        indent === 0 && styles.leafLabelBold,
                        isSelected && styles.leafLabelSelected
                    ]} 
                    numberOfLines={2}
                >
                    {label}
                </Text>
            </TouchableOpacity>
        );
    };

    const renderNode = (condName: string, node: ConditionTreeNode) => {
        const subKeys = Object.keys(node.subs);

        if (node.directEntry && subKeys.length === 0 && !node.initiation) {
            return renderCheckbox(node.directEntry.id, condName, 0);
        }

        if (!node.directEntry && subKeys.length === 0 && node.initiation) {
            return (
                <View key={condName + '_ic'}>
                    {node.initiation && renderCheckbox(node.initiation.id, 'Initiation', 1)}
                    {node.continuation && renderCheckbox(node.continuation.id, 'Continuation', 1)}
                </View>
            );
        }

        return (
            <View key={condName + '_subs'}>
                {subKeys.map(subKey => {
                    const sub = node.subs[subKey];
                    const subExpandKey = `${condName}::${subKey}`;

                    if (sub.initiation || sub.continuation) {
                        const isSubExpanded = expandedSubs[subExpandKey];
                        return (
                            <View key={subExpandKey}>
                                <TouchableOpacity
                                    style={[styles.subHeader, { paddingLeft: 32 }]}
                                    onPress={() => toggleSub(subExpandKey)}
                                >
                                    {isSubExpanded ? <ChevronDown size={14} color={colors.text.secondary} /> : <ChevronRight size={14} color={colors.text.secondary} />}
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

                    if (sub.directEntry) {
                        return renderCheckbox(sub.directEntry.id, subKey, 1);
                    }
                    return null;
                })}

                {node.initiation && renderCheckbox(node.initiation.id, 'Initiation', 1)}
                {node.continuation && renderCheckbox(node.continuation.id, 'Continuation', 1)}
            </View>
        );
    };

    return (
        <View style={styles.container}>
            <Text style={styles.inputLabel}>Medical Conditions (Max {maxConditions})</Text>

            {selectedConditions.length > 0 && (
                <View style={{ marginBottom: 12 }}>
                    {selectedConditions.map(id => (
                        <View key={id} style={styles.selectedChip}>
                            <Text style={styles.selectedChipText} numberOfLines={2}>
                                {getConditionLabel(id)}
                            </Text>
                            <TouchableOpacity onPress={() => onToggleCondition(id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                                <X size={16} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            )}

            <View style={styles.searchContainer}>
                <Search size={20} color="#94A3B8" />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search conditions..."
                    placeholderTextColor="#94A3B8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                        <Text style={{ color: colors.text.disabled, fontWeight: 'bold' }}>X</Text>
                    </TouchableOpacity>
                )}
            </View>

            <View style={{ backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' }}>
                {filteredParents.map(condName => {
                    const node = tree[condName];
                    if (!node) return null;

                    const subKeys = Object.keys(node.subs);
                    const isSimple = node.directEntry && subKeys.length === 0 && !node.initiation;

                    if (isSimple) {
                        return (
                            <View key={condName} style={styles.parentContainer}>
                                {renderCheckbox(node.directEntry!.id, condName, 0)}
                            </View>
                        );
                    }

                    const isExpanded = expandedParents[condName];
                    return (
                        <View key={condName} style={styles.parentContainer}>
                            <TouchableOpacity style={styles.parentHeader} onPress={() => toggleParent(condName)}>
                                {isExpanded ? <ChevronDown size={18} color={colors.text.primary} /> : <ChevronRight size={18} color={colors.text.primary} />}
                                <Text style={styles.parentLabel}>{condName}</Text>
                            </TouchableOpacity>
                            {isExpanded && renderNode(condName, node)}
                        </View>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: { marginBottom: 16 },
    inputLabel: { fontSize: 13, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
    searchContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8F9FB', borderRadius: 12, paddingHorizontal: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0' },
    searchInput: { flex: 1, height: 44, marginLeft: 8, fontSize: 15, color: '#1E293B' },
    parentContainer: { borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
    parentHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 },
    parentLabel: { fontSize: 15, fontWeight: '800', color: colors.text.primary, flex: 1, marginLeft: 6 },
    subHeader: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingRight: 16 },
    subLabel: { fontSize: 14, fontWeight: '500', color: colors.text.secondary, flex: 1, marginLeft: 6 },
    leafItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingRight: 16 },
    leafItemSelected: { backgroundColor: colors.primary + '08' },
    leafItemDisabled: { opacity: 0.4 },
    checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: colors.border.main, alignItems: 'center', justifyContent: 'center', marginRight: 10, backgroundColor: '#fff' },
    checkboxSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    leafLabel: { fontSize: 14, color: colors.text.primary, flex: 1 },
    leafLabelBold: { fontWeight: '800' },
    leafLabelSelected: { color: colors.primary, fontWeight: '500' },
    selectedChip: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: colors.primary + '12', borderRadius: 8,
        paddingHorizontal: 12, paddingVertical: 10, marginBottom: 6,
        borderWidth: 1, borderColor: colors.primary + '30',
    },
    selectedChipText: { flex: 1, fontSize: 13, color: colors.primary, fontWeight: '500', marginRight: 8 },
});
