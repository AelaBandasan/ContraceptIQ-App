import { StyleSheet, Text } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';

const Diduknow = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text>Diduknow</Text>
    </SafeAreaView>
  )
}

export default Diduknow

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  }
})