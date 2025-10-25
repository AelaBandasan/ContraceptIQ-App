import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { openDrawer } from '../navigation/NavigationService';

type Props = {
  navigation: DrawerNavigationProp<any, any>;
};

const ViewRecom: React.FC<Props> = ({ navigation }) => {
  const contraceptives = [
    {
      name: 'Implant',
      image: require('../../assets/image/implantt.png'),
      preferences: 'preference 1, preference 2, preference 3',
      color: '#FF6B6B',
    },
    {
      name: 'Injectables',
      image: require('../../assets/image/injectables.png'),
      preferences: 'preference 1, preference 2, preference 3',
      color: '#16A085',
    },
    {
      name: 'Patch',
      image: require('../../assets/image/patchh.png'),
      preferences: 'preference 1, preference 2, preference 3',
      color: '#FFB84D',
    },
    {
      name: 'Cu-IUD',
      image: require('../../assets/image/copperiud.png'),
      preferences: 'preference 1, preference 2, preference 3',
      color: '#4A90E2',
    },
    {
      name: 'Pills',
      image: require('../../assets/image/pillss.png'),
      preferences: 'preference 1, preference 2, preference 3',
      color: '#58D68D',
    },
    {
      name: 'Hormonal IUD',
      image: require('../../assets/image/leviud.png'),
      preferences: 'preference 1, preference 2, preference 3',
      color: '#A569BD',
    },
  ];

  const [selected, setSelected] = useState(contraceptives[3]); 

  const nextMethod = () => {
    const currentIndex = contraceptives.findIndex((c) => c.name === selected.name);
    if (currentIndex < contraceptives.length - 1) setSelected(contraceptives[currentIndex + 1]);
  };

  const prevMethod = () => {
    const currentIndex = contraceptives.findIndex((c) => c.name === selected.name);
    if (currentIndex > 0) setSelected(contraceptives[currentIndex - 1]);
  };

  return (
    <ScrollView
      style={styles.containerOne}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingTop: 10, paddingBottom: 90 }}
    >
      <View>
        <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
          <Ionicons name="menu" size={35} color={'#000'} />
        </TouchableOpacity>
        <Text style={styles.headerText}>Recommendations</Text>
      </View>

      <View style={styles.mainCircleWrapper}>
        <TouchableOpacity onPress={prevMethod} style={styles.sideButton}>
          <Ionicons name="chevron-back" size={28} color="#555" />
        </TouchableOpacity>

        <View style={[styles.mainCircle, { borderColor: selected.color }]}>
          <Image source={selected.image} style={styles.mainImage} />
        </View>

        <TouchableOpacity onPress={nextMethod} style={styles.sideButton}>
          <Ionicons name="chevron-forward" size={28} color="#555" />
        </TouchableOpacity>
      </View>

      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{selected.name}</Text>
        <Text style={styles.preferencesText}>
          <Text style={{ fontStyle: 'italic' }}>{selected.preferences}</Text>
        </Text>
      </View>

      <TouchableOpacity style={styles.addNotesButton}>
        <Ionicons name="create-outline" size={26} color="#fff" />
      </TouchableOpacity>
      
      <View style={styles.listContainer}>
        {contraceptives.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.listItem,
              selected.name === item.name && styles.listItemSelected,
            ]}
            onPress={() => setSelected(item)}
          >
            <Image source={item.image} style={styles.listImage} />
            <Text style={styles.listText}>{item.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

export default ViewRecom;

const styles = StyleSheet.create({
  containerOne: {
    flex: 1,
    backgroundColor: '#fff',
  },
  menuButton: {
    position: 'absolute',
    top: 35,
    left: 20,
    zIndex: 10,
  },
  headerText: {
    textAlign: 'center',
    top: 40,
    fontSize: 21,
    fontWeight: '600',
  },
  mainCircleWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  sideButton: {
    backgroundColor: '#D9D9D9',
    padding: 10,
    borderRadius: 8,
  },
  mainCircle: {
    height: 160,
    width: 160,
    borderRadius: 80,
    borderWidth: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 25,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  mainImage: {
    height: 80,
    width: 80,
    resizeMode: 'contain',
  },
  deviceInfo: {
    alignItems: 'center',
    marginTop: 15,
  },
  deviceName: {
    fontSize: 18,
    fontWeight: '600',
  },
  preferencesText: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  addNotesButton: {
    alignSelf: 'center',
    backgroundColor: '#4A90E2',
    height: 55,
    width: 55,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 25,
  },
  listContainer: {
    marginTop: 30,
    paddingHorizontal: 20,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  listItemSelected: {
    backgroundColor: '#E8F0FF',
    borderWidth: 2,
    borderColor: '#4A90E2',
  },
  listImage: {
    width: 50,
    height: 50,
    resizeMode: 'contain',
    marginRight: 15,
  },
  listText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
});
