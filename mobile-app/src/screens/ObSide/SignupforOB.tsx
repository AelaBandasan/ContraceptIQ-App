import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  Easing,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Calendar, Check, Eye, EyeOff, Lock, Mail, User, X } from "lucide-react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";

import Logo from "../../../assets/cl_tempLogo.png";
import { auth, db } from "../../config/firebaseConfig";
import { colors, shadows } from "../../theme";

// ── Password requirements ──────────────────────────────────────────────────────

interface PasswordRule {
  label: string;
  test: (pw: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { label: "At least 8 characters",       test: (pw) => pw.length >= 8 },
  { label: "One uppercase letter (A–Z)",  test: (pw) => /[A-Z]/.test(pw) },
  { label: "One number (0–9)",            test: (pw) => /[0-9]/.test(pw) },
  { label: "One special character (!@#…)", test: (pw) => /[!@#$%^&*()_\-+=\[\]{}|;:',.<>?/\\]/.test(pw) },
];

const isPasswordValid = (pw: string) => PASSWORD_RULES.every((r) => r.test(pw));

// Validate age ≥ 18
const isAgeValid = (birthDate: Date): boolean => {
  const age = (Date.now() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  return age >= 18;
};

// ── Component ─────────────────────────────────────────────────────────────────

const SignupforOB = ({ navigation }: any) => {
  const [fullName,          setFullName]          = useState("");
  const [email,             setEmail]             = useState("");
  const [password,          setPassword]          = useState("");
  const [confirmPassword,   setConfirmPassword]   = useState("");
  const [prcId,             setPrcId]             = useState("");
  const [birthdate,         setBirthdate]         = useState<Date | null>(null);
  const [showDatePicker,    setShowDatePicker]    = useState(false);
  const [showPassword,      setShowPassword]      = useState(false);
  const [showConfirm,       setShowConfirm]       = useState(false);
  const [showPwRules,       setShowPwRules]       = useState(false);
  const [isLoading,         setIsLoading]         = useState(false);

  const logoScale = useSharedValue(0.9);
  const blob1Pos  = useSharedValue(0);
  const blob2Pos  = useSharedValue(0);
  const blob3Pos  = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withRepeat(
      withSequence(
        withSpring(1.03, { damping: 10, stiffness: 20 }),
        withSpring(0.97, { damping: 10, stiffness: 20 }),
      ),
      -1,
      true,
    );
    blob1Pos.value = withRepeat(withTiming(1, { duration: 8000,  easing: Easing.inOut(Easing.sin) }), -1, true);
    blob2Pos.value = withRepeat(withTiming(1, { duration: 10000, easing: Easing.inOut(Easing.sin) }), -1, true);
    blob3Pos.value = withRepeat(withTiming(1, { duration: 12000, easing: Easing.inOut(Easing.sin) }), -1, true);
  }, [blob1Pos, blob2Pos, blob3Pos, logoScale]);

  const animatedLogoStyle = useAnimatedStyle(() => ({ transform: [{ scale: logoScale.value }] }));
  const blob1Style = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(blob1Pos.value * 20) }, { translateY: withSpring(blob1Pos.value * -30) }],
  }));
  const blob2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(blob2Pos.value * -40) }, { translateY: withSpring(blob2Pos.value * 20) }],
  }));
  const blob3Style = useAnimatedStyle(() => ({
    transform: [{ translateX: withSpring(blob3Pos.value * 30) }, { translateY: withSpring(blob3Pos.value * 36) }],
  }));

  const handleDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setBirthdate(selectedDate);
    }
  };

  const handleSignup = async () => {
    // Field presence check
    if (!fullName.trim() || !email.trim() || !password || !confirmPassword || !prcId.trim() || !birthdate) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }

    // Password strength
    if (!isPasswordValid(password)) {
      Alert.alert("Weak Password", "Your password does not meet the requirements. Please check the rules below the password field.");
      return;
    }

    // Password match
    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match. Please re-enter.");
      return;
    }

    // PRC ID format — exactly 7 digits
    const prcDigits = prcId.trim();
    if (prcDigits.length !== 7 || !/^\d+$/.test(prcDigits)) {
      Alert.alert("Invalid PRC ID", "Please enter a valid 7-digit PRC License number.");
      return;
    }

    // Birthdate validation
    if (!isAgeValid(birthdate)) {
      Alert.alert("Invalid Birthdate", "You must be at least 18 years old to register as an OB Professional.");
      return;
    }

    const formattedBirthdate = `${birthdate.getDate().toString().padStart(2, '0')}/${(birthdate.getMonth() + 1).toString().padStart(2, '0')}/${birthdate.getFullYear()}`;

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid:                user.uid,
        fullName:           fullName.trim(),
        email:              email.trim(),
        prcId:              prcDigits,
        birthdate:          formattedBirthdate,
        role:               "OB",
        verificationStatus: "pending",
        createdAt:          new Date().toISOString(),
      });

      navigation.reset({
        index: 0,
        routes: [{ name: "PendingVerification", params: { doctorName: fullName.trim() } }],
      });
    } catch (error: any) {
      let message = error.message ?? "An error occurred during registration.";
      if (error.code === "auth/email-already-in-use") message = "An account with this email already exists.";
      else if (error.code === "auth/invalid-email")  message = "Please enter a valid email address.";
      Alert.alert("Registration Failed", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient colors={["#FFFFFF", "#FFF9FB", "#FFF0F5"]} style={styles.gradientBackground}>
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Animated.View style={[styles.blob, styles.blob1, blob1Style]} />
          <Animated.View style={[styles.blob, styles.blob2, blob2Style]} />
          <Animated.View style={[styles.blob, styles.blob3, blob3Style]} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardContainer}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header */}
            <View style={styles.headerSection}>
              <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
                <Image source={Logo} style={styles.logo} resizeMode="contain" />
              </Animated.View>
              <Text style={styles.title}>ContraceptIQ</Text>
              <Text style={styles.welcomeText}>Create OB Professional Account</Text>
              <Text style={styles.subtext}>Your expertise, now powered by guided risk insights.</Text>
            </View>

            {/* Form */}
            <Animated.View entering={FadeInUp.delay(120).duration(700)} style={styles.formSection}>

              {/* Full Name */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name (as it appears on your ID)</Text>
                <View style={styles.inputWrapper}>
                  <User size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Juan Dela Cruz"
                    placeholderTextColor="#9CA3AF"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Mail size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#9CA3AF"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* PRC ID */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>PRC License Number</Text>
                <View style={styles.inputWrapper}>
                  <User size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your PRC ID number"
                    placeholderTextColor="#9CA3AF"
                    value={prcId}
                    onChangeText={setPrcId}
                    keyboardType="numeric"
                    maxLength={7}
                  />
                </View>
              </View>

              {/* Birthdate */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Date of Birth</Text>
                <Pressable onPress={() => setShowDatePicker(true)} style={styles.inputWrapper}>
                  <Calendar size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <Text style={[styles.input, !birthdate && { color: "#9CA3AF" }]}>
                    {birthdate 
                      ? `${birthdate.getDate().toString().padStart(2, '0')}/${(birthdate.getMonth() + 1).toString().padStart(2, '0')}/${birthdate.getFullYear()}`
                      : "Select your birthdate"}
                  </Text>
                </Pressable>
                {showDatePicker && (
                  <DateTimePicker
                    value={birthdate || new Date(2000, 0, 1)}
                    mode="date"
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handleDateChange}
                    maximumDate={new Date()}
                  />
                )}
              </View>

              {/* Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Create a password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={(t) => { setPassword(t); setShowPwRules(t.length > 0); }}
                    secureTextEntry={!showPassword}
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                    {showPassword ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                  </Pressable>
                </View>

                {/* Inline password requirements */}
                {showPwRules && (
                  <View style={styles.pwRulesBox}>
                    {PASSWORD_RULES.map((rule) => {
                      const passed = rule.test(password);
                      return (
                        <View key={rule.label} style={styles.pwRuleRow}>
                          {passed
                            ? <Check size={13} color="#16A34A" strokeWidth={3} />
                            : <X     size={13} color="#DC2626" strokeWidth={3} />}
                          <Text style={[styles.pwRuleText, passed ? styles.pwRuleOk : styles.pwRuleFail]}>
                            {rule.label}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>

              {/* Confirm Password */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={[
                  styles.inputWrapper,
                  confirmPassword.length > 0 && password !== confirmPassword && styles.inputWrapperError,
                ]}>
                  <Lock size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Re-enter your password"
                    placeholderTextColor="#9CA3AF"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirm}
                  />
                  <Pressable onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeIcon}>
                    {showConfirm ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                  </Pressable>
                </View>
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <Text style={styles.errorHint}>Passwords do not match.</Text>
                )}
              </View>

              {/* Submit */}
              <Pressable
                style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
                onPress={handleSignup}
                disabled={isLoading}
              >
                <View style={styles.buttonContent}>
                  {isLoading
                    ? <ActivityIndicator color="#FFFFFF" />
                    : <Text style={styles.signupButtonText}>Create Account</Text>}
                </View>
              </Pressable>

              <View style={styles.registerSection}>
                <Text style={styles.registerText}>Already have an account? </Text>
                <Pressable onPress={() => navigation.navigate("LoginforOB")}>
                  <Text style={styles.registerLink}>Sign In</Text>
                </Pressable>
              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  gradientBackground: {
    flex: 1,
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 40,
  },
  blob: {
    position: "absolute",
    borderRadius: 200,
    opacity: 0.14,
  },
  blob1: {
    top: -120,
    left: -100,
    width: 320,
    height: 320,
    backgroundColor: "#D81B60",
  },
  blob2: {
    bottom: 20,
    right: -130,
    width: 360,
    height: 360,
    backgroundColor: "#FCE7F3",
  },
  blob3: {
    top: 280,
    left: -140,
    width: 280,
    height: 280,
    backgroundColor: "#FDF2F8",
  },
  headerSection: {
    alignItems: "center",
    marginTop: hp("3%"),
    marginBottom: 16,
  },
  logoContainer: {
    width: wp("38%"),
    height: wp("38%"),
    maxWidth: 150,
    maxHeight: 150,
    marginBottom: hp("0.2%"),
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: hp("4%"),
    fontWeight: "900",
    color: "#D81B60",
    letterSpacing: -0.8,
  },
  welcomeText: {
    marginTop: 4,
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
  },
  subtext: {
    marginTop: 6,
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
  },
  formSection: {
    paddingHorizontal: 2,
  },
  inputContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: hp("6.0%"),
  },
  inputWrapperError: {
    borderColor: "#DC2626",
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
  },
  eyeIcon: {
    padding: 4,
  },

  // Password rules
  pwRulesBox: {
    marginTop: 8,
    paddingHorizontal: 4,
    gap: 4,
  },
  pwRuleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  pwRuleText: {
    fontSize: 12.5,
    fontWeight: "500",
  },
  pwRuleOk: {
    color: "#16A34A",
  },
  pwRuleFail: {
    color: "#DC2626",
  },
  errorHint: {
    marginTop: 4,
    fontSize: 12,
    color: "#DC2626",
    fontWeight: "500",
    paddingLeft: 4,
  },

  // Buttons
  signupButton: {
    height: hp("6.0%"),
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: colors.primary,
    ...shadows.md,
    shadowColor: "#D81B60",
    shadowOpacity: 0.3,
    marginTop: 8,
  },
  signupButtonDisabled: {
    opacity: 0.65,
  },
  buttonContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  signupButtonText: {
    fontSize: hp("2.2%"),
    fontWeight: "800",
    color: "#FFFFFF",
  },
  registerSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 14,
  },
  registerText: {
    fontSize: 15,
    color: "#6B7280",
  },
  registerLink: {
    fontSize: 15,
    color: colors.primary,
    fontWeight: "800",
  },
});

export default SignupforOB;
