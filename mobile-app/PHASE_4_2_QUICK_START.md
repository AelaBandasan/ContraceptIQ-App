# Phase 4.2 Quick Integration Guide

## 🚀 Quick Start: Using Error Handling in Your Components

This guide shows how to use the Phase 4.2 error handling infrastructure in your React Native components.

---

## Basic Pattern (5 steps)

### Step 1: Import Error Components

```typescript
import { ErrorAlert } from "../components/ErrorAlert";
import { createAppError } from "../utils/errorHandler";
```

### Step 2: Set Up State

```typescript
const [error, setError] = useState<AppError | null>(null);
const [loading, setLoading] = useState(false);
```

### Step 3: Make API Call with Error Handling

```typescript
const handleAssessment = async () => {
  setLoading(true);
  setError(null);

  try {
    const result =
      await discontinuationRiskService.assessDiscontinuationRisk(data);
    // Handle success - update context/state
  } catch (err) {
    // Catch and convert to AppError
    setError(createAppError(err));
  } finally {
    setLoading(false);
  }
};
```

### Step 4: Display Error Alert

```typescript
<ErrorAlert
  error={error}
  onRetry={handleAssessment}
  onDismiss={() => setError(null)}
/>
```

### Step 5: Test Scenarios

- Turn off network → See offline error
- Provide invalid data → See validation error
- Stop API server → See connection error with retry

---

## Complete Component Example

```typescript
import React, { useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { ErrorAlert } from '../components/ErrorAlert';
import { RiskAssessmentCard } from '../components/RiskAssessmentCard';
import { discontinuationRiskService } from '../services/discontinuationRiskService';
import { createAppError, AppError } from '../utils/errorHandler';
import { useAssessment } from '../context/AssessmentContext';

export const Recommendation: React.FC = () => {
  const { assessment, setAssessmentResult } = useAssessment();
  const [error, setError] = useState<AppError | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePerformAssessment = async () => {
    setLoading(true);
    setError(null);

    try {
      // Make API call with built-in error handling
      const result = await discontinuationRiskService.assessDiscontinuationRisk(
        assessment.data
      );

      // Store result in context
      setAssessmentResult(result);

    } catch (err) {
      // Convert any error to AppError with context
      const appError = createAppError(err, {
        operation: 'assessDiscontinuationRisk',
        component: 'Recommendation'
      });

      setError(appError);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Error Alert - Automatically handles retry/dismiss */}
      <ErrorAlert
        error={error}
        onRetry={handlePerformAssessment}
        onDismiss={() => setError(null)}
      />

      {/* Risk Assessment Card - Shows results */}
      {assessment.result && (
        <RiskAssessmentCard result={assessment.result} />
      )}

      {/* Assessment Button */}
      {/* ... button with onPress={handlePerformAssessment} ... */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
});
```

---

## Error Types You'll Encounter

### Offline Error

```typescript
// When device has no internet
if (error?.type === "OfflineError") {
  // Already handled by ErrorAlert
  // Shows: "No Internet Connection" with retry button
}
```

### Validation Error

```typescript
// When user data is invalid
if (error?.type === "ValidationError") {
  // Already handled by ErrorAlert
  // Shows: "Invalid Input" with helpful message
}
```

### Network Error

```typescript
// When connection fails
if (error?.type === "NetworkError") {
  // Already handled by ErrorAlert
  // Shows: "Connection Failed" with retry button
  // Service automatically retries 3 times
}
```

### Timeout Error

```typescript
// When request takes >30 seconds
if (error?.type === "TimeoutError") {
  // Already handled by ErrorAlert
  // Shows: "Request Timeout" with retry button
}
```

### Server Error

```typescript
// When backend returns 500, 502, 503
if (error?.type === "ServiceUnavailableError") {
  // Already handled by ErrorAlert
  // Shows: "Service Unavailable" with retry button
  // Service retries with longer backoff
}
```

---

## Advanced: Network-Aware Features

### Check Before API Call

```typescript
import { isOnline } from "../utils/networkUtils";

const handleAssessment = async () => {
  // Check network first
  const online = await isOnline();

  if (!online) {
    setError(createAppError(new Error("Device offline")));
    return;
  }

  // Proceed with API call
  try {
    const result = await discontinuationRiskService.assess(data);
  } catch (err) {
    setError(createAppError(err));
  }
};
```

### Listen for Network Changes

```typescript
import { subscribeToNetworkStatus } from "../utils/networkUtils";

useEffect(() => {
  // Listen for network changes
  const unsubscribe = subscribeToNetworkStatus((status) => {
    if (!status.isConnected) {
      disableFormSubmission();
    } else {
      enableFormSubmission();
    }
  });

  return unsubscribe;
}, []);
```

---

## Advanced: Logging

### Create Module Logger

```typescript
import { createModuleLogger } from "../utils/loggerUtils";

const logger = createModuleLogger("MyComponent");

// Log significant operations
logger.info("Assessment started", {
  featureCount: Object.keys(assessment).length,
});

// Log errors
logger.error("Assessment failed", error, {
  attempt: 1,
});
```

### Export Logs for Debugging

```typescript
import { getLogger } from "../utils/loggerUtils";

const handleExportLogs = () => {
  const logs = getLogger().exportLogs();
  // Send to backend, share with support, etc.
  console.log(logs);
};
```

---

## Common Patterns

### Pattern 1: Form Submission with Error Handling

```typescript
const handleSubmit = async () => {
  setError(null);
  setLoading(true);

  try {
    // Validate first
    validateFormData(formData);

    // Make API call
    const result = await apiService.submit(formData);

    // Success
    navigation.navigate("Success", { result });
  } catch (err) {
    // Show error
    setError(createAppError(err, { form: "MyForm" }));
  } finally {
    setLoading(false);
  }
};
```

### Pattern 2: Retry with Manual Attempt Count

```typescript
const [retryCount, setRetryCount] = useState(0);

const handleRetry = async () => {
  setRetryCount((prev) => prev + 1);

  if (retryCount >= 3) {
    setError(createAppError(new Error("Max retries reached")));
    return;
  }

  try {
    const result = await apiCall();
  } catch (err) {
    setError(createAppError(err));
  }
};
```

### Pattern 3: Cascade Error Handling

```typescript
const handleComplexOperation = async () => {
  try {
    // Step 1: Check network
    const online = await isOnline();
    if (!online) throw createAppError(new Error("Offline"));

    // Step 2: Validate data
    validateData(data);

    // Step 3: Make request
    const result = await apiService.request(data);

    return result;
  } catch (err) {
    const appError = createAppError(err, {
      operation: "complexOperation",
    });

    // Log with context
    logger.error("Complex operation failed", appError);

    // Set for UI display
    setError(appError);

    // Re-throw for parent handling if needed
    throw appError;
  }
};
```

---

## Troubleshooting

### Q: Error shows but retry doesn't work

**A:** Make sure `onRetry` function is passed to ErrorAlert

```typescript
<ErrorAlert
  error={error}
  onRetry={handleAssessment}  // ← Must pass this
  onDismiss={() => setError(null)}
/>
```

### Q: Offline detection not working

**A:** Ensure `@react-native-community/netinfo` is installed

```bash
npm install @react-native-community/netinfo
# or
yarn add @react-native-community/netinfo
```

### Q: No logs being captured

**A:** Use createModuleLogger in your component

```typescript
const logger = createModuleLogger("MyComponent");
logger.info("My message"); // Now it's logged
```

### Q: Retry button keeps showing after success

**A:** Clear error state after success

```typescript
try {
  const result = await apiCall();
  setError(null); // ← Clear error
} catch (err) {
  setError(createAppError(err));
}
```

---

## File Locations Reference

```
mobile-app/
├── src/
│   ├── components/
│   │   ├── ErrorAlert.tsx          ← Error UI component
│   │   └── ...
│   ├── services/
│   │   └── discontinuationRiskService.ts  ← Enhanced API service
│   ├── utils/
│   │   ├── networkUtils.ts         ← Network detection
│   │   ├── loggerUtils.ts          ← Logging
│   │   ├── errorHandler.ts         ← Error classification
│   │   └── errorMessageMapper.ts   ← Error messages
│   └── ...
└── PHASE_4_2_COMPLETION_REPORT.md  ← Full documentation
```

---

## Next: Component Integration (Phase 4.3)

Add ErrorAlert to these components:

1. **Recommendation.tsx** - For risk assessment
2. **Whatsrightforme.tsx** - For feature submission
3. **RiskAssessmentCard.tsx** - For display errors

Simply wrap with:

```typescript
<ErrorAlert error={error} onRetry={retry} onDismiss={dismiss} />
```

---

## Summary

✅ **Import ErrorAlert** - Use error UI component  
✅ **Create AppError** - Standardize any error  
✅ **Handle in Try-Catch** - Catch and convert errors  
✅ **Pass to ErrorAlert** - Display to user  
✅ **Implement Retry** - Let user retry easily

**That's it!** The rest (offline detection, retry logic, logging) happens automatically.

---

**Questions?** Refer to `PHASE_4_2_ERROR_HANDLING_COMPLETE.md` for complete documentation.
