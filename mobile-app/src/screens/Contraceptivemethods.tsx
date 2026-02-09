import { StyleSheet, Text, View } from 'react-native'
import React from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserTabScreenProps, ObTabScreenProps } from '../types/navigation';
import ObHeader from '../components/ObHeader';

type Props = UserTabScreenProps<'Contraceptive Methods'> | ObTabScreenProps<'ObMethods'>;

const Contraceptivemethods: React.FC<Props> = ({ route }) => {
  const { isDoctorAssessment } = (route?.params as any) || {};

  return (
    <SafeAreaView style={styles.container} edges={isDoctorAssessment ? ['left', 'right', 'bottom'] : undefined}>
      {isDoctorAssessment && <ObHeader title="Methods" subtitle="Contraceptives" />}
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Contraceptivemethods</Text>
      </View>
    </SafeAreaView>
  )
}

export default Contraceptivemethods

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  }
})