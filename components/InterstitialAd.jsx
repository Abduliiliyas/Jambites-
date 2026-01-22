import React from 'react';

const InterstitialAdComponent = ({ onAdClosed }) => {
  // Don't show anything, immediately call onAdClosed
  React.useEffect(() => {
    if (onAdClosed) {
      onAdClosed();
    }
  }, [onAdClosed]);

  return null;
};

export default InterstitialAdComponent;