import { KeyboardAvoidingView, StyleSheet, Text, TouchableOpacity, View, Image, TextInput, Platform, Pressable, ActivityIndicator, ScrollView } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react-native';

const COLORS = {
  primary: '#E45A92',
  primaryDark: '#D3347A',
  textPrimary: '#0F172A',
  border: '#E2E8F0',
  white: '#FFFFFF',
  placeholder: '#94A3B8',
  error: '#EF4444',
};

const LoginforOB = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      const namePart = email.split('@')[0];
      const doctorName = "Dr. " + namePart.charAt(0).toUpperCase() + namePart.slice(1);
      navigation.navigate('ObDrawer', { doctorName });
    }, 2000);
  };

  const fillDemoCredentials = () => {
    setEmail('ob@gmail.com');
    setPassword('password');
    setShowPassword(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          <View style={styles.logoSection}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/tempLogo.png')} // Replace with your logo path
                style={styles.logo}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>ContraceptIQ</Text>
            <Text style={styles.welcomeText}>Create your OB Account</Text>
            <Text style={styles.subtext}>Your expertise. Smarter contraceptive care.</Text>
          </View>

          <Pressable style={styles.demoBanner} onPress={fillDemoCredentials}>
            <View style={styles.demoContent}>
              <Text style={styles.demoTitle}>🎉 Demo Credentials</Text>
              <Text style={styles.demoText}>Email: ob@gmail.com</Text>
              <Text style={styles.demoText}>Password: password</Text>
              <Text style={styles.demoHint}>Tap here to auto-fill</Text>
            </View>
          </Pressable>

          <View style={styles.form}>
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

            {/* Password */}
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
                  {showPassword ? (
                    <EyeOff size={20} color="#9CA3AF" />
                  ) : (
                    <Eye size={20} color="#9CA3AF" />
                  )}
                </Pressable>
              </View>
              {/* Forgot Password */}
              <Pressable style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </Pressable>

              {/* Login Button */}
              <Pressable
                style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={['#d3347a', '#e83c91']}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.loginButtonText}>Sign In</Text>
                      <ArrowRight size={20} color="#FFFFFF" />
                    </>
                  )}
                </LinearGradient>
              </Pressable>
            </View>

            <View style={styles.registerSection}>
              <Text style={styles.registerText}>Don't have an account? </Text>
              <Pressable onPress={() => navigation.navigate('SignupforOB')}>
                <Text style={styles.registerLink}>Sign Up</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  logoSection: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  logoContainer: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  subtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  demoBanner: {
    backgroundColor: '#FFF7ED',
    borderWidth: 1,
    borderColor: '#FFEDD5',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  demoContent: {
    alignItems: 'center',
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E45A92',
    marginBottom: 8,
  },
  demoText: {
    fontSize: 13,
    color: '#E45A92',
    marginBottom: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  demoHint: {
    fontSize: 12,
    color: '#E45A92',
    marginTop: 8,
    fontWeight: '600',
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
  },
  eyeIcon: {
    padding: 4,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#E45A92',
    fontWeight: '600',
    paddingTop: 10,
  },
  loginButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  signInButton: {
    backgroundColor: "#E45A92",
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: "#E45A92",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  registerSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  registerText: {
    fontSize: 14,
    color: '#6B7280',
  },
  registerLink: {
    fontSize: 14,
    color: '#E45A92',
    fontWeight: '700',
  },
});

export default LoginforOB;