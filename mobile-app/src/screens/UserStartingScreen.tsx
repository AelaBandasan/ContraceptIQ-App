import { StyleSheet, Text, Touchable, TouchableOpacity, View } from 'react-native'
import React from 'react'

const UserStartingScreen = ({ navigation}: any ) => {
    const handleContinueAsGuest = () => {
        navigation.navigate('MainDrawer');
    }
    const handleOBlogin = () => {
        navigation.navigate('LoginforOB');
    }
  return (
    <View style = {styles.screen}>
        <View style ={styles.container}>
            <View style = {styles.textContainer}>
                <Text style = {styles.title}>ContraceptIQ</Text>
            <Text style = {styles.text}>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor </Text>
            </View>
            
            <View style = {styles.buttonContainer}>
                <TouchableOpacity 
                style = {styles.button}
                onPress={handleContinueAsGuest}>
                    <Text style = {styles.buttonLabel}>Continue as Guest</Text>
                </TouchableOpacity>
            </View>
        </View>    
        
        <View style = {styles.loginContainer}> 
            <Text style = {styles.loginText}>     
                Login as <TouchableOpacity onPress={handleOBlogin}><Text style = {styles.profText}>OB Professional</Text></TouchableOpacity>
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
        margin: 15,
        marginTop: 55,
        paddingVertical: 30,
        paddingHorizontal: 20,
        height: 750,
        justifyContent: 'flex-end',
        alignItems: 'center',
        shadowOpacity: 0.1,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
    },
    textContainer: {
        alignItems: 'center',
    },
    title: {
        fontSize: 30,
        fontWeight: 'bold',
        fontStyle: 'italic',
        paddingTop: 100,
    },
    text: {
        fontSize: 16,
        textAlign: 'center',
        marginTop: 5,
    },
    buttonContainer: {
        paddingTop: 200,
    },
    button: {
        backgroundColor: '#E45A92',
        borderRadius: 30,
        paddingVertical: 20,
        paddingHorizontal: 80,
        elevation: 5,
        shadowColor: '#000',
        shadowOpacity: 0.25,
        shadowRadius: 4,
        shadowOffset: { width: 0, height: 2 },
        paddingTop: 15,
    },
    buttonLabel: {
        fontSize: 21,
        fontWeight: 'bold',
        color: '#fff',
    },
    loginContainer: {
        paddingTop: 10,
    },
    loginText: {
        fontSize: 19,
        flexDirection: 'row',
    },
    profText: {
        fontSize: 19,
        color: '#E45A92',
        fontStyle: 'italic',
        fontWeight: 400,
        top: 7
    },
})