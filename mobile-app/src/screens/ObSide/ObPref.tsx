import { StyleSheet, Text, View, Image, TouchableOpacity, ToastAndroid, Platform } from 'react-native';
import React, { useState } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  navigation: DrawerNavigationProp<any, any>;
};

const Preferences = ({ navigation }: Props) => {
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);

  const preferences = [
    { key: 'effectiveness', label: 'Effectiveness', description: 'Most reliable at preventing pregnancy', icon: require('../../../assets/image/star.png') },
    { key: 'sti', label: 'STI Prevention', description: 'Protection against STIs/HIV', icon: require('../../../assets/image/shield.png') },
    { key: 'nonhormonal', label: 'Non-hormonal', description: 'Hormone-free option', icon: require('../../../assets/image/forbidden.png') },
    { key: 'regular', label: 'Regular Bleeding', description: 'Helps with cramps or heavy bleeding', icon: require('../../../assets/image/blood.png') },
    { key: 'privacy', label: 'Privacy', description: 'Can be used without others knowing', icon: require('../../../assets/image/privacy.png') },
    { key: 'client', label: 'Client controlled', description: 'Can start or stop it myself', icon: require('../../../assets/image/responsibility.png') },
    { key: 'longterm', label: 'Long-term protection', description: 'Lasts for years with little action', icon: require('../../../assets/image/calendar.png') },
  ];

  const showMaxAlert = () => {
    const message = 'You can only select up to 3 characteristics.';
    if (Platform.OS === 'android') {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    } else {
      console.warn(message);
    }
  };

  const togglePreference = (key: string) => {
    const isSelected = selectedPrefs.includes(key);

    if (isSelected) {
      setSelectedPrefs(selectedPrefs.filter(item => item !== key));
    } else {
      if (selectedPrefs.length >= 3) {
        showMaxAlert();
        return;
      }
      setSelectedPrefs([...selectedPrefs, key]);
    }
  };

  const handleObViewRecommendation = () => {
    navigation.navigate('ObViewRecom');
  }

  return (
    <ScrollView
      style={styles.containerOne}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: 10, paddingBottom: 100 }}
    >
        <View>
            <TouchableOpacity style = {styles.backButton}>
                <Ionicons name="arrow-back-outline" onPress={() => navigation.goBack()} size={35}  color={'#000'}/>
            </TouchableOpacity>
        </View>
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

        <TouchableOpacity style={styles.prefButton} onPress={handleObViewRecommendation}>
            <Text style={styles.prefRecomButton}>View Recommendation</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default Preferences;

const styles = StyleSheet.create({
  containerOne: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backButton: {
    position: 'absolute',
    top: 35,
    left: 15,
    zIndex: 10,
  },
  screenCont: {
    top: 50,
    left: 20,
  },
  header2: {
    fontSize: 19,
    fontWeight: '500',
    top: 25
  },
  header3: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#444',
    marginTop: 5,
    top: 20,
    paddingBottom: 20
  },
  prefCont: {
    elevation: 10,
    backgroundColor: '#FBFBFB',
    width: '90%',
    borderRadius: 10,
    marginRight: 10,
    marginTop: 15,
    paddingVertical: 15,
    paddingHorizontal: 20,
    shadowOpacity: 0.3,
    shadowRadius: 5,
    shadowOffset: { width: 1, height: 1 },
  },
  prefHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  prefIcon: {
    resizeMode: 'contain',
    height: 35,
    width: 35,
    top: 2,
  },
  prefLabel: {
    fontSize: 19,
    fontWeight: '600',
    paddingLeft: 10,
    flex: 1,
  },
  prefDescription: {
    marginTop: 8,
    fontSize: 15,
    fontStyle: 'italic',
    color: '#444',
  },
  prefButton: {
    marginTop: 15,
    width: '90%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  prefRecomButton: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '600',
  },
});
