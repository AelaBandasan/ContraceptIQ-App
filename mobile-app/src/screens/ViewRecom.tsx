import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RootStackScreenProps } from '../types/navigation';
import { openDrawer } from '../navigation/NavigationService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getMECColor, getMECLabel, MECCategory, calculateMatchScore } from '../services/mecService';

type Props = RootStackScreenProps<'ViewRecommendation'>;

const ViewRecom: React.FC<Props> = ({ navigation, route }) => {
  const { ageLabel, ageValue, prefs, mecResults } = route.params || {};

  // Define contraceptives with their MEC key mapping
  const baseContraceptives = [
    {
      name: 'Implant',
      mecKey: 'Implant' as const,
      image: require('../../assets/image/implantt.png'),
      description: 'Long-acting, highly effective',
    },
    {
      name: 'DMPA (Injectable)',
      mecKey: 'DMPA' as const,
      image: require('../../assets/image/injectables.png'),
      description: 'Injection every 3 months',
    },
    {
      name: 'CHC (Patch/Pills/Ring)',
      mecKey: 'CHC' as const,
      image: require('../../assets/image/patchh.png'),
      description: 'Combined hormonal methods',
    },
    {
      name: 'Cu-IUD (Copper)',
      mecKey: 'Cu-IUD' as const,
      image: require('../../assets/image/copperiud.png'),
      description: 'Non-hormonal, long-acting',
    },
    {
      name: 'POP (Progestin-Only Pills)',
      mecKey: 'POP' as const,
      image: require('../../assets/image/pillss.png'),
      description: 'Daily progestin pill',
    },
    {
      name: 'LNG-IUD (Hormonal)',
      mecKey: 'LNG-IUD' as const,
      image: require('../../assets/image/leviud.png'),
      description: 'Hormonal IUD, long-acting',
    },
  ];

  // Sort by MEC category (safest first) and add color
  // Sort by MEC category (safest first) AND Preference Match (highest first)
  const contraceptives = useMemo(() => {
    if (!mecResults) {
      return baseContraceptives.map(c => ({
        ...c,
        mecCategory: 1 as MECCategory,
        color: getMECColor(1),
        matchScore: calculateMatchScore(c.mecKey, prefs || [])
      })).sort((a, b) => b.matchScore - a.matchScore);
    }

    return baseContraceptives
      .map(c => ({
        ...c,
        mecCategory: mecResults[c.mecKey] as MECCategory,
        color: getMECColor(mecResults[c.mecKey]),
        matchScore: calculateMatchScore(c.mecKey, prefs || [])
      }))
      .sort((a, b) => {
        // 1. Primary Sort: Safety (MEC Category Ascending: 1 is best)
        if (a.mecCategory !== b.mecCategory) {
          return a.mecCategory - b.mecCategory;
        }
        // 2. Secondary Sort: Preference Match (Score Descending: 100% is best)
        return b.matchScore - a.matchScore;
      });
  }, [mecResults, prefs]);

  const [selected, setSelected] = useState(contraceptives[0]);

  const nextMethod = () => {
    const currentIndex = contraceptives.findIndex((c) => c.name === selected.name);
    if (currentIndex < contraceptives.length - 1) setSelected(contraceptives[currentIndex + 1]);
  };

  const prevMethod = () => {
    const currentIndex = contraceptives.findIndex((c) => c.name === selected.name);
    if (currentIndex > 0) setSelected(contraceptives[currentIndex - 1]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.containerOne}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 90 }}
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
            <Ionicons name="menu" size={35} color={'#000'} />
          </TouchableOpacity>
          <Text style={styles.headerText}>Recommendations</Text>
          <View style={{ width: 35 }} />
        </View>

        {/* Display Selected Age */}
        <View style={{ alignItems: 'center', marginBottom: 10 }}>
          <Text style={{ fontSize: 16, color: '#E45A92', fontWeight: 'bold' }}>
            Selected Age: {ageLabel || 'N/A'}
          </Text>
        </View>

        <View style={styles.mainCircleWrapper}>
          <TouchableOpacity onPress={prevMethod} style={styles.sideButton}>
            <Ionicons name="chevron-back" size={28} color="#555" />
          </TouchableOpacity>

          <View style={[styles.mainCircle, { borderColor: selected.color }]}>
            <Image source={selected.image} style={styles.mainImage} />
          </View>

          <TouchableOpacity onPress={nextMethod} style={styles.sideButton}>
            <Ionicons name="chevron-forward" size={28} color="#555" />
          </TouchableOpacity>
        </View>

        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{selected.name}</Text>
          <Text style={styles.preferencesText}>
            <Text style={{ fontStyle: 'italic' }}>{selected.description}</Text>
          </Text>
          {/* MEC Category Badge */}
          <View style={[styles.mecBadge, { backgroundColor: selected.color }]}>
            <Text style={styles.mecBadgeText}>{getMECLabel(selected.mecCategory)}</Text>
          </View>

          {/* Match Score Badge (Secondary) */}
          {(selected as any).matchScore > 0 && (
            <View style={styles.matchBadge}>
              <Ionicons name="thumbs-up" size={12} color="#fff" style={{ marginRight: 4 }} />
              <Text style={styles.matchBadgeText}>{(selected as any).matchScore}% Match</Text>
            </View>
          )}
        </View>

        {/* CONSULT WITH DOCTOR BUTTON */}
        <TouchableOpacity
          style={styles.consultButton}
          onPress={() => {
            const preFilledData = {
              AGE: ageValue ? ageValue.toString() : '25',
              prefs: prefs || []
            };
            navigation.navigate('GuestAssessment', { preFilledData });
          }}
        >
          <Text style={styles.consultButtonText}>Consult with Doctor (Start Intake)</Text>
          <Ionicons name="arrow-forward-circle" size={24} color="#fff" style={{ marginLeft: 8 }} />
        </TouchableOpacity>

        <View style={styles.listContainer}>
          {contraceptives.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.listItem,
                selected.name === item.name && styles.listItemSelected,
              ]}
              onPress={() => setSelected(item)}
            >
              <Image source={item.image} style={styles.listImage} />
              <Text style={styles.listText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ViewRecom;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerOne: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  menuButton: {
    padding: 5,
  },
  headerText: {
    fontSize: 21,
    fontWeight: '600',
    textAlign: 'center',
  },
  mainCircleWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  sideButton: {
    backgroundColor: '#D9D9D9',
    padding: 10,
    borderRadius: 8,
  },
  mainCircle: {
    height: 160,
    width: 160,
    borderRadius: 80,
    borderWidth: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 25,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  mainImage: {
    height: 80,
    width: 80,
    resizeMode: 'contain',
  },
  deviceInfo: {
    alignItems: 'center',
    marginTop: 15,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
  },
  preferencesText: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  addNotesButton: {
    alignSelf: 'center',
    backgroundColor: '#4A90E2',
    height: 55,
    width: 55,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },
  listContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  listItemSelected: {
    backgroundColor: '#E8F0FF',
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  listImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    marginRight: 15,
  },
  listText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  consultButton: {
    backgroundColor: '#E45A92',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginTop: 20,
    paddingVertical: 15,
    borderRadius: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
  },
  consultButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mecBadge: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'center',
  },
  mecBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  matchBadge: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
  },
  matchBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
