import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { colors, shadows } from '../theme';

const WhatIsContraception = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <View style={styles.menuButtonSolid}>
            <Ionicons name="chevron-back" size={24} color="#FFF" />
          </View>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerText}>What is Contraception?</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={styles.mainCard}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, { backgroundColor: '#E0E7FF' }]}>
              <Ionicons name="heart" size={24} color="#6366F1" />
            </View>
            <Text style={styles.cardTitle}>Understanding Contraception</Text>
          </View>
          <Text style={styles.cardDescription}>
            Contraception refers to the use of methods or devices to prevent pregnancy. Family planning services enable individuals and couples to decide whether and when to have children and how many children to have.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).duration(400)} style={styles.quoteCard}>
          <View style={styles.quoteHeader}>
            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
            <Text style={styles.quoteTitle}>Why It Matters</Text>
          </View>
          <Text style={styles.quoteText}>
            According to the World Health Organization, access to effective contraception supports reproductive rights and contributes to improved health and social outcomes for individuals and families.
          </Text>
          <View style={styles.whoBadge}>
            <Text style={styles.whoText}>WHO</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(260).duration(400)}>
          <TouchableOpacity style={styles.learnMoreCard} onPress={() => navigation.navigate('LearnHub')} activeOpacity={0.8}>
            <View style={styles.learnMoreContent}>
              <View style={[styles.learnMoreIcon, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="book" size={22} color="#16A34A" />
              </View>
              <View style={styles.learnMoreText}>
                <Text style={styles.learnMoreTitle}>Learn More</Text>
                <Text style={styles.learnMoreSubtitle}>Explore different birth control methods</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#16A34A" />
          </TouchableOpacity>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

export default WhatIsContraception;

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
  headerText: { fontSize: 20, fontWeight: 'bold', color: '#FFF' },
  scrollContent: { padding: 16 },
  mainCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 20, marginBottom: 16, ...shadows.sm, borderWidth: 1, borderColor: '#E0E7FF' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', flex: 1 },
  cardDescription: { fontSize: 15, color: '#64748B', lineHeight: 24 },
  quoteCard: { backgroundColor: '#F0FDF4', borderRadius: 20, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: '#BBF7D0' },
  quoteHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  quoteTitle: { fontSize: 16, fontWeight: '700', color: '#166534' },
  quoteText: { fontSize: 14, color: '#15803D', lineHeight: 22, fontStyle: 'italic' },
  whoBadge: { alignSelf: 'flex-end', backgroundColor: '#16A34A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginTop: 12 },
  whoText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  learnMoreCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', ...shadows.sm, borderWidth: 1, borderColor: '#DCFCE7' },
  learnMoreContent: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  learnMoreIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  learnMoreText: { flex: 1 },
  learnMoreTitle: { fontSize: 15, fontWeight: '700', color: '#166534' },
  learnMoreSubtitle: { fontSize: 13, color: '#15803D', marginTop: 2 },
});
