import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import type { DrawerScreenProps } from "@react-navigation/drawer";
import type { DrawerParamList } from "../types/navigation";
import { Ionicons } from "@expo/vector-icons";
import { Sparkles } from "lucide-react-native";
import { colors } from "../theme";

export type PrivacyDisclaimerScreenProps = DrawerScreenProps<
  DrawerParamList,
  "PrivacyDisclaimer"
>;

type PrivacyBlock = {
  id: number;
  title: string;
  content: string;
  iconName: keyof typeof Ionicons.glyphMap;
  tone: "privacy" | "medical";
};

const BLOCKS: PrivacyBlock[] = [
  {
    id: 1,
    title: "What We Collect and Why",
    content:
      "ContraceptIQ is committed to protecting your privacy and handling your information responsibly. We may collect information you provide (such as account details and assessment inputs) and technical data (such as device type and app usage patterns). Information is used to deliver app features, personalize recommendations, maintain security, and meet legal or compliance obligations where applicable.",
    iconName: "analytics-outline",
    tone: "privacy",
  },
  {
    id: 2,
    title: "Security and Data Sharing",
    content:
      "We use industry-standard safeguards to protect your data. No method is 100% secure, and we continuously review our controls to mitigate risk. We do not sell your personal data. Limited sharing may occur with trusted providers to operate the service, subject to confidentiality and security obligations.",
    iconName: "shield-checkmark-outline",
    tone: "privacy",
  },
  {
    id: 3,
    title: "Contact Information",
    content: "Questions or requests can be sent to support@contraceptiq.com.",
    iconName: "mail-outline",
    tone: "privacy",
  },
  {
    id: 4,
    title: "Clinical Use Limits",
    content:
      "Content and outputs from this app are for informational purposes only and are not a substitute for professional medical advice, diagnosis, or treatment. Outcomes and recommendations may vary. Always consult qualified healthcare providers for decisions about your reproductive care.",
    iconName: "warning-outline",
    tone: "medical",
  },
  {
    id: 5,
    title: "Liability and Research Use",
    content:
      "To the fullest extent permitted by law, ContraceptIQ and its contributors are not liable for any decisions or outcomes based on app use. Data may be used in aggregated or de-identified form to improve the service and support research and quality efforts.",
    iconName: "document-text-outline",
    tone: "medical",
  },
];

const PrivacyDisclaimerScreen: React.FC<PrivacyDisclaimerScreenProps> = ({
  navigation,
  route,
}) => {
  const insets = useSafeAreaInsets();
  void route;

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          onPress={() => (navigation as any).toggleDrawer()}
          style={styles.menuButton}
        >
          <View style={styles.menuButtonSolid}>
            <Ionicons name="menu" size={24} color="#FFF" />
          </View>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerText}>Privacy & Security</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.brandCard}>
          <View style={styles.brandMark}>
            <Ionicons name="shield-outline" size={22} color={colors.primary} />
          </View>
          <Text style={styles.brandTitle}>Your Data, Your Safety</Text>
          <Text style={styles.brandSubtitle}>
            Transparent privacy practices and clear medical guidance limits.
          </Text>
        </View>

        {BLOCKS.map((block, index) => {
          const isMedical = block.tone === "medical";
          return (
            <View
              key={block.id}
              style={[
                styles.infoCard,
                isMedical ? styles.infoCardMedical : styles.infoCardPrivacy,
              ]}
            >
              <View
                style={[
                  styles.iconTop,
                  isMedical ? styles.iconTopMedical : styles.iconTopPrivacy,
                ]}
              >
                <Ionicons name={block.iconName} size={20} color={colors.primary} />
              </View>
              <Text style={styles.cardTitle}>{block.title}</Text>
              <Text style={styles.cardContent}>{block.content}</Text>
            </View>
          );
        })}

        <View style={styles.bannerCard}>
          <Sparkles size={18} color="#166534" />
          <Text style={styles.bannerText}>
            If you are making medical decisions, please consult a qualified healthcare professional.
          </Text>
        </View>

        <View style={{ height: 34 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacyDisclaimerScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAFAF9",
  },
  header: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    flexDirection: "row",
    alignItems: "center",
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
    overflow: "hidden",
  },
  menuButtonSolid: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  titleContainer: {
    marginLeft: 15,
  },
  headerText: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFF",
  },
  scrollContent: {
    padding: 18,
    paddingTop: 20,
  },
  brandCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#FBCFE8",
    borderRadius: 15,
    padding: 16,
    marginBottom: 14,
    alignItems: "center",
  },
  brandMark: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#FDF2F8",
    borderWidth: 1,
    borderColor: "#FBCFE8",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text.primary,
    textAlign: "center",
  },
  brandSubtitle: {
    marginTop: 4,
    fontSize: 14,
    lineHeight: 21,
    color: "#475569",
    textAlign: "center",
  },
  infoCard: {
    borderRadius: 15,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 16,
    marginBottom: 10,
    alignItems: "center",
  },
  infoCardPrivacy: {
    backgroundColor: "#FFFFFF",
    borderColor: "#E2E8F0",
  },
  infoCardMedical: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
  },
  iconTop: {
    width: 46,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  iconTopPrivacy: {
    backgroundColor: "#FDF2F8",
    borderColor: "#FBCFE8",
  },
  iconTopMedical: {
    backgroundColor: "#FFF7ED",
    borderColor: "#FED7AA",
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
    marginBottom: 8,
  },
  cardContent: {
    fontSize: 14.5,
    lineHeight: 22,
    color: "#475569",
    textAlign: "center",
  },
  bannerCard: {
    marginTop: 16,
    backgroundColor: "#F0FDF4",
    borderWidth: 1,
    borderColor: "#BBF7D0",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  bannerText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: "#166534",
    fontWeight: "600",
  },
});
