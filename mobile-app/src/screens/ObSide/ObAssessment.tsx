import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  CheckCircle2,
  Check,
  Heart,
  ShieldCheck,
  Clock,
  EyeOff,
  UserCheck,
  Leaf,
  Shield,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";

import {
  assessDiscontinuationRisk,
  UserAssessmentData,
  RiskAssessmentResponse,
} from "../../services/discontinuationRiskService";
import {
  calculateWhoMecTool,
  MECResult,
  getMECColor,
  MECCategory,
  METHOD_ATTRIBUTES,
  getDisplayNameFromModelKey,
  MODEL_KEY_TO_MEC_ID,
} from "../../services/mecService";
import RiskAssessmentCard, {
  generateKeyFactors,
} from "../../components/RiskAssessmentCard";
import { auth } from "../../config/firebaseConfig";
import { saveAssessment, AssessmentRecord } from "../../services/doctorService";
import ObHeader from "../../components/ObHeader";
import { WHO_MEC_CONDITIONS } from "../../data/whoMecData";
import { MecTreeSelector } from "../../components/MecTreeSelector";
import { colors, shadows } from "../../theme";

// ─── Field Definitions (9 V4 features + patient name) ───────────────────────

const FORM_FIELDS = [
  {
    id: "NAME",
    label: "Patient Name",
    type: "text",
    placeholder: "Enter patient name",
  },
  {
    id: "AGE",
    label: "Patient Age",
    type: "numeric",
    placeholder: "e.g. 28",
  },
  {
    id: "HUSBAND_AGE",
    label: "Husband / Partner Age",
    type: "numeric",
    placeholder: "e.g. 32",
  },
  {
    id: "ETHNICITY",
    label: "Ethnicity",
    type: "select",
    options: [
      "Tagalog",
      "Ilocano",
      "Cebuano",
      "Hiligaynon/Ilonggo",
      "Bikol/Bicol",
      "Waray",
      "Kapampangan",
      "Pangasinan",
      "Other Filipinos",
      "Other ethnicity",
    ],
  },
  {
    id: "HOUSEHOLD_HEAD_SEX",
    label: "Household Head Sex",
    type: "select",
    options: ["Male", "Female", "Shared/Both", "Others"],
  },
  {
    id: "SMOKE_CIGAR",
    label: "Smoking Habits",
    type: "select",
    options: ["Never", "Former smoker", "Occasional smoker", "Current daily"],
  },
  {
    id: "PARITY",
    label: "Number of Children (Parity)",
    type: "numeric",
    placeholder: "e.g. 2",
  },
  {
    id: "DESIRE_FOR_MORE_CHILDREN",
    label: "Desire for More Children",
    type: "select",
    options: [
      "Wants more children",
      "Wants no more children",
      "Undecided/ambivalent",
      "Sterilised (self or partner)",
      "Not applicable",
    ],
  },
  {
    id: "PATTERN_USE",
    label: "Pattern of Use",
    type: "select",
    options: [
      "Current user",
      "Recent user (stopped within 12 months)",
      "Past user (stopped >12 months ago)",
    ],
  },
];

// ─── Method → MEC key mapping ────────────────────────────────────────────────

const METHOD_NAME_TO_INDEX: Record<string, number> = {
  Pills: 1,
  "Copper IUD": 2,
  "Intrauterine Device (IUD)": 3,
  Implant: 4,
  Patch: 5,
  Injectable: 6,
};

// ─── Preferences ─────────────────────────────────────────────────────────────

const PREFERENCES = [
  { key: "regular", label: "Regular Bleeding", description: "Helps regulate periods and reduce cramps", icon: Heart },
  { key: "effectiveness", label: "Highly Effective", description: "Most reliable at preventing pregnancy", icon: ShieldCheck },
  { key: "longterm", label: "Long Lasting", description: "Lasts for years with minimal maintenance", icon: Clock },
  { key: "privacy", label: "Privacy", description: "Can be used discreetly without others knowing", icon: EyeOff },
  { key: "client", label: "Client Controlled", description: "Patient can start or stop it themselves", icon: UserCheck },
  { key: "nonhormonal", label: "No Hormones", description: "Hormone-free contraceptive option", icon: Leaf },
];

// ─── Component ───────────────────────────────────────────────────────────────

const ObAssessment = ({ navigation, route }: any) => {
  const hasPatientData = !!route.params?.record;

  // screen: 'form' → 'mec' → 'mec_results' → 'results'
  const [screen, setScreen] = useState(hasPatientData ? "results" : "form");
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Results state
  const [allMethodResults, setAllMethodResults] = useState<
    Record<string, RiskAssessmentResponse | null>
  >({});
  const [, setMethodEligibility] = useState<Record<string, number>>({});
  const [mecResults, setMecResults] = useState<MECResult | null>(null);

  // MEC state
  const [mecConditionIds, setMecConditionIds] = useState<string[]>([]);
  const [mecPrefs, setMecPrefs] = useState<string[]>([]);

  // Modal selector
  const [openDropdownFieldId, setOpenDropdownFieldId] = useState<string | null>(null);

  // Clinical notes
  const [clinicalNotes, setClinicalNotes] = useState("");

  // ─── Load existing record (view mode) ─────────────────────────────────────

  const resetToNewAssessment = () => {
    setFormData({});
    setClinicalNotes("");
    setAllMethodResults({});
    setMecResults(null);
    setMecConditionIds([]);
    setMecPrefs([]);
    setOpenDropdownFieldId(null);
    setScreen("form");
  };

  const handleExitAssessment = () => {
    Alert.alert(
      "Exit Assessment",
      "Are you sure you want to exit?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Exit",
          style: "destructive",
          onPress: () => navigation.navigate("ObHome"),
        },
      ]
    );
  };

  useEffect(() => {
    const record = route.params?.record as AssessmentRecord | undefined;
    if (!record) {
      resetToNewAssessment();
      return;
    }

    setFormData(record.patientData || {});
    setClinicalNotes(record.clinicalNotes || "");
    setMecConditionIds(record.mecConditionIds || []);
    setMecPrefs(record.mecPreferences || []);

    if (record.riskResults) {
      const restored: Record<string, RiskAssessmentResponse> = {};
      Object.entries(record.riskResults).forEach(([method, res]) => {
        restored[method] = {
          risk_level: res.riskLevel as "LOW" | "HIGH",
          confidence: res.confidence,
          recommendation: res.recommendation,
          xgb_probability: res.probability,
          upgraded_by_dt: false,
        };
      });
      setAllMethodResults(restored);
    }

    if (record.mecResults) {
      setMecResults(record.mecResults as any);
    }

    setScreen("results");
  }, [route.params]);

  // ─── Helpers ──────────────────────────────────────────────────────────────

  const updateVal = (val: string, id: string) =>
    setFormData((prev) => ({ ...prev, [id]: val }));

  const toggleCondition = (id: string) => {
    setMecConditionIds((prev) => {
      if (prev.includes(id)) return prev.filter((c) => c !== id);
      if (prev.length >= 3) {
        Alert.alert("Limit Reached", "Max 3 conditions for MEC tool.");
        return prev;
      }
      return [...prev, id];
    });
  };

  const togglePref = (key: string) =>
    setMecPrefs((prev) => {
      if (prev.includes(key)) {
        return prev.filter((k) => k !== key);
      }

      if (prev.length >= 3) {
        Alert.alert("Limit Reached", "You can select up to 3 preferences only.");
        return prev;
      }

      return [...prev, key];
    });

  // ─── Validation ───────────────────────────────────────────────────────────

  const validateForm = (): boolean => {
    if (!formData.AGE || isNaN(Number(formData.AGE))) {
      Alert.alert("Required", "Please enter a valid patient age.");
      return false;
    }
    if (!formData.ETHNICITY) {
      Alert.alert("Required", "Please select the patient's ethnicity.");
      return false;
    }
    return true;
  };

  // ─── MEC calculation ──────────────────────────────────────────────────────

  const generateMecResults = () => {
    if (mecPrefs.length > 3) {
      Alert.alert("Validation", "Please select up to 3 preferences only.");
      return;
    }

    setIsLoading(true);
    try {
      const age = parseInt(formData.AGE) || 25;
      const mecOut = calculateWhoMecTool({
        age,
        conditionIds: mecConditionIds,
        preferences: mecPrefs,
      });

      setMecResults(mecOut.mecCategories as MECResult);
      const eligibility: Record<string, number> = {};
      (Object.keys(mecOut.mecCategories) as Array<keyof typeof mecOut.mecCategories>).forEach(
        (key) => { eligibility[key] = mecOut.mecCategories[key]; }
      );
      setMethodEligibility(eligibility);
      setScreen("mec_results");
    } catch (e: any) {
      Alert.alert("MEC Calculation Failed", e.message || "Failed to calculate criteria.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Risk assessment ──────────────────────────────────────────────────────

  const generateRiskAssessment = async () => {
    setIsLoading(true);
    try {
      if (!mecResults) {
        Alert.alert("Missing MEC Data", "Please run MEC check first.");
        return;
      }

      const nameToKey = MODEL_KEY_TO_MEC_ID;

      const eligibleMethods = Object.keys(METHOD_NAME_TO_INDEX).filter((m) => {
        const cat = (mecResults as any)[nameToKey[m]] || 1;
        return cat <= 3;
      });

      if (eligibleMethods.length === 0) {
        Alert.alert("No Eligible Methods", "No methods are eligible based on MEC results.");
        return;
      }

      const results: Record<string, RiskAssessmentResponse | null> = {};
      for (const methodName of eligibleMethods) {
        try {
          const result = await assessDiscontinuationRisk({
            ...formData,
            CONTRACEPTIVE_METHOD: methodName,
          } as unknown as UserAssessmentData);

          const cat = (mecResults as any)[nameToKey[methodName]] || 1;
          if (cat >= 3 && result) {
            result.risk_level = "HIGH";
            result.recommendation = `Medical risks present (MEC Cat ${cat}). Strong clinical counseling required.`;
            result.upgraded_by_dt = true;
          }
          results[methodName] = result;
        } catch (err: any) {
          console.warn(`Risk assessment failed for ${methodName}:`, err.message);
          results[methodName] = null;
        }
      }

      if (Object.values(results).every((r) => r === null)) {
        Alert.alert("Prediction Failed", "Could not generate risk predictions.");
        return;
      }

      setAllMethodResults(results);
      setScreen("results");
    } catch (err: any) {
      Alert.alert("Assessment Failed", err.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Save ─────────────────────────────────────────────────────────────────

  const handleSaveAndFinish = async () => {
    const resultCount = Object.values(allMethodResults).filter((r) => r !== null).length;
    if (resultCount === 0) {
      Alert.alert("No Assessment", "Please generate risk assessments first.");
      return;
    }

    setIsLoading(true);
    try {
      const currentUser = auth.currentUser;
      const doctorId = currentUser?.uid || "unknown";
      const doctorName =
        route.params?.doctorName ||
        "Dr. " + (currentUser?.email?.split("@")[0] || "OB");

      const hasHighRisk = Object.values(allMethodResults).some((r) => r?.risk_level === "HIGH");

      const riskResults: AssessmentRecord["riskResults"] = {};
      Object.entries(allMethodResults).forEach(([method, result]) => {
        if (result) {
          riskResults[method] = {
            riskLevel: result.risk_level,
            probability: result.xgb_probability || 0,
            recommendation: result.recommendation,
            confidence: result.confidence,
          };
        }
      });

      const mecResultsToSave: Record<string, number> = {};
      if (mecResults) {
        Object.entries(mecResults).forEach(([k, v]) => { mecResultsToSave[k] = v as number; });
      }

      const createdAt = new Date().toISOString();
      const record: AssessmentRecord = {
        id: `${doctorId}_${Date.now()}`,
        doctorId,
        doctorName,
        patientName: formData.NAME || "Unknown Patient",
        patientData: formData,
        mecResults: mecResultsToSave,
        mecConditionIds,
        mecPreferences: mecPrefs,
        riskResults,
        clinicalNotes: clinicalNotes.trim() || "",
        status: hasHighRisk ? "critical" : "completed",
        createdAt,
        pendingSync: true,
      };

      await saveAssessment(record);
      Alert.alert("Saved", "Assessment saved to your records.");
      navigation.navigate("ObMainTabs", { screen: "ObHome" });
    } catch {
      Alert.alert("Save Failed", "Could not save the assessment. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // ─── Field renderer ───────────────────────────────────────────────────────

  const renderField = (field: any) => (
    <View key={field.id} style={styles.fieldGroup}>
      <Text style={styles.inputLabel}>{field.label}</Text>
      {field.type === "text" || field.type === "numeric" ? (
        <TextInput
          style={styles.textInput}
          placeholder={field.placeholder}
          placeholderTextColor="#94A3B8"
          value={formData[field.id] || ""}
          onChangeText={(val) => updateVal(val, field.id)}
          keyboardType={field.type === "numeric" ? "numeric" : "default"}
        />
      ) : (
        <View>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() =>
              setOpenDropdownFieldId((prev) => (prev === field.id ? null : field.id))
            }
            activeOpacity={0.85}
          >
            <Text
              style={
                formData[field.id]
                  ? styles.dropdownTextSelected
                  : styles.dropdownTextPlaceholder
              }
            >
              {formData[field.id] || "Select…"}
            </Text>
            {openDropdownFieldId === field.id ? (
              <ChevronUp size={20} color="#64748B" />
            ) : (
              <ChevronDown size={20} color="#64748B" />
            )}
          </TouchableOpacity>

          {openDropdownFieldId === field.id ? (
            <View style={styles.dropdownPanel}>
              {(field.options || []).map((option: string) => {
                const isSelected = formData[field.id] === option;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.dropdownOption, isSelected && styles.dropdownOptionSelected]}
                    onPress={() => {
                      updateVal(option, field.id);
                      setOpenDropdownFieldId(null);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.dropdownOptionText,
                        isSelected && styles.dropdownOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>
                    {isSelected ? <CheckCircle2 size={20} color={colors.primary} /> : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : null}
        </View>
      )}
    </View>
  );

  // ─── MEC results renderer ─────────────────────────────────────────────────

  const renderMECResults = () => {
    if (!mecResults) return null;
    const getConditionLabel = (id: string) => {
      const entry = WHO_MEC_CONDITIONS.find((c) => c.id === id);
      if (!entry) return id;
      let label = entry.condition;
      if (entry.subCondition) label += ` — ${entry.subCondition}`;
      if (entry.variant) label += ` (${entry.variant === "I" ? "Initiation" : "Continuation"})`;
      return label;
    };

    const methodMap: Record<string, { label: string; image: any }> = {
      CHC: { label: "Combined Hormonal Contraceptive (CHC)", image: require("../../../assets/image/sq_chcpills.png") },
      POP: { label: "Progestogen-only Pill (POP)", image: require("../../../assets/image/sq_poppills.png") },
      DMPA: { label: "Injectable (DMPA)", image: require("../../../assets/image/sq_dmpainj.png") },
      Implant: { label: "Implant (LNG/ETG)", image: require("../../../assets/image/sq_lngetg.png") },
      "Cu-IUD": { label: "Copper IUD (Cu-IUD)", image: require("../../../assets/image/sq_cuiud.png") },
      "LNG-IUD": { label: "LNG-IUD (Levonorgestrel-IUD)", image: require("../../../assets/image/sq_lngiud.png") },
    };

    const getMatchedPreferenceLabels = (methodId: string): string[] => {
      const attrs = METHOD_ATTRIBUTES.find((m) => m.id === methodId);
      if (!attrs || !mecPrefs || mecPrefs.length === 0) return [];
      return mecPrefs
        .filter((pref) =>
          (pref === "effectiveness" && attrs.isHighlyEffective) ||
          (pref === "nonhormonal" && attrs.isNonHormonal) ||
          (pref === "regular" && attrs.regulatesBleeding) ||
          (pref === "privacy" && attrs.isPrivate) ||
          (pref === "client" && attrs.isClientControlled) ||
          (pref === "longterm" && attrs.isLongActing)
        )
        .map((pref) => {
          const p = PREFERENCES.find((pItem) => pItem.key === pref);
          return p?.label || pref;
        });
    };

    return (
      <View>
        <View style={styles.conditionSummary}>
          <Text style={styles.conditionSummaryTitle}>Patient Summary</Text>

          <View style={styles.summaryRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.summarySectionLabel}>Age</Text>
              <Text style={styles.summaryValue}>{formData.AGE || "—"}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summarySectionLabel}>Status</Text>
              <Text style={styles.summaryValue}>OB Assessment</Text>
            </View>
          </View>

          <Text style={styles.summarySectionLabel}>Conditions ({mecConditionIds.length})</Text>
          {mecConditionIds.length > 0 ? (
            mecConditionIds.map((id) => (
              <Text key={id} style={styles.summaryItem}>• {getConditionLabel(id)}</Text>
            ))
          ) : (
            <Text style={styles.summaryItem}>• None selected</Text>
          )}

          {mecPrefs.length > 0 && (
            <>
              <Text style={styles.summarySectionLabel}>Preferences ({mecPrefs.length})</Text>
              {mecPrefs.map((key) => {
                const p = PREFERENCES.find((pref) => pref.key === key);
                return (
                  <Text key={key} style={styles.summaryItem}>• {p?.label || key}</Text>
                );
              })}
            </>
          )}
        </View>

        {([1, 2, 3, 4] as MECCategory[]).map((cat) => {
          // Use METHOD_ATTRIBUTES to ensure identical ordering and naming
          const methodsInCat = METHOD_ATTRIBUTES
            .filter(attr => (mecResults as any)[attr.id] === cat)
            .map(attr => ({
              id: attr.id,
              label: attr.name,
              image: methodMap[attr.id]?.image,
            }));
          if (methodsInCat.length === 0) return null;
          return (
            <View key={cat} style={{ marginBottom: 8 }}>
              <View style={styles.mecCatRow}>
                <View style={styles.mecCatBadge}>
                  <Text style={styles.mecCatBadgeText}>{cat}</Text>
                </View>
                <Text style={styles.mecCatDesc}>
                  {cat === 1 ? "Safe - No Restrictions"
                    : cat === 2 ? "Generally Safe - Benefits > Risks"
                      : cat === 3 ? "Use with Caution - Risks > Benefits"
                        : "Not Recommended - Do Not Use"}
                </Text>
              </View>
              <View style={styles.mecMethodCard}>
                {methodsInCat.map((method, i) => {
                  const matchedPrefs = getMatchedPreferenceLabels(method.id);
                  return (
                    <View
                      key={`${method.id}_${i}`}
                      style={[
                        styles.mecMethodItem,
                        i < methodsInCat.length - 1 && styles.mecMethodItemBorder,
                      ]}
                    >
                      <View style={styles.mecMethodRow}>
                        {method.image ? (
                          <View style={[styles.mecMethodImageWrap, { borderColor: getMECColor(cat) }]}> 
                            <Image source={method.image} style={styles.mecMethodImage} resizeMode="cover" />
                          </View>
                        ) : null}
                        <View style={styles.mecMethodContent}>
                          <Text style={styles.mecMethodText}>{method.label}</Text>
                          {matchedPrefs.length > 0 && (
                            <View style={styles.methodPrefRow}>
                              {matchedPrefs.map((prefLabel) => (
                                <View key={`${method.id}_${prefLabel}`} style={styles.methodPrefChip}>
                                  <Text style={styles.methodPrefChipText}>{prefLabel}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────

  const currentStep =
    screen === "form" ? 1 : screen === "mec" ? 2 : screen === "mec_results" ? 3 : 4;

  const steps = [
    { id: 1, label: "Details" },
    { id: 2, label: "MEC" },
    { id: 3, label: "Rules" },
    { id: 4, label: "Results" },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ObHeader
        title="Patient Assessment"
        subtitle={formData?.NAME || "New Patient"}
        showBack
        onBackPress={handleExitAssessment}
      />

      <View style={styles.stepperWrap}>
        {steps.map((step) => {
          const isDone = step.id < currentStep;
          const isActive = step.id === currentStep;
          return (
            <View key={step.id} style={styles.stepItem}>
              <View
                style={[
                  styles.stepDot,
                  isDone && styles.stepDotDone,
                  isActive && styles.stepDotActive,
                ]}
              >
                {isDone ? (
                  <Check size={16} color="#FFFFFF" strokeWidth={3} />
                ) : (
                  <Text
                    style={[
                      styles.stepDotText,
                      (isDone || isActive) && styles.stepDotTextActive,
                    ]}
                  >
                    {step.id}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.stepLabel,
                  (isDone || isActive) && styles.stepLabelActive,
                ]}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* ── SCREEN 1: FORM (9 V4 features) ─────────────────────────────── */}
      {screen === "form" && (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.screenTitle}>Patient Details</Text>
            <Text style={styles.screenSubtitle}>
              Fill in the 9 key factors used by the risk model.
            </Text>

            <View style={styles.cardSection}>
              {FORM_FIELDS.map(renderField)}
            </View>

            <View style={{ height: 24 }} />

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => {
                if (validateForm()) setScreen("mec");
              }}
            >
              <Text style={styles.primaryBtnText}>Next: MEC Assessment</Text>
              <ChevronRight size={18} color="#FFF" />
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      )}

      {/* ── SCREEN 2: MEC CONDITIONS + PREFERENCES ──────────────────────── */}
      {screen === "mec" && (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.screenTitle}>MEC Assessment</Text>
          <Text style={styles.screenSubtitle}>
            Select up to 3 medical conditions, then choose patient preferences.
          </Text>

          <View style={styles.cardSection}>
            <MecTreeSelector
              selectedConditions={mecConditionIds}
              onToggleCondition={toggleCondition}
              maxConditions={3}
            />

            <Text style={[styles.inputLabel, { marginTop: 24, marginBottom: 12 }]}>
              Patient Preferences
            </Text>
            {PREFERENCES.map((pref) => {
              const isSelected = mecPrefs.includes(pref.key);
              const IconComponent = pref.icon;
              return (
                <TouchableOpacity
                  key={pref.key}
                  style={[styles.prefRow, isSelected && styles.prefRowSelected]}
                  onPress={() => togglePref(pref.key)}
                >
                  <View style={[styles.prefIcon, isSelected && styles.prefIconSelected]}>
                    <IconComponent size={20} color={isSelected ? "#fff" : "#64748B"} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.prefLabel, isSelected && styles.prefLabelSelected]}>
                      {pref.label}
                    </Text>
                    <Text style={styles.prefDesc}>{pref.description}</Text>
                  </View>
                  <View style={[styles.prefCheck, isSelected && styles.prefCheckSelected]}>
                    {isSelected && <Check size={16} color="#fff" />}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ height: 24 }} />

          <TouchableOpacity
            style={[styles.primaryBtn, { marginBottom: 12 }]}
            onPress={generateMecResults}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.primaryBtnText}>Assess WHO MEC Rules</Text>
                <ChevronRight size={18} color="#FFF" />
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setScreen("form")}>
            <ChevronLeft size={16} color="#6B4254" />
            <Text style={styles.secondaryBtnText}>Back to Patient Details</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── SCREEN 3: MEC RESULTS ────────────────────────────────────────── */}
      {screen === "mec_results" && (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.screenTitle}>Eligibility Rules</Text>
          <Text style={styles.screenSubtitle}>
            WHO Medical Eligibility Criteria results by method.
          </Text>

          {renderMECResults()}

          <View style={{ height: 24 }} />

          <TouchableOpacity
            style={[styles.primaryBtn, { marginBottom: 12 }]}
            onPress={generateRiskAssessment}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <>
                <Text style={styles.primaryBtnText}>Run ML Discontinuation Risk</Text>
                <ChevronRight size={18} color="#FFF" />
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setScreen("mec")}>
            <ChevronLeft size={16} color="#6B4254" />
            <Text style={styles.secondaryBtnText}>Back to Conditions</Text>
          </TouchableOpacity>

          {isLoading ? (
            <View style={styles.mecLoadingCard}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.mecLoadingText}>Running ML discontinuation risk assessment...</Text>
            </View>
          ) : null}
        </ScrollView>
      )}

      {/* ── SCREEN 4: RISK RESULTS ───────────────────────────────────────── */}
      {screen === "results" && (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.screenTitle}>ML Risk Results</Text>
          <Text style={styles.screenSubtitle}>
            Discontinuation risk for each eligible method.
          </Text>

          {isLoading ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color="#E45A92" />
              <Text style={styles.loadingText}>Assessing risk for eligible methods…</Text>
            </View>
          ) : (
            <>
              {Object.entries(allMethodResults).map(([methodName, result]) => {
                if (!result) return null;
                const mecKey = MODEL_KEY_TO_MEC_ID[methodName];
                const mecCat = mecResults && mecKey ? (mecResults as any)[mecKey] : null;

                const mecCardStyle = mecCat
                  ? {
                    borderColor: getMECColor(mecCat as MECCategory),
                    borderWidth: 1.5,
                  }
                  : undefined;

                return (
                  <View key={methodName} style={{ marginBottom: 10 }}>
                    <View style={styles.methodHeader}>
                      <Text style={styles.methodName}>{getDisplayNameFromModelKey(methodName)}</Text>
                      {mecCat && (
                        <View style={[styles.mecBadge, { backgroundColor: getMECColor(mecCat as MECCategory) }]}>
                          <Text style={styles.mecBadgeText}>MEC {mecCat}</Text>
                        </View>
                      )}
                    </View>
                    <RiskAssessmentCard
                      riskLevel={result.risk_level}
                      confidence={result.confidence}
                      recommendation={result.recommendation}
                      contraceptiveMethod={methodName}
                      keyFactors={generateKeyFactors(formData, result.risk_level)}
                      upgradedByDt={result.upgraded_by_dt}
                      mecCategory={mecCat as 1 | 2 | 3 | 4 | undefined}
                      style={mecCardStyle}
                    />
                  </View>
                );
              })}
            </>
          )}

          {/* ── Clinical Notes ── */}
          <View style={[styles.cardSection, { marginBottom: 0 }]}>
            <Text style={styles.inputLabel}>Clinical Notes</Text>
            <TextInput
              style={[styles.textInput, { height: 90, textAlignVertical: "top", paddingTop: 10 }]}
              placeholder="Add any clinical observations, referrals, or follow-up instructions…"
              placeholderTextColor="#94A3B8"
              value={clinicalNotes}
              onChangeText={setClinicalNotes}
              multiline
            />
          </View>

          <View style={{ height: 24 }} />

          <TouchableOpacity
            style={[styles.primaryBtn, { backgroundColor: colors.primary, marginBottom: 12 }]}
            onPress={handleSaveAndFinish}
          >
            <Text style={styles.primaryBtnText}>Save & Finish</Text>
            <CheckCircle2 color="#FFF" size={20} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setScreen("mec_results")}>
            <ChevronLeft size={16} color="#6B4254" />
            <Text style={styles.secondaryBtnText}>Back to MEC Rules</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
};

export default ObAssessment;

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FDF7FA",
  },
  stepperWrap: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
    backgroundColor: "#FFF8FC",
    borderBottomWidth: 1,
    borderBottomColor: "#F8DDE9",
  },
  stepItem: {
    alignItems: "center",
    flex: 1,
  },
  stepDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3E8EF",
    borderWidth: 1,
    borderColor: "#E4CFDB",
  },
  stepDotDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepDotActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  stepDotText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#8A7A83",
  },
  stepDotTextActive: {
    color: "#FFFFFF",
  },
  stepLabel: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "600",
    color: "#8A7A83",
  },
  stepLabelActive: {
    color: colors.primary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 28,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text.primary,
    marginBottom: 4,
  },
  screenSubtitle: {
    fontSize: 14.5,
    color: colors.text.secondary,
    marginBottom: 13,
    lineHeight: 20,
  },
  cardSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    padding: 18,
    borderWidth: 1,
    borderColor: "#F3DCE8",
    ...shadows.sm,
    shadowColor: colors.primary,
    shadowOpacity: 0.08,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text.primary,
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#FFFCFE",
    paddingHorizontal: 14,
    height: 52,
    borderRadius: 14,
    fontSize: 15,
    color: colors.text.primary,
    borderWidth: 1,
    borderColor: "#EFD8E5",
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    height: 52,
    backgroundColor: "#FFFCFE",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#EFD8E5",
  },
  dropdownTextSelected: {
    fontSize: 15,
    color: "#1E293B",
    fontWeight: "500",
    flex: 1,
  },
  dropdownTextPlaceholder: {
    fontSize: 15,
    color: "#94A3B8",
    flex: 1,
  },
  dropdownPanel: {
    marginTop: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#EFD8E5",
    overflow: "hidden",
  },
  dropdownOption: {
    minHeight: 46,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F6E8EF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFFFF",
  },
  dropdownOptionSelected: {
    backgroundColor: "#FFF5FA",
  },
  dropdownOptionText: {
    flex: 1,
    fontSize: 14,
    color: "#334155",
    fontWeight: "500",
    marginRight: 10,
  },
  dropdownOptionTextSelected: {
    color: colors.primary,
    fontWeight: "700",
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    height: 55,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 7,
    elevation: 4,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "800",
    marginRight: 6,
  },
  secondaryBtn: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 55,
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#FFF8FC",
    borderWidth: 1,
    borderColor: "#EFD8E5",
  },
  secondaryBtnText: {
    color: "#6B4254",
    fontSize: 17,
    fontWeight: "700",
  },
  // Preferences
  prefRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
  },
  prefRowSelected: {
    borderColor: colors.primary,
    backgroundColor: "#FDF2F8",
  },
  prefIcon: {
    width: 45,
    height: 45,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  prefIconSelected: {
    backgroundColor: colors.primary,
  },
  prefLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  prefLabelSelected: {
    color: "#BE185D",
  },
  prefDesc: {
    fontSize: 14,
    color: "#94A3B8",
    lineHeight: 16,
  },
  prefCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  prefCheckSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  // MEC results
  conditionSummary: {
    marginBottom: 20,
    padding: 14,
    backgroundColor: "#F8F9FB",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  conditionSummaryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  conditionSummaryItem: {
    fontSize: 15,
    color: "#334155",
    marginBottom: 4,
  },
  summaryRow: {
    flexDirection: "row",
    gap: 20,
    marginBottom: 8,
  },
  summarySectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  summaryItem: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 2,
  },
  mecCatRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  mecCatBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "#F8F1F5",
    borderWidth: 1,
    borderColor: "#EFD8E5",
  },
  mecCatBadgeText: {
    color: "#6B4254",
    fontWeight: "bold",
    fontSize: 14,
  },
  mecCatDesc: {
    color: "#64748B",
    fontSize: 14,
    flex: 1,
    flexWrap: "wrap",
  },
  mecMethodCard: {
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
  },
  mecMethodItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  mecMethodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  mecMethodImageWrap: {
    width: 60,
    height: 60,
    borderRadius: 90,
    overflow: "hidden",
    borderWidth: 2.5,
    borderColor: "#EBD5E1",
    backgroundColor: "#FFF",
  },
  mecMethodImage: {
    width: "100%",
    height: "100%",
  },
  mecMethodItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  mecMethodText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 19,
    fontWeight: "600",
    color: "#334155",
  },
  mecMethodContent: {
    flex: 1,
  },
  methodPrefRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 8,
  },
  methodPrefChip: {
    backgroundColor: "#F0F9FF",
    borderWidth: 1,
    borderColor: "#BAE6FD",
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  methodPrefChipText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0369A1",
  },
  mecLoadingCard: {
    marginTop: 8,
    backgroundColor: "#FFF8FC",
    borderWidth: 1,
    borderColor: "#F3DCE8",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
  },
  mecLoadingText: {
    marginLeft: 10,
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: "600",
  },
  // Risk results
  loadingBox: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 14,
    color: "#64748B",
    fontSize: 14,
  },
  methodHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  methodName: {
    fontSize: 16.5,
    fontWeight: "700",
    color: "#1E293B",
  },
  mecBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  mecBadgeText: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "bold",
  },
});
