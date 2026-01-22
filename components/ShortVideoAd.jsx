import React from 'react';

const ShortVideoAd = ({ showAd, onAdClosed }) => {
  // Don't show anything, immediately call onAdClosed if shown
  React.useEffect(() => {
    if (showAd && onAdClosed) {
      onAdClosed(false);
    }
  }, [showAd, onAdClosed]);

  return null;
};

export default ShortVideoAd;