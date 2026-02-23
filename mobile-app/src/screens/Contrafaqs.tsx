import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronDown, ChevronUp, Info } from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { colors } from '../theme';

// Types
type FaqItem = {
  id: number;
  question: string;
  answer: string;
};

// FAQ Data
const faqs: FaqItem[] = [
  {
    id: 1,
    question: "How effective is the pill if I miss a dose?",
    answer: "If you miss one pill, take it as soon as you remember, even if it means taking two in one day. The pill is still effective. If you miss two or more pills, use a backup method (like condoms) for 7 days.",
  },
  {
    id: 2,
    question: "Can antibiotics interfere?",
    answer: "Most common antibiotics do not decrease the effectiveness of birth control pills. The only exception is Rifampin (used for tuberculosis), which can lower hormone levels. Always inform your doctor about your medications.",
  },
  {
    id: 3,
    question: "What are LARCs?",
    answer: "LARCs stand for Long-Acting Reversible Contraceptives, such as IUDs (hormonal or copper) and the implant. They are the most effective reversible methods, with failure rates less than 1%, and last for several years.",
  },
  {
    id: 4,
    question: "How soon does it start working?",
    answer: "If starting within 5 days of your period's start, it is effective immediately. If started at any other time, use a backup method (like condoms) for the first 7 days to ensure full protection.",
  },
  {
    id: 5,
    question: "Does it protect against STIs?",
    answer: "No, hormonal birth control (pills, patches, rings, IUDs) and copper IUDs do NOT protect against Sexually Transmitted Infections. Only barrier methods like condoms provide STI protection.",
  },
  {
    id: 6,
    question: "Common side effects?",
    answer: "Common side effects include spotting between periods, mild nausea, breast tenderness, or slight headaches. These are usually temporary and subside after the first few months of use.",
  },
  {
    id: 7,
    question: "Plan B vs Abortion pill?",
    answer: "Plan B (Emergency Contraception) prevents a pregnancy from occurring by delaying ovulation. It does not terminate an existing pregnancy. The abortion pill (Mifepristone/Misoprostol) is a medical treatment to end a confirmed pregnancy.",
  },
  {
    id: 8,
    question: "Can I skip my period?",
    answer: "Yes, with monophasic pills, you can continuously take active pills and skip the placebo (sugar) pills to safely skip your period. Consult your healthcare provider for the best approach for your body.",
  },
  {
    id: 9,
    question: "Impact on future fertility?",
    answer: "Birth control does not negatively impact your long-term fertility. After stopping the pill, patch, or removing an IUD/implant, fertility usually returns rapidly, often within the first month.",
  },
  {
    id: 10,
    question: "What if IUD strings feel different?",
    answer: "If you cannot feel your IUD strings, or if they feel longer/shorter or you feel the hard plastic of the IUD, do not attempt to adjust it. Use a backup method and contact your healthcare provider for a check-up.",
  }
];

const FaqItemComponent = ({
  item,
  isOpen,
  onToggle
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  return (
    <View style={[styles.faqCard, isOpen && styles.faqCardOpen]}>
      <TouchableOpacity
        style={styles.faqHeader}
        onPress={onToggle}
        activeOpacity={0.7}
      >
        <Text style={[styles.questionText, isOpen && styles.questionTextOpen]}>
          {item.question}
        </Text>
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
          <Text style={styles.answerText}>{item.answer}</Text>
        </View>
      )}
    </View>
  );
};

const ContraFAQs = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const [openId, setOpenId] = useState<number | null>(null);

  const handleToggle = (id: number) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {/* Header */}
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
          <Text style={styles.headerTagline}>Frequently Asked</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.subtitle}>
          Find answers to common questions about birth control methods, effectiveness, and side effects.
        </Text>

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

        {/* Medical Disclaimer */}
        <View style={styles.disclaimerContainer}>
          <View style={styles.disclaimerHeader}>
            <Info size={20} color="#3B82F6" />
            <Text style={styles.disclaimerTitle}>Medical Disclaimer</Text>
          </View>
          <Text style={styles.disclaimerText}>
            The information provided here is for educational purposes only and does not substitute professional medical advice. Always consult your healthcare provider or OB-GYN for personalized medical recommendations.
          </Text>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default ContraFAQs;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // Light gray background
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
  },
  headerTagline: {
    fontSize: 14,
    color: '#FFDBEB',
    fontStyle: 'italic',
    marginTop: 4,
  },
  scrollContent: {
    padding: 20,
    paddingTop: 24,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
    marginBottom: 24,
  },
  faqList: {
    gap: 12,
    marginBottom: 32,
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
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  questionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    paddingRight: 16,
    lineHeight: 22,
  },
  questionTextOpen: {
    color: '#E45A92',
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
  },
  answerText: {
    fontSize: 14.5,
    lineHeight: 22,
    color: '#4B5563',
  },
  disclaimerContainer: {
    backgroundColor: '#EFF6FF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  disclaimerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  disclaimerText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#3B82F6',
  }
});