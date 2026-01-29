// src/screens/HomeScreen.tsx
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
} from 'react-native';
import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import type { DrawerScreenProps } from '../types/navigation';
import { HeaderWithMenu, ScreenContainer } from '../components';
import { colors, spacing, typography, borderRadius, shadows } from '../theme';

type Props = DrawerScreenProps<'Home'>;

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
      <ScrollView
        style={styles.containerOne}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 10, paddingBottom: 90 }}
      >
        {/* Header with menu button */}
        <TouchableOpacity onPress={() => navigation.toggleDrawer()} style={styles.menuButton}>
          <Ionicons name="menu" size={35} color="#000" />
        </TouchableOpacity>

        {/* Title section */}
        <View style={styles.containerTwo}>
          <Text style={styles.title}>ContraceptIQ</Text>
          <Text style={styles.tagline}>Smart Support, Informed Choices.</Text>
        </View>

        {/* Infographic */}
        <View style={styles.containerThree}>
          <Image
            source={require('../../assets/image/infographic.jpg')}
            style={styles.infographic}
          />
        </View>

        {/* Contraceptive methods carousel */}
        <View style={styles.containerFour}>
          <Text style={styles.headerTitle}>Contraceptive Methods</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.methodsScrollView}
            contentContainerStyle={styles.methodsContainer}
          >
            {contraceptiveMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={styles.methodItem}
                onPress={() => navigation.navigate('Contraceptive Methods')}
              >
                <View style={styles.methodPics} />
                <Text style={styles.methodName}>{method.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Informational sections */}
        <View style={styles.infoSection}>
          <Text style={styles.headerTitle}>What is Contraception?</Text>
          <Text style={styles.info}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua.
          </Text>

          <Text style={styles.headerTitle}>A Guide to Birth Control</Text>
          <Text style={styles.info}>
            Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
            incididunt ut labore et dolore magna aliqua.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default HomeScreen;

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
    fontSize: typography.sizes.lg,
    fontStyle: 'italic',
    textAlign: 'left',
    marginTop: spacing.xs,
    paddingBottom: spacing.md,
  },
  infographicContainer: {
    paddingBottom: spacing.md,
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
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  containerThree: {
    paddingBottom: 12,
  },
  containerFour: {
    marginTop: spacing.md,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '500',
    paddingBottom: 4,
    marginTop: 10,
  },
  info: {
    fontSize: typography.sizes.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
    textAlign: 'justify',
  },
  methodsScrollView: {
    marginTop: spacing.sm,
  },
  methodsContainer: {
    paddingHorizontal: spacing.sm,
  },
  methodItem: {
    alignItems: 'center',
    marginRight: spacing.lg,
  },
  methodPics: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 8,
    backgroundColor: '#eee',
  },
  methodName: {
    fontSize: 16,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 10,
  },
  infoSection: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
});