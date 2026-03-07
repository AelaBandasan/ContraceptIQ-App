# Phase 4.2: Comprehensive API Error Handling

## Overview

Phase 4.2 implements a complete error handling infrastructure for API interactions, network failures, and user-facing error messaging. This phase builds on the foundation laid in Phase 4.1 (Error Boundaries) and extends error handling specifically for network and API scenarios.

**Status:** ✅ INFRASTRUCTURE COMPLETE - Ready for Component Integration

---

## Components Created

### 1. **networkUtils.ts** (80+ lines)

Network connectivity detection and monitoring utilities.

**Key Functions:**

```typescript
// Get current network status
async function getNetworkStatus(): Promise<NetworkStatus>;

// Simple online/offline check
async function isOnline(): Promise<boolean>;

// Subscribe to network status changes
function subscribeToNetworkStatus(
  callback: (status: NetworkStatus) => void,
): () => void;
```

**NetworkType Enum:**

- `WiFi` - WiFi connection
- `Cellular` - Mobile data
- `Ethernet` - Wired connection
- `VPN` - Virtual private network
- `Other` - Unknown connection type
- `None` - No connection

**Usage Example:**

```typescript
import { isOnline, subscribeToNetworkStatus } from "../utils/networkUtils";

// Check before API call
const online = await isOnline();
if (!online) {
  showErrorMessage("Device is offline");
  return;
}

// Listen for connectivity changes
const unsubscribe = subscribeToNetworkStatus((status) => {
  console.log(`Network changed: ${status.type}`);
});
```

---

### 2. **loggerUtils.ts** (200+ lines)

Application-wide logging with module isolation.

**Logger Class Methods:**

```typescript
// Log levels
debug(module: string, message: string, data?: any): void
info(module: string, message: string, data?: any): void
warn(module: string, message: string, data?: any): void
error(module: string, message: string, error: Error, data?: any): void

// Log retrieval
getLogs(): LogEntry[]
getLogsByLevel(level: LogLevel): LogEntry[]
getLogsByModule(module: string): LogEntry[]

// Export
exportLogs(): string (JSON)
exportLogsAsCSV(): string (CSV)
```

**LogLevel Enum:**

- `DEBUG` - Detailed debugging information
- `INFO` - Informational messages
- `WARN` - Warning messages
- `ERROR` - Error messages

**Usage Example:**

```typescript
import { createModuleLogger, getLogger } from "../utils/loggerUtils";

// Create module-specific logger
const logger = createModuleLogger("MyComponent");

// Log messages
logger.info("Operation started");
logger.error("Operation failed", new Error("Network timeout"));

// Export logs for debugging
const allLogs = getLogger().exportLogs();
```

**Features:**

- In-memory log storage (max 100 entries)
- Module-specific logging isolation
- Console logging in development
- Export as JSON/CSV for debugging
- Remote logging service support (framework included)

---

### 3. **errorHandler.ts** (250+ lines)

Comprehensive error classification and factory.

**ErrorType Enum (14 types):**

```typescript
// Network & Connectivity
"NetworkError"; // Connection failed
"TimeoutError"; // Request timeout
"OfflineError"; // Device offline

// Client Errors
"ValidationError"; // 400 - Invalid input
"UnauthorizedError"; // 401 - Not authenticated
"ForbiddenError"; // 403 - Insufficient permissions
"NotFoundError"; // 404 - Resource not found
"ConflictError"; // 409 - Duplicate/conflict

// Rate Limiting
"TooManyRequestsError"; // 429 - Rate limited

// Server Errors
"InternalServerError"; // 500 - Server error
"BadGatewayError"; // 502 - Gateway error
"ServiceUnavailableError"; // 503 - Service down

// Fallback
"UnknownError"; // Unmapped error
```

**Main Functions:**

```typescript
// Create AppError from any error type
function createAppError(error: any, context?: Record<string, any>): AppError;

// Handle axios errors specifically
function handleHttpError(error: AxiosError): AppError;

// Error predicates
function isRetryableError(error: AppError | Error): boolean;
function isOfflineError(error: AppError | Error): boolean;
function isValidationError(error: AppError | Error): boolean;
function isTimeoutError(error: AppError | Error): boolean;
function isServerError(error: AppError | Error): boolean;

// Message utilities
function getUserErrorMessage(error: AppError | Error): string;
function getTechnicalErrorMessage(error: AppError | Error): string;
function getErrorDetails(error: AppError | Error): string;
```

**AppError Interface:**

```typescript
interface AppError extends Error {
  type: ErrorType; // Error classification
  message: string; // Technical message
  userMessage: string; // User-friendly message
  statusCode?: number; // HTTP status if applicable
  originalError?: Error; // Root cause
  shouldRetry?: boolean; // Can be retried
  timestamp: string; // ISO timestamp
}
```

**Usage Example:**

```typescript
import { createAppError, isRetryableError } from "../utils/errorHandler";

try {
  await apiCall();
} catch (error) {
  const appError = createAppError(error, { operation: "apiCall" });

  if (isRetryableError(appError)) {
    // Safe to retry
    attemptRetry();
  } else if (isOfflineError(appError)) {
    // Device is offline
    showOfflineMessage();
  } else if (isValidationError(appError)) {
    // User input is invalid
    showValidationError();
  }
}
```

---

### 4. **errorMessageMapper.ts** (350+ lines)

Maps errors to user-friendly messages and UI actions.

**ErrorDisplay Interface:**

```typescript
interface ErrorDisplay {
  title: string; // Error title
  message: string; // User-friendly message
  userAction?: string; // Suggested user action
  icon: "warning" | "error" | "info" | "offline";
  severity: "critical" | "warning" | "info";
  actionLabel?: string; // Button label
  actionType?: "retry" | "settings" | "dismiss";
  showDetails?: boolean; // Show details button
}
```

**Key Functions:**

```typescript
// Get display info for error
function getErrorDisplay(error: AppError | string | Error): ErrorDisplay;

// Check if error supports retry
function shouldShowRetry(error: AppError | string | Error): boolean;

// Get recommended delay before retry
function getRetryDelay(
  error: AppError | string | Error,
  attemptNumber: number,
): number;

// Get error category for analytics
function getErrorCategory(error: AppError | string | Error): string;
```

**Retry Delay Strategy:**

- **Rate Limit (429):** 5s + 2s per attempt
- **Service Unavailable (503):** Exponential backoff 2s, 4s, 8s...
- **Network Errors:** Exponential backoff 1s, 2s, 4s...
- **Other:** No delay

---

### 5. **ErrorAlert.tsx** (400+ lines)

React Native components for displaying errors to users.

**ErrorAlert Component:**

```typescript
<ErrorAlert
  error={error}
  onRetry={handleRetry}
  onDismiss={handleDismiss}
  visible={true}
  showDetails={false}
/>
```

**Features:**

- User-friendly error messaging
- Automatic retry button for retryable errors
- Loading state during retry
- Detailed error information (development mode)
- Color-coded severity levels
- Emoji icons for visual clarity

**ErrorBanner Component:**

```typescript
<ErrorBanner
  error={error}
  onDismiss={handleDismiss}
/>
```

**Usage Example:**

```typescript
const [error, setError] = useState<AppError | null>(null);

const handleAssessment = async () => {
  try {
    const result = await assessmentService.assess(data);
    // Handle success
  } catch (err) {
    setError(createAppError(err));
  }
};

return (
  <>
    <ErrorAlert
      error={error}
      onRetry={handleAssessment}
      onDismiss={() => setError(null)}
    />
    {/* Rest of UI */}
  </>
);
```

---

### 6. **discontinuationRiskService.ts** (Enhanced)

Enhanced service layer with full error handling integration.

**Enhancements Made:**

1. ✅ Network connectivity checks before API calls
2. ✅ Offline error detection
3. ✅ Comprehensive error logging
4. ✅ Network-aware retry logic
5. ✅ Validation error mapping
6. ✅ Server error handling
7. ✅ User-friendly error messages

**Methods Enhanced:**

- `checkHealth()` - Network check + health verification
- `getRequiredFeatures()` - Offline detection + error logging
- `assessDiscontinuationRisk()` - Full error handling + retry logic
- `validateInputData()` - Enhanced validation with detailed logging

**Error Flow:**

```
User Action
    ↓
Check Network (isOnline())
    ↓
Validate Input (validateInputData())
    ↓
Make API Request
    ↓
Success? → Return Result
    ↓ (No)
Offline Error? → Offline Error Message
    ↓ (No)
Retryable? → Retry with Backoff
    ↓ (No)
Create AppError → Throw Error
    ↓
Component Catches & Logs Error
    ↓
Display ErrorAlert Component
```

---

## Error Handling Architecture

### Error Flow Chain

```
API Call Error
    ↓
axios Interceptor (if configured)
    ↓
Try-Catch Block in Service
    ↓
isOfflineError()? → OfflineError
    ↓ (No)
isRetryableError()? → Retry with Backoff
    ↓ (No - exhausted retries)
createAppError() → Standardized AppError
    ↓
Log Error (Logger)
    ↓
Component Receives AppError
    ↓
getErrorDisplay() → User-Friendly Message
    ↓
ErrorAlert Component → User Sees Clear Message
```

### Error Categories

#### Network Errors

- **Offline:** Device has no internet connection
- **Network:** Connection lost/failed during request
- **Timeout:** Request took too long (30s default)
- **Retry Strategy:** Exponential backoff, max 3 attempts

#### Client Errors (4xx)

- **400:** Validation error - don't retry
- **401:** Unauthorized - redirect to login
- **403:** Forbidden - permission denied
- **404:** Not found - resource doesn't exist
- **409:** Conflict - duplicate/conflicting data
- **429:** Rate limited - wait before retry

#### Server Errors (5xx)

- **500:** Internal server error - retry
- **502:** Bad gateway - retry
- **503:** Service unavailable - retry with longer backoff

---

## Integration Guide

### Step 1: Use in Components

```typescript
import React, { useState } from 'react';
import { ErrorAlert } from '../components/ErrorAlert';
import { discontinuationRiskService } from '../services/discontinuationRiskService';
import { createAppError } from '../utils/errorHandler';

const MyComponent = () => {
  const [error, setError] = useState<AppError | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAssess = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await discontinuationRiskService.assessDiscontinuationRisk(data);
      // Handle success
    } catch (err) {
      setError(createAppError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ErrorAlert
        error={error}
        onRetry={handleAssess}
        onDismiss={() => setError(null)}
      />
      {/* Your UI */}
    </>
  );
};
```

### Step 2: Global Error Handling

Use with AssessmentContext:

```typescript
const { assessment, setError } = useAssessment();

try {
  const result = await service.assess(data);
  setAssessmentResult(result);
} catch (err) {
  setError(createAppError(err));
}
```

### Step 3: Network-Aware Features

```typescript
import { isOnline } from "../utils/networkUtils";

// Before performing API operations
const online = await isOnline();
if (!online) {
  showOfflineMessage();
  return;
}

// Or subscribe to changes
subscribeToNetworkStatus((status) => {
  if (!status.isConnected) {
    disableFormSubmission();
  } else {
    enableFormSubmission();
  }
});
```

### Step 4: Logging

```typescript
import { createModuleLogger } from "../utils/loggerUtils";

const logger = createModuleLogger("RiskAssessmentCard");

logger.info("Assessment started", { featureCount: 26 });
logger.warn("Network slow", { latency: 5000 });
logger.error("Assessment failed", error, { attempt: 2 });

// Export logs for debugging
const logs = logger.exportLogs();
```

---

## Configuration

### API Timeout

```typescript
// In discontinuationRiskService.ts
private readonly API_TIMEOUT: number = 30000; // 30 seconds
```

### Max Retries

```typescript
// In discontinuationRiskService.ts
private readonly MAX_RETRIES: number = 3;
```

### Log Storage

```typescript
// In loggerUtils.ts
private readonly MAX_LOGS: number = 100;
```

### Network Check Interval

The network status uses system callbacks and listeners - updates happen in real-time when network changes.

---

## Testing Scenarios

### Test Offline Detection

```typescript
// Disable network in device settings or toggle airplane mode
const online = await isOnline();
console.log(online); // Should be false
```

### Test Retry Logic

```typescript
// Stop API server to trigger connection refused
try {
  await service.assessDiscontinuationRisk(data);
} catch (err) {
  // Should retry 3 times with backoff
}
```

### Test Timeout

```typescript
// Simulate slow network or unresponsive server
// Service will timeout after 30 seconds
```

### Test Validation Error

```typescript
// Send data missing required fields
try {
  await service.assessDiscontinuationRisk(incompleteData);
} catch (err) {
  // Should throw validation error immediately (no retry)
}
```

---

## Logging Example Output

```json
[
  {
    "timestamp": "2024-01-15T10:30:45.123Z",
    "level": "INFO",
    "module": "DiscontinuationRiskService",
    "message": "Assessment started",
    "data": { "featureCount": 26 }
  },
  {
    "timestamp": "2024-01-15T10:30:47.456Z",
    "level": "WARN",
    "module": "DiscontinuationRiskService",
    "message": "Network error, retrying (1/3)",
    "data": { "code": "ETIMEDOUT", "retryCount": 1 }
  },
  {
    "timestamp": "2024-01-15T10:30:49.789Z",
    "level": "INFO",
    "module": "DiscontinuationRiskService",
    "message": "Assessment completed successfully",
    "data": { "riskLevel": "HIGH", "confidence": 0.87 }
  }
]
```

---

## Files Created/Modified

### New Files Created

- ✅ `src/utils/networkUtils.ts` (80 lines)
- ✅ `src/utils/loggerUtils.ts` (200 lines)
- ✅ `src/utils/errorHandler.ts` (250 lines)
- ✅ `src/utils/errorMessageMapper.ts` (350 lines)
- ✅ `src/components/ErrorAlert.tsx` (400 lines)

### Files Modified

- ✅ `src/services/discontinuationRiskService.ts`
  - Added error handling imports
  - Enhanced checkHealth() method
  - Enhanced getRequiredFeatures() method
  - Enhanced assessDiscontinuationRisk() method
  - Enhanced validateInputData() method

### Total Lines Added: 1,280+

---

## Next Phase (4.3): Edge Cases

Planned improvements:

1. **Duplicate Request Prevention** - Prevent multiple simultaneous assessments
2. **Navigation Edge Cases** - Handle errors during screen transitions
3. **Missing Features** - Better handling when features are incomplete
4. **Timeout Enhancement** - Progressive timeout increases for slow connections
5. **Recovery State** - Cache last successful assessment for offline viewing

---

## Best Practices

1. **Always Check Network Before API Calls**

   ```typescript
   const online = await isOnline();
   if (!online) throw createAppError(new Error("Offline"));
   ```

2. **Use createAppError for All Errors**

   ```typescript
   catch (err) {
     const appError = createAppError(err, { operation: 'myOp' });
   }
   ```

3. **Log All Significant Operations**

   ```typescript
   logger.info("Operation started");
   logger.error("Operation failed", error);
   ```

4. **Show ErrorAlert on API Errors**

   ```typescript
   <ErrorAlert error={error} onRetry={retry} onDismiss={dismiss} />
   ```

5. **Don't Retry Validation Errors**
   ```typescript
   if (isValidationError(error)) {
     // Show validation message, don't retry
   }
   ```

---

## Summary

Phase 4.2 provides a production-ready error handling infrastructure:

- ✅ Network connectivity detection
- ✅ Comprehensive error classification
- ✅ User-friendly error messages
- ✅ Intelligent retry logic
- ✅ Application-wide logging
- ✅ React Native UI components
- ✅ Full service integration
- ✅ 1,280+ lines of production code

The system is ready for component integration in Phase 4.3 and subsequent phases.
