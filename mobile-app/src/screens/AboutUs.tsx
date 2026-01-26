import { StyleSheet, Text } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';

const AboutUs = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text>AboutUs</Text>
    </SafeAreaView>
  )
}

export default AboutUs

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  }
})