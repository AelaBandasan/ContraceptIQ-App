import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../theme';

interface ObHeaderProps {
    title: string;
    subtitle?: string;
    appSubtitle?: string;
    date?: string;
    rightAction?: React.ReactNode;
}

const ObHeader: React.FC<ObHeaderProps> = ({
    title,
    subtitle,
    appSubtitle = "Clinical Decision Support Tool",
    date,
    rightAction
}) => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    return (
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
            <View style={styles.topInfo}>
                <View />
                {date && <Text style={styles.dateText}>{date}</Text>}
            </View>

            <View style={styles.contentContainer}>
                <View style={styles.doctorInfo}>
                    <Text style={styles.greeting}>{title}</Text>
                    <Text style={styles.subtitle}>{subtitle}</Text>
                </View>
                {rightAction && <View style={styles.rightActionContainer}>{rightAction}</View>}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: '#E45A92', // colors.primary
        paddingHorizontal: 20,
        paddingBottom: 30,
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
    },
    topInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
        opacity: 0.9,
    },
    appName: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    appSubtitle: {
        color: '#FFDBEB',
        fontSize: 10,
        fontWeight: '500',
    },
    dateText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '500',
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuBtn: {
        width: 42,
        height: 42,
        borderRadius: 12,
        overflow: 'hidden',
        marginRight: 16,
    },
    gradient: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    doctorInfo: {
        flex: 1,
    },
    greeting: {
        color: '#FFDBEB',
        fontSize: 14,
        fontWeight: '500',
    },
    subtitle: {
        color: '#FFFFFF',
        fontSize: 22,
        fontWeight: 'bold',
    },
    rightActionContainer: {
        marginLeft: 16,
    }
});

export default ObHeader;
