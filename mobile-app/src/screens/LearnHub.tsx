import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ChevronRight,
  Tablet,
  Shield,
  Syringe,
  Calendar,
  AlertTriangle,
  Activity,
  Heart,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, shadows } from '../theme';

const LEARN_DATA = [
  { id: 'pill', title: 'The Pill', subtitle: 'How it works & daily routines.', icon: Tablet, color: '#E45A92' },
  { id: 'iud-implant', title: 'IUDs & Implants', subtitle: 'Long-term, low-maintenance options.', icon: Shield, color: '#8B5CF6' },
  { id: 'shot-patch', title: 'The Shot & Patch', subtitle: 'Understanding non-daily methods.', icon: Syringe, color: '#3B82F6' },
  { id: 'natural', title: 'Natural Planning', subtitle: 'Tracking fertility and cycles.', icon: Calendar, color: '#10B981' },
  { id: 'emergency', title: 'Emergency Options', subtitle: "What to do when things don't go to plan.", icon: AlertTriangle, color: '#F59E0B' },
  { id: 'side-effects', title: 'Side Effects', subtitle: 'What is normal and what to watch for.', icon: Activity, color: '#F43F5E' },
];

const CONTENT_DATA: Record<string, any> = {
  pill: {
    sections: [
      {
        title: 'How it works',
        icon: Heart,
        iconColor: '#E45A92',
        iconBg: '#FCE7F3',
        description:
          'Combined oral contraceptives contain estrogen and progestin, hormones similar to those naturally produced in the body. These methods work primarily by preventing the release of an egg from the ovaries, thereby stopping ovulation. They also thicken cervical mucus and alter the uterine lining, which further reduces the chance of pregnancy.',
      },
      {
        title: 'Daily Routines',
        icon: Clock,
        iconColor: '#3B82F6',
        iconBg: '#DBEAFE',
        description:
          'For best effectiveness, the pill should be taken every day and each new pack should be started on time. Missing pills or starting packs late increases the risk of pregnancy. Users should take a missed pill as soon as possible and continue the remaining pills as directed.',
        hasToggle: true,
      },
    ],
  },
  'iud-implant': {
    sections: [
      {
        title: 'Long-term, Low-maintenance Options',
        icon: Shield,
        iconColor: '#8B5CF6',
        iconBg: '#EDE9FE',
        description:
          'Intrauterine devices and contraceptive implants are considered highly effective long-acting reversible contraceptives. After insertion by a trained provider, these methods provide continuous protection for several years and require little ongoing effort from the user. Fertility typically returns quickly after removal.',
        badges: ['Low Maintenance', 'Long-term Protection', 'Highly Effective'],
      },
    ],
  },
  'shot-patch': {
    sections: [
      {
        title: 'Understanding Non-daily Methods',
        icon: Syringe,
        iconColor: '#3B82F6',
        iconBg: '#DBEAFE',
        description:
          'Injectable contraceptives are progestin injections given at regular intervals, commonly every three months, to prevent ovulation. Other combined hormonal methods such as the patch or vaginal ring deliver hormones without requiring daily pills. Users must follow the recommended schedule to maintain effectiveness.',
        badges: ['Every 3 months'],
      },
    ],
  },
  natural: {
    sections: [
      {
        title: 'Track Fertility Cycles',
        icon: Calendar,
        iconColor: '#10B981',
        iconBg: '#D1FAE5',
        description:
          'Fertility awareness methods involve identifying the fertile days of the menstrual cycle and avoiding unprotected intercourse during that time. These methods require careful tracking, consistent daily monitoring, and cooperation with a partner. WHO notes they are generally less effective than modern contraceptive methods.',
        badges: ['Cycle Tracking', 'Partner Cooperation Required'],
      },
    ],
  },
  emergency: {
    sections: [
      {
        title: 'What to do when things do not go to plan',
        icon: AlertTriangle,
        iconColor: '#F59E0B',
        iconBg: '#FEF3C7',
        description:
          'Emergency contraception can help prevent pregnancy after unprotected sex or contraceptive failure. It is intended for occasional use in situations such as missed pills, condom breakage, or when no method was used.',
        isBanner: true,
        bannerTitle: 'Act quickly',
        badges: ['Occasional Use Only', 'Not for Regular Use'],
      },
    ],
  },
  'side-effects': {
    sections: [
      {
        title: 'What is normal',
        icon: Info,
        iconColor: '#F43F5E',
        iconBg: '#FECACA',
        description:
          'Users of hormonal contraceptives commonly experience changes in bleeding patterns, headaches, nausea, or breast tenderness. According to WHO, most bleeding changes are normal and not harmful, especially during the first few months of use.',
      },
      {
        title: 'What to watch for',
        icon: AlertCircle,
        iconColor: '#DC2626',
        iconBg: '#FEE2E2',
        description:
          'Users should seek medical care if they experience severe abdominal pain, unusually heavy bleeding, or symptoms suggestive of a blood clot. Serious complications are rare but require prompt evaluation.',
        isUrgent: true,
      },
    ],
  },
};

const LearnHub = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();

  const renderArticleRow = (item: any) => (
    <TouchableOpacity key={item.id} style={styles.rowCard} onPress={() => navigation.navigate('LearnHubDetail', { item })}>
      <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
        <item.icon size={22} color={item.color} strokeWidth={2.5} />
      </View>
      <View style={styles.textContainer}>
        <Text style={styles.rowTitle}>{item.title}</Text>
        <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
      </View>
      <ChevronRight size={20} color="#CBD5E1" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}> 
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <View style={styles.menuButtonSolid}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </View>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerText}>Guide to Birth Control</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100).duration(500).withInitialValues({ opacity: 1 })} style={styles.introCard}>
          <View style={styles.introCardHeader}>
            <View style={[styles.introIconBox, { backgroundColor: '#E0E7FF' }]}>
              <Ionicons name="information-circle" size={22} color="#6366F1" />
            </View>
            <Text style={styles.introCardTitle}>Understanding Birth Control</Text>
          </View>
          <Text style={styles.introCardText}>
            Birth control methods differ in effectiveness, duration of protection, and the way they are used. The WHO Family Planning Handbook provides practical guidance on more than twenty family planning methods to help clients choose and use contraception safely and effectively.
          </Text>
        </Animated.View>

        <View style={styles.introContainer}>
          <Text style={styles.introTitle}>Explore Topics</Text>
          <Text style={styles.introSubtitle}>Learn about different contraception methods.</Text>
        </View>

        <View style={styles.listContainer}>{LEARN_DATA.map(renderArticleRow)}</View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

export const LearnHubDetail = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const { item } = route.params;
  const content = CONTENT_DATA[item.id];
  const [reminderEnabled, setReminderEnabled] = useState(false);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}> 
        <TouchableOpacity onPress={() => navigation.navigate('LearnHub')} style={styles.backButton}>
          <View style={styles.menuButtonSolid}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </View>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerText}>{item.title}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {content?.sections?.map((section: any, index: number) => (
          <Animated.View key={index} entering={FadeInDown.delay(index * 100).duration(350).withInitialValues({ opacity: 1 })} style={[styles.infoCard, section.isUrgent && styles.urgentCard]}> 
            <View style={styles.infoCardHeader}>
              <View style={[styles.infoIconBox, { backgroundColor: section.iconBg }]}>
                <section.icon size={18} color={section.iconColor} />
              </View>
              <Text style={[styles.infoCardTitle, section.isUrgent && { color: '#DC2626' }]}>{section.isBanner ? section.bannerTitle : section.title}</Text>
            </View>
            <Text style={styles.infoCardText}>{section.description}</Text>

            {section.hasToggle && (
              <View style={styles.reminderToggle}>
                <Text style={styles.reminderText}>Daily Reminder</Text>
                <Switch
                  value={reminderEnabled}
                  onValueChange={setReminderEnabled}
                  trackColor={{ false: '#E2E8F0', true: item.color + '50' }}
                  thumbColor={reminderEnabled ? item.color : '#F1F5F9'}
                />
              </View>
            )}

            {section.badges && (
              <View style={styles.badgeContainer}>
                {section.badges.map((badge: string, idx: number) => (
                  <View key={idx} style={[styles.badge, { backgroundColor: item.color + '15' }]}>
                    <CheckCircle size={14} color={item.color} />
                    <Text style={[styles.badgeText, { color: item.color }]}>{badge}</Text>
                  </View>
                ))}
              </View>
            )}
          </Animated.View>
        ))}
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

export default LearnHub;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  backButton: { width: 44, height: 44, borderRadius: 14, overflow: 'hidden' },
  menuButtonSolid: { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
  titleContainer: { marginLeft: 15 },
  headerText: { fontSize: 22, fontWeight: 'bold', color: '#FFF' },
  scrollContent: { paddingTop: 20, paddingHorizontal: 16 },
  introCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 20, ...shadows.md, borderWidth: 1, borderColor: '#E0E7FF' },
  introCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  introIconBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  introCardTitle: { fontSize: 19, fontWeight: '700', color: '#1F2937', flex: 1 },
  introCardText: { fontSize: 16, color: '#64748B', lineHeight: 24 },
  introContainer: { paddingHorizontal: 4, marginBottom: 20 },
  introTitle: { fontSize: 19, fontWeight: '700', color: '#1F2937', marginBottom: 4 },
  introSubtitle: { fontSize: 15, color: '#64748B' },
  listContainer: { paddingHorizontal: 0 },
  rowCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, ...shadows.sm, borderWidth: 1, borderColor: '#F1F5F9' },
  iconContainer: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  textContainer: { flex: 1 },
  rowTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginBottom: 2 },
  rowSubtitle: { fontSize: 15, color: '#64748B' },
  infoCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, marginBottom: 12, ...shadows.sm, borderWidth: 1, borderColor: '#F1F5F9' },
  urgentCard: { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  infoIconBox: { width: 40, height: 40, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  infoCardTitle: { fontSize: 17, fontWeight: '700', color: '#1F2937' },
  infoCardText: { fontSize: 15.5, color: '#64748B', lineHeight: 21 },
  reminderToggle: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  reminderText: { fontSize: 15, color: '#636E72', fontWeight: '500' },
  badgeContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  badge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 16, gap: 4 },
  badgeText: { fontSize: 13, fontWeight: '600' },
});
