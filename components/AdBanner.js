{/*
import React, { useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

const AdBanner = () => {
  const [adError, setAdError] = useState(null);
  const [adLoaded, setAdLoaded] = useState(false);

  // Test Ad Unit IDs
  const adUnitIDs = {
    ios: "ca-app-pub-3940256099942544/6300978111",
    android: "ca-app-pub-3940256099942544/6300978111",
  };

  const currentAdUnitID = Platform.OS === 'ios' ? adUnitIDs.ios : adUnitIDs.android;

  const handleAdFailedToLoad = (error) => {
    console.log('Ad failed to load:', error);
    setAdError(error.message);
    setAdLoaded(false);
  };

  const handleAdLoaded = () => {
    console.log('Ad loaded successfully!');
    setAdError(null);
    setAdLoaded(true);
  };

  return (
    <View style={styles.adContainer}>
      
      <BannerAd
        unitId={currentAdUnitID}
        size={BannerAdSize.BANNER}
        onAdFailedToLoad={handleAdFailedToLoad}
        onAdLoaded={handleAdLoaded}
        requestOptions={{
          requestNonPersonalizedAdsOnly: false,
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  adContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 100,
  },

});

export default AdBanner;
*/}

import React from 'react';
import { View, StyleSheet } from 'react-native';

const AdBanner = () => {
  // Return an empty container or placeholder
  return (
    <View style={styles.adContainer}>
      {/* Ad functionality removed */}
      {/* You can add a placeholder message if needed */}
    </View>
  );
};

const styles = StyleSheet.create({
  adContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    minHeight: 100,
  },
});

export default AdBanner;