import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  Modal,
  Animated,
  PanResponder,
  ActivityIndicator,
  Alert,
  TouchableWithoutFeedback,
} from 'react-native';
import React, { useState, useRef, useEffect } from 'react';
import { ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { openDrawer } from '../navigation/NavigationService';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RootStackScreenProps } from '../types/navigation';
import { colors, typography, spacing, borderRadius } from '../theme';
import { RiskAssessmentCard } from '../components/RiskAssessmentCard';
import { ErrorAlert } from '../components/ErrorAlert';
import { 
  assessDiscontinuationRisk, 
  UserAssessmentData 
} from '../services/discontinuationRiskService';
import { AssessmentData, useAssessment } from '../context/AssessmentContext';
import { createAppError } from '../utils/errorHandler';

type Props = RootStackScreenProps<'Recommendation'>;

// Predefined inputs to ensure the model always has a valid baseline
const PREDEFINED_INPUTS: Partial<UserAssessmentData> = {
  REGION: 1,
  EDUC_LEVEL: 2,
  RELIGION: 1,
  ETHNICITY: 1,
  MARITAL_STATUS: 1,
  RESIDING_WITH_PARTNER: 1,
  HOUSEHOLD_HEAD_SEX: 1,
  OCCUPATION: 1,
  HUSBANDS_EDUC: 2,
  HUSBAND_AGE: 30,
  PARTNER_EDUC: 2,
  SMOKE_CIGAR: 2,
  PARITY: 1,
  DESIRE_FOR_MORE_CHILDREN: 1,
  WANT_LAST_CHILD: 1,
  WANT_LAST_PREGNANCY: 1,
  CONTRACEPTIVE_METHOD: 1,
  MONTH_USE_CURRENT_METHOD: 6,
  PATTERN_USE: 1,
  TOLD_ABT_SIDE_EFFECTS: 1,
  LAST_SOURCE_TYPE: 3,
  LAST_METHOD_DISCONTINUED: 2,
  REASON_DISCONTINUED: 0,
  HSBND_DESIRE_FOR_MORE_CHILDREN: 2,
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const Recommendation: React.FC<Props> = ({ navigation }) => {
  // State
  const [sliderValue, setSliderValue] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [isAssessing, setIsAssessing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const translateY = useRef(new Animated.Value(500)).current;

  // Context
  const {
    assessmentData,
    assessmentResult,
    updateAssessmentData,
    setAssessmentResult,
  } = useAssessment();

  // Constants
  const ageRanges = [
    'Menarche to < 18 years',
    '18 - 19 years',
    '20 - 39 years',
    '40 - 45 years',
    '≥ 46 years',
  ];

  const representativeAges = [17, 19, 30, 42, 48];

  const colorMap: Record<number, string> = {
    1: '#4CAF50', // Green
    2: '#FFEB3B', // Yellow
    3: '#FF9800', // Orange
    4: '#F44336', // Red
    5: '#bbb',    // Gray
  };

  const recommendations: Record<number, Record<string, number>> = {
    0: { pills: 1, patch: 1, copperIUD: 2, levIUD: 2, implant: 2, injectables: 2 },
    1: { pills: 1, patch: 1, copperIUD: 2, levIUD: 2, implant: 1, injectables: 1 },
    2: { pills: 1, patch: 1, copperIUD: 1, levIUD: 1, implant: 1, injectables: 1 },
    3: { pills: 1, patch: 2, copperIUD: 1, levIUD: 1, implant: 1, injectables: 1 },
    4: { pills: 1, patch: 2, copperIUD: 1, levIUD: 1, implant: 1, injectables: 2 },
  };

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleAssessDiscontinuationRisk = async () => {
    // Prevent duplicate requests
    if (isAssessing) return;

    try {
      setIsAssessing(true);
      setError(null);

      console.log('[Recommendation] Starting risk assessment...');

      // Get selected age
      const selectedAge = representativeAges[sliderValue];

      // Prepare the data for the API call, merging with predefined inputs
      // We use the local selectedAge variable to ensure the API gets the right value
      // regardless of when the context state update finishes.
      const apiData: UserAssessmentData = {
        ...PREDEFINED_INPUTS,
        ...(assessmentData || {}),
        AGE: selectedAge,
      } as UserAssessmentData;

      console.log('[Recommendation] Prepared API Data:', apiData);

      // Call API
      const result = await assessDiscontinuationRisk(apiData);

      console.log('[Recommendation] Assessment successful:', result);

      // Store result in context
      setAssessmentResult({
        riskLevel: result.risk_level,
        confidence: result.confidence,
        recommendation: result.recommendation,
        contraceptiveMethod: result.method_name || 'Current Method',
        timestamp: new Date().toISOString(),
      });

      // Update context with the selected age
      updateAssessmentData({ AGE: selectedAge });
    } catch (err) {
      console.error('[Recommendation] Assessment failed:', err);
      const appError = createAppError(err, "Recommendation: handleAssessDiscontinuationRisk");
      setError(new Error(appError.userMessage));
      Alert.alert('Assessment Error', appError.userMessage);
    } finally {
      setIsAssessing(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    handleAssessDiscontinuationRisk();
  };

  const handleDismissError = () => {
    setError(null);
  };

  const handleSliderChange = (value: number) => {
    setSliderValue(value);
  };

  const handleSlidingComplete = (value: number) => {
    setSliderValue(value);
    setModalVisible(true);
  };

  const handleAddPreference = () => {
    navigation.navigate('Preferences');
  };

  const handleViewRecommendation = () => {
    navigation.navigate('ViewRecommendation');
  };

  const getColor = (method: string): string => {
    const code = recommendations[sliderValue][method];
    return colorMap[code] || '#ccc';
  };

  // ============================================================================
  // PAN RESPONDER
  // ============================================================================

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dy) > 20,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          translateY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100) {
          Animated.timing(translateY, {
            toValue: 500,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(500);
            setModalVisible(false);
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // ============================================================================
  // EFFECTS
  // ============================================================================

  useEffect(() => {
    if (modalVisible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [modalVisible]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={openDrawer} style={styles.menuButton}>
            <Ionicons name="menu" size={35} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerText}>What's Right for Me?</Text>
          <View style={styles.menuButton} />
        </View>

        {/* Main Content */}
        <View style={styles.screenCont}>
          <Text style={styles.header2}>Tell us about you</Text>
          <Text style={styles.header3}>
            Enter your age to personalize recommendations.
          </Text>

          {/* Age Selector */}
          <View style={styles.ageCont}>
            <View style={styles.ageHeader}>
              <Image
                source={require('../../assets/image/age.png')}
                style={styles.ageIcon}
              />
              <Text style={styles.ageLabel}>Age</Text>
            </View>

            <Text style={styles.selectedAge}>{ageRanges[sliderValue]}</Text>

            <View style={styles.sliderCont}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={4}
                step={1}
                value={sliderValue}
                onValueChange={handleSliderChange}
                onSlidingComplete={handleSlidingComplete}
                minimumTrackTintColor="#E45A92"
                maximumTrackTintColor="#D3D3D3"
                thumbTintColor="#E45A92"
              />
              <View style={styles.sliderLabel}>
                <Text style={styles.labelText}>Menarche to {'< 18'}</Text>
                <Text style={styles.labelText}>(≥ 46)</Text>
              </View>
            </View>
          </View>

          {/* Add Preferences Button */}
          <TouchableOpacity
            style={styles.prefButton}
            onPress={handleAddPreference}
          >
            <Text style={styles.prefLabel}>+ Add Preferences</Text>
          </TouchableOpacity>

          {/* Error Alert */}
          {error && (
            <ErrorAlert
              error={error}
              onRetry={handleRetry}
              onDismiss={handleDismissError}
              style={styles.errorAlert}
            />
          )}

          {/* Risk Assessment Button */}
          <TouchableOpacity
            style={[
              styles.riskAssessmentButton,
              isAssessing && styles.riskAssessmentButtonDisabled,
            ]}
            onPress={handleAssessDiscontinuationRisk}
            disabled={isAssessing}
          >
            {isAssessing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.loadingText}>Assessing...</Text>
              </View>
            ) : (
              <Text style={styles.riskAssessmentButtonText}>
                🔍 Assess My Discontinuation Risk
              </Text>
            )}
          </TouchableOpacity>

          {/* Risk Assessment Result Card */}
          {assessmentResult && (
            <RiskAssessmentCard
              riskLevel={assessmentResult.riskLevel}
              confidence={assessmentResult.confidence}
              recommendation={assessmentResult.recommendation}
              contraceptiveMethod={assessmentResult.contraceptiveMethod}
              style={styles.riskCard}
            />
          )}
        </View>

        {/* Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="none"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
              <View style={StyleSheet.absoluteFill} />
            </TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalContainer,
                { transform: [{ translateY }] },
              ]}
              {...panResponder.panHandlers}
            >
              <View style={styles.modalHandle} />

              <TouchableOpacity
                style={styles.recomButton}
                onPress={handleViewRecommendation}
              >
                <Text style={styles.modalHeader}>View Recommendation</Text>
              </TouchableOpacity>

              <View style={styles.modalContent}>
                <Text style={styles.modalText}>Selected Age:</Text>
                <Text style={styles.modalAge}>{ageRanges[sliderValue]}</Text>
              </View>

              <View style={styles.modalButtons}>
                <View style={styles.recomRow}>
                  <ContraceptiveItem
                    image={require('../../assets/image/copperiud.png')}
                    label="Cu-IUD"
                    color={getColor('copperIUD')}
                  />
                  <ContraceptiveItem
                    image={require('../../assets/image/implantt.png')}
                    label="LNG/ETG"
                    color={getColor('implant')}
                  />
                  <ContraceptiveItem
                    image={require('../../assets/image/injectables.png')}
                    label="DMPA"
                    color={getColor('injectables')}
                  />
                </View>

                <View style={styles.recomRow}>
                  <ContraceptiveItem
                    image={require('../../assets/image/leviud.png')}
                    label="LNG-IUD"
                    color={getColor('levIUD')}
                  />
                  <ContraceptiveItem
                    image={require('../../assets/image/patchh.png')}
                    label="CHC"
                    color={getColor('patch')}
                  />
                  <ContraceptiveItem
                    image={require('../../assets/image/pillss.png')}
                    label="POP"
                    color={getColor('pills')}
                  />
                </View>
              </View>
            </Animated.View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

interface ContraceptiveItemProps {
  image: any;
  label: string;
  color: string;
}

const ContraceptiveItem: React.FC<ContraceptiveItemProps> = ({
  image,
  label,
  color,
}) => (
  <View style={styles.recomItem}>
    <Image
      source={image}
      style={[styles.contraceptiveImg, { borderColor: color }]}
    />
    <Text style={styles.contraceptiveLabel}>{label}</Text>
  </View>
);

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    paddingTop: 10,
    paddingBottom: 90,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 20,
  },
  menuButton: {
    padding: 5,
    width: 45,
  },
  headerText: {
    fontSize: 21,
    fontWeight: '600',
    textAlign: 'center',
  },
  screenCont: {
    paddingHorizontal: 20,
  },
  header2: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.medium,
  },
  header3: {
    fontSize: typography.sizes.sm,
    fontStyle: 'italic',
    color: colors.text.secondary,
  },
  ageCont: {
    elevation: 20,
    backgroundColor: '#FBFBFB',
    width: '100%',
    borderRadius: 10,
    marginTop: 25,
    paddingVertical: 20,
    paddingHorizontal: 20,
    shadowOpacity: 0.5,
    shadowRadius: 100,
    shadowOffset: { width: 2, height: 2 },
    alignSelf: 'center',
  },
  ageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ageIcon: {
    resizeMode: 'contain',
    height: 45,
    width: 45,
  },
  ageLabel: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.semibold,
    paddingLeft: spacing.sm,
  },
  selectedAge: {
    fontSize: typography.sizes.base,
    color: colors.text.primary,
    fontWeight: typography.weights.regular,
    paddingLeft: spacing.sm,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  sliderCont: {
    width: '100%',
    marginTop: 10,
  },
  slider: {
    width: '100%',
    height: spacing['4xl'],
  },
  sliderLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -spacing.sm,
  },
  labelText: {
    fontSize: 14,
    color: '#333',
  },
  prefButton: {
    marginTop: 30,
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
  },
  prefLabel: {
    textAlign: 'center',
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  errorAlert: {
    marginBottom: 16,
  },
  riskAssessmentButton: {
    marginTop: 30,
    marginBottom: 20,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: '#E45A92',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  riskAssessmentButtonDisabled: {
    backgroundColor: '#C4C4C4',
    elevation: 2,
  },
  riskAssessmentButtonText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: '#fff',
    textAlign: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: typography.sizes.base,
    fontWeight: typography.weights.semibold,
    color: '#fff',
    marginLeft: 10,
  },
  riskCard: {
    marginHorizontal: 0,
    marginTop: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    alignItems: 'center',
    height: '60%',
    elevation: 15,
  },
  modalHandle: {
    width: 60,
    height: 6,
    backgroundColor: colors.border.main,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.base,
  },
  recomButton: {
    backgroundColor: '#E45A92',
    borderRadius: 30,
    paddingVertical: 18,
    width: '80%',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  modalHeader: {
    fontSize: typography.sizes['2xl'],
    fontWeight: typography.weights.bold,
    color: colors.background.primary,
  },
  modalContent: {
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 15,
  },
  modalText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.text.disabled,
  },
  modalAge: {
    fontSize: 20,
    fontWeight: '700',
    color: '#E45A92',
    marginTop: 5,
  },
  modalButtons: {
    width: '100%',
    alignItems: 'center',
    flex: 1,
  },
  recomRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 10,
    flexWrap: 'wrap',
  },
  recomItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '30%',
    marginBottom: 10,
  },
  contraceptiveImg: {
    width: 70,
    height: 70,
    resizeMode: 'contain',
    borderRadius: 35,
    borderWidth: 4,
    padding: 5,
    backgroundColor: '#fff',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 2 },
  },
  contraceptiveLabel: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '600',
    color: '#000',
    textAlign: 'center',
  },
});

export default Recommendation;