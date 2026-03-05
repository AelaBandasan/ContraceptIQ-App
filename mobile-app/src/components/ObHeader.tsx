import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
    appName = "",
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
                        <View
                            style={styles.menuBtnSolid}
                        >
                            <Menu color="#FFF" size={24} />
                        </View>
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
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
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
    menuBtnSolid: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
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
});

export default ObHeader;
