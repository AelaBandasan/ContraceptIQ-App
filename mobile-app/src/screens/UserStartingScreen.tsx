import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react'

const UserStartingScreen = ({ navigation }: any) => {
    const handleContinueAsGuest = () => {
        navigation.navigate('MainDrawer');
    }
    const handleOBlogin = () => {
        navigation.navigate('LoginforOB');
    }
    return (
        <SafeAreaView style={styles.screen}>
            <View style={styles.container}>
                <View style={styles.textContainer}>
                    <Text style={styles.title}>ContraceptIQ</Text>
                    <Text style={styles.text}>
                        Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor
                    </Text>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.button} onPress={handleContinueAsGuest}>
                        <Text style={styles.buttonLabel}>Continue as Guest</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Login as </Text>
                <TouchableOpacity onPress={handleOBlogin}>
                    <Text style={styles.profText}>OB Professional</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default UserStartingScreen;

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#fff',
    },
    container: {
        flex: 1,
        elevation: 8,
        backgroundColor: '#fff',
        borderRadius: 30,
        margin: 15,
        paddingVertical: 30,
        paddingHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    textContainer: {
        alignItems: 'center',
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        fontStyle: 'italic',
        marginBottom: 20,
    },
    text: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 5,
    },
    buttonContainer: {
        paddingBottom: 50,
        width: '100%',
        alignItems: 'center',
    },
    button: {
        backgroundColor: '#E45A92',
        borderRadius: 30,
        paddingVertical: 20,
        width: '80%',
        alignItems: 'center',
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
    },
    buttonLabel: {
        fontSize: 21,
        fontWeight: 'bold',
        color: '#fff',
    },
    loginContainer: {
        paddingVertical: 20,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    loginText: {
        fontSize: 19,
        color: '#000',
    },
    profText: {
        fontSize: 19,
        color: '#E45A92',
        fontStyle: 'italic',
        fontWeight: '400',
        top: 3,
    },
});