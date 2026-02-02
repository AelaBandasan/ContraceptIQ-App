import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import React from 'react'
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';

const UserStartingScreen = ({ navigation }: any) => {
    const handleContinueAsGuest = () => {
        // Start at Recommendation/Home screen (Review First)
        navigation.navigate('MainDrawer');
    }
    const handleOBlogin = () => {
        navigation.navigate('LoginforOB');
    }
    return (
        <View style={styles.screen}>
            <View style={styles.container}>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>ContraceptIQ</Text>
                    <Text style={styles.text}>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor </Text>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleContinueAsGuest}>
                        <Text style={styles.buttonLabel}>Continue as Guest</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.loginContainer}>
                <Text style={styles.loginText}>
                    Login as <TouchableOpacity onPress={handleOBlogin}><Text style={styles.profText}>OB Professional</Text></TouchableOpacity>
                </Text>
            </View>
        </View>

    )
}

export default UserStartingScreen

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    container: {
        elevation: 8,
        backgroundColor: '#fff',
        borderRadius: 30,
        margin: wp('4%'),
        marginTop: hp('7%'),
        paddingVertical: hp('4%'),
        paddingHorizontal: wp('5%'),
        height: hp('80%'), // Reduced to give safe space at bottom
        justifyContent: 'flex-end',
        alignItems: 'center',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        width: wp('92%'),
    },
    textContainer: {
        alignItems: 'center',
        position: 'absolute',
        top: hp('10%'),
    },
    title: {
        fontSize: hp('4%'), // Approx 30
        fontWeight: 'bold',
        fontStyle: 'italic',
        marginBottom: hp('2%'),
    },
    text: {
        fontSize: hp('2%'), // Approx 16
        textAlign: 'center',
        marginTop: 5,
        paddingHorizontal: wp('2%'),
    },
    buttonContainer: {
        marginTop: 'auto',
        marginBottom: hp('10%')
    },
    button: {
        backgroundColor: '#E45A92',
        borderRadius: 30,
        paddingVertical: hp('2.5%'), // Approx 20
        paddingHorizontal: wp('15%'), // Dynamic horizontal padding
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        alignItems: 'center',
        justifyContent: 'center'
    },
    buttonLabel: {
        fontSize: hp('2.5%'), // Approx 21
        fontWeight: 'bold',
        color: '#fff',
    },
    loginContainer: {
        position: 'absolute',
        bottom: hp('6%'),
        elevation: 10, // Ensure it sits on top of container
        zIndex: 10,
    },
    loginText: {
        fontSize: hp('2.2%'), // Approx 19
        flexDirection: 'row',
    },
    profText: {
        fontSize: hp('2.2%'), // Approx 19
        color: '#E45A92',
        fontStyle: 'italic',
        fontWeight: '400',
        top: hp('0.5%') // Relative top adjustment
    },
})
