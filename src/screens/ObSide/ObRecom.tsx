import { StyleSheet, Text, TouchableOpacity, View, Image, ToastAndroid, Modal, PanResponder, Animated, } from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { DrawerNavigationProp } from '@react-navigation/drawer';

type Props = {
  navigation: DrawerNavigationProp<any, any>;
};

const ObRecom: React.FC<Props> = ({ navigation }) => {
  const [sliderValue, setSliderValue] = useState(0);
  const [selectedCondition, setSelectedCondition] = useState<string[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const translateY = useRef(new Animated.Value(500)).current;

  const ageRanges = [
    'Menarche to < 18 years',
    '18 - 19 years',
    '20 - 39 years',
    '40 - 45 years',
    '≥ 46 years',
  ];
  const selectedLabel = ageRanges[Math.round(sliderValue)] || '';

  const colorMap: Record<number, string> = {
    1: '#4CAF50',
    2: '#FFEB3B',
    3: '#FF9800',
    4: '#F44336',
  };

  const recommendations: Record<number, Record<string, number>> = {
    0: { pills: 1, patch: 1, copperIUD: 2, levIUD: 2, implant: 2, injectables: 2 },
    1: { pills: 1, patch: 1, copperIUD: 2, levIUD: 2, implant: 1, injectables: 1 },
    2: { pills: 1, patch: 1, copperIUD: 1, levIUD: 1, implant: 1, injectables: 1 },
    3: { pills: 1, patch: 2, copperIUD: 1, levIUD: 1, implant: 1, injectables: 1 },
    4: { pills: 1, patch: 2, copperIUD: 1, levIUD: 1, implant: 1, injectables: 2 },
  };

  const conditions = ['Breastfeeding', 'Diabetes', 'Headache', 'HIV/AIDS', 'Smoking'];

  const getColor = (method: string) => {
    const code = recommendations[sliderValue][method];
    return colorMap[code] || '#ccc';
  };

  const handleSelectCondition = (condition: string) => {
    const message = 'You can only select up to 2 conditions.';
    if (selectedCondition.includes(condition)) {
      setSelectedCondition(selectedCondition.filter((c) => c !== condition));
    } else if (selectedCondition.length < 2) {
      const updated = [...selectedCondition, condition];
      setSelectedCondition(updated);
      if (updated.length === 2) {
        setTimeout(() => setModalVisible(true), 400);
      }
    } else {
      ToastAndroid.show(message, ToastAndroid.SHORT);
    }
  };

  const handleObAddPref = () => {
    navigation.navigate('ObPref');
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => Math.abs(gestureState.dy) > 20,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) translateY.setValue(gestureState.dy);
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

  return (
    <ScrollView
      style={styles.containerOne}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: 10, paddingBottom: 90 }}
    >
      <View style={styles.screenCont}>
        <Text style={styles.header2}>What’s Suitable for the Patient?</Text>
        <Text style={styles.header3}>
          Enter the patient’s age and select applicable medical conditions to generate
          personalized recommendations.
        </Text>

        <View style={styles.ageCont}>
          <View style={styles.ageHeader}>
            <Image source={require('../../../assets/image/age.png')} style={styles.ageIcon} />
            <Text style={styles.ageLabel}>Age</Text>
          </View>

          <Text style={styles.selectedAge}>{selectedLabel}</Text>

          <View style={styles.sliderCont}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={4}
              step={1}
              value={sliderValue}
              onValueChange={(value) => setSliderValue(value)}
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

        <View style={styles.conditionContainer}>
          <Text style={styles.conditionHeader}>Conditions</Text>
          <Text style={styles.conditionSub}>Select applicable conditions</Text>

          {conditions.map((item) => {
            const isSelected = selectedCondition.includes(item);
            return (
              <TouchableOpacity
                key={item}
                style={[styles.conditionBox, isSelected && styles.selectedBox]}
                onPress={() => handleSelectCondition(item)}
              >
                <Text style={[styles.conditionText, isSelected && styles.selectedText]}>
                  {item}
                </Text>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={22} color="#2E8B57" style={styles.checkIcon} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <Modal
          visible={modalVisible}
          transparent
          animationType="none"
          onRequestClose={() => setModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPressOut={() => setModalVisible(false)}
          >
            <Animated.View
              style={[styles.modalContainer, { transform: [{ translateY }] }]}
              {...panResponder.panHandlers}
            >
              <View style={styles.modalHandle} />

              <TouchableOpacity style={styles.modalHeaderBar} onPress={handleObAddPref}>
                <Text style={styles.modalHeaderText}>+ Add Preference</Text>
              </TouchableOpacity>

              <View style={styles.modalContent}>
                <Text style={styles.modalText}>Selected Age:</Text>
                <Text style={styles.modalAge}>{selectedLabel}</Text>
              </View>

              <View style={styles.recomGrid}>
                {[
                  { key: 'copperIUD', label: 'Cu-IUD', img: require('../../../assets/image/copperiud.png') },
                  { key: 'levIUD', label: 'LNG-IUD', img: require('../../../assets/image/leviud.png') },
                  { key: 'injectables', label: 'DMPA', img: require('../../../assets/image/injectables.png') },
                  { key: 'implant', label: 'LNG/ETG', img: require('../../../assets/image/implantt.png') },
                  { key: 'patch', label: 'CHC', img: require('../../../assets/image/patchh.png') },
                  { key: 'pills', label: 'POP', img: require('../../../assets/image/pillss.png') },
                ].map((item) => (
                  <View key={item.key} style={styles.recomItem}>
                    <Image
                      source={item.img}
                      style={[styles.contaceptiveImg, { borderColor: getColor(item.key) }]}
                    />
                    <Text style={styles.contraceptiveLabel}>{item.label}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          </TouchableOpacity>
        </Modal>
      </View>
    </ScrollView>
  );
};

export default ObRecom;

const styles = StyleSheet.create({
  containerOne: { 
    flex: 1, 
    backgroundColor: '#fff' 
  },
  screenCont: { 
    top: 70, 
    left: 20 
  },
  header2: { 
    fontSize: 19, 
    fontWeight: '500' 
  },
  header3: { 
    fontSize: 15, 
    fontStyle: 'italic', 
    color: '#444', 
    marginBottom: 10 
  },
  ageCont: {
    elevation: 10,
    backgroundColor: '#FBFBFB',
    width: '90%',
    borderRadius: 10,
    marginTop: 15,
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  ageHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  ageIcon: { 
    resizeMode: 'contain', 
    height: 45, 
    width: 45 
  },
  ageLabel: { 
    fontSize: 20, 
    fontWeight: '600', 
    paddingLeft: 10 
  },
  selectedAge: { 
    fontSize: 16, 
    color: '#000', 
    fontWeight: '400', 
    textAlign: 'center' 
  },
  sliderCont: { 
    width: '100%' 
  },
  slider: { 
    width: '100%', 
    height: 50 
  },
  sliderLabel: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginTop: -10 
  },
  labelText: { 
    fontSize: 14, 
    color: '#333' 
  },
  conditionContainer: { 
    marginTop: 25, 
    width: '90%' 
  },
  conditionHeader: { 
    fontSize: 19, 
    fontWeight: '600' 
  },
  conditionSub: { 
    fontSize: 15, 
    color: '#555', 
    fontStyle: 'italic', 
    marginBottom: 10 
  },
  conditionBox: {
    backgroundColor: '#FFF',
    borderRadius: 10,
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginVertical: 5,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f1f1f1',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedBox: { 
    backgroundColor: '#fff', 
    borderColor: '#2E8B57', 
    borderWidth: 2 
  },
  conditionText: { 
    fontSize: 18, 
    color: '#000', 
    fontWeight: '500' 
  },
  selectedText: { 
    color: '#000' 
  },
  checkIcon: { 
    marginLeft: 8 
  },
  prefButton: { 
    marginTop: 20, 
    width: '90%', 
    alignItems: 'center' 
  },
  prefText: { 
    textAlign: 'center', 
    fontSize: 18, 
    fontWeight: '600' 
  },
  modalOverlay: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.1)'
    , justifyContent: 'flex-end' 
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    alignItems: 'center',
    elevation: 15,
    paddingBottom: 30,
    height: '50%',
  },
  modalHandle: {
    width: 60,
    height: 6,
    backgroundColor: '#ccc',
    borderRadius: 3,
    marginTop: 10,
    marginBottom: 15,
  },
  modalHeaderBar: {
    backgroundColor: '#E45A92',
    borderRadius: 30,
    width: '90%',
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 80,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  modalHeaderText: { 
    color: '#fff', 
    fontSize: 19,
    fontWeight: '600' 
  },
  modalContent: { 
    alignItems: 'center', 
    marginTop: 15,
    marginBottom: 5,
  },
  modalText: { 
    fontSize: 17, 
    fontWeight: '500', 
    color: '#555' 
  },
  modalAge: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#E45A92' 
  },
  recomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  recomItem: { 
    alignItems: 'center', 
    margin: 11,
  },
  contaceptiveImg: {
    width: 90,
    height: 90,
    resizeMode: 'contain',
    borderRadius: 50,
    borderWidth: 3,
    padding: 8,
    backgroundColor: '#fff',
    elevation: 5,
  },
  contraceptiveLabel: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
});
