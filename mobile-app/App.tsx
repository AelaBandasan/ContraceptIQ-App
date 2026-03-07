import 'react-native-gesture-handler';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootStack from './src/routes/RootStack';
import { navigationRef } from './src/navigation/NavigationService';
import { AssessmentProvider } from './src/context/AssessmentContext';
import { preloadModels } from './src/services/onDeviceRiskService';

export default function App() {
  useEffect(() => {
    // Pre-load ONNX v4 models so the first assessment doesn't stall.
    // Runs in background — failure is silent, models load on demand instead.
    preloadModels();
  }, []);

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
