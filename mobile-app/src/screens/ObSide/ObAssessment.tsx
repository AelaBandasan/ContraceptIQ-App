import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  StatusBar,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import {
  X,
  CheckCircle2,
  Check,
  Heart,
  ShieldCheck,
  Clock,
  EyeOff,
  UserCheck,
  Leaf,
  Shield,
  ChevronDown,
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
} from "../../services/mecService";
import RiskAssessmentCard, {
  generateKeyFactors,
} from "../../components/RiskAssessmentCard";
import { auth } from "../../config/firebaseConfig";
import { saveAssessment, AssessmentRecord } from "../../services/doctorService";
import ObHeader from "../../components/ObHeader";
import { WHO_MEC_CONDITIONS } from "../../data/whoMecData";
import { MecTreeSelector } from "../../components/MecTreeSelector";

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
    id: "CONTRACEPTIVE_METHOD",
    label: "Current Contraceptive Method",
    type: "select",
    options: [
      "Pills",
      "Copper IUD",
      "Intrauterine Device (IUD)",
      "Injectable",
      "Implant",
      "Patch",
      "Condom",
      "None",
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
  { key: "sti", label: "STI Prevention", description: "Protects against sexually transmitted infections", icon: Shield },
];

// ─── Component ───────────────────────────────────────────────────────────────

const ObAssessment = ({ navigation, route }: any) => {
  const hasPatientData = !!(
    route.params?.patientData ||
    route.params?.consultationId ||
    route.params?.viewOnly
  );

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
  const [selectorVisible, setSelectorVisible] = useState(false);
  const [activeSelectorField, setActiveSelectorField] = useState<any>(null);

  // Clinical notes
  const [clinicalNotes, setClinicalNotes] = useState("");

  // ─── Load existing record (view mode) ─────────────────────────────────────

  useEffect(() => {
    const record = route.params?.record as AssessmentRecord | undefined;
    if (!record) return;

    setFormData(record.patientData || {});
    setClinicalNotes(record.clinicalNotes || "");

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

  const openSelector = (field: any) => {
    setActiveSelectorField(field);
    setSelectorVisible(true);
  };

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
    setMecPrefs((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]);

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
    if (!formData.CONTRACEPTIVE_METHOD) {
      Alert.alert("Required", "Please select a contraceptive method.");
      return false;
    }
    return true;
  };

  // ─── MEC calculation ──────────────────────────────────────────────────────

  const generateMecResults = () => {
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

      const nameToKey: Record<string, keyof MECResult> = {
        Pills: "CHC",
        Patch: "CHC",
        Injectable: "DMPA",
        Implant: "Implant",
        "Copper IUD": "Cu-IUD",
        "Intrauterine Device (IUD)": "LNG-IUD",
      };

      const eligibleMethods = Object.keys(METHOD_NAME_TO_INDEX).filter((m) => {
        const cat = mecResults[nameToKey[m]] || 1;
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

          const cat = mecResults[nameToKey[methodName]] || 1;
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
        <TouchableOpacity
          style={styles.dropdownButton}
          onPress={() => openSelector(field)}
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
          <ChevronDown size={20} color="#64748B" />
        </TouchableOpacity>
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

    const methodMap: Record<string, string> = {
      CHC: "Pills / Patch / Ring",
      POP: "Progestogen-only Pill",
      DMPA: "Injectable (DMPA)",
      Implant: "Implant",
      "Cu-IUD": "Copper IUD",
      "LNG-IUD": "LNG-IUD (Hormonal)",
    };

    return (
      <View>
        {mecConditionIds.length > 0 && (
          <View style={styles.conditionSummary}>
            <Text style={styles.conditionSummaryTitle}>Selected Conditions</Text>
            {mecConditionIds.map((id) => (
              <Text key={id} style={styles.conditionSummaryItem}>
                • {getConditionLabel(id)}
              </Text>
            ))}
          </View>
        )}
        {([1, 2, 3, 4] as MECCategory[]).map((cat) => {
          const methodsInCat = Object.entries(mecResults)
            .filter(([, value]) => value === cat)
            .map(([key]) => methodMap[key] || key);
          if (methodsInCat.length === 0) return null;
          return (
            <View key={cat} style={{ marginBottom: 16 }}>
              <View style={styles.mecCatRow}>
                <View style={[styles.mecCatBadge, { backgroundColor: getMECColor(cat) }]}>
                  <Text style={styles.mecCatBadgeText}>Category {cat}</Text>
                </View>
                <Text style={styles.mecCatDesc}>
                  {cat === 1 ? "Freely use method"
                    : cat === 2 ? "Advantages outweigh risks"
                    : cat === 3 ? "Risks usually outweigh advantages"
                    : "Do not use method"}
                </Text>
              </View>
              <View style={styles.mecMethodCard}>
                {methodsInCat.map((method, i) => (
                  <View
                    key={i}
                    style={[
                      styles.mecMethodItem,
                      i < methodsInCat.length - 1 && styles.mecMethodItemBorder,
                    ]}
                  >
                    <Text style={styles.mecMethodText}>{method}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // ─── RENDER ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <ObHeader
        title="Patient Assessment"
        subtitle={formData?.NAME || "New Patient"}
      />

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
              <Text style={styles.arrow}>»</Text>
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
                    {isSelected && <Check size={14} color="#fff" />}
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
                <Text style={styles.arrow}>»</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setScreen("form")}>
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
                <Text style={styles.arrow}>»</Text>
              </>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setScreen("mec")}>
            <Text style={styles.secondaryBtnText}>Back to Conditions</Text>
          </TouchableOpacity>
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
                const nameToKey: Record<string, keyof MECResult> = {
                  Pills: "CHC",
                  Patch: "CHC",
                  Injectable: "DMPA",
                  Implant: "Implant",
                  "Copper IUD": "Cu-IUD",
                  "Intrauterine Device (IUD)": "LNG-IUD",
                };
                const mecKey = nameToKey[methodName];
                const mecCat = mecResults && mecKey ? mecResults[mecKey] : null;
                return (
                  <View key={methodName} style={{ marginBottom: 12 }}>
                    <View style={styles.methodHeader}>
                      <Text style={styles.methodName}>{methodName}</Text>
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
            style={[styles.primaryBtn, { backgroundColor: "#10B981", marginBottom: 12 }]}
            onPress={handleSaveAndFinish}
          >
            <Text style={styles.primaryBtnText}>Save & Finish</Text>
            <CheckCircle2 color="#FFF" size={20} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => setScreen("mec_results")}>
            <Text style={styles.secondaryBtnText}>Back to MEC Rules</Text>
          </TouchableOpacity>
        </ScrollView>
      )}

      {/* ── OPTION SELECTOR MODAL ────────────────────────────────────────── */}
      <Modal
        animationType="slide"
        transparent
        visible={selectorVisible}
        onRequestClose={() => setSelectorVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.selectorContent}>
            <View style={styles.selectorHeader}>
              <Text style={styles.selectorTitle}>
                {activeSelectorField?.label || "Select Option"}
              </Text>
              <TouchableOpacity onPress={() => setSelectorVisible(false)}>
                <X size={24} color="#1E293B" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={activeSelectorField?.options || []}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.methodItem}
                  onPress={() => {
                    if (activeSelectorField) {
                      updateVal(item, activeSelectorField.id);
                      setSelectorVisible(false);
                    }
                  }}
                >
                  <Text style={styles.methodText}>{item}</Text>
                  {activeSelectorField && formData[activeSelectorField.id] === item && (
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FB",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: "800",
    color: "#101828",
    marginBottom: 6,
  },
  screenSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginBottom: 20,
    lineHeight: 18,
  },
  cardSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#64748B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  fieldGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#475467",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#F8FAFC",
    padding: 14,
    borderRadius: 12,
    fontSize: 15,
    color: "#1E293B",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  dropdownButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
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
  primaryBtn: {
    backgroundColor: "#E45A92",
    borderRadius: 12,
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E45A92",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  primaryBtnText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    marginRight: 6,
  },
  arrow: {
    color: "#FFF",
    fontSize: 18,
    fontWeight: "800",
  },
  secondaryBtn: {
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryBtnText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
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
    borderColor: "#E45A92",
    backgroundColor: "#FDF2F8",
  },
  prefIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  prefIconSelected: {
    backgroundColor: "#E45A92",
  },
  prefLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1E293B",
    marginBottom: 2,
  },
  prefLabelSelected: {
    color: "#BE185D",
  },
  prefDesc: {
    fontSize: 12,
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
    backgroundColor: "#E45A92",
    borderColor: "#E45A92",
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
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  conditionSummaryItem: {
    fontSize: 14,
    color: "#334155",
    marginBottom: 4,
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
  },
  mecCatBadgeText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 14,
  },
  mecCatDesc: {
    color: "#64748B",
    fontSize: 12,
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
    padding: 14,
  },
  mecMethodItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  mecMethodText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#334155",
  },
  // Risk results
  loadingBox: {
    padding: 40,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
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
    fontSize: 15,
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
    fontSize: 11,
    fontWeight: "bold",
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  selectorContent: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    height: "80%",
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
