import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  FlatList,
  Image,
  StatusBar,
  Platform,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  SectionList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  X,
  ChevronUp,
  ChevronDown,
  CheckCircle2,
  ClipboardList,
  Check,
  Heart,
  ShieldCheck,
  Clock,
  EyeOff,
  UserCheck,
  Leaf,
  Shield,
  Search,
} from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import { Picker } from "@react-native-picker/picker";

import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from "react-native-responsive-screen";

import {
  assessDiscontinuationRisk,
  UserAssessmentData,
  RiskAssessmentResponse,
} from "../../services/discontinuationRiskService";
import {
  calculateWhoMecTool,
  MECResult,
  MECInput,
  getMECColor,
  getMECLabel,
  MECCategory,
} from "../../services/mecService";
import RiskAssessmentCard, {
  generateKeyFactors,
} from "../../components/RiskAssessmentCard";
import { AlertTriangle } from "lucide-react-native";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { auth, db } from "../../config/firebaseConfig";
import ObHeader from "../../components/ObHeader";
import { WHO_MEC_CONDITIONS } from "../../data/whoMecData";
import { MecTreeSelector } from "../../components/MecTreeSelector";

interface PatientIntakeData {
  details?: any;
  method_eligibility?: Record<string, number>;
}

interface MethodSection {
  title: string;
  data: string[];
  category: number;
}

// --- DATA CONFIGURATION ---
const GUEST_STEPS = [
  {
    id: "NAME",
    label: "What's your Name?",
    type: "text",
    sub: "Let's get to know you first.",
  },
  {
    id: "AGE",
    label: "What's your Age?",
    type: "wheel",
    sub: "This helps in personalizing results.",
    range: [15, 55],
  },
  {
    id: "REGION",
    label: "Your Region",
    type: "select",
    options: [
      "NCR",
      "CAR",
      "Region 1",
      "Region 2",
      "Region 3",
      "Region 4",
      "Region 5",
      "Region 6",
      "Region 7",
      "Region 8",
      "Region 9",
      "Region 10",
      "Region 11",
      "Region 12",
      "Region 13",
      "BARMM",
    ],
  },
  {
    id: "EDUC_LEVEL",
    label: "Education Level",
    type: "select",
    options: [
      "No formal education",
      "Primary",
      "Secondary",
      "Senior High",
      "College undergraduate",
      "College graduate",
    ],
  },
  {
    id: "RELIGION",
    label: "What is your Religion?",
    type: "select",
    options: ["Catholic", "Christian", "Muslim", "INC", "Prefer not to say"],
  },
  {
    id: "ETHNICITY",
    label: "Your Ethnicity",
    type: "dropdown",
    options: ["Tagalog", "Cebuano", "Ilocano"],
  },
  {
    id: "MARITAL_STATUS",
    label: "Marital Status",
    type: "select",
    options: [
      "Single",
      "Married",
      "Living with partner",
      "Separated",
      "Divorced",
      "Widowed",
    ],
  },
  {
    id: "RESIDING_WITH_PARTNER",
    label: "Residing with partner?",
    type: "select",
    options: ["Yes", "No"],
  },
  {
    id: "HOUSEHOLD_HEAD_SEX",
    label: "Household Head Sex",
    type: "select",
    options: ["Male", "Female", "Shared/Both", "Others"],
  },
  {
    id: "OCCUPATION",
    label: "Current Occupation",
    type: "select",
    options: ["Unemployed", "Student", "Farmer", "Others"],
  },
  { id: "HUSBAND_AGE", label: "Husband's Age", type: "wheel" },
  {
    id: "HUSBAND_EDUC_LEVEL",
    label: "Husband's Education Level",
    type: "select",
    options: [
      "No formal education",
      "Primary",
      "Secondary",
      "Senior High",
      "College undergraduate",
      "College graduate",
    ],
  },
  {
    id: "SMOKE_CIGAR",
    label: "Smoking Habits",
    type: "select",
    options: ["Never", "Former smoker", "Occasional smoker", "Current daily"],
  },
  {
    id: "PARITY",
    label: "Number of Births (Parity)",
    type: "wheel",
    range: [0, 5],
  },
  {
    id: "DESIRE_FOR_MORE_CHILDREN",
    label: "Desire for more children?",
    type: "select",
    options: ["Yes", "No", "Not Sure"],
  },
  {
    id: "WANT_LAST_CHILD",
    label: "Do you want your last child?",
    type: "select",
    options: ["Yes", "No", "Not Sure"],
  },
  {
    id: "WANT_LAST_PREGNANCY",
    label: "Do you want your last pregnancy?",
    type: "select",
    options: ["Yes", "No", "Not Sure"],
  },
  {
    id: "LAST_METHOD_DISCONTINUED",
    label: "Last Method Discontinued",
    type: "select",
    options: [
      "Pills",
      "Condom",
      "Copper IUD",
      "Intrauterine Device (IUD)",
      "Implant",
      "Patch",
      "Injectable",
      "Withdrawal",
      "None",
    ],
  },
  {
    id: "REASON_DISCONTINUED",
    label: "Reason Discontinued",
    type: "select",
    options: [
      "Side effects",
      "Health concerns",
      "Desire to become pregnant",
      "None / Not Applicable",
    ],
  },
  {
    id: "HSBND_DESIRE_FOR_MORE_CHILDREN",
    label: "Husband's Desire for More Children",
    type: "select",
    options: ["Yes", "No", "Not Sure"],
  },
];

const DOCTOR_STEPS = [
  {
    id: "MONTH_USE_CURRENT_METHOD",
    label: "Month of Use Current Method",
    type: "select",
    options: Array.from({ length: 13 }, (_, i) => i.toString()),
  },
  {
    id: "PATTERN_USE",
    label: "Pattern of Use",
    type: "select",
    options: ["Regular", "Irregular", "Not Sure"],
  },
  {
    id: "TOLD_ABT_SIDE_EFFECTS",
    label: "Told about Side effects?",
    type: "select",
    options: ["Yes by Health Worker", "Yes by research/friends", "No"],
  },
  {
    id: "LAST_SOURCE_TYPE",
    label: "Last Source Type",
    type: "select",
    options: [
      "Government health facility",
      "Private Clinic/Hospital",
      "Pharmacy",
      "NGO",
      "Online/Telehealth",
    ],
  },
];

// Method names mapped to their API index (1-based, matching the old CONTRACEPTIVE_METHOD options order)
const METHOD_NAME_TO_INDEX: Record<string, number> = {
  Pills: 1,
  "Copper IUD": 2,
  "Intrauterine Device (IUD)": 3,
  Implant: 4,
  Patch: 5,
  Injectable: 6,
};

const STEPS = [...GUEST_STEPS];
const ALL_STEPS = [...GUEST_STEPS, ...DOCTOR_STEPS];

const PREFERENCES = [
  {
    key: "regular",
    label: "Regular Bleeding",
    description: "Helps regulate periods and reduce cramps",
    icon: Heart,
  },
  {
    key: "effectiveness",
    label: "Highly Effective",
    description: "Most reliable at preventing pregnancy",
    icon: ShieldCheck,
  },
  {
    key: "longterm",
    label: "Long Lasting",
    description: "Lasts for years with minimal maintenance",
    icon: Clock,
  },
  {
    key: "privacy",
    label: "Privacy",
    description: "Can be used discreetly without others knowing",
    icon: EyeOff,
  },
  {
    key: "client",
    label: "Client Controlled",
    description: "Patient can start or stop it themselves",
    icon: UserCheck,
  },
  {
    key: "nonhormonal",
    label: "No Hormones",
    description: "Hormone-free contraceptive option",
    icon: Leaf,
  },
  {
    key: "sti",
    label: "STI Prevention",
    description: "Protects against sexually transmitted infections",
    icon: Shield,
  },
];

interface FloatingIconProps {
  source: any;
  delay?: number;
  size?: number;
  top: number | string; // Allow percentage strings or numbers
  left: number | string;
}

// --- FLOATING ICON COMPONENT ---
const FloatingIcon = ({
  source,
  delay = 0,
  size = wp("15%"),
  top,
  left,
}: FloatingIconProps) => {
  const translateY = useSharedValue(0);
  useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: 2500 + delay }),
        withTiming(0, { duration: 2500 + delay }),
      ),
      -1,
      true,
    );
  }, []);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  return (
    <Animated.View
      style={[
        {
          position: "absolute",
          top: top as any,
          left: left as any,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.15,
          shadowRadius: 10,
          elevation: 8,
        },
        animatedStyle,
      ]}
    >
      <View
        style={{ backgroundColor: "white", borderRadius: 100, padding: 10 }}
      >
        <Image
          source={source}
          style={{ width: size, height: size }}
          resizeMode="contain"
        />
      </View>
    </Animated.View>
  );
};

const ObAssessment = ({ navigation, route }: any) => {
  const hasPatientData = !!(
    route.params?.patientData ||
    route.params?.consultationId ||
    route.params?.viewOnly
  );
  // screen state: 'intake1' (Demographics) -> 'intake2' (Clinical) -> 'intake3' (MEC Select) -> 'mec_results' (MEC Rules) -> 'results' (ML Risk)
  const [screen, setScreen] = useState(hasPatientData ? "results" : "intake1");
  const [formData, setFormData] = useState<any>({});
  const [isLoading, setIsLoading] = useState(false);

  // Accordion State for Step 1
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({
    demographics: true,
    husband: false,
    repro_history: false,
    contra_history: false,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Results state
  const [allMethodResults, setAllMethodResults] = useState<
    Record<string, RiskAssessmentResponse | null>
  >({});
  const [methodEligibility, setMethodEligibility] = useState<
    Record<string, number>
  >({});
  const [mecRecommendations, setMecRecommendations] = useState<string[]>([]);

  // Form Helpers
  const [clinicalNotes, setClinicalNotes] = useState("");
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [activeSelectorStep, setActiveSelectorStep] = useState<any>(null);

  // Embedded MEC State (Step 3)
  const [mecConditionIds, setMecConditionIds] = useState<string[]>([]);
  const [mecPrefs, setMecPrefs] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [mecResults, setMecResults] = useState<MECResult | null>(null);

  const isDoctorEval =
    route?.params?.isDoctorAssessment || !!route?.params?.consultationId;

  useEffect(() => {
    const loadConsultationData = async () => {
      setIsLoading(true);
      if (route.params?.patientData) {
        const data = route.params.patientData;
        const initialForm = data.details || data;
        setFormData(initialForm);

        if (data.mec_recommendations)
          setMecRecommendations(data.mec_recommendations);
        if (data.method_eligibility)
          setMethodEligibility(data.method_eligibility);

        if (screen !== "results") setScreen("results");
      } else if (route.params?.consultationId) {
        try {
          const docRef = doc(db, "consultations", route.params.consultationId);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            const data = snap.data() as any;
            const patientData = data.patientData || {};
            const initialForm = patientData.details || patientData;
            setFormData(initialForm);
            if (patientData.mec_recommendations)
              setMecRecommendations(patientData.mec_recommendations);
            if (patientData.method_eligibility)
              setMethodEligibility(patientData.method_eligibility);
          }
        } catch (error) {
          Alert.alert("Error", "Failed to load patient data.");
        }
      }

      if (hasPatientData) setScreen("results");
      setIsLoading(false);
    };
    loadConsultationData();
  }, [route.params]);

  const mapFormDataToApi = (data: any): UserAssessmentData => {
    const getIndex = (key: string, list: string[] | undefined) => {
      if (!list) return 1;
      const idx = list.indexOf(data[key]);
      return idx !== -1 ? idx + 1 : 1;
    };

    const getNumber = (key: string, def = 0) => {
      const val = parseInt(data[key]);
      return isNaN(val) ? def : val;
    };

    return {
      AGE: getNumber("AGE", 25),
      REGION: getIndex(
        "REGION",
        ALL_STEPS.find((s) => s.id === "REGION")?.options,
      ),
      EDUC_LEVEL: getIndex(
        "EDUC_LEVEL",
        ALL_STEPS.find((s) => s.id === "EDUC_LEVEL")?.options,
      ),
      RELIGION: getIndex(
        "RELIGION",
        ALL_STEPS.find((s) => s.id === "RELIGION")?.options,
      ),
      ETHNICITY: getIndex(
        "ETHNICITY",
        ALL_STEPS.find((s) => s.id === "ETHNICITY")?.options,
      ),
      MARITAL_STATUS: getIndex(
        "MARITAL_STATUS",
        ALL_STEPS.find((s) => s.id === "MARITAL_STATUS")?.options,
      ),
      RESIDING_WITH_PARTNER: data["RESIDING_WITH_PARTNER"] === "Yes" ? 1 : 0,
      HOUSEHOLD_HEAD_SEX: getIndex(
        "HOUSEHOLD_HEAD_SEX",
        ALL_STEPS.find((s) => s.id === "HOUSEHOLD_HEAD_SEX")?.options,
      ),
      OCCUPATION: getIndex(
        "OCCUPATION",
        ALL_STEPS.find((s) => s.id === "OCCUPATION")?.options,
      ),
      HUSBANDS_EDUC: getIndex(
        "HUSBAND_EDUC_LEVEL",
        ALL_STEPS.find((s) => s.id === "HUSBAND_EDUC_LEVEL")?.options,
      ),
      HUSBAND_AGE: getNumber("HUSBAND_AGE", 30),
      PARTNER_EDUC: getIndex(
        "HUSBAND_EDUC_LEVEL",
        ALL_STEPS.find((s) => s.id === "HUSBAND_EDUC_LEVEL")?.options,
      ),
      SMOKE_CIGAR:
        data["SMOKE_CIGAR"] === "Thinking about quitting" ||
        data["SMOKE_CIGAR"] === "Current daily"
          ? 1
          : 0,
      PARITY: getNumber("PARITY", 0),
      DESIRE_FOR_MORE_CHILDREN: getIndex(
        "DESIRE_FOR_MORE_CHILDREN",
        ALL_STEPS.find((s) => s.id === "DESIRE_FOR_MORE_CHILDREN")?.options,
      ),
      WANT_LAST_CHILD: getIndex(
        "WANT_LAST_CHILD",
        ALL_STEPS.find((s) => s.id === "WANT_LAST_CHILD")?.options,
      ),
      WANT_LAST_PREGNANCY: getIndex(
        "WANT_LAST_PREGNANCY",
        ALL_STEPS.find((s) => s.id === "WANT_LAST_PREGNANCY")?.options,
      ),
      CONTRACEPTIVE_METHOD:
        METHOD_NAME_TO_INDEX[data["CONTRACEPTIVE_METHOD"]] || 1,
      MONTH_USE_CURRENT_METHOD: getNumber("MONTH_USE_CURRENT_METHOD", 1),
      PATTERN_USE: getIndex(
        "PATTERN_USE",
        ALL_STEPS.find((s) => s.id === "PATTERN_USE")?.options,
      ),
      TOLD_ABT_SIDE_EFFECTS: data["TOLD_ABT_SIDE_EFFECTS"]?.includes("Yes")
        ? 1
        : 0,
      LAST_SOURCE_TYPE: getIndex(
        "LAST_SOURCE_TYPE",
        ALL_STEPS.find((s) => s.id === "LAST_SOURCE_TYPE")?.options,
      ),
      LAST_METHOD_DISCONTINUED: getIndex(
        "LAST_METHOD_DISCONTINUED",
        ALL_STEPS.find((s) => s.id === "LAST_METHOD_DISCONTINUED")?.options,
      ),
      REASON_DISCONTINUED: getIndex(
        "REASON_DISCONTINUED",
        ALL_STEPS.find((s) => s.id === "REASON_DISCONTINUED")?.options,
      ),
      HSBND_DESIRE_FOR_MORE_CHILDREN: getIndex(
        "HSBND_DESIRE_FOR_MORE_CHILDREN",
        ALL_STEPS.find((s) => s.id === "HSBND_DESIRE_FOR_MORE_CHILDREN")
          ?.options,
      ),
    };
  };

  const savePatientData = async (status: string) => {
    setIsLoading(true);
    try {
      const consultationId = route.params?.consultationId;
      const riskSummary: Record<string, any> = {};
      Object.entries(allMethodResults).forEach(([method, result]) => {
        if (result) {
          riskSummary[method] = {
            riskLevel: result.risk_level,
            probability: result.xgb_probability || 0,
            recommendation: result.recommendation,
            confidence: result.confidence,
          };
        }
      });

      if (consultationId) {
        const currentUser = auth.currentUser;
        const obName =
          route.params?.doctorName ||
          "Dr. " + (currentUser?.email?.split("@")[0] || "OB");

        await updateDoc(doc(db, "consultations", consultationId), {
          patientData: { ...formData, mec_recommendations: mecRecommendations },
          riskResults: riskSummary,
          obId: currentUser?.uid || "unknown",
          obName: obName,
          clinicalNotes: clinicalNotes || "Patient assessment completed.",
          assessedAt: new Date().toISOString(),
          status: status.toLowerCase(),
        });
        Alert.alert("Success", "Consultation record updated.");
      }
      navigation.navigate("ObMainTabs", { screen: "ObHome" });
    } catch (error: any) {
      Alert.alert("Save Failed", "Could not update consultation record.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAndFinish = () => {
    const resultCount = Object.values(allMethodResults).filter(
      (r) => r !== null,
    ).length;
    if (resultCount === 0) {
      Alert.alert("No Assessment", "Please generate risk assessments first.");
      return;
    }
    const hasHighRisk = Object.values(allMethodResults).some(
      (r) => r?.risk_level === "HIGH",
    );
    savePatientData(hasHighRisk ? "Critical" : "Completed");
  };

  const updateVal = (val: string, fieldId: string) => {
    setFormData({ ...formData, [fieldId]: val });
  };

  const toggleWizardCondition = (id: string) => {
    setMecConditionIds((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id);
      if (prev.length >= 3) {
        Alert.alert("Limit Reached", "Max 3 conditions for MEC tool.");
        return prev;
      }
      return [...prev, id];
    });
  };

  const toggleWizardPref = (key: string) => {
    setMecPrefs((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  // Calculate MEC immediately when leaving screen 3
  const generateMecResults = () => {
    setIsLoading(true);
    try {
      const age = parseInt(formData["AGE"]) || 25;
      const mecOut = calculateWhoMecTool({
        age,
        conditionIds: mecConditionIds,
        preferences: mecPrefs,
      });

      setMecResults(mecOut.mecCategories as MECResult);
      const eligibility: Record<string, number> = {};
      (
        Object.keys(mecOut.mecCategories) as Array<
          keyof typeof mecOut.mecCategories
        >
      ).forEach((key) => {
        eligibility[key] = mecOut.mecCategories[key];
      });
      setMethodEligibility(eligibility);

      const recommended = (
        Object.keys(mecOut.mecCategories) as Array<
          keyof typeof mecOut.mecCategories
        >
      )
        .filter((key) => mecOut.mecCategories[key] <= 2)
        .map((key) => key);
      setMecRecommendations(recommended);

      setScreen("mec_results");
    } catch (e: any) {
      Alert.alert(
        "MEC Calculation Failed",
        e.message || "Failed to calculate criteria.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const generateRiskAssessment = async () => {
    setIsLoading(true);
    try {
      if (!mecResults) {
        Alert.alert("Missing MEC Data", "Please run MEC check first.");
        setIsLoading(false);
        return;
      }

      // --- RUN RISK PREDICTION ---
      const eligibleMethods: string[] = [];
      const nameToKey: Record<string, keyof MECResult> = {
        Pills: "CHC",
        Patch: "CHC",
        Injectable: "DMPA",
        Implant: "Implant",
        "Copper IUD": "Cu-IUD",
        "Intrauterine Device (IUD)": "LNG-IUD",
      };

      Object.keys(METHOD_NAME_TO_INDEX).forEach((methodName) => {
        const mecKey = nameToKey[methodName];
        const cat = mecResults[mecKey] || 1;
        if (cat <= 3) eligibleMethods.push(methodName);
      });

      if (eligibleMethods.length === 0) {
        Alert.alert(
          "No Eligible Methods",
          "No methods are eligible based on MEC results.",
        );
        setIsLoading(false);
        return;
      }

      const results: Record<string, RiskAssessmentResponse | null> = {};
      for (const methodName of eligibleMethods) {
        try {
          const dataToAssess = {
            ...formData,
            CONTRACEPTIVE_METHOD: methodName,
          };
          const apiData = mapFormDataToApi(dataToAssess);
          const result = await assessDiscontinuationRisk(apiData);

          const mecKey = nameToKey[methodName];
          const cat = mecResults[mecKey] || 1;

          if (cat >= 3 && result) {
            result.risk_level = "HIGH";
            result.recommendation = `Medical Risks present (MEC Cat ${cat}). Strong clinical counseling required.`;
            result.upgraded_by_dt = true;
          }
          results[methodName] = result;
        } catch (error: any) {
          console.error(
            `Risk assessment failed for ${methodName}:`,
            error.message,
          );
          results[methodName] = null;
        }
      }
      setAllMethodResults(results);
      setScreen("results");
    } catch (error: any) {
      Alert.alert(
        "Assessment Failed",
        error.message || "Something went wrong.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderField = (step: any) => {
    return (
      <View key={step.id} style={{ marginBottom: 16 }}>
        <Text style={styles.inputLabel}>{step.label}</Text>
        {step.type === "text" ? (
          <TextInput
            style={[
              styles.textInput,
              { paddingVertical: 12, paddingHorizontal: 16, fontSize: 15 },
            ]}
            placeholder={`Enter ${step.label.toLowerCase()}`}
            placeholderTextColor="#94A3B8"
            value={formData[step.id] || ""}
            onChangeText={(val) => updateVal(val, step.id)}
          />
        ) : (
          <TouchableOpacity
            style={[styles.dropdownButton, { padding: 14 }]}
            onPress={() => {
              setActiveSelectorStep(step);
              setSelectorVisible(true);
            }}
          >
            <Text
              style={
                formData[step.id]
                  ? styles.dropdownTextSelected
                  : styles.dropdownTextPlaceholder
              }
            >
              {formData[step.id] || "Select Option"}
            </Text>
            <ChevronDown size={20} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const AccordionHeader = ({
    title,
    section,
    subtext,
  }: {
    title: string;
    section: string;
    subtext?: string;
  }) => {
    const isExpanded = expandedSections[section];
    return (
      <TouchableOpacity
        style={[
          styles.accordionHeader,
          isExpanded && styles.accordionHeaderExpanded,
        ]}
        onPress={() => toggleSection(section)}
        activeOpacity={0.7}
      >
        <View style={{ flex: 1 }}>
          <Text
            style={[
              styles.sectionTitle,
              {
                color: isExpanded ? "#E45A92" : "#334155",
                marginBottom: subtext ? 4 : 0,
              },
            ]}
          >
            {title}
          </Text>
          {subtext && (
            <Text
              style={{ fontSize: 12, color: "#64748B", fontStyle: "italic" }}
            >
              {subtext}
            </Text>
          )}
        </View>
        <View
          style={[
            styles.accordionIconContainer,
            isExpanded && { backgroundColor: "#FDF2F8" },
          ]}
        >
          {isExpanded ? (
            <ChevronUp size={20} color="#E45A92" />
          ) : (
            <ChevronDown size={20} color="#64748B" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderMECResults = () => {
    if (!mecResults) return null;

    const getConditionLabel = (id: string) => {
      const entry = WHO_MEC_CONDITIONS.find((c) => c.id === id);
      if (!entry) return id;
      let label = entry.condition;
      if (entry.subCondition) label += ` — ${entry.subCondition}`;
      if (entry.variant)
        label += ` (${entry.variant === "I" ? "Initiation" : "Continuation"})`;
      return label;
    };

    const categories = [1, 2, 3, 4] as MECCategory[];

    // Count methods per category
    const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    Object.values(mecResults).forEach((val) => {
      if (val >= 1 && val <= 4) counts[val]++;
    });

    return (
      <View>
        {mecConditionIds.length > 0 && (
          <View
            style={{
              marginBottom: 20,
              padding: 14,
              backgroundColor: "#F8F9FB",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#E2E8F0",
            }}
          >
            <Text
              style={{
                fontSize: 13,
                fontWeight: "700",
                color: "#64748B",
                textTransform: "uppercase",
                marginBottom: 8,
                letterSpacing: 0.5,
              }}
            >
              Selected Conditions
            </Text>
            {mecConditionIds.map((id) => (
              <Text
                key={id}
                style={{ fontSize: 14, color: "#334155", marginBottom: 4 }}
              >
                • {getConditionLabel(id)}
              </Text>
            ))}
          </View>
        )}
        {categories.map((cat) => {
          const methodMap: Record<string, string> = {
            CHC: "Pills / Patch / Ring",
            POP: "Progestogen-only Pill",
            DMPA: "Injectable (DMPA)",
            Implant: "Implant",
            "Cu-IUD": "Copper IUD",
            "LNG-IUD": "LNG-IUD (Hormonal)",
          };
          const methodsInCat = Object.entries(mecResults)
            .filter(([_, value]) => value === cat)
            .map(([key, _]) => methodMap[key] || key);

          if (methodsInCat.length === 0) return null;

          return (
            <View key={cat} style={{ marginBottom: 16 }}>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  marginBottom: 8,
                  gap: 8,
                }}
              >
                <View
                  style={{
                    backgroundColor: getMECColor(cat),
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                    borderRadius: 8,
                  }}
                >
                  <Text
                    style={{ color: "#FFF", fontWeight: "bold", fontSize: 14 }}
                  >
                    Category {cat}
                  </Text>
                </View>
                <Text
                  style={{
                    color: "#64748B",
                    fontSize: 12,
                    flex: 1,
                    flexWrap: "wrap",
                  }}
                >
                  {cat === 1
                    ? "Freely use method"
                    : cat === 2
                      ? "Advantages outweigh risks"
                      : cat === 3
                        ? "Risks usually outweigh advantages"
                        : "Do not use method"}
                </Text>
              </View>

              <View
                style={{
                  backgroundColor: "#FFF",
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: "#E2E8F0",
                  overflow: "hidden",
                }}
              >
                {methodsInCat.map((method, index) => (
                  <View
                    key={index}
                    style={{
                      padding: 14,
                      borderBottomWidth:
                        index < methodsInCat.length - 1 ? 1 : 0,
                      borderBottomColor: "#F1F5F9",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 15,
                        fontWeight: "600",
                        color: "#334155",
                      }}
                    >
                      {method}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: "#F8F9FB" }]}>
      <StatusBar barStyle="light-content" />
      <ObHeader
        title="Patient Assessment"
        subtitle={formData?.NAME || "New Patient"}
      />

      {/* STEP 1: DEMOGRAPHICS (Collapsibles) */}
      {screen === "intake1" && (
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ padding: 20 }}
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={[styles.title, { marginBottom: 20, textAlign: "left" }]}
            >
              Step 1: Patient Details
            </Text>

            {/* Demographics Group */}
            <View style={styles.accordionContainer}>
              <AccordionHeader
                title="Personal Demographics"
                section="demographics"
                subtext="Name, Age, Education, Region"
              />
              {expandedSections["demographics"] && (
                <View style={styles.accordionContent}>
                  {GUEST_STEPS.slice(0, 10).map(renderField)}
                </View>
              )}
            </View>

            {/* Husband / Partner Group */}
            <View style={styles.accordionContainer}>
              <AccordionHeader
                title="Husband / Partner Info"
                section="husband"
                subtext="Partner Age, Education, Intentions"
              />
              {expandedSections["husband"] && (
                <View style={styles.accordionContent}>
                  {GUEST_STEPS.slice(10, 12).map(renderField)}
                  {GUEST_STEPS.slice(19, 20).map(renderField)}
                </View>
              )}
            </View>

            {/* Reproductive History */}
            <View style={styles.accordionContainer}>
              <AccordionHeader
                title="Reproductive History"
                section="repro_history"
                subtext="Parity, Pregnancy intentions"
              />
              {expandedSections["repro_history"] && (
                <View style={styles.accordionContent}>
                  {[...GUEST_STEPS.slice(13, 17), GUEST_STEPS[12]].map(
                    renderField,
                  )}
                </View>
              )}
            </View>

            {/* Contraceptive History */}
            <View style={styles.accordionContainer}>
              <AccordionHeader
                title="Contraceptive History"
                section="contra_history"
                subtext="Past methods and side effects"
              />
              {expandedSections["contra_history"] && (
                <View style={styles.accordionContent}>
                  {GUEST_STEPS.slice(17, 19).map(renderField)}
                </View>
              )}
            </View>
            <View style={{ height: 40 }} />
            <TouchableOpacity
              onPress={() => setScreen("intake2")}
              style={[styles.dashboardStyleBtn, { backgroundColor: "#E45A92" }]}
            >
              <Text style={styles.dashboardStyleBtnText}>
                Next: Clinical Input
              </Text>
              <Text
                style={[
                  styles.arrow,
                  { color: "#FFF", marginLeft: 6, fontSize: 16 },
                ]}
              >
                »
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* STEP 2: CLINICAL INPUT */}
      {screen === "intake2" && (
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ padding: 20 }}
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={[styles.title, { marginBottom: 20, textAlign: "left" }]}
            >
              Step 2: Clinical Input
            </Text>

            <View style={styles.cardSection}>
              {DOCTOR_STEPS.map(renderField)}
            </View>
            <View style={{ height: 40 }} />
            <TouchableOpacity
              onPress={() => setScreen("intake3")}
              style={[
                styles.dashboardStyleBtn,
                { backgroundColor: "#E45A92", marginBottom: 12 },
              ]}
            >
              <Text style={styles.dashboardStyleBtnText}>
                Next: MEC Conditions
              </Text>
              <Text
                style={[
                  styles.arrow,
                  { color: "#FFF", marginLeft: 6, fontSize: 16 },
                ]}
              >
                »
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setScreen("intake1")}
              style={styles.dashboardStyleBtnSecondary}
            >
              <Text style={styles.dashboardStyleBtnSecondaryText}>
                Back to Patient Details
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* STEP 3: MEC TOOL SELECTION */}
      {screen === "intake3" && (
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ padding: 20 }}
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={[styles.title, { marginBottom: 20, textAlign: "left" }]}
            >
              Step 3: MEC Selection
            </Text>

            <View style={styles.cardSection}>
              <Text
                style={[
                  styles.helperText,
                  { textAlign: "left", marginBottom: 16 },
                ]}
              >
                Select up to 3 medical conditions.
              </Text>

              <MecTreeSelector
                selectedConditions={mecConditionIds}
                onToggleCondition={toggleWizardCondition}
                maxConditions={3}
              />

              <Text style={[styles.inputLabel, { marginTop: 24 }]}>
                Patient Preferences
              </Text>
              {PREFERENCES.map((pref) => {
                const isSelected = mecPrefs.includes(pref.key);
                const IconComponent = pref.icon;
                return (
                  <TouchableOpacity
                    key={pref.key}
                    style={[
                      {
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: "#fff",
                        borderRadius: 12,
                        padding: 14,
                        marginBottom: 10,
                        borderWidth: 1.5,
                        borderColor: "#E2E8F0",
                      },
                      isSelected && {
                        borderColor: "#E45A92",
                        backgroundColor: "#FDF2F8",
                      },
                    ]}
                    onPress={() => toggleWizardPref(pref.key)}
                  >
                    <View
                      style={[
                        {
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          backgroundColor: "#F8F9FB",
                          alignItems: "center",
                          justifyContent: "center",
                          marginRight: 12,
                        },
                        isSelected && { backgroundColor: "#E45A92" },
                      ]}
                    >
                      <IconComponent
                        size={20}
                        color={isSelected ? "#fff" : "#64748B"}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          {
                            fontSize: 15,
                            fontWeight: "600",
                            color: "#1E293B",
                            marginBottom: 2,
                          },
                          isSelected && { color: "#BE185D" },
                        ]}
                      >
                        {pref.label}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: "#94A3B8",
                          lineHeight: 16,
                        }}
                      >
                        {pref.description}
                      </Text>
                    </View>
                    <View
                      style={[
                        {
                          width: 24,
                          height: 24,
                          borderRadius: 12,
                          borderWidth: 1.5,
                          borderColor: "#CBD5E1",
                          alignItems: "center",
                          justifyContent: "center",
                          marginLeft: 8,
                        },
                        isSelected && {
                          backgroundColor: "#E45A92",
                          borderColor: "#E45A92",
                        },
                      ]}
                    >
                      {isSelected && <Check size={14} color="#fff" />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={{ height: 40 }} />

            <TouchableOpacity
              onPress={generateMecResults}
              style={[
                styles.dashboardStyleBtn,
                { backgroundColor: "#E45A92", marginBottom: 12 },
              ]}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={[styles.dashboardStyleBtnText]}>
                    Assess WHO MEC Rules
                  </Text>
                  <Text
                    style={[
                      styles.arrow,
                      { color: "#FFF", marginLeft: 6, fontSize: 16 },
                    ]}
                  >
                    »
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setScreen("intake2")}
              style={styles.dashboardStyleBtnSecondary}
            >
              <Text style={styles.dashboardStyleBtnSecondaryText}>
                Back to Clinical Input
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* STEP 4: MEC TOOL RESULTS */}
      {screen === "mec_results" && (
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ padding: 20 }}
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={[styles.title, { marginBottom: 20, textAlign: "left" }]}
            >
              Step 4: Eligibility Rules
            </Text>

            {renderMECResults()}

            <View style={{ height: 40 }} />

            <TouchableOpacity
              onPress={generateRiskAssessment}
              style={[
                styles.dashboardStyleBtn,
                { backgroundColor: "#E45A92", marginBottom: 12 },
              ]}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <>
                  <Text style={[styles.dashboardStyleBtnText]}>
                    Run ML Discontinuation Risk
                  </Text>
                  <Text
                    style={[
                      styles.arrow,
                      { color: "#FFF", marginLeft: 6, fontSize: 16 },
                    ]}
                  >
                    »
                  </Text>
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setScreen("intake3")}
              style={styles.dashboardStyleBtnSecondary}
            >
              <Text style={styles.dashboardStyleBtnSecondaryText}>
                Back to Conditions Selection
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* STEP 5: FINAL RESULTS */}
      {screen === "results" && (
        <View style={{ flex: 1 }}>
          <ScrollView
            contentContainerStyle={{ padding: 20 }}
            showsVerticalScrollIndicator={false}
          >
            <Text
              style={[styles.title, { marginBottom: 20, textAlign: "left" }]}
            >
              Step 5: ML Risk Results
            </Text>
            <Text
              style={[
                styles.helperText,
                { textAlign: "left", marginBottom: 16 },
              ]}
            >
              Risk predictions for all eligible contraceptive methods based on
              MEC eligibility and history.
            </Text>

            {isLoading ? (
              <View style={{ padding: 40, alignItems: "center" }}>
                <ActivityIndicator size="large" color="#E45A92" />
                <Text style={{ marginTop: 12, color: "#64748B", fontSize: 14 }}>
                  Assessing risk for all eligible methods...
                </Text>
              </View>
            ) : (
              <>
                {Object.entries(allMethodResults).map(
                  ([methodName, result]) => {
                    if (!result) return null;
                    const nameToKey: Record<string, keyof MECResult> = {
                      Pills: "CHC",
                      Patch: "CHC",
                      Injectable: "DMPA",
                      Implant: "Implant",
                      "Copper IUD": "Cu-IUD",
                      "Intrauterine Device (IUD)": "LNG-IUD",
                    };
                    const mecKey = nameToKey[methodName];
                    const mecCat =
                      mecResults && mecKey ? mecResults[mecKey] : null;

                    return (
                      <View key={methodName} style={{ marginBottom: 12 }}>
                        <View
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            marginBottom: 6,
                            gap: 8,
                          }}
                        >
                          <Text
                            style={{
                              fontSize: 15,
                              fontWeight: "700",
                              color: "#1E293B",
                            }}
                          >
                            {methodName}
                          </Text>
                          {mecCat && (
                            <View
                              style={{
                                backgroundColor: getMECColor(
                                  mecCat as MECCategory,
                                ),
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: 6,
                              }}
                            >
                              <Text
                                style={{
                                  color: "#FFF",
                                  fontSize: 11,
                                  fontWeight: "bold",
                                }}
                              >
                                MEC {mecCat}
                              </Text>
                            </View>
                          )}
                        </View>
                        <RiskAssessmentCard
                          riskLevel={result.risk_level}
                          confidence={result.confidence}
                          recommendation={result.recommendation}
                          contraceptiveMethod={methodName}
                          keyFactors={generateKeyFactors(
                            formData,
                            result.risk_level,
                          )}
                          upgradedByDt={result.upgraded_by_dt}
                        />
                      </View>
                    );
                  },
                )}

                <View style={{ height: 40 }} />
              </>
            )}

            <TouchableOpacity
              onPress={handleSaveAndFinish}
              style={[
                styles.dashboardStyleBtn,
                { backgroundColor: "#10B981", marginBottom: 12 },
              ]}
            >
              <Text style={[styles.dashboardStyleBtnText]}>Save & Finish</Text>
              <CheckCircle2 color="#FFF" size={20} style={{ marginLeft: 6 }} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setScreen("mec_results")}
              style={styles.dashboardStyleBtnSecondary}
            >
              <Text style={styles.dashboardStyleBtnSecondaryText}>
                Back to MEC Rules
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      <Modal
        animationType="slide"
        transparent={true}
        visible={selectorVisible}
        onRequestClose={() => setSelectorVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.selectorContent}>
            <View style={styles.selectorHeader}>
              <Text style={styles.selectorTitle}>
                Select {activeSelectorStep?.label || "Option"}
              </Text>
              <TouchableOpacity onPress={() => setSelectorVisible(false)}>
                <X size={24} color="#1E293B" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={
                activeSelectorStep?.options ||
                (activeSelectorStep?.range
                  ? Array.from(
                      {
                        length:
                          activeSelectorStep.range[1] -
                          activeSelectorStep.range[0] +
                          1,
                      },
                      (_, i) => String(activeSelectorStep.range[0] + i),
                    )
                  : [])
              }
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.methodItem}
                  onPress={() => {
                    if (activeSelectorStep) {
                      updateVal(item, activeSelectorStep.id);
                      setSelectorVisible(false);
                    }
                  }}
                >
                  <Text style={styles.methodText}>{item}</Text>
                  {activeSelectorStep &&
                    formData[activeSelectorStep.id] === item && (
                      <CheckCircle2 size={18} color="#E45A92" />
                    )}
                </TouchableOpacity>
              )}
              contentContainerStyle={{ paddingBottom: 20 }}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
};
export default ObAssessment;

const styles = StyleSheet.create({
  floatingFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#F8F9FB",
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
  },

  accordionContainer: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  accordionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    backgroundColor: "#FFFFFF",
  },
  accordionHeaderExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    backgroundColor: "#F8FAFC",
  },
  accordionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  accordionContent: {
    padding: 18,
    backgroundColor: "#FFFFFF",
  },

  container: {
    flex: 1,
    backgroundColor: "#d3347a",
  },
  // Welcome Screen Styles
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: "#d3347a",
    borderBottomWidth: 1,
    borderBottomColor: "#d3347a",
  },
  content: {
    flex: 1,
  },
  animationContainer: {
    flex: 1,
    zIndex: 10,
  },
  footer: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 45,
    borderTopRightRadius: 45,
    paddingHorizontal: 35,
    paddingTop: 25,
    alignItems: "center",
  },
  brandName: {
    fontSize: 14,
    color: "#d3347a",
    fontWeight: "800",
    letterSpacing: 3,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1D2939",
    textAlign: "center",
    lineHeight: 36,
    fontStyle: "italic",
    paddingBottom: 10,
  },
  bottomBarContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  pillContainer: {
    backgroundColor: "#d3347a", // Primary Pink
    height: 90,
    borderRadius: 45,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    shadowColor: "#d3347a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 10,
  },
  textBtn: {
    paddingLeft: 30,
  },
  doItLaterText: {
    color: "#FFD3E2",
    fontSize: 16,
    fontWeight: "600",
  },
  assessmentBtn: {
    backgroundColor: "#FFFFFF",
    height: 70,
    borderRadius: 35,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  assessmentBtnText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "700",
  },
  arrowIcon: {
    fontSize: 18,
    fontWeight: "800",
    color: "#000",
    marginLeft: 5,
  },
  // Assessment Flow Styles
  progressHeader: { padding: 20 },
  progressBg: { height: 6, backgroundColor: "#F2F4F7", borderRadius: 3 },
  progressFill: { height: 6, backgroundColor: "#d3347a", borderRadius: 3 },
  stepContent: { flex: 1, paddingHorizontal: 25 },
  title: {
    fontSize: 26,
    fontWeight: "800",
    color: "#101828",
    textAlign: "center",
  },
  subTitle: {
    fontSize: 15,
    color: "#667085",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 25,
  },
  optionBtn: {
    backgroundColor: "#F9FAFB",
    padding: 18,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#EAECF0",
  },
  selectedBtn: { backgroundColor: "#d3347a", borderColor: "#d3347a" },
  optionText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#475467",
    textAlign: "center",
  },
  selectedText: { color: "#FFF" },
  dropdown: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 12 },
  stepFooter: { padding: 20, paddingBottom: 30 },
  pillBar: {
    backgroundColor: "#d3347a",
    height: 85,
    borderRadius: 42,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  backBtn: { paddingLeft: 20 },
  backBtnText: { color: "#FFD3E2", fontSize: 16, fontWeight: "600" },
  nextBtn: {
    backgroundColor: "#FFF",
    height: 65,
    borderRadius: 33,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  nextBtnText: { color: "#000", fontSize: 16, fontWeight: "700" },
  arrow: { fontSize: 18, fontWeight: "800", color: "#000" },
  reviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F2F4F7",
  },
  reviewL: { fontSize: 13, color: "#667085" },
  reviewV: { fontSize: 16, color: "#101828", fontWeight: "700" },
  editText: { color: "#d3347a", fontWeight: "700" },

  // New Styles
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
    marginBottom: 0,
  },
  cardSection: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475467",
    marginBottom: 8,
  },
  wheelContainer: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    overflow: "hidden",
    height: 150,
  },
  textInput: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    padding: 20,
    borderRadius: 16,
    fontSize: 18,
    color: "#1E293B",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  // New Footer Styles for Review Screen
  reviewFooterContainer: {
    width: "100%",
    alignItems: "center",
    gap: 12,
  },
  dashboardStyleBtn: {
    backgroundColor: "#E45A92",
    borderRadius: 12,
    height: 48,
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E45A92",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  dashboardStyleBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  dashboardStyleBtnSecondary: {
    backgroundColor: "transparent",
    paddingVertical: 10,
    width: "100%",
    alignItems: "center",
  },
  dashboardStyleBtnSecondaryText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#101828",
  },
  closeModalBtn: {
    marginTop: 20,
    backgroundColor: "#d3347a",
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: "center",
  },
  closeModalBtnText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "700",
  },
  // Selector Styles
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 18,
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dropdownTextSelected: {
    fontSize: 16,
    color: "#1E293B",
    fontWeight: "600",
  },
  dropdownTextPlaceholder: {
    fontSize: 16,
    color: "#94A3B8",
  },
  helperText: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 8,
    textAlign: "center",
    fontStyle: "italic",
  },
  selectorContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    height: "80%", // Bottom sheet style
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  selectorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  selectorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1E293B",
  },
  sectionHeader: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 10,
    marginTop: 15,
  },
  sectionHeaderText: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  methodItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 5,
    backgroundColor: "#F8FAFC",
  },
  methodText: {
    fontSize: 16,
    color: "#334155",
    fontWeight: "500",
  },
});
