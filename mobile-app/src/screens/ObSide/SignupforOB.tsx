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
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { Eye, EyeOff, Lock, Mail, User } from "lucide-react-native";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

import Logo from "../../../assets/cl_tempLogo.png";
import { auth, db } from "../../config/firebaseConfig";
import { colors, shadows } from "../../theme";

const SignupforOB = ({ navigation }: any) => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSignup = async () => {
    if (!fullName || !email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        fullName,
        email,
        role: "OB",
        createdAt: new Date().toISOString(),
      });

      Alert.alert("Success", "Account created successfully!", [
        { text: "OK", onPress: () => navigation.navigate("LoginforOB") },
      ]);
    } catch (error: any) {
      Alert.alert("Registration Failed", error.message);
    } finally {
      setIsLoading(false);
    }
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
            <View style={styles.headerSection}>
              <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
                <Image source={Logo} style={styles.logo} resizeMode="contain" />
              </Animated.View>
              <Text style={styles.title}>ContraceptIQ</Text>
              <Text style={styles.welcomeText}>Create OB Professional Account</Text>
              <Text style={styles.subtext}>Your expertise, now powered by guided risk insights.</Text>
            </View>

            <Animated.View entering={FadeInUp.delay(120).duration(700)} style={styles.formSection}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Full Name</Text>
                <View style={styles.inputWrapper}>
                  <User size={20} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor="#9CA3AF"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

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
                    placeholder="Create a password"
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

              <Pressable
                style={[styles.signupButton, isLoading && styles.signupButtonDisabled]}
                onPress={handleSignup}
                disabled={isLoading}
              >
                <View style={styles.buttonContent}>
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.signupButtonText}>Create Account</Text>
                  )}
                </View>
              </Pressable>

              <View style={styles.registerSection}>
                <Text style={styles.registerText}>Already have an account? </Text>
                <Pressable onPress={() => navigation.navigate("LoginforOB")}>
                  <Text style={styles.registerLink}>Sign In</Text>
                </Pressable>
              </View>
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
    height: hp("6.0%"),
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
});

export default SignupforOB;
