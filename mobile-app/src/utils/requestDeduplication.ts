/**
 * Request Deduplication Utility
 * 
 * Prevents duplicate API requests from being sent simultaneously.
 * Useful for preventing multiple assessment submissions when users
 * rapidly tap buttons or navigate between screens.
 */

interface PendingRequest<T> {
  promise: Promise<T>;
  timestamp: number;
  requestKey: string;
}

/**
 * RequestDeduplicator - Manages duplicate request prevention
 * 
 * Tracks pending requests and returns the same promise for
 * duplicate requests until the original completes.
 */
class RequestDeduplicator {
  private pendingRequests: Map<string, PendingRequest<any>>;
  private requestTimeout: number = 30000; // 30 seconds

  constructor() {
    this.pendingRequests = new Map();
  }

  /**
   * Execute a request with deduplication
   * 
   * If the same request is already in flight, returns the pending promise.
   * Otherwise, executes the request function and tracks it.
   * 
   * @param requestKey - Unique key identifying this request
   * @param requestFn - Function that performs the request
   * @returns Promise with the request result
   */
  async deduplicate<T>(
    requestKey: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Check if request is already pending
    const pending = this.pendingRequests.get(requestKey);
    
    if (pending) {
      // Check if pending request is still valid (not timed out)
      const age = Date.now() - pending.timestamp;
      if (age < this.requestTimeout) {
        console.log(`[RequestDedup] Returning existing promise for: ${requestKey}`);
        return pending.promise;
      } else {
        // Request timed out, remove it
        console.warn(`[RequestDedup] Removing timed out request: ${requestKey}`);
        this.pendingRequests.delete(requestKey);
      }
    }

    // Create new request
    console.log(`[RequestDedup] Creating new request for: ${requestKey}`);
    const promise = requestFn()
      .then((result) => {
        // Remove from pending on success
        this.pendingRequests.delete(requestKey);
        return result;
      })
      .catch((error) => {
        // Remove from pending on error
        this.pendingRequests.delete(requestKey);
        throw error;
      });

    // Track the pending request
    this.pendingRequests.set(requestKey, {
      promise,
      timestamp: Date.now(),
      requestKey,
    });

    return promise;
  }

  /**
   * Check if a request is currently pending
   * 
   * @param requestKey - Request key to check
   * @returns True if request is pending
   */
  isPending(requestKey: string): boolean {
    const pending = this.pendingRequests.get(requestKey);
    if (!pending) return false;

    // Check if still valid
    const age = Date.now() - pending.timestamp;
    if (age >= this.requestTimeout) {
      this.pendingRequests.delete(requestKey);
      return false;
    }

    return true;
  }

  /**
   * Cancel a pending request
   * 
   * Removes the request from tracking but does not abort the actual request.
   * 
   * @param requestKey - Request key to cancel
   */
  cancel(requestKey: string): void {
    console.log(`[RequestDedup] Cancelling request: ${requestKey}`);
    this.pendingRequests.delete(requestKey);
  }

  /**
   * Cancel all pending requests
   */
  cancelAll(): void {
    console.log(`[RequestDedup] Cancelling all ${this.pendingRequests.size} pending requests`);
    this.pendingRequests.clear();
  }

  /**
   * Get count of pending requests
   */
  getPendingCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * Clean up timed out requests
   */
  cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.pendingRequests.forEach((request, key) => {
      const age = now - request.timestamp;
      if (age >= this.requestTimeout) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach((key) => {
      console.warn(`[RequestDedup] Cleaning up timed out request: ${key}`);
      this.pendingRequests.delete(key);
    });

    if (keysToDelete.length > 0) {
      console.log(`[RequestDedup] Cleaned up ${keysToDelete.length} timed out requests`);
    }
  }
}

// Singleton instance
let deduplicatorInstance: RequestDeduplicator | null = null;

/**
 * Get the singleton RequestDeduplicator instance
 */
export function getDeduplicator(): RequestDeduplicator {
  if (!deduplicatorInstance) {
    deduplicatorInstance = new RequestDeduplicator();
    
    // Cleanup timed out requests every 5 minutes
    setInterval(() => {
      deduplicatorInstance?.cleanup();
    }, 5 * 60 * 1000);
  }
  return deduplicatorInstance;
}

/**
 * Generate a request key from assessment data
 * 
 * Creates a stable key based on the assessment data to identify
 * duplicate assessment requests.
 * 
 * @param data - Assessment data object
 * @returns Request key string
 */
export function generateAssessmentKey(data: any): string {
  // Create a stable hash from the data
  const sortedKeys = Object.keys(data).sort();
  const values = sortedKeys.map((key) => `${key}:${data[key]}`).join('|');
  return `assessment:${hashString(values)}`;
}

/**
 * Simple string hash function
 * 
 * @param str - String to hash
 * @returns Hash number
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Hook for using request deduplication in components
 * 
 * @returns Deduplicator instance
 */
export function useRequestDeduplication() {
  return getDeduplicator();
}

export default getDeduplicator;
