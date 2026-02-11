import { StyleSheet, Text, TouchableOpacity, View, Image, ToastAndroid, Platform, Alert, Dimensions } from 'react-native';
import React, { useState } from 'react';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { ScrollView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { openDrawer } from '../navigation/NavigationService';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackScreenProps } from '../types/navigation';
import { typography, spacing } from '../theme';

type Props = RootStackScreenProps<"Preferences">;

const Preferences = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);

  const preferences = [
    {
      key: "effectiveness",
      label: "Effectiveness",
      description: "Most reliable at preventing pregnancy",
      icon: require("../../assets/image/star.png"),
    },
    {
      key: "sti",
      label: "STI Prevention",
      description: "Protection against STIs/HIV",
      icon: require("../../assets/image/shield.png"),
    },
    {
      key: "nonhormonal",
      label: "Non-hormonal",
      description: "Hormone-free option",
      icon: require("../../assets/image/forbidden.png"),
    },
    {
      key: "regular",
      label: "Regular Bleeding",
      description: "Helps with cramps or heavy bleeding",
      icon: require("../../assets/image/blood.png"),
    },
    {
      key: "privacy",
      label: "Privacy",
      description: "Can be used without others knowing",
      icon: require("../../assets/image/privacy.png"),
    },
    {
      key: "client",
      label: "Client controlled",
      description: "Can start or stop it myself",
      icon: require("../../assets/image/responsibility.png"),
    },
    {
      key: "longterm",
      label: "Long-term protection",
      description: "Lasts for years with little action",
      icon: require("../../assets/image/calendar.png"),
    },
  ];

  const showMaxAlert = () => {
    const message = 'You can only select up to 3 characteristics.';
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      Alert.alert('Limit Reached', message);
    }
  };

  const togglePreference = (key: string) => {
    const isSelected = selectedPrefs.includes(key);

    if (isSelected) {
      setSelectedPrefs(selectedPrefs.filter((item) => item !== key));
    } else {
      if (selectedPrefs.length >= 3) {
        showMaxAlert();
        return;
      }
      setSelectedPrefs([...selectedPrefs, key]);
    }
  };

  const handleViewRecommendation = () => {
    navigation.navigate("ViewRecommendation", {});
  };

  return (
    <View style={styles.safeArea}>
      <View style={[styles.headerContainer, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
          <LinearGradient
            colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)']}
            style={styles.gradient}
          >
            <Ionicons name="menu" size={24} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerAppTitle}>ContraceptIQ</Text>
          <Text style={styles.headerText}>What's Right for Me?</Text>
        </View>
      </View>

      <ScrollView
        style={styles.containerOne}
        showsVerticalScrollIndicator
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 100 }}
      >

        <View style={styles.screenCont}>
          <Text style={styles.header2}>Preferences</Text>
          <Text style={styles.header3}>What's important to you</Text>

          {preferences.map((pref) => {
            const selected = selectedPrefs.includes(pref.key);

            return (
              <TouchableOpacity
                key={pref.key}
                activeOpacity={0.9}
                onPress={() => togglePreference(pref.key)}
                style={[
                  styles.prefCont,
                  selected && { backgroundColor: '#E6F5E9', borderColor: '#2E8B57', borderWidth: 2 },
                ]}
              >
                <View style={styles.prefHeader}>
                  <Image source={pref.icon} style={styles.prefIcon} />
                  <Text style={styles.prefLabel}>{pref.label}</Text>
                  {selected && <Ionicons name="checkmark-circle" size={22} color="#2E8B57" />}
                </View>

                {selected && (
                  <Text style={styles.prefDescription}>{pref.description}</Text>
                )}
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity style={styles.prefButton} onPress={handleViewRecommendation}>
            <Text style={styles.prefRecomButton}>View Recommendation</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default Preferences;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerOne: {
    flex: 1,
    backgroundColor: '#fff',
  },
  headerContainer: {
    backgroundColor: '#E45A92', // colors.primary
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleContainer: {
    marginLeft: 15,
  },
  headerAppTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFDBEB',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerText: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#FFF',
  },
  screenCont: {
    paddingHorizontal: 20,
  },
  header2: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.medium,
  },
  header3: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#444',
    marginTop: 5,
    marginBottom: 15,
  },
  prefCont: {
    elevation: 10,
    backgroundColor: '#FBFBFB',
    width: '100%',
    borderRadius: 10,
    marginTop: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 1, height: 1 },
    alignSelf: 'center',
  },
  prefHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prefIcon: {
    resizeMode: "contain",
    height: 35,
    width: 35,
  },
  prefLabel: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    paddingLeft: spacing.sm,
    flex: 1,
  },
  prefDescription: {
    marginTop: 8,
    fontSize: 15,
    fontStyle: 'italic',
    color: '#444',
  },
  prefButton: {
    marginTop: 30,
    width: '100%',
    alignItems: 'center',
    paddingVertical: 15,
  },
  prefRecomButton: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
    color: '#E45A92', // Assuming this is the theme color based on earlier files
  },
});
