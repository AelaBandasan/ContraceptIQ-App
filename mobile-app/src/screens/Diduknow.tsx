import { StyleSheet, Text, View, TouchableOpacity, ScrollView } from 'react-native'
import React from 'react'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { UserTabScreenProps, DrawerScreenProps } from '../types/navigation';
import { colors, spacing, typography } from '../theme';

type Props = UserTabScreenProps<'Did You Know?'> | DrawerScreenProps<'Did You Know?'>;

const Diduknow = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.safeArea}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => (navigation as any).toggleDrawer()} style={styles.menuButton}>
          <LinearGradient
            colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.1)']}
            style={styles.gradient}
          >
            <Ionicons name="menu" size={24} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerAppTitle}>ContraceptIQ</Text>
          <Text style={styles.headerTagline}>Did You Know?</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.center}>
          <Text>Learning Resources Coming Soon</Text>
        </View>
      </ScrollView>
    </View>
  )
}

export default Diduknow

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#E45A92', // colors.primary
    paddingHorizontal: 20,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
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
  headerTitleContainer: {
    marginLeft: 15,
  },
  headerAppTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFDBEB',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  headerTagline: {
    fontSize: 21,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  }
})