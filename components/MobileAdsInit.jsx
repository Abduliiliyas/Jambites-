import React, { useEffect, useState } from 'react';
import { Text } from 'react-native';
import mobileAds from 'react-native-google-mobile-ads';

const MobileAdsInit = ({ children }) => {
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const initializeAds = async () => {
      try {
        await mobileAds().initialize();
        console.log('Google Mobile Ads initialized successfully');
        setInitialized(true);
      } catch (error) {
        console.log('Error initializing Google Mobile Ads:', error);
        setInitialized(true); // Continue anyway
      }
    };

    initializeAds();
  }, []);

  if (!initialized) {
    return <Text>Initializing ads...</Text>;
  }

  return children;
};

export default MobileAdsInit;