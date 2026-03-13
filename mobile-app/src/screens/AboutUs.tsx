import React, { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  BookCheck,
  ChevronDown,
  ChevronUp,
  Shield,
  Sparkles,
  Target,
} from 'lucide-react-native';
import { colors } from '../theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type AboutItem = {
  id: number;
  title: string;
  content: string;
  icon: 'target' | 'book' | 'shield' | 'sparkles';
};

const ABOUT_ITEMS: AboutItem[] = [
  {
    id: 1,
    title: 'Why ContraceptIQ?',
    content:
      'ContraceptIQ was developed to support informed and evidence-based contraceptive decision-making through a clear and accessible mobile experience.',
    icon: 'target',
  },
  {
    id: 2,
    title: 'Medical Accuracy',
    content:
      'All educational content is aligned with the World Health Organization Family Planning Handbook and reviewed for accuracy and relevance.',
    icon: 'book',
  },
  {
    id: 3,
    title: 'Privacy First',
    content:
      'ContraceptIQ is designed to protect user confidentiality through responsible data handling and secure system practices.',
    icon: 'shield',
  },
  {
    id: 4,
    title: 'User Empowerment',
    content:
      'The application aims to empower users with understandable, evidence-based information so they can make confident reproductive health decisions.',
    icon: 'sparkles',
  },
];

const AboutUs = ({ navigation, route }: any) => {
  const insets = useSafeAreaInsets();
  const [openId, setOpenId] = useState<number | null>(1);
  const isObView = route?.name === 'ObAbout';

  const toggleItem = (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId((prev) => (prev === id ? null : id));
  };

  const renderIcon = (icon: AboutItem['icon']) => {
    if (icon === 'target') return <Target size={18} color={colors.primary} />;
    if (icon === 'book') return <BookCheck size={18} color={colors.primary} />;
    if (icon === 'shield') return <Shield size={18} color={colors.primary} />;
    return <Sparkles size={18} color={colors.primary} />;
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {isObView ? (
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}> 
          <TouchableOpacity onPress={() => navigation.navigate('ObProfile')} style={styles.menuButton}>
            <View style={styles.menuButtonSolid}>
              <Ionicons name="chevron-back" size={24} color="#FFF" />
            </View>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerText}>About ContraceptIQ</Text>
          </View>
        </View>
      ) : (
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}> 
          <TouchableOpacity onPress={() => (navigation as any).toggleDrawer()} style={styles.menuButton}>
            <View style={styles.menuButtonSolid}>
              <Ionicons name="menu" size={24} color="#FFF" />
            </View>
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerText}>About ContraceptIQ</Text>
          </View>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.brandCard}>
          <View style={styles.brandMark}>
            <Ionicons name="heart" size={22} color={colors.primary} />
          </View>
          <View style={styles.brandCopy}>
            <Text style={styles.brandTitle}>ContraceptIQ</Text>
            <Text style={styles.brandSubtitle}>Evidence-based contraceptive guidance, designed for clarity.</Text>
          </View>
        </View>

        <View style={styles.accordionList}>
          {ABOUT_ITEMS.map((item, index) => {
            const isOpen = openId === item.id;

            return (
              <View key={item.id} style={[styles.accordionCard, isOpen && styles.accordionCardOpen]}>
                <TouchableOpacity
                  style={styles.accordionHeader}
                  activeOpacity={0.85}
                  onPress={() => toggleItem(item.id)}
                >
                  <View style={styles.leftSection}>
                    <View style={styles.iconChip}>{renderIcon(item.icon)}</View>
                    <Text style={[styles.itemTitle, isOpen && styles.itemTitleOpen]}>{item.title}</Text>
                  </View>
                    {isOpen ? <ChevronUp size={18} color={colors.primary} /> : <ChevronDown size={20} color="#64748B" />}
                
                </TouchableOpacity>

                {isOpen ? (
                  <View style={styles.answerWrap}>
                    <Text style={styles.answerText}>{item.content}</Text>

                    {item.id === 2 ? (
                      <View style={styles.whoBadge}>
                        <Ionicons name="ribbon-outline" size={14} color="#1D4ED8" />
                        <Text style={styles.whoBadgeText}>WHO Family Planning Handbook reference</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        <View style={styles.bannerCard}>
          <Sparkles size={18} color="#166534" />
          <Text style={styles.bannerText}>You deserve clear, trusted information to make confident reproductive health decisions.</Text>
        </View>

        <View style={{ height: 34 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default AboutUs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAF9',
  },
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
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    overflow: 'hidden',
  },
  menuButtonSolid: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    marginLeft: 15,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scrollContent: {
    padding: 18,
    paddingTop: 20,
  },
  brandCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FBCFE8',
    borderRadius: 15,
    padding: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandMark: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FDF2F8',
    borderWidth: 1,
    borderColor: '#FBCFE8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  brandCopy: {
    flex: 1,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text.primary,
    marginBottom: 2,
  },
  brandSubtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
  },
  accordionList: {
    gap: 10,
  },
  accordionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  accordionCardOpen: {
    borderColor: '#FBCFE8',
    backgroundColor: '#FFFBFD',
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 10,
  },
  iconChip: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#FDF2F8',
    borderWidth: 1,
    borderColor: '#FBCFE8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  itemTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
  },
  itemTitleOpen: {
    color: colors.primary,
  },
  answerWrap: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 2,
  },
  answerText: {
    fontSize: 15,
    lineHeight: 22,
    color: '#475569',
  },
  whoBadge: {
    marginTop: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
  },
  whoBadgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  bannerCard: {
    marginTop: 16,
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#166534',
    fontWeight: '600',
  },
});
