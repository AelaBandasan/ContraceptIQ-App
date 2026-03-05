import React from 'react';
import {
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
    ChevronRight,
    BookOpen,
    Tablet,
    Shield,
    Syringe,
    Calendar,
    AlertTriangle,
    Activity
} from 'lucide-react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, spacing, typography, shadows, borderRadius } from '../theme';

const LEARN_DATA = [
    {
        id: '1',
        title: 'The Pill',
        subtitle: 'How it works & daily routines.',
        icon: Tablet,
        color: '#E45A92',
    },
    {
        id: '2',
        title: 'IUDs & Implants',
        subtitle: 'Long-term, low-maintenance options.',
        icon: Shield,
        color: '#8B5CF6',
    },
    {
        id: '3',
        title: 'The Shot & Patch',
        subtitle: 'Understanding non-daily methods.',
        icon: Syringe,
        color: '#3B82F6',
    },
    {
        id: '4',
        title: 'Natural Planning',
        subtitle: 'Tracking fertility and cycles.',
        icon: Calendar,
        color: '#10B981',
    },
    {
        id: '5',
        title: 'Emergency Options',
        subtitle: "What to do when things don't go to plan.",
        icon: AlertTriangle,
        color: '#F59E0B',
    },
    {
        id: '6',
        title: 'Side Effects',
        subtitle: 'What is normal and what to watch for.',
        icon: Activity,
        color: '#F43F5E',
    },
];

const LearnHub = ({ navigation }: any) => {
    const insets = useSafeAreaInsets();

    const renderArticleRow = (item: any) => (
        <TouchableOpacity key={item.id} style={styles.rowCard}>
            <View style={[styles.iconContainer, { backgroundColor: item.color + '15' }]}>
                <item.icon size={22} color={item.color} strokeWidth={2.5} />
            </View>
            <View style={styles.textContainer}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <Text style={styles.rowSubtitle}>{item.subtitle}</Text>
            </View>
            <ChevronRight size={20} color="#CBD5E1" />
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header (Branded like HomeScreen) */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <View
                        style={styles.menuButtonSolid}
                    >
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </View>
                </TouchableOpacity>

                <View style={styles.titleContainer}>
                    <Text style={styles.headerText}>Educational Hub</Text>
                </View>
            </View>

            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.introContainer}>
                    <Text style={styles.introTitle}>Essentials</Text>
                    <Text style={styles.introSubtitle}>Key guides to help you make informed choices.</Text>
                </View>

                <View style={styles.listContainer}>
                    {LEARN_DATA.map(renderArticleRow)}
                </View>

                {/* Bottom Spacer */}
                <View style={{ height: 40 }} />
            </ScrollView>
        </View>
    );
};

export default LearnHub;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAF9',
    },
    header: {
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingBottom: 20,
        borderBottomLeftRadius: 32,
        borderBottomRightRadius: 32,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 3,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 14,
        overflow: 'hidden',
    },
    menuButtonSolid: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitleContainer: {
        marginLeft: 15,
    },
    headerAppTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
    },
    headerTagline: {
        fontSize: 14,
        color: '#FFDBEB',
        fontStyle: 'italic',
    },
    titleContainer: {
        marginLeft: 15,
    },
    headerText: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#FFF',
    },
    scrollContent: {
        paddingTop: 20,
    },
    introContainer: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    introTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 4,
    },
    introSubtitle: {
        fontSize: 14,
        color: '#64748B',
    },
    listContainer: {
        paddingHorizontal: 20,
    },
    rowCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        ...shadows.sm,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    textContainer: {
        flex: 1,
    },
    rowTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F2937',
        marginBottom: 2,
    },
    rowSubtitle: {
        fontSize: 13,
        color: '#64748B',
    },
});
