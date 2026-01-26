import { StyleSheet, Text } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';

const Contraceptivemethods = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text>Contraceptivemethods</Text>
    </SafeAreaView>
  )
}

export default Contraceptivemethods

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  }
})