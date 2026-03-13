import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { DrawerContentComponentProps, DrawerContentScrollView } from '@react-navigation/drawer';
import {
  Home as HomeIcon,
  List,
  BookOpen,
  Sliders,
  Award,
  AlertTriangle,
  HelpCircle,
  Info,
  ShieldCheck,
  LogOut
} from 'lucide-react-native';
import { colors, typography, spacing, borderRadius } from '../theme';
import { useAssessmentData } from '../context/AssessmentContext';
import { useAlert } from '../context/AlertContext';

const SideMenu: React.FC<DrawerContentComponentProps> = (props) => {
  const { state, navigation } = props;
  const { showAlert } = useAlert();
  const assessmentData = useAssessmentData();
  const hasAssessment =
    !!assessmentData && Object.keys(assessmentData).length > 0;

  // Function to check if a route is focused
  const isFocused = (routeName: string) => {
    const currentRoute = state.routes[state.index];

    // Check if direct drawer route
    if (currentRoute.name === routeName) return true;

    // Check if nested in MainTabs
    if (currentRoute.name === 'MainTabs' && currentRoute.state) {
      const tabState = currentRoute.state as any;
      const tabRoute = tabState.routes[tabState.index];
      return tabRoute.name === routeName;
    }

    return false;
  };

  const menuItems = [
    {
      label: 'Home',
      route: 'MainTabs',
      Icon: HomeIcon,
      show: true,
    },
    {
      label: 'Emergency Contraception',
      route: 'Emergency Contraception',
      Icon: AlertTriangle,
      show: true,
    },
  ];

  const supportItems = [
    {
      label: 'FAQs',
      route: 'Contraceptive FAQs',
      Icon: HelpCircle,
      show: true,
    },
    {
      label: 'About Us',
      route: 'About Us',
      Icon: Info,
      show: true,
    },
    {
      label: 'Privacy & Disclaimer',
      route: 'PrivacyDisclaimer',
      Icon: ShieldCheck,
      show: true,
    },
  ];

  const handleExit = () => {
    showAlert(
      "Exit",
      "Are you sure you want to exit the app?",
      [
        { text: "Stay", style: "cancel" },
        { text: "Exit", style: "destructive", onPress: () => navigation.navigate('UserStartingScreen' as never) },
      ]
    );
  };

  const renderItem = (item: any, index: number) => {
    if (!item.show && item.show !== undefined) return null;

    const focused = isFocused(item.route);

    return (
      <TouchableOpacity
        key={index}
        style={[styles.menuItem, focused && styles.menuItemActive]}
        onPress={() => navigation.navigate(item.route, item.params)}
      >
        <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
          <item.Icon
            size={22}
            color={colors.primary}
            strokeWidth={focused ? 3 : 2.5}
          />
        </View>
        <Text style={[styles.menuLabel, focused && styles.menuLabelActive]}>
          {item.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>ContraceptIQ</Text>
          <Text style={styles.tagline}>Smart Support.</Text>
        </View>
      </View>

      <DrawerContentScrollView
        {...props}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MENU</Text>
          {menuItems.map((item, index) => renderItem(item, index))}
        </View>

        <View style={styles.divider} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SUPPORT</Text>
          {supportItems.map((item, index) => renderItem(item, 100 + index))}
        </View>

        <View style={styles.divider} />
      </DrawerContentScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
          <LogOut size={22} color={colors.error} strokeWidth={2.5} />
          <Text style={styles.exitText}>Exit App</Text>
        </TouchableOpacity>
        <Text style={styles.versionText}>Version 1.0.1</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
  },
  header: {
    padding: spacing.lg,
    paddingTop: spacing['3xl'], // More space for status bar
    backgroundColor: colors.green.light, // Light hint of brand color
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  logoContainer: {
    marginTop: spacing.sm,
  },
  logoText: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  tagline: {
    fontSize: typography.sizes.sm,
    color: colors.text.secondary,
    fontStyle: 'italic',
  },
  scrollContent: {
    paddingTop: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.text.disabled,
    marginLeft: spacing.lg,
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: spacing.lg,
    marginHorizontal: spacing.sm,
    borderRadius: borderRadius.md,
  },
  menuItemActive: {
    backgroundColor: colors.primaryLight + '20', // Low opacity primary
  },
  iconContainer: {
    width: 44, // Slightly wider to match screenshot
    height: 44,
    backgroundColor: '#FFF5F9', // Light pink background like screenshot
    borderRadius: 12, // Rounded square
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  iconContainerActive: {
    backgroundColor: '#FFE4EF', // Slightly deeper pink when active
  },
  menuLabel: {
    fontSize: typography.sizes.base,
    color: colors.text.secondary,
    fontWeight: '500',
  },
  menuLabelActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.light,
    marginVertical: spacing.sm,
    marginHorizontal: spacing.lg,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border.light,
    padding: spacing.lg,
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  exitText: {
    marginLeft: spacing.md,
    color: colors.error,
    fontWeight: '600',
    fontSize: typography.sizes.base,
  },
  versionText: {
    fontSize: 10,
    color: colors.text.disabled,
    textAlign: 'center',
  },
});

export default SideMenu;
