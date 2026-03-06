import React from "react";
import {
  ScrollView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import type { DrawerScreenProps } from "@react-navigation/drawer";
import type { DrawerParamList } from "../types/navigation";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ShieldAlert, FileWarning } from "lucide-react-native";
import { colors } from "../theme";

export type PrivacyDisclaimerScreenProps = DrawerScreenProps<
  DrawerParamList,
  "PrivacyDisclaimer"
>;

const PrivacyDisclaimerScreen: React.FC<PrivacyDisclaimerScreenProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  void route;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      {/* Premium Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => (navigation as any).toggleDrawer()}
          style={styles.menuButton}
        >
          <View
            style={styles.menuButtonSolid}
          >
            <Ionicons name="menu" size={24} color="#FFF" />
          </View>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerText}>Privacy & Security</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <Text style={styles.pageDescription}>
          Please read this information carefully. It outlines how we handle your data and the limitations of our medical guidance.
        </Text>

        {/* Privacy Policy Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainerBlue}>
              <ShieldAlert size={24} color="#2563EB" />
            </View>
            <Text style={styles.sectionTitle}>Privacy Policy</Text>
          </View>

          <View style={styles.divider} />

          <Text style={styles.subheading}>Introduction</Text>
          <Text style={styles.paragraph}>
            ContraceptIQ is committed to protecting your privacy and handling
            your information responsibly. This notice explains what we collect,
            how we use it, and the safeguards we apply.
          </Text>

          <Text style={styles.subheading}>Information We Collect</Text>
          <Text style={styles.paragraph}>
            We may collect information you provide (such as account details and
            assessment inputs) and technical data (such as device type and app
            usage patterns) to improve your experience.
          </Text>

          <Text style={styles.subheading}>How We Use Your Information</Text>
          <Text style={styles.paragraph}>
            Information is used to deliver app features, personalize
            recommendations, maintain security, and meet legal or compliance
            obligations where applicable.
          </Text>

          <Text style={styles.subheading}>Data Storage and Security</Text>
          <Text style={styles.paragraph}>
            We use industry-standard safeguards to protect your data. No method
            is 100% secure, and we continuously review our controls to mitigate risk.
          </Text>

          <Text style={styles.subheading}>Data Sharing</Text>
          <Text style={styles.paragraph}>
            We do not sell your personal data. Limited sharing may occur with
            trusted providers to operate the service, subject to confidentiality
            and security obligations.
          </Text>

          <Text style={styles.subheading}>Contact Information</Text>
          <Text style={styles.paragraph}>
            Questions or requests can be sent to support@contraceptiq.com.
          </Text>
        </View>

        {/* Medical Disclaimer Card */}
        <View style={[styles.card, styles.disclaimerCard]}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainerOrange}>
              <FileWarning size={24} color="#D97706" />
            </View>
            <Text style={[styles.sectionTitle, { color: '#92400E' }]}>Medical Disclaimer</Text>
          </View>

          <View style={[styles.divider, { backgroundColor: '#FDE68A' }]} />

          <Text style={styles.subheading}>Not Medical Advice</Text>
          <Text style={styles.paragraph}>
            Content and outputs from this app are for informational purposes
            only and are not a substitute for professional medical advice,
            diagnosis, or treatment.
          </Text>

          <Text style={styles.subheading}>No Guarantee of Outcomes</Text>
          <Text style={styles.paragraph}>
            Outcomes and recommendations may vary. Always consult qualified
            healthcare providers for decisions about your reproductive care.
          </Text>

          <Text style={styles.subheading}>Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            To the fullest extent permitted by law, ContraceptIQ and its
            contributors are not liable for any decisions or outcomes based on
            app use.
          </Text>

          <Text style={styles.subheading}>Research Use Notice</Text>
          <Text style={styles.paragraph}>
            Data may be used in aggregated or de-identified form to improve the
            service and support research and quality efforts.
          </Text>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacyDisclaimerScreen;

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
    padding: 24,
  },
  pageDescription: {
    fontSize: 15,
    lineHeight: 24,
    color: '#475569',
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  disclaimerCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FEF3C7',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainerBlue: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainerOrange: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginBottom: 20,
  },
  subheading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 24,
    color: '#475569',
    marginBottom: 20,
  },
});
