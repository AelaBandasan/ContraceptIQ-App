import React, { useState } from 'react';
import {
  Alert,
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
import { ChevronDown, ChevronUp, Info } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { colors } from '../theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type FaqItem = {
  id: number;
  question: string;
  answer: string;
  badge?: string;
  iconName: string;
};

const faqs: FaqItem[] = [
  {
    id: 1,
    question: 'How effective is the pill if I miss a dose?',
    answer:
      'The effectiveness of oral contraceptive pills decreases when pills are missed or when a new pack is started late. The risk of pregnancy is highest when multiple pills are missed, particularly near the beginning or end of the pill pack.',
    iconName: 'medkit-outline',
  },
  {
    id: 2,
    question: 'Can antibiotics interfere?',
    answer:
      'Most commonly used antibiotics do not reduce the effectiveness of hormonal contraceptives. However, certain medications such as rifampicin and rifabutin can make combined oral contraceptives less effective and backup contraception may be needed.',
    iconName: 'flask-outline',
  },
  {
    id: 3,
    question: 'What are LARCs?',
    answer:
      'Long-acting reversible contraceptives, or LARCs, refer to contraceptive implants and intrauterine devices that provide highly effective, long-term pregnancy prevention. These methods require placement by a trained provider and fertility typically returns quickly after removal.',
    badge: 'Low maintenance',
    iconName: 'shield-checkmark-outline',
  },
  {
    id: 4,
    question: 'How soon does it start working?',
    answer:
      'The time required for a contraceptive method to become effective depends on the method and when it is started in the menstrual cycle. Some methods provide immediate protection, while others require temporary backup protection.',
    iconName: 'time-outline',
  },
  {
    id: 5,
    question: 'Does it protect against STIs?',
    answer:
      'Hormonal contraceptives and intrauterine devices do not protect against sexually transmitted infections. The WHO handbook emphasizes that condoms should be used when STI or HIV protection is needed.',
    iconName: 'shield-outline',
  },
  {
    id: 6,
    question: 'Common side effects?',
    answer:
      'Common side effects include changes in bleeding patterns, headaches, nausea, dizziness, and breast tenderness. These effects are usually mild and often improve after the first few months of use.',
    iconName: 'pulse-outline',
  },
  {
    id: 7,
    question: 'Can I skip my period?',
    answer:
      'Some hormonal contraceptive regimens may result in lighter, infrequent, or absent monthly bleeding. According to WHO guidance, these bleeding changes are common and generally not harmful.',
    iconName: 'calendar-outline',
  },
  {
    id: 8,
    question: 'Impact on future fertility?',
    answer:
      'Most contraceptive methods allow a rapid return to fertility after discontinuation. Injectable contraceptives may cause a temporary delay, but they do not cause permanent infertility.',
    iconName: 'leaf-outline',
  },
  {
    id: 9,
    question: 'What if IUD strings feel different?',
    answer:
      'If IUD strings feel shorter, longer, or cannot be felt, the user should consult a trained healthcare provider for evaluation to confirm proper placement.',
    iconName: 'alert-circle-outline',
  },
];

const FaqItemComponent = ({
  item,
  isOpen,
  onToggle,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  const renderAnswerContent = () => {
    if (item.id === 2) {
      return (
        <Text style={styles.answerText}>
          Most commonly used antibiotics do not reduce the effectiveness of hormonal contraceptives. However, certain medications such as{' '}
          <Text style={styles.boldText}>rifampicin</Text> and <Text style={styles.boldText}>rifabutin</Text> can make combined oral contraceptives less effective and backup contraception may be needed.
        </Text>
      );
    }

    return <Text style={styles.answerText}>{item.answer}</Text>;
  };

  return (
    <Animated.View entering={FadeInDown.delay(item.id * 45).duration(350)} style={[styles.faqCard, isOpen && styles.faqCardOpen]}>
      <TouchableOpacity
        style={styles.faqHeader}
        onPress={onToggle}
        activeOpacity={0.8}
      >
        <View style={styles.leftIconWrap}>
          <Ionicons name={item.iconName as any} size={18} color={colors.primary} />
        </View>

        <View style={styles.questionWrap}>
          <View style={styles.questionRow}>
            <Text style={[styles.questionText, isOpen && styles.questionTextOpen]}>
              {item.question}
            </Text>
          </View>
        </View>

        <View style={styles.iconContainer}>
          {isOpen ? (
            <ChevronUp size={20} color="#E45A92" />
          ) : (
            <ChevronDown size={20} color="#6B7280" />
          )}
        </View>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.answerContainer}>
          {renderAnswerContent()}

          {item.id === 1 ? (
            <TouchableOpacity
              style={styles.quickActionBtn}
              onPress={() => Alert.alert('Coming Soon', 'Missed pill guide will be added here.')}
            >
              <Ionicons name="flash-outline" size={18} color="#DB2777" />
              <Text style={styles.quickActionText}>Missed pill?</Text>
            </TouchableOpacity>
          ) : null}

          {item.id === 5 ? (
            <View style={styles.condomChip}>
              <Ionicons name="shield-checkmark-outline" size={18} color="#166534" />
              <Text style={styles.condomChipText}>Condom reminder: use condoms for STI/HIV protection</Text>
            </View>
          ) : null}

          {item.id === 7 ? (
            <Text style={styles.microcopyText}>Usually safe when using hormonal methods.</Text>
          ) : null}

          {item.id === 8 ? (
            <View style={styles.reassuranceRow}>
              <Ionicons name="checkmark-circle" size={18} color="#16A34A" />
              <Text style={styles.reassuranceText}>Most methods do not affect long-term fertility.</Text>
            </View>
          ) : null}

          {item.id === 9 ? (
            <TouchableOpacity
              style={styles.contactBtn}
              onPress={() => Alert.alert('Contact Provider', 'Please consult a trained healthcare provider.')}
            >
              <Ionicons name="call-outline" size={18} color="#FFFFFF" />
              <Text style={styles.contactBtnText}>Contact provider</Text>
            </TouchableOpacity>
          ) : null}

          {item.id === 4 ? (
            <View style={styles.inlineHintBottomRow}>
              <Ionicons name="time-outline" size={18} color="#2563EB" />
              <Text style={styles.inlineHintText}>Timing matters for full protection</Text>
            </View>
          ) : null}

          {item.badge ? (
            <View style={styles.badgeChipBottom}>
              <Text style={styles.badgeChipText}>{item.badge}</Text>
            </View>
          ) : null}
        </View>
      )}
    </Animated.View>
  );
};

const ContraFAQs = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [openId, setOpenId] = useState<number | null>(null);

  const handleToggle = (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId(openId === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}> 
        <TouchableOpacity onPress={() => (navigation as any).toggleDrawer()} style={styles.menuButton}>
          <View style={styles.menuButtonSolid}>
            <Ionicons name="menu" size={24} color="#FFF" />
          </View>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerText}>FAQs</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.faqList}>
          {faqs.map((faq) => (
            <FaqItemComponent
              key={faq.id}
              item={faq}
              isOpen={openId === faq.id}
              onToggle={() => handleToggle(faq.id)}
            />
          ))}
        </View>

        <Text style={styles.disclaimerText}>
          Medical Disclaimer: This FAQ content is provided for educational purposes only and does not replace consultation with a qualified healthcare professional.
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ContraFAQs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    width: 42,
    height: 42,
    borderRadius: 12,
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
  introCard: {
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  faqList: {
    gap: 8,
    marginBottom: 15,
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    overflow: 'hidden',
  },
  faqCardOpen: {
    borderColor: '#FBCFE8',
    backgroundColor: '#FFFBFD',
    shadowOpacity: 0.07,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  leftIconWrap: {
    width: 37,
    height: 37,
    borderRadius: 10,
    backgroundColor: '#FDF2F8',
    borderWidth: 1,
    borderColor: '#FBCFE8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  questionWrap: {
    flex: 1,
    paddingRight: 8,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    lineHeight: 22,
  },
  questionTextOpen: {
    color: colors.primary,
  },
  badgeChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#166534',
  },
  badgeChipBottom: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF3',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  inlineHintBottomRow: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlineHintText: {
    fontSize: 13,
    color: '#1D4ED8',
    fontWeight: '600',
  },
  iconContainer: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 2,
  },
  answerText: {
    fontSize: 14.5,
    lineHeight: 22,
    color: colors.text.secondary,
  },
  boldText: {
    fontWeight: '800',
    color: colors.text.primary,
  },
  quickActionBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#FDF2F8',
    borderColor: '#FBCFE8',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickActionText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '700',
  },
  condomChip: {
    marginTop: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  condomChipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: '#166534',
    fontWeight: '600',
  },
  microcopyText: {
    marginTop: 10,
    fontSize: 13,
    color: '#166534',
    fontWeight: '600',
    fontStyle: 'italic',
  },
  reassuranceRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reassuranceText: {
    fontSize: 13,
    color: '#166534',
    fontWeight: '600',
  },
  contactBtn: {
    marginTop: 12,
    alignSelf: 'flex-start',
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  disclaimerText: {
    fontSize: 14,
    lineHeight: 18,
    color: '#5E686D',
    textAlign: 'center',
    paddingHorizontal: 10,
  },
});
