import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native'
import React from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { UserTabScreenProps, ObTabScreenProps, DrawerScreenProps } from '../types/navigation';
import ObHeader from '../components/ObHeader';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';

type Props = UserTabScreenProps<'Contraceptive Methods'> | ObTabScreenProps<'ObMethods'> | DrawerScreenProps<'Contraceptive Methods'>;

interface MethodItem {
  id: string;
  name: string;
  shortName: string;
  description: string;
  effectiveness: string;
  perfectEffectiveness: string;
  icon: string;
  illustration: any;
  color: string;
  iconFamily: 'Ionicons' | 'MaterialCommunityIcons';
}

const Contraceptivemethods: React.FC<Props> = ({ route }) => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { isDoctorAssessment } = (route?.params as any) || {};

  const methods: MethodItem[] = [
    {
      id: 'chc',
      name: 'Combined Hormonal (CHC)',
      shortName: 'The Pill, Patch, or Ring',
      description: 'Contains both estrogen and progestin.',
      effectiveness: '91% Effective',
      perfectEffectiveness: '>99%',
      icon: 'pill',
      iconFamily: 'MaterialCommunityIcons',
      illustration: require('../../assets/image/patchh.png'),
      color: '#4A90E2',
    },
    {
      id: 'pop',
      name: 'Progestin-Only Pill (POP)',
      shortName: 'Daily mini-pill',
      description: 'Hormone-free of estrogen; daily use.',
      effectiveness: '91% Effective',
      perfectEffectiveness: '>99%',
      icon: 'pill',
      iconFamily: 'MaterialCommunityIcons',
      illustration: require('../../assets/image/pillss.png'),
      color: '#E45A92',
    },
    {
      id: 'implant',
      name: 'Implants (LARC)',
      shortName: 'Subdermal Implant',
      description: 'Small rod under skin; lasts 3 years.',
      effectiveness: '>99% Effective',
      perfectEffectiveness: '>99%',
      icon: 'ellipsis-horizontal-circle',
      iconFamily: 'Ionicons',
      illustration: require('../../assets/image/implantt.png'),
      color: '#2E8B57',
    },
    {
      id: 'cu-iud',
      name: 'Copper IUD (Cu-IUD)',
      shortName: 'Non-hormonal IUD',
      description: 'Long-term protection (10 years).',
      effectiveness: '>99% Effective',
      perfectEffectiveness: '>99%',
      icon: 'git-commit-outline',
      iconFamily: 'Ionicons',
      illustration: require('../../assets/image/copperiud.png'),
      color: '#D4AF37',
    },
    {
      id: 'lng-ius',
      name: 'Hormonal IUD (LNG-IUS)',
      shortName: 'Levonorgestrel Device',
      description: 'Hormone delivery device (3-8 years).',
      effectiveness: '>99% Effective',
      perfectEffectiveness: '>99%',
      icon: 'shield-checkmark-outline',
      iconFamily: 'Ionicons',
      illustration: require('../../assets/image/leviud.png'),
      color: '#8E44AD',
    },
    {
      id: 'dmpa',
      name: 'Injectable Contraceptives',
      shortName: 'The Shot (DMPA)',
      description: 'Injection given every 3 months.',
      effectiveness: '94% Effective',
      perfectEffectiveness: '>99%',
      icon: 'flask-outline',
      iconFamily: 'Ionicons',
      illustration: require('../../assets/image/injectables.png'),
      color: '#EC6F5F',
    },
  ];

  return (
    <View style={styles.safeArea}>
      {!isDoctorAssessment && (
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
          <TouchableOpacity onPress={() => (navigation as any).toggleDrawer()} style={styles.menuButton}>
            <LinearGradient
              colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)']}
              style={styles.gradient}
            >
              <Ionicons name="menu" size={24} color="#FFF" />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerAppTitle}>ContraceptIQ</Text>
            <Text style={styles.headerTagline}>Methods</Text>
          </View>
        </View>
      )}

      {isDoctorAssessment && <ObHeader title="Methods" subtitle="Contraceptives" />}

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.screenHeading}>Explore Contraceptive Options</Text>
        <Text style={styles.screenSubheading}>Find the right methods for you</Text>

        {methods.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.methodCard}
            activeOpacity={0.9}
            onPress={() => (navigation as any).navigate('MethodDetail', { methodId: item.id as any })}
          >
            <View style={styles.cardContent}>
              <View style={styles.textContainer}>
                <View style={[styles.miniIconContainer, { backgroundColor: item.color + '20' }]}>
                  {item.iconFamily === 'Ionicons' ? (
                    <Ionicons name={item.icon as any} size={18} color={item.color} />
                  ) : (
                    <MaterialCommunityIcons name={item.icon as any} size={18} color={item.color} />
                  )}
                </View>
                <Text style={styles.methodName}>{item.name}</Text>
                <Text style={styles.methodShortName}>{item.shortName}</Text>

                <View style={styles.statsContainer}>
                  <View style={styles.statRow}>
                    <Ionicons name="people-outline" size={14} color="#666" />
                    <Text style={styles.statText}>{item.effectiveness}</Text>
                  </View>
                  <View style={styles.statRow}>
                    <MaterialCommunityIcons name="shield-check-outline" size={14} color="#666" />
                    <Text style={styles.statText}>{item.perfectEffectiveness} Perfect</Text>
                  </View>
                </View>
              </View>

              <View style={styles.illustrationContainer}>
                <Image source={item.illustration} style={styles.illustration} />
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.8)']}
                  style={styles.illustrationOverlay}
                />
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>


    </View>
  )
}

export default Contraceptivemethods

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.md,
  },
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    marginLeft: 15,
  },
  headerAppTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFDBEB',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerTagline: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  screenHeading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 5,
  },
  screenSubheading: {
    fontSize: 16,
    color: '#636E72',
    marginBottom: 20,
    fontStyle: 'italic',
  },
  methodCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 15,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    ...shadows.sm,
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textContainer: {
    flex: 1,
    paddingRight: 10,
  },
  miniIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  methodName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2D3436',
    marginBottom: 2,
  },
  methodShortName: {
    fontSize: 13,
    color: '#636E72',
    marginBottom: 12,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 5,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#636E72',
  },
  illustrationContainer: {
    width: 100,
    height: 100,
    backgroundColor: '#F1F8F6',
    borderRadius: 15,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustration: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
  },
  illustrationOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 30,
  },

})