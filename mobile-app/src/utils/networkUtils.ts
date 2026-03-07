/**
 * Network Utilities
 *
 * Provides network connectivity detection and monitoring.
 * Used to determine if app is online or offline.
 */

import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

// ============================================================================
// TYPES
// ============================================================================

export enum NetworkType {
  WiFi = 'wifi',
  Cellular = 'cellular',
  Ethernet = 'ethernet',
  VPN = 'vpn',
  Other = 'other',
  None = 'none',
}

export interface NetworkStatus {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: NetworkType;
  details: NetInfoState;
}

// ============================================================================
// NETWORK UTILITIES
// ============================================================================

/**
 * Get current network status
 */
export const getNetworkStatus = async (): Promise<NetworkStatus> => {
  const state = await NetInfo.fetch();

  return {
    isConnected: state.isConnected ?? false,
    isInternetReachable: state.isInternetReachable,
    type: mapNetworkType(state.type),
    details: state,
  };
};

/**
 * Check if device is online
 */
export const isOnline = async (): Promise<boolean> => {
  const status = await getNetworkStatus();
  return status.isConnected && status.isInternetReachable !== false;
};

/**
 * Subscribe to network status changes
 *
 * Usage:
 *   const unsubscribe = subscribeToNetworkStatus((status) => {
 *     console.log('Network status:', status.isConnected);
 *   });
 *
 *   // Later, unsubscribe
 *   unsubscribe();
 */
export const subscribeToNetworkStatus = (
  callback: (status: NetworkStatus) => void
): (() => void) => {
  const unsubscribe = NetInfo.addEventListener((state) => {
    const status: NetworkStatus = {
      isConnected: state.isConnected ?? false,
      isInternetReachable: state.isInternetReachable,
      type: mapNetworkType(state.type),
      details: state,
    };

    callback(status);
  });

  return unsubscribe;
};

/**
 * Map network type to our enum
 */
const mapNetworkType = (type: string): NetworkType => {
  switch (type) {
    case 'wifi':
      return NetworkType.WiFi;
    case 'cellular':
      return NetworkType.Cellular;
    case 'ethernet':
      return NetworkType.Ethernet;
    case 'vpn':
      return NetworkType.VPN;
    case 'other':
      return NetworkType.Other;
    case 'none':
      return NetworkType.None;
    default:
      return NetworkType.Other;
  }
};

/**
 * Get human-readable network type description
 */
export const getNetworkTypeDescription = (type: NetworkType): string => {
  switch (type) {
    case NetworkType.WiFi:
      return 'WiFi';
    case NetworkType.Cellular:
      return 'Cellular';
    case NetworkType.Ethernet:
      return 'Ethernet';
    case NetworkType.VPN:
      return 'VPN';
    case NetworkType.None:
      return 'No Connection';
    default:
      return 'Other';
  }
};
