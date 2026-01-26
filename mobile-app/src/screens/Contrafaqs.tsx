import { StyleSheet, Text } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';

const Contrafaqs = () => {
  return (
    <SafeAreaView style={styles.container}>
      <Text>Contrafaqs</Text>
    </SafeAreaView>
  )
}

export default Contrafaqs

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  }
})