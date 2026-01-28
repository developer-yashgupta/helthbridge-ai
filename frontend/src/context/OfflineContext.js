import React, { createContext, useContext, useState, useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';

const OfflineContext = createContext({});

export const useOffline = () => {
  const context = useContext(OfflineContext);
  if (!context) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};

export const OfflineProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true);
  const [pendingSync, setPendingSync] = useState([]);

  useEffect(() => {
    setupNetworkListener();
    loadPendingSync();
  }, []);

  const setupNetworkListener = () => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasOffline = !isConnected;
      setIsConnected(state.isConnected);
      
      // If coming back online, sync pending data
      if (wasOffline && state.isConnected) {
        syncPendingData();
      }
    });

    return unsubscribe;
  };

  const loadPendingSync = async () => {
    try {
      const pending = await AsyncStorage.getItem('pendingSync');
      if (pending) {
        setPendingSync(JSON.parse(pending));
      }
    } catch (error) {
      console.error('Error loading pending sync:', error);
    }
  };

  const savePendingSync = async (data) => {
    try {
      const updated = [...pendingSync, data];
      setPendingSync(updated);
      await AsyncStorage.setItem('pendingSync', JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving pending sync:', error);
    }
  };

  const storeSymptomAnalysis = async (userId, symptoms, analysis) => {
    try {
      const key = `symptom_${userId}_${Date.now()}`;
      const data = {
        userId,
        symptoms,
        analysis,
        timestamp: new Date().toISOString(),
        synced: false
      };
      
      await AsyncStorage.setItem(key, JSON.stringify(data));
      console.log('Symptom analysis stored offline');
      return true;
    } catch (error) {
      console.error('Error storing symptom analysis:', error);
      return false;
    }
  };

  const getOfflineSymptomHistory = async (userId) => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const symptomKeys = keys.filter(key => key.startsWith(`symptom_${userId}_`));
      
      const history = [];
      for (const key of symptomKeys) {
        const data = await AsyncStorage.getItem(key);
        if (data) {
          history.push(JSON.parse(data));
        }
      }
      
      // Sort by timestamp, most recent first
      return history.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 10);
    } catch (error) {
      console.error('Error getting symptom history:', error);
      return [];
    }
  };

  const storeOfflineContent = async (type, content, language = 'hi') => {
    try {
      const key = `content_${type}_${language}`;
      const data = {
        type,
        content,
        language,
        lastUpdated: new Date().toISOString()
      };
      
      await AsyncStorage.setItem(key, JSON.stringify(data));
      console.log('Offline content stored');
      return true;
    } catch (error) {
      console.error('Error storing offline content:', error);
      return false;
    }
  };

  const getOfflineContent = async (type, language = 'hi') => {
    try {
      const key = `content_${type}_${language}`;
      const data = await AsyncStorage.getItem(key);
      
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.content;
      }
      return null;
    } catch (error) {
      console.error('Error getting offline content:', error);
      return null;
    }
  };

  const syncPendingData = async () => {
    if (!isConnected || pendingSync.length === 0) {
      return;
    }

    try {
      console.log('Syncing pending data...');
      
      // Process each pending item
      for (const item of pendingSync) {
        try {
          // Sync based on item type
          if (item.type === 'symptom_analysis') {
            // Sync symptom analysis to server
            console.log('Syncing symptom analysis:', item.data);
          }
          // Add other sync types as needed
        } catch (error) {
          console.error('Error syncing item:', error);
        }
      }

      // Clear pending sync
      setPendingSync([]);
      await AsyncStorage.removeItem('pendingSync');
      
      console.log('Sync completed');
    } catch (error) {
      console.error('Sync error:', error);
    }
  };

  const clearOfflineData = async () => {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const offlineKeys = keys.filter(key => 
        key.startsWith('symptom_') || 
        key.startsWith('content_') || 
        key === 'pendingSync'
      );
      
      await AsyncStorage.multiRemove(offlineKeys);
      setPendingSync([]);
      
      console.log('Offline data cleared');
    } catch (error) {
      console.error('Error clearing offline data:', error);
    }
  };

  const value = {
    isConnected,
    pendingSync,
    storeSymptomAnalysis,
    getOfflineSymptomHistory,
    storeOfflineContent,
    getOfflineContent,
    savePendingSync,
    syncPendingData,
    clearOfflineData,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};