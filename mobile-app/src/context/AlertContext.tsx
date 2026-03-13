import React, { createContext, useContext, useState, ReactNode } from 'react';

/**
 * Alert Button Type
 */
export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

/**
 * Alert Options Type
 */
interface AlertOptions {
  cancelable?: boolean;
  onDismiss?: () => void;
}

/**
 * Alert State Type
 */
interface AlertState {
  visible: boolean;
  title: string;
  message: string;
  buttons: AlertButton[];
  options: AlertOptions;
}

/**
 * Alert Context Type
 */
interface AlertContextType {
  showAlert: (title: string, message: string, buttons?: AlertButton[], options?: AlertOptions) => void;
  hideAlert: () => void;
  alertState: AlertState;
}

const defaultState: AlertState = {
  visible: false,
  title: '',
  message: '',
  buttons: [],
  options: {},
};

const AlertContext = createContext<AlertContextType | undefined>(undefined);

/**
 * AlertProvider Component
 */
export const AlertProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [alertState, setAlertState] = useState<AlertState>(defaultState);

  const showAlert = (title: string, message: string, buttons: AlertButton[] = [{ text: 'OK' }], options: AlertOptions = {}) => {
    setAlertState({
      visible: true,
      title,
      message,
      buttons,
      options,
    });
  };

  const hideAlert = () => {
    setAlertState(prev => ({ ...prev, visible: false }));
    if (alertState.options.onDismiss) {
      alertState.options.onDismiss();
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert, hideAlert, alertState }}>
      {children}
    </AlertContext.Provider>
  );
};

/**
 * Hook to use Alert Context
 */
export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};
