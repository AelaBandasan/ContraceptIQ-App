import { StyleSheet, Text, View, TouchableOpacity, Modal, Image, Dimensions } from 'react-native'
import React, { useState, useRef } from 'react'
import { Ionicons } from '@expo/vector-icons'
import type { DrawerNavigationProp } from '@react-navigation/drawer'
import { ScrollView } from 'react-native-gesture-handler'

type Props = {
  navigation: DrawerNavigationProp<any, any>;
};

const { width } = Dimensions.get('window');

const Whatsrightforme: React.FC<Props> = ({ navigation }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleGetStarter = () => setIsModalVisible(true);
  const handleContinue = () => {
    navigation.navigate('Recommendation' as never)
  };

  const handleScroll = (event: any) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentIndex(index);
  };

  return (
    <View style={styles.containerOne}>
      <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={styles.menuButton}>
        <Ionicons name="menu" size={35} color={"#000"} />
      </TouchableOpacity>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >

        <View style={styles.onBoardscrn}>
          <Image
            source={require('../../assets/image/onboardscrn1.png')}
            style={styles.onBoardImg}
          />
          <Text style={styles.OBheader}>Take Charge of Your Health</Text>
          <Text style={styles.OBtext}>
            Choosing the right contraceptive method is an important step toward 
            taking charge of your reproductive health and overall well-being.
          </Text>
        </View>

        <View style={styles.onBoardscrnTwo}>
          <Image
            source={require('../../assets/image/onboardscrn2.png')}
            style={styles.onBoardImgTwo}
          />
          <Text style={styles.OBheaderTwo}>Make Confident, Informed Decisions</Text>
          <Text style={styles.OBtextTwo}>
            It helps you make informed and confident contraceptive choices by 
            guiding you through your preferences, lifestyle, and health needs—offering 
            tailored method insights and a personalized summary to discuss with your provider.
          </Text>
        </View>

        <View style={styles.onBoardscrnThree}>
          <Image
            source={require('../../assets/image/onboardscrn3.png')}
            style={styles.onBoardImgThree}
          />
          <Text style={styles.OBheaderThree}>Empower Yourself with Knowledge</Text>
          <Text style={styles.OBtextThree}>
            The best contraceptive choice is the one that’s right for you — 
            and knowledge is the key to making that decision with confidence.
          </Text>

          <TouchableOpacity style={styles.button} onPress={handleGetStarter}>
            <Text style={styles.buttonLabel}>Get Started</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.indicatorContainer}>
        {[0, 1, 2].map((index) => (
          <View
            key={index}
            style={[
              styles.indicator,
              currentIndex === index && styles.currentIndicator,
            ]}
          />
        ))}
      </View>

      <Modal transparent visible={isModalVisible}>
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <Text style={styles.disclaimer}>Disclaimer</Text>
            <Text style={styles.message}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do 
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem 
              ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod 
              tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum 
              dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor 
              incididunt ut labore et dolore magna aliqua.
            </Text>
            <TouchableOpacity style={styles.modalButton} onPress={handleContinue}>
              <Text style={styles.modalButtonText}>Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default Whatsrightforme;

const styles = StyleSheet.create({
  containerOne: {
    flex: 1,
    backgroundColor: '#fff',
  },
  menuButton: {
    position: 'absolute',
    top: 45,
    left: 20,
    zIndex: 10,
  },
  onBoardscrn: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    top: -80
  },
  onBoardImg: {
    height: 340,
    width: 435,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  OBheader: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginTop: 10,
  },
  OBtext: {
    fontSize: 17,
    color: '#444',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 24,
    paddingHorizontal: 25,
  },
  onBoardscrnTwo: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    top: -55
  },
  onBoardImgTwo: {
    height: 340,
    width: 435,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  OBheaderTwo: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginTop: 10,
  },
  OBtextTwo: {
    fontSize: 17,
    color: '#444',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 24,
    paddingHorizontal: 25,
    justifyContent: 'center',
  },
  onBoardscrnThree: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    top: -32
  },
  onBoardImgThree: {
    height: 340,
    width: 435,
    resizeMode: 'contain',
    marginBottom: 20,
  },
  OBheaderThree: {
    fontSize: 22,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
    marginTop: 10,
  },
  OBtextThree: {
    fontSize: 17,
    color: '#444',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 24,
    paddingHorizontal: 25,
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#E45A92',
    borderRadius: 10,
    paddingVertical: 20,
    paddingHorizontal: 80,
    alignItems: 'center',
    marginTop: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  indicatorContainer: {
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 40,
  },
  indicator: {
    height: 12,
    width: 12,
    borderRadius: 6,
    backgroundColor: '#C4C4C4',
    marginHorizontal: 5,
  },
  currentIndicator: {
    width: 30,
    backgroundColor: '#E45A92',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    padding: 25,
    borderRadius: 10,
    width: '85%',
    elevation: 5,
  },
  disclaimer: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 10,
    color: '#000',
  },
  message: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    textAlign: 'justify',
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: '#E45A92',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 17,
  },
});
