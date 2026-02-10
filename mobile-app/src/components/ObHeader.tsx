import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu } from 'lucide-react-native';
import { colors } from '../theme';

interface ObHeaderProps {
    title: string;
    subtitle?: string;
    appName?: string;
    appSubtitle?: string;
    date?: string;
    showMenu?: boolean;
}

const ObHeader: React.FC<ObHeaderProps> = ({
    title,
    subtitle,
    appName = "ContraceptIQ",
    appSubtitle = "Clinical Decision Support Tool",
    date,
    showMenu = true
}) => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    const openDrawer = () => {
        navigation.dispatch(DrawerActions.openDrawer());
    };

    return (
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
            <View style={styles.topInfo}>
                <View />
                {date && <Text style={styles.dateText}>{date}</Text>}
            </View>

            <View style={styles.contentContainer}>
                {showMenu && (
                    <TouchableOpacity
                        style={styles.menuBtn}
                        onPress={openDrawer}
                    >
                        <Menu color="#FFF" size={24} />
                    </TouchableOpacity>
                )}
                <View style={styles.doctorInfo}>
                    <Text style={styles.greeting}>{title}</Text>
                    <Text style={styles.subtitle}>{subtitle}</Text>
                </View>
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
        backgroundColor: 'rgba(255,255,255,0.25)',
        padding: 12,
        borderRadius: 14,
        marginRight: 16,
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
});

export default ObHeader;
