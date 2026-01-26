import { StyleSheet, Text, TouchableOpacity, View, Image, Modal, Animated, PanResponder, Dimensions } from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { openDrawer } from '../navigation/NavigationService';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  navigation: DrawerNavigationProp<any, any>;
};

const Recommendation: React.FC<Props> = ({ navigation }) => {
  const [sliderValue, setSliderValue] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const translateY = useRef(new Animated.Value(500)).current;

  const ageRanges = [
    'Menarche to < 18 years',
    '18 - 19 years',
    '20 - 39 years',
    '40 - 45 years',
    '≥ 46 years',
  ];

  const selectedLabel = ageRanges[sliderValue];

  const colorMap: Record<number, string> = {
    1: '#4CAF50',
    2: '#FFEB3B',
    3: '#FF9800',
    4: '#F44336',
    5: '#bbb', // Default gray
  };

  const recommendations: Record<number, Record<string, number>> = {
    0: { // Menarche to <18
      pills: 1,
      patch: 1,
      copperIUD: 2,
      levIUD: 2,
      implant: 2,
      injectables: 2,
    },
    1: { // 18-19
      pills: 1,
      patch: 1,
      copperIUD: 2,
      levIUD: 2,
      implant: 1,
      injectables: 1,
    },
    2: { // 20-39
      pills: 1,
      patch: 1,
      copperIUD: 1,
      levIUD: 1,
      implant: 1,
      injectables: 1,
    },
    3: { // 40-45
      pills: 1,
      patch: 2,
      copperIUD: 1,
      levIUD: 1,
      implant: 1,
      injectables: 1,
    },
    4: { // ≥46
      pills: 1,
      patch: 2,
      copperIUD: 1,
      levIUD: 1,
      implant: 1,
      injectables: 2,
    },
  };

  const getColor = (method: string) => {
    const code = recommendations[sliderValue][method];
    return colorMap[code] || '#ccc';
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 20,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          Animated.timing(translateY, {
            toValue: 500,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(500);
            setModalVisible(false);
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  useEffect(() => {
    if (modalVisible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [modalVisible]);

  const handleAddPreference = () => {
    navigation.navigate('Preferences');
  };

  const handleViewRecommendation = () => {
    navigation.navigate('ViewRecommendation')
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.containerOne}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 90 }}
      >
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
            <Ionicons name="menu" size={35} color={'#000'} />
          </TouchableOpacity>
          <Text style={styles.headerText}>What's Right for Me?</Text>
          <View style={{ width: 35 }} />
        </View>

        <View style={styles.screenCont}>
          <Text style={styles.header2}>Tell us about you</Text>
          <Text style={styles.header3}>
            Enter your age to personalize recommendations.
          </Text>

          <View style={styles.ageCont}>
            <View style={styles.ageHeader}>
              <Image
                source={require('../../assets/image/age.png')}
                style={styles.ageIcon}
              />
              <Text style={styles.ageLabel}>Age</Text>
            </View>

            <View>
              <Text style={styles.selectedAge}>{selectedLabel}</Text>
            </View>

            <View style={styles.sliderCont}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={4}
                step={1}
                value={sliderValue}
                onValueChange={(value) => {
                  setSliderValue(value);
                  setModalVisible(true);
                }}
                minimumTrackTintColor="#E45A92"
                maximumTrackTintColor="#D3D3D3"
                thumbTintColor="#E45A92"
              />
              <View style={styles.sliderLabel}>
                <Text style={styles.labelText}>Menarche to {'< 18'}</Text>
                <Text style={styles.labelText}>(≥ 46)</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.prefButton} onPress={handleAddPreference}>
            <Text style={styles.prefLabel}>+ Add Preferences</Text>
          </TouchableOpacity>

          <Modal
            visible={modalVisible}
            transparent
            animationType="none"
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay} pointerEvents="box-none">
              <Animated.View
                style={[styles.modalContainer, { transform: [{ translateY }] }]}
                {...panResponder.panHandlers}
              >
                <View style={styles.modalHandle} />

                <TouchableOpacity style={styles.recomButton} onPress={handleViewRecommendation}>
                  <Text style={styles.modalHeader}>View Recommendation</Text>
                </TouchableOpacity>

                <View style={styles.modalContent}>
                  <Text style={styles.modalText}>Selected Age:</Text>
                  <Text style={styles.modalAge}>{selectedLabel}</Text>
                </View>

                <View style={styles.modalButtons}>
                  <View style={styles.recomRow}>
                    <View style={styles.recomItem}>
                      <Image
                        source={require('../../assets/image/copperiud.png')}
                        style={[styles.contaceptiveImg, { borderColor: getColor('copperIUD') }]}
                      />
                      <Text style={styles.contraceptiveLabel}>Cu-IUD</Text>
                    </View>

                    <View style={styles.recomItem}>
                      <Image
                        source={require('../../assets/image/implantt.png')}
                        style={[styles.contaceptiveImg, { borderColor: getColor('implant') }]}
                      />
                      <Text style={styles.contraceptiveLabel}>LNG/ETG</Text>
                    </View>

                    <View style={styles.recomItem}>
                      <Image
                        source={require('../../assets/image/injectables.png')}
                        style={[styles.contaceptiveImg, { borderColor: getColor('injectables') }]}
                      />
                      <Text style={styles.contraceptiveLabel}>DMPA</Text>
                    </View>
                  </View>

                  <View style={styles.recomRow}>
                    <View style={styles.recomItem}>
                      <Image
                        source={require('../../assets/image/leviud.png')}
                        style={[styles.contaceptiveImg, { borderColor: getColor('levIUD') }]}
                      />
                      <Text style={styles.contraceptiveLabel}>LNG-IUD</Text>
                    </View>

                    <View style={styles.recomItem}>
                      <Image
                        source={require('../../assets/image/patchh.png')}
                        style={[styles.contaceptiveImg, { borderColor: getColor('patch') }]}
                      />
                      <Text style={styles.contraceptiveLabel}>CHC</Text>
                    </View>

                    <View style={styles.recomItem}>
                      <Image
                        source={require('../../assets/image/pillss.png')}
                        style={[styles.contaceptiveImg, { borderColor: getColor('pills') }]}
                      />
                      <Text style={styles.contraceptiveLabel}>POP</Text>
                    </View>
                  </View>
                </View>
              </Animated.View>
            </View>
          </Modal>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default Recommendation;

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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  menuButton: {
    padding: 5,
  },
  headerText: {
    fontSize: 21,
    fontWeight: '600',
    textAlign: 'center',
  },
  screenCont: {
    paddingHorizontal: 20,
  },
  header2: {
    fontSize: 19,
    fontWeight: '500',
  },
  header3: {
    fontSize: 15,
    fontStyle: 'italic',
    color: '#444',
  },
  ageCont: {
    elevation: 20,
    backgroundColor: '#FBFBFB',
    width: '100%',
    borderRadius: 10,
    marginTop: 25,
    paddingVertical: 20,
    paddingHorizontal: 20,
    shadowOpacity: 0.5,
    shadowRadius: 100,
    shadowOffset: { width: 2, height: 2 },
    alignSelf: 'center',
  },
  ageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ageIcon: {
    resizeMode: 'contain',
    height: 45,
    width: 45,
  },
  ageLabel: {
    fontSize: 20,
    fontWeight: '600',
    paddingLeft: 10,
  },
  selectedAge: {
    fontSize: 16,
    color: '#000',
    fontWeight: '400',
    paddingLeft: 10,
    marginTop: 3,
    textAlign: 'center',
  },
  sliderCont: {
    width: '100%',
    marginTop: 10,
  },
  slider: {
    width: '100%',
    height: 50,
  },
  sliderLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -10,
  },
  labelText: {
    fontSize: 14,
    color: '#333',
  },
  prefButton: {
    marginTop: 30,
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  prefLabel: {
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    alignItems: 'center',
    height: '60%',
    elevation: 15,
  },
  modalHandle: {
    width: 60,
    height: 6,
    backgroundColor: '#ccc',
    borderRadius: 3,
    marginBottom: 15,
  },
  recomButton: {
    backgroundColor: '#E45A92',
    borderRadius: 30,
    paddingVertical: 18,
    width: '80%',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  modalHeader: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  modalContent: {
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 15,
  },
  modalText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#555',
  },
  modalAge: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E45A92',
    marginTop: 5,
  },
  modalButtons: {
    width: '100%',
    alignItems: 'center',
    flex: 1,
  },
  recomRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  recomItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '30%',
    marginBottom: 10,
  },
  contaceptiveImg: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
    borderRadius: 35,
    borderWidth: 4,
    padding: 5,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  contraceptiveLabel: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
});
