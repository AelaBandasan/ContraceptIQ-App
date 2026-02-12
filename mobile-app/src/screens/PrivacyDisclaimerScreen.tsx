import React from "react";
import { SafeAreaView, ScrollView, View, Text, StyleSheet } from "react-native";
import type { DrawerScreenProps } from "@react-navigation/drawer";
import type { DrawerParamList } from "../types/navigation";

export type PrivacyDisclaimerScreenProps = DrawerScreenProps<
  DrawerParamList,
  "PrivacyDisclaimer"
>;

const PrivacyDisclaimerScreen: React.FC<PrivacyDisclaimerScreenProps> = ({
  navigation,
  route,
}) => {
  // route is unused but kept for typed consistency
  void route;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.container}>
          <Text
            style={styles.backLink}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate("MainTabs");
              }
            }}
          >
            Back
          </Text>
          <Text style={styles.title}>Privacy & Disclaimer</Text>

          <Text style={styles.sectionTitle}>Privacy Policy</Text>

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
            is 100% secure, and we continuously review our controls to mitigate
            risk.
          </Text>

          <Text style={styles.subheading}>Data Sharing</Text>
          <Text style={styles.paragraph}>
            We do not sell your personal data. Limited sharing may occur with
            trusted providers to operate the service, subject to confidentiality
            and security obligations.
          </Text>

          <Text style={styles.subheading}>Data Retention</Text>
          <Text style={styles.paragraph}>
            We retain information only as long as needed for the purposes
            described or as required by law, after which it is securely deleted
            or de-identified.
          </Text>

          <Text style={styles.subheading}>Your Rights</Text>
          <Text style={styles.paragraph}>
            Depending on your location, you may have rights to access, correct,
            delete, or restrict processing of your data. Contact us to exercise
            these rights.
          </Text>

          <Text style={styles.subheading}>Contact Information</Text>
          <Text style={styles.paragraph}>
            Questions or requests can be sent to support@contraceptiq.app.
          </Text>

          <Text style={styles.sectionTitle}>Medical Disclaimer</Text>

          <Text style={styles.subheading}>Not Medical Advice</Text>
          <Text style={styles.paragraph}>
            Content and outputs from this app are for informational purposes
            only and are not a substitute for professional medical advice,
            diagnosis, or treatment.
          </Text>

          <Text style={styles.subheading}>No Guarantee of Outcomes</Text>
          <Text style={styles.paragraph}>
            Outcomes and recommendations may vary. Always consult qualified
            healthcare providers for decisions about care.
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
      </ScrollView>
    </SafeAreaView>
  );
};

export default PrivacyDisclaimerScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  container: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 16,
  },
  backLink: {
    color: "#2563EB",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginTop: 16,
    marginBottom: 8,
  },
  subheading: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1F2937",
    marginTop: 12,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: "#334155",
  },
});
