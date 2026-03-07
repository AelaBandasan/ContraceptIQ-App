import { StyleSheet, Text, TouchableOpacity, View, Image, StatusBar } from 'react-native';
import React, { useEffect } from 'react';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from 'react-native-responsive-screen';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    FadeInUp,
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    withRepeat,
    withSequence,
    withDelay,
    withTiming,
    Easing
} from 'react-native-reanimated';
import { ArrowRight } from 'lucide-react-native';

import Logo from '../../assets/cl_tempLogo.png';
import { colors, shadows } from '../theme';

const UserStartingScreen = ({ navigation }: any) => {
    const logoScale = useSharedValue(0.9);

    // Background Animation Shared Values
    const blob1Pos = useSharedValue(0);
    const blob2Pos = useSharedValue(0);
    const blob3Pos = useSharedValue(0);

    useEffect(() => {
        // Logo breathing animation
        logoScale.value = withRepeat(
            withSequence(
                withSpring(1.03, { damping: 10, stiffness: 20 }),
                withSpring(0.97, { damping: 10, stiffness: 20 })
            ),
            -1,
            true
        );

        // Background floating animations
        blob1Pos.value = withRepeat(
            withTiming(1, { duration: 8000, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        );

        blob2Pos.value = withRepeat(
            withTiming(1, { duration: 10000, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        );

        blob3Pos.value = withRepeat(
            withTiming(1, { duration: 12000, easing: Easing.inOut(Easing.sin) }),
            -1,
            true
        );
    }, []);

    const animatedLogoStyle = useAnimatedStyle(() => ({
        transform: [{ scale: logoScale.value }],
    }));

    // Background Blob Styles
    const blob1Style = useAnimatedStyle(() => ({
        transform: [
            { translateX: withSpring(blob1Pos.value * 20) },
            { translateY: withSpring(blob1Pos.value * -30) }
        ],
    }));

    const blob2Style = useAnimatedStyle(() => ({
        transform: [
            { translateX: withSpring(blob2Pos.value * -40) },
            { translateY: withSpring(blob2Pos.value * 20) }
        ],
    }));

    const blob3Style = useAnimatedStyle(() => ({
        transform: [
            { translateX: withSpring(blob3Pos.value * 30) },
            { translateY: withSpring(blob3Pos.value * 40) }
        ],
    }));

    const handleContinueAsGuest = () => {
        navigation.navigate('MainDrawer');
    };

    const handleOBlogin = () => {
        navigation.navigate('LoginforOB');
    };

    return (
        <View style={styles.screen}>
            <StatusBar barStyle="dark-content" />
            <LinearGradient
                colors={['#FFFFFF', '#FFF9FB', '#FFF0F5']}
                style={styles.gradientBackground}
            >
                {/* Animated Background Mesh Elements */}
                <View style={StyleSheet.absoluteFill} pointerEvents="none">
                    <Animated.View style={[styles.blob, styles.blob1, blob1Style]} />
                    <Animated.View style={[styles.blob, styles.blob2, blob2Style]} />
                    <Animated.View style={[styles.blob, styles.blob3, blob3Style]} />
                </View>

                <View style={styles.container}>
                    <View style={styles.brandingSection}>
                        {/* Logo Section */}
                        <Animated.View style={[styles.logoContainer, animatedLogoStyle]}>
                            <Image source={Logo} style={styles.logo} />
                        </Animated.View>

                        {/* Title and Tagline grouped below Logo */}
                        <View style={styles.textContainer}>
                            <Animated.Text style={styles.title}>
                                ContraceptIQ
                            </Animated.Text>

                            <Animated.View style={styles.subtitleContainer}>
                                <Text style={styles.subtitle}>
                                    Where Data Meets{"\n"}
                                    <Text style={styles.subtitleHighlight}>Reproductive Health</Text>
                                </Text>
                            </Animated.View>
                        </View>
                    </View>

                    {/* Action Section */}
                    <Animated.View
                        entering={FadeInUp.delay(1000).duration(1200).springify()}
                        style={styles.bottomSection}
                    >
                        <TouchableOpacity
                            activeOpacity={0.8}
                            style={styles.primaryButtonContainer}
                            onPress={handleContinueAsGuest}
                        >
                            <View
                                style={[styles.primaryButton, { backgroundColor: colors.primary }]}
                            >
                                <Text style={styles.buttonLabel}>Continue as Guest</Text>
                                <ArrowRight size={20} color="#FFF" style={{ marginLeft: 12 }} />
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                            onPress={handleOBlogin}
                            style={styles.obLinkContainer}
                            activeOpacity={0.6}
                        >
                            <Text style={styles.obText}>
                                Sign in as <Text style={styles.obTextActive}>OB Professional</Text>
                            </Text>
                        </TouchableOpacity>
                    </Animated.View>
                </View>
            </LinearGradient>
        </View>
    );
};

export default UserStartingScreen;

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: '#fff',
    },
    gradientBackground: {
        flex: 1,
    },
    container: {
        flex: 1,
        paddingHorizontal: wp('8%'),
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: hp('8%'),
        paddingBottom: hp('8%'),
    },
    // Mesh Gradient Blobs
    blob: {
        position: 'absolute',
        borderRadius: 200,
        opacity: 0.15,
    },
    blob1: {
        top: -hp('10%'),
        left: -wp('20%'),
        width: wp('100%'),
        height: wp('100%'),
        backgroundColor: '#D81B60',
    },
    blob2: {
        bottom: hp('10%'),
        right: -wp('30%'),
        width: wp('120%'),
        height: wp('120%'),
        backgroundColor: '#FCE7F3',
    },
    blob3: {
        top: hp('30%'),
        left: -wp('40%'),
        width: wp('80%'),
        height: wp('80%'),
        backgroundColor: '#FDF2F8',
    },
    brandingSection: {
        alignItems: 'center',
        marginTop: hp('5%'),
        zIndex: 10,
    },
    logoContainer: {
        width: wp('60%'),
        height: wp('60%'),
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
    },
    textContainer: {
        alignItems: 'center',
        marginTop: hp('2%'),
    },
    title: {
        fontSize: hp('4.2%'),
        fontWeight: '900',
        color: '#D81B60',
        letterSpacing: -0.8,
        marginBottom: hp('0.5%'),
    },
    subtitleContainer: {
        alignItems: 'center',
    },
    subtitle: {
        fontSize: hp('2.1%'),
        color: '#455A64',
        textAlign: 'center',
        lineHeight: hp('3%'),
        fontWeight: '500',
        letterSpacing: 0.2,
    },
    subtitleHighlight: {
        color: '#263238',
        fontWeight: '800',
    },
    bottomSection: {
        width: '100%',
        alignItems: 'center',
        marginBottom: hp('2%'),
        zIndex: 10,
    },
    primaryButtonContainer: {
        width: '100%',
        ...shadows.md,
        shadowColor: '#D81B60',
        shadowOpacity: 0.3,
    },
    primaryButton: {
        flexDirection: 'row',
        height: hp('7.5%'),
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: wp('6%'),
    },
    buttonLabel: {
        fontSize: hp('2.3%'),
        fontWeight: 'bold',
        color: '#fff',
        letterSpacing: 0.5,
    },
    obLinkContainer: {
        marginTop: hp('3.5%'),
        padding: 10,
    },
    obText: {
        fontSize: hp('2%'),
        color: '#546E7A',
        fontWeight: '500',
    },
    obTextActive: {
        color: '#D81B60',
        fontWeight: '800',
    },
});
