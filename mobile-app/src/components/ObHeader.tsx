import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation, DrawerActions } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, Menu } from 'lucide-react-native';
import { colors } from '../theme';

interface ObHeaderProps {
    title: string;
    subtitle?: string;
    date?: string;
    showMenu?: boolean;
    showBack?: boolean;
    onBackPress?: () => void;
}

const ObHeader: React.FC<ObHeaderProps> = ({
    title,
    subtitle,
    showMenu = false,
    showBack = false,
    onBackPress,
}) => {
    const navigation = useNavigation<any>();
    const insets = useSafeAreaInsets();

    const openDrawer = () => {
        navigation.dispatch(DrawerActions.openDrawer());
    };

    const goBack = () => {
        if (onBackPress) {
            onBackPress();
            return;
        }

        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    };

    return (
        <View style={[styles.header, { paddingTop: insets.top + 10 }]}> 
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
                {showBack && (
                    <TouchableOpacity
                        style={styles.menuBtn}
                        onPress={goBack}
                    >
                        <View
                            style={styles.menuBtnSolid}
                        >
                            <ChevronLeft color="#FFF" size={24} />
                        </View>
                    </TouchableOpacity>
                )}
                <View style={[styles.headerTitleContainer, !showMenu && !showBack && styles.headerTitleContainerNoMenu]}>
                    <Text style={styles.headerTitle}>{title}</Text>
                    {subtitle ? <Text style={styles.headerSubtitle}>{subtitle}</Text> : null}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    header: {
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingBottom: 15,
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    contentContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    menuBtn: {
        width: 42,
        height: 42,
        borderRadius: 16,
        overflow: 'hidden',
    },
    menuBtnSolid: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        flex: 1,
        marginLeft: 16,
    },
    headerTitleContainerNoMenu: {
        marginLeft: 0,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: -0.5,
    },
    headerSubtitle: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.85)',
        fontWeight: '500',
        marginTop: 2,
    },
});

export default ObHeader;
