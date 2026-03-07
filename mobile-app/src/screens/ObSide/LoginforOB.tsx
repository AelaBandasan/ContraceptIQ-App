import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { ChevronDown, ChevronUp, Eye, EyeOff, Lock, Mail } from "lucide-react-native";
import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import Logo from "../../../assets/cl_tempLogo.png";
import { auth, db } from "../../config/firebaseConfig";
import { colors, shadows } from "../../theme";

const LoginforOB = ({ navigation }: any) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showDemoDetails, setShowDemoDetails] = useState(false);

  const logoScale = useSharedValue(0.9);
  const blob1Pos = useSharedValue(0);
  const blob2Pos = useSharedValue(0);
  const blob3Pos = useSharedValue(0);

  useEffect(() => {
    logoScale.value = withRepeat(
      withSequence(
        withSpring(1.03, { damping: 10, stiffness: 20 }),
        withSpring(0.97, { damping: 10, stiffness: 20 }),
      ),
      -1,
      true,
    );

    blob1Pos.value = withRepeat(
      withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    blob2Pos.value = withRepeat(
      withTiming(1, { duration: 10000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
    blob3Pos.value = withRepeat(
      withTiming(1, { duration: 12000, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [blob1Pos, blob2Pos, blob3Pos, logoScale]);

  const animatedLogoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const blob1Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: withSpring(blob1Pos.value * 20) },
      { translateY: withSpring(blob1Pos.value * -30) },
    ],
  }));

  const blob2Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: withSpring(blob2Pos.value * -40) },
      { translateY: withSpring(blob2Pos.value * 20) },
    ],
  }));

  const blob3Style = useAnimatedStyle(() => ({
    transform: [
      { translateX: withSpring(blob3Pos.value * 30) },
      { translateY: withSpring(blob3Pos.value * 36) },
    ],
  }));

  const handleContinueAsGuest = () => navigation.navigate("UserStartingScreen");

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password");
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const doctorName =
          userData.fullName ||
          "Dr. " + (userData.email ? userData.email.split("@")[0] : "User");

        if (userData.verificationStatus === "verified") {
          navigation.reset({
            index: 0,
            routes: [{ name: "ObMainTabs", params: { doctorName } }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: "PendingVerification", params: { doctorName } }],
          });
        }
      } else {
        await signOut(auth);
        Alert.alert(
          "Access Denied",
          "User not found in the database. Please contact support.",
        );
      }
    } catch (error: any) {
      let errorMessage = "An error occurred during sign in.";

      if (error.code === "auth/invalid-email") {
        errorMessage = "Invalid email address format.";
      } else if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential"
      ) {
        errorMessage = "Invalid email or password.";
      } else if (error.code === "auth/too-many-requests") {
        errorMessage = "Too many failed attempts. Please try again later.";
      }

      Alert.alert("Login Failed", errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setEmail("ob@gmail.com");
    setPassword("password");
    setShowPassword(true);
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <LinearGradient
        colors={["#FFFFFF", "#FFF9FB", "#FFF0F5"]}
        style={styles.gradientBackground}
      >
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Animated.View style={[styles.blob, styles.blob1, blob1Style]} />
          <Animated.View style={[styles.blob, styles.blob2, blob2Style]} />
          <Animated.View style={[styles.blob, styles.blob3, blob3Style]} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardContainer}
        >
          <View style={styles.container}>
            <Animated.View entering={FadeInDown.duration(700)} style={styles.headerSection}>
              <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
                <Image source={Logo} style={styles.logo} resizeMode="contain" />
              </Animated.View>
              <Text style={styles.title}>ContraceptIQ</Text>
              <Text style={styles.welcomeText}>OB Professional Sign In</Text>
              <Text style={styles.subtext}>Secure access for smarter contraceptive care.</Text>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(80).duration(650)} style={styles.demoBannerOutside}>
              <Pressable style={styles.demoBannerTop} onPress={fillDemoCredentials}>
                <Text style={styles.demoTitle}>Use Demo Credentials</Text>
                <Text style={styles.demoHintInline}>Tap to auto-fill</Text>
              </Pressable>
              <Pressable
                style={styles.demoToggle}
                onPress={() => setShowDemoDetails((prev) => !prev)}
              >
                <Text style={styles.demoToggleText}>Show credentials</Text>
                {showDemoDetails ? (
                  <ChevronUp size={16} color={colors.primary} />
                ) : (
                  <ChevronDown size={16} color={colors.primary} />
                )}
              </Pressable>
              {showDemoDetails ? (
                <View style={styles.demoDetails}>
                  <Text style={styles.demoText}>Email: ob@gmail.com</Text>
                  <Text style={styles.demoText}>Password: password</Text>
                </View>
              ) : null}
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(120).duration(700)} style={styles.formSection}>
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

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.inputWrapper}>
                  <Lock size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your password"
                    placeholderTextColor="#9CA3AF"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                  >
                    {showPassword ? <EyeOff size={20} color="#9CA3AF" /> : <Eye size={20} color="#9CA3AF" />}
                  </Pressable>
                </View>
              </View>

              <Pressable style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </Pressable>

              <Pressable
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <View style={styles.buttonContent}>
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.loginButtonText}>Sign In</Text>
                  )}
                </View>
              </Pressable>

              <View style={styles.registerSection}>
                <Text style={styles.registerText}>Don't have an account? </Text>
                <Pressable onPress={() => navigation.navigate("SignupforOB")}>
                  <Text style={styles.registerLink}>Sign Up</Text>
                </Pressable>
              </View>

              <Pressable style={styles.guestButton} onPress={handleContinueAsGuest}>
                <View style={styles.buttonContent}>
                  <Text style={styles.guestButtonText}>Continue as Guest</Text>
                </View>
              </Pressable>
            </Animated.View>
          </View>
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
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 20,
    justifyContent: "space-between",
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
    marginTop: hp("4%"),
    marginBottom: 10,
  },
  logoContainer: {
    width: wp("48%"),
    height: wp("48%"),
    maxWidth: 190,
    maxHeight: 190,
    marginBottom: hp("0.2%"),
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: hp("4.2%"),
    fontWeight: "900",
    color: "#D81B60",
    letterSpacing: -0.8,
  },
  welcomeText: {
    marginTop: 4,
    fontSize: 19,
    fontWeight: "700",
    color: "#1F2937",
    textAlign: "center",
  },
  subtext: {
    marginTop: 6,
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
  },
  formSection: {
    paddingHorizontal: 2,
  },
  demoBannerOutside: {
    backgroundColor: "rgba(255, 247, 237, 0.95)",
    borderWidth: 1,
    borderColor: "#FED7AA",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 5,
  },
  demoBannerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  demoToggle: {
    marginTop: 3,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  demoToggleText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "500",
  },
  demoDetails: {
    marginTop: 5,
  },
  demoHintInline: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  demoTitle: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 4,
  },
  demoText: {
    color: colors.primary,
    fontSize: 14,
    marginBottom: 2,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  inputContainer: {
    marginBottom: 10,
  },
  label: {
    fontSize: 15,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: hp("7.5%"),
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#111827",
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: 2,
    marginBottom: 10,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "700",
  },
  loginButton: {
    height: hp("7.5%"),
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: colors.primary,
    ...shadows.md,
    shadowColor: "#D81B60",
    shadowOpacity: 0.3,
  },
  loginButtonDisabled: {
    opacity: 0.65,
  },
  buttonContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  loginButtonText: {
    fontSize: hp("2.3%"),
    fontWeight: "800",
    color: "#FFFFFF",
  },
  registerSection: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  registerText: {
    fontSize: 16,
    color: "#6B7280",
  },
  registerLink: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: "800",
  },
  guestButton: {
    height: hp("7.5%"),
    borderRadius: 22,
    overflow: "hidden",
    backgroundColor: "#FFF0F6",
    borderWidth: 1,
    borderColor: "#F7B8D3",
    marginTop: 8,
  },
  guestButtonText: {
    fontSize: hp("2.3%"),
    color: colors.primary,
    fontWeight: "800",
  },
});

export default LoginforOB;
