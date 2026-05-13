import NetInfo from '@react-native-community/netinfo';
import { useEffect, useState } from 'react';

type NetworkStatus = {
  isConnected: boolean;
  isInternetReachable: boolean;
  isOffline: boolean;
};

const initialStatus: NetworkStatus = {
  isConnected: true,
  isInternetReachable: true,
  isOffline: false,
};

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>(initialStatus);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const isConnected = Boolean(state.isConnected);
      const isInternetReachable = Boolean(state.isInternetReachable);
      setStatus({
        isConnected,
        isInternetReachable,
        isOffline: !isConnected || !isInternetReachable,
      });
    });

    return () => unsubscribe();
  }, []);

  return status;
}
