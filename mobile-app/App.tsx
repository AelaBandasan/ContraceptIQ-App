import 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootStack from './src/routes/RootStack';
import { navigationRef } from './src/navigation/NavigationService';
import { AssessmentProvider } from './src/context/AssessmentContext';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AssessmentProvider>
          <NavigationContainer ref={navigationRef}>
            <RootStack />
            <StatusBar style="auto" />
          </NavigationContainer>
        </AssessmentProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
