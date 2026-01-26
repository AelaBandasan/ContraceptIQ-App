import { StyleSheet, Text, View, TouchableOpacity, Image, Dimensions } from 'react-native'
import React from 'react'
import { Ionicons } from '@expo/vector-icons';
import type { DrawerNavigationProp } from '@react-navigation/drawer';
import { ScrollView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  navigation: DrawerNavigationProp<any, any>;
};

const { width } = Dimensions.get('window');

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const contraceptiveMethods = [
    { id: '1', name: 'Pills', image: null },
    { id: '2', name: 'Patch', image: null },
    { id: '3', name: 'IUD', image: null },
    { id: '4', name: 'Implants', image: null },
    { id: '5', name: 'Injections', image: null },
  ];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.containerOne}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 90 }}>

        <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={styles.menuButton}>
          <Ionicons name="menu" size={35} color="#000" />
        </TouchableOpacity>

        <View style={styles.containerTwo}>
          <Text style={styles.title}>ContraceptIQ</Text>
          <Text style={styles.tagline}>Smart Support, Informed Choices.</Text>
        </View>

        <View style={styles.containerThree}>
          <Image source={require('../../assets/image/infographic.jpg')}
            style={styles.infographic} />
        </View>

        <View style={styles.containerFour}>
          <Text style={styles.headerTitle}>Contaceptive Methods</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.methodsScrollView}
            contentContainerStyle={styles.methodsContainer}>

            {contraceptiveMethods.map((method) => (
              <TouchableOpacity key={method.id} style={styles.methodItem}>
                <View style={styles.methodPics}>

                </View>
                <Text style={styles.methodName}>{method.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View>
          <Text style={styles.headerTitle}>What is Contraception?</Text>
          <Text style={styles.info}>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</Text>
          <Text style={styles.headerTitle}>A Guide to Birth Control</Text>
          <Text style={styles.info}>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>

  )
}

export default HomeScreen

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerOne: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  menuButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'left',
    marginTop: 10,
  },
  tagline: {
    fontSize: 18,
    fontStyle: 'italic',
    textAlign: 'left',
    marginTop: 2,
    paddingBottom: 12
  },
  infographic: {
    width: '100%',
    height: undefined,
    aspectRatio: 1,
    resizeMode: 'contain',
    borderRadius: 10,
    alignSelf: 'center',
  },
  containerTwo: {

  },
  containerThree: {
    paddingBottom: 12
  },
  containerFour: {

  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '500',
    paddingBottom: 4,
    marginTop: 10,
  },
  info: {
    fontSize: 17,
    paddingTop: 1,
    paddingBottom: 4,
    textAlign: 'justify'
  },
  methodsScrollView: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  methodsContainer: {
    paddingRight: 20
  },
  methodItem: {
    alignItems: 'center',
    marginRight: 20,
  },
  methodPics: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
    backgroundColor: '#eee', // Added placeholder color
  },
  methodName: {
    fontSize: 16,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 10
  },

})