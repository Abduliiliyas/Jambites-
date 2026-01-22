import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
  Clipboard,
  Linking,
} from 'react-native';
import { WebView } from 'react-native-webview';
import axios from 'axios';
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// --- Configuration ---
const API_BASE_URL = 'https://healthprof.com.ng/api';
const SUPPORT_WHATSAPP_NUMBER = '+2347072578779';
const router = useRouter();

// --- Helper Components ---
const PlanCard = ({ plan, onSelect, isSelected, buttonText = "Select", loading = false }) => (
  <View style={[
    styles.planCard,
    isSelected && styles.planCardSelected,
    styles.cardShadow
  ]}>
    <View style={styles.planCardInner}>
      {/* Popular Badge */}
      {plan.popular && (
        <View style={styles.popularBadge}>
          <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
        </View>
      )}
      
      <View style={styles.planHeader}>
        <View style={styles.planTitleContainer}>
          <Text style={styles.planName}>{plan.name}</Text>
          <View style={styles.priceContainer}>
            <Text style={styles.planPrice}>₦{plan.price}</Text>
            <Text style={styles.planDuration}>/{plan.duration}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.featuresContainer}>
        {plan.features && plan.features.split('\n').map((feature, index) => (
          <View key={index} style={styles.featureItem}>
            <Ionicons name="checkmark-circle" size={18} color="#10B981" style={styles.featureIcon} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
      </View>
      
      {onSelect && (
        <TouchableOpacity
          style={[
            styles.subscribeButton,
            plan.popular && styles.popularButton,
            loading && styles.disabledButton
          ]}
          onPress={() => onSelect(plan)}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.subscribeButtonText}>{buttonText}</Text>
              <Ionicons name="arrow-forward" size={16} color="#fff" />
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  </View>
);

const CopyField = ({ label, value, onCopy }) => (
  <View style={styles.copyField}>
    <Text style={styles.copyLabel}>{label}</Text>
    <TouchableOpacity style={styles.copyContainer} onPress={onCopy}>
      <Text style={styles.copyValue}>{value}</Text>
      <Ionicons name="copy-outline" size={18} color="#6366F1" />
    </TouchableOpacity>
  </View>
);

const CustomAlert = ({ title, message, onClose, visible, showCopyButton = false, onCopy }) => (
  <Modal
    visible={visible}
    transparent={true}
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={styles.alertOverlay}>
      <View style={[styles.alertContainer, styles.cardShadow]}>
        <View style={styles.alertIcon}>
          <Ionicons name="information-circle" size={48} color="#6366F1" />
        </View>
        <Text style={styles.alertTitle}>{title}</Text>
        <Text style={styles.alertMessage}>{message}</Text>
        <View style={styles.alertButtons}>
          {showCopyButton && (
            <TouchableOpacity
              style={[styles.alertButton, styles.secondaryButton]}
              onPress={onCopy}
            >
              <Ionicons name="copy-outline" size={18} color="#6366F1" />
              <Text style={styles.secondaryButtonText}>Copy Again</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.alertButton}
            onPress={onClose}
          >
            <Text style={styles.alertButtonText}>Got It</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

// Improved Payment WebView Modal Component
const PaymentModal = ({ visible, paymentUrl, onSuccess, onClose, onError, processingPayment }) => {
  const webViewRef = useRef(null);

  const handleNavigationStateChange = (navState) => {
    const { url, loading, title } = navState;
    
    console.log('WebView Navigation:', { url, loading, title });
    
    // Check if this is a Paystack callback URL
    if (url.includes('/verify-payment/') || url.includes('reference=') || url.includes('trxref=')) {
      console.log('Paystack callback detected:', url);
      
      // Extract reference from URL parameters
      try {
        const urlObj = new URL(url);
        const reference = urlObj.searchParams.get('reference') || urlObj.searchParams.get('trxref');
        
        if (reference) {
          console.log('Payment reference found:', reference);
          
          // Close WebView and trigger success after a short delay
          setTimeout(() => {
            onSuccess({
              transactionRef: reference,
              status: 'success'
            });
          }, 1500);
          
          // Prevent further navigation in WebView
          return false;
        }
      } catch (error) {
        console.log('Error parsing URL:', error);
      }
    }
    
    // Check for error URLs
    if (url.includes('/error') || url.includes('status=failed') || url.includes('cancel')) {
      console.log('Payment error or cancellation detected');
      onError('Payment was cancelled or failed. Please try again.');
      return false;
    }
    
    return true;
  };

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('Message from WebView:', data);
      
      if (data.type === 'payment_success' && data.reference) {
        console.log('Payment success message received:', data.reference);
        onSuccess({
          transactionRef: data.reference,
          status: 'success'
        });
      }
    } catch (error) {
      console.log('Non-JSON message from WebView:', event.nativeEvent.data);
    }
  };

  const handleError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.error('WebView error:', nativeEvent);
    
    // Ignore errors on callback URLs - they're expected to complete
    if (nativeEvent.url.includes('/verify-payment/')) {
      console.log('Ignoring error on callback URL - payment likely completed');
      return;
    }
    
    // Only show error for actual network failures on checkout page
    if (nativeEvent.description && nativeEvent.url.includes('checkout.paystack')) {
      onError('Network error during payment. Please check your connection.');
    }
  };

  const handleHttpError = (syntheticEvent) => {
    const { nativeEvent } = syntheticEvent;
    console.log('WebView HTTP error:', nativeEvent);
    
    // Ignore 405 and 500 errors on callback URLs - payment is likely successful
    if (nativeEvent.url.includes('/verify-payment/') && 
        (nativeEvent.statusCode === 405 || nativeEvent.statusCode === 500)) {
      console.log('Ignoring HTTP error on callback URL - extracting reference');
      
      // Try to extract reference from URL even with HTTP error
      try {
        const urlObj = new URL(nativeEvent.url);
        const reference = urlObj.searchParams.get('reference') || urlObj.searchParams.get('trxref');
        
        if (reference) {
          console.log('Reference extracted from errored URL:', reference);
          setTimeout(() => {
            onSuccess({
              transactionRef: reference,
              status: 'success'
            });
          }, 1000);
        }
      } catch (error) {
        console.log('Could not extract reference from errored URL');
      }
      return;
    }
    
    // Show error for other HTTP errors
    if (nativeEvent.statusCode >= 400 && nativeEvent.url.includes('checkout.paystack')) {
      onError(`Payment error: ${nativeEvent.statusCode || 'Unknown error'}`);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.webviewContainer}>
        <View style={styles.webviewHeader}>
          <View style={styles.webviewTitleContainer}>
            <Ionicons name="lock-closed" size={20} color="#6366F1" />
            <Text style={styles.webviewTitle}>Secure Payment</Text>
          </View>
          <TouchableOpacity 
            onPress={onClose} 
            style={styles.closeButton}
            disabled={processingPayment}
          >
            <Ionicons name="close" size={24} color="#64748B" />
          </TouchableOpacity>
        </View>
        
        {paymentUrl ? (
          <WebView
            ref={webViewRef}
            source={{ uri: paymentUrl }}
            style={styles.webview}
            onNavigationStateChange={handleNavigationStateChange}
            onMessage={handleMessage}
            onError={handleError}
            onHttpError={handleHttpError}
            startInLoadingState={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            sharedCookiesEnabled={true}
            renderLoading={() => (
              <View style={styles.webviewLoading}>
                <ActivityIndicator size="large" color="#6366F1" />
                <Text style={styles.loadingText}>Loading secure payment gateway...</Text>
              </View>
            )}
          />
        ) : (
          <View style={styles.webviewLoading}>
            <ActivityIndicator size="large" color="#6366F1" />
            <Text style={styles.loadingText}>Preparing payment...</Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

// --- Main Subscription Screen ---
const SubscriptionScreen = () => {
  const [activeTab, setActiveTab] = useState('automatic');
  const [subscriptions, setSubscriptions] = useState([]);
  const [accountInfo, setAccountInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alertInfo, setAlertInfo] = useState(null);
  const [userId, setUserId] = useState(null);
  const [email, setEmail] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentUrl, setPaymentUrl] = useState('');
  const [currentPlan, setCurrentPlan] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [initializingPayment, setInitializingPayment] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [checkingSubscription, setCheckingSubscription] = useState(false);

  // Fetch initial data from Django backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const storedUserId = await AsyncStorage.getItem("userId");
        if (storedUserId) {
          setUserId(storedUserId);
        }

        const subsResponse = await axios.get(`${API_BASE_URL}/jsubscriptions/`);
        // Add popular flag to plans for styling
        const plansWithPopular = subsResponse.data.map((plan, index) => ({
          ...plan,
          popular: index === 1 // Mark second plan as popular
        }));
        setSubscriptions(plansWithPopular);

        const accountInfoResponse = await axios.get(`${API_BASE_URL}/account-info/`);
        if (accountInfoResponse.data && accountInfoResponse.data.length > 0) {
          setAccountInfo(accountInfoResponse.data[0]);
        }

      } catch (e) {
        console.error("Failed to fetch data:", e);
        setError('Failed to load subscription details. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Check subscription status
  const checkSubscriptionStatus = async () => {
    if (!userId) {
      setAlertInfo({ 
        title: "User ID Missing", 
        message: "Unable to find your user ID. Please log in again." 
      });
      return;
    }

    try {
      setCheckingSubscription(true);
      
      const response = await axios.get(`${API_BASE_URL}/jcheck-subscription/${userId}/`);
      
      if (response.data.status) {
        const isActive = response.data.data.is_active;
        
        // Update local storage
        await AsyncStorage.setItem('isActivated', isActive ? 'true' : 'false');
        
        if (isActive) {
          setAlertInfo({ 
            title: "Subscription Active", 
            message: "Your subscription is active! You have access to all premium features." 
          });
        } else {
          setAlertInfo({ 
            title: "No Active Subscription", 
            message: "You don't have an active subscription. Please subscribe to access premium features." 
          });
        }
      } else {
        throw new Error(response.data.message || 'Failed to check subscription status');
      }
    } catch (err) {
      console.error("Subscription check failed:", err);
      
      let errorMessage = "Failed to check subscription status. Please try again.";
      
      if (err.response) {
        errorMessage = err.response.data?.message || errorMessage;
      }
      
      setAlertInfo({ 
        title: "Check Failed", 
        message: errorMessage 
      });
    } finally {
      setCheckingSubscription(false);
    }
  };

  const copyToClipboard = async (text, field) => {
    try {
      await Clipboard.setString(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  const contactSupport = async () => {
    if (!userId) {
      setAlertInfo({ 
        title: "User ID Missing", 
        message: "Unable to find your user ID. Please try again later." 
      });
      return;
    }

    const message = `Hello, I have made payment please activate my account ${userId}. Below is my proof of payment:`;
    
    // Format WhatsApp URL
    const whatsappUrl = `whatsapp://send?phone=${SUPPORT_WHATSAPP_NUMBER.replace('+', '')}&text=${encodeURIComponent(message)}`;
    
    try {
      // First try to open WhatsApp directly
      const canOpen = await Linking.canOpenURL(whatsappUrl);
      
      if (canOpen) {
        await Linking.openURL(whatsappUrl);
      } else {
        // If WhatsApp is not installed, try web WhatsApp
        const webWhatsappUrl = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER.replace('+', '')}?text=${encodeURIComponent(message)}`;
        await Linking.openURL(webWhatsappUrl);
      }
    } catch (error) {
      console.error('Error opening WhatsApp:', error);
      
      // Fallback: show instructions with copy option
      try {
        await Clipboard.setString(message);
        setAlertInfo({
          title: "WhatsApp Not Available",
          message: `We couldn't open WhatsApp. We've copied a ready-made message to your clipboard.\n\nHere's what to do:\n\n1. Open WhatsApp manually\n2. Message: ${SUPPORT_WHATSAPP_NUMBER}\n3. Paste the message (it's already copied!)\n4. Send your proof of payment screenshot\n\nYour User ID: ${userId}`,
          showCopyButton: true,
          onCopy: () => Clipboard.setString(message)
        });
      } catch (copyError) {
        console.error('Copy failed:', copyError);
        // Show message without copy option
        setAlertInfo({
          title: "Contact Support",
          message: `Please message ${SUPPORT_WHATSAPP_NUMBER} on WhatsApp with:\n\n"${message}"\n\nThen send your payment proof screenshot.`
        });
      }
    }
  };

  const initializePayment = async (plan) => {
    if (!userId) {
      setAlertInfo({ title: "Error", message: "Could not find your user ID. Please log in again." });
      return;
    }
    
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setAlertInfo({ title: "Invalid Email", message: "Please enter a valid email address to proceed." });
      return;
    }

    try {
      setInitializingPayment(true);
      setCurrentPlan(plan);

      const requestData = {
        planId: plan.id,
        user_id: parseInt(userId),
        email: email,
      };

      const response = await axios.post(
        `${API_BASE_URL}/jinitiate-payment/`,
        requestData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        }
      );

      if (response.data.status) {
        // Add cache-busting parameter to force new Paystack session
        const cacheBuster = `t=${Date.now()}`;
        const separator = response.data.data.authorization_url.includes('?') ? '&' : '?';
        const finalPaymentUrl = `${response.data.data.authorization_url}${separator}${cacheBuster}`;
        
        setPaymentUrl(finalPaymentUrl);
        setShowPaymentModal(true);
      } else {
        throw new Error(response.data.message || 'Payment initialization failed');
      }
    } catch (err) {
      let errorMessage = "Failed to initialize payment. Please try again.";
      
      if (err.response) {
        const status = err.response.status;
        const data = err.response.data;
        
        switch (status) {
          case 400:
            errorMessage = data.message || "Invalid request data.";
            break;
          case 403:
            errorMessage = "Access denied. Please check if the user is authenticated.";
            break;
          case 404:
            errorMessage = "API endpoint not found. Please check the URL.";
            break;
          case 500:
            errorMessage = "Server error. Please try again later.";
            break;
          default:
            errorMessage = `Server error (${status}). Please try again.`;
        }
      } else if (err.request) {
        errorMessage = "Network error. Please check your internet connection.";
      }
      
      setAlertInfo({ 
        title: "Payment Error", 
        message: errorMessage 
      });
    } finally {
      setInitializingPayment(false);
    }
  };

  const handlePaymentSuccess = async (transaction) => {
    // Prevent multiple verification calls
    if (processingPayment) {
      console.log('Payment verification already in progress, skipping...');
      return;
    }

    try {
      setProcessingPayment(true);
      
      console.log('Verifying payment with reference:', transaction.transactionRef);
      
      // Verify payment with your backend - this already activates the subscription
      const response = await axios.post(`${API_BASE_URL}/jverify-payment/`, {
        user_id: userId,
        plan_id: currentPlan.id,
        reference: transaction.transactionRef,
      });

      console.log('Verification response:', response.data);

      if (response.data.status) {
        console.log('Payment verified and subscription activated successfully');
        
        // Update AsyncStorage to mark user as activated
        await AsyncStorage.setItem('isActivated', 'true');
        
        setAlertInfo({ 
          title: "Payment Successful!", 
          message: "Your subscription has been activated successfully! You can now access all premium features." 
        });
        
      } else {
        throw new Error(response.data.message || "Payment verification failed");
      }
    } catch (err) {
      console.error("Payment processing failed:", err);
      
      let errorMessage = "Payment completed but we encountered an issue. Please contact support.";
      
      if (err.response) {
        errorMessage = err.response.data?.message || errorMessage;
        console.log('Error response data:', err.response.data);
      }
      
      setAlertInfo({ 
        title: "Verification Issue", 
        message: `${errorMessage}\n\nReference: ${transaction.transactionRef}` 
      });
    } finally {
      setProcessingPayment(false);
      setShowPaymentModal(false);
      setCurrentPlan(null);
      setPaymentUrl('');
    }
  };

  const handlePaymentError = (errorMessage) => {
    setAlertInfo({ 
      title: "Payment Error", 
      message: errorMessage 
    });
    setShowPaymentModal(false);
    setPaymentUrl('');
    setCurrentPlan(null);
  };

  const handlePaymentClose = () => {
    setShowPaymentModal(false);
    setPaymentUrl('');
    setCurrentPlan(null);
    setAlertInfo({ 
      title: "Payment Cancelled", 
      message: "You have cancelled the payment process." 
    });
  };

  // Subscription Check Button Component
  const SubscriptionCheckButton = () => (
    <TouchableOpacity
      style={styles.checkSubscriptionButton}
      onPress={checkSubscriptionStatus}
      disabled={checkingSubscription}
    >
      {checkingSubscription ? (
        <ActivityIndicator color="#fff" size="small" />
      ) : (
        <>
          <Ionicons name="refresh-circle" size={20} color="#fff" />
          <Text style={styles.checkSubscriptionButtonText}>Check Subscription Status</Text>
        </>
      )}
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#6366F1" />
          <Text style={styles.loadingText}>Loading subscription plans...</Text>
        </View>
      );
    }
    
    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="cloud-offline" size={64} color="#94A3B8" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => window.location.reload()}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (activeTab === 'manual') {
      return (
        <View>
          <View style={styles.sectionHeader}>
            <Ionicons name="business" size={24} color="#6366F1" />
            <Text style={styles.sectionTitle}>Manual Payment</Text>
          </View>
          
          <Text style={styles.sectionDescription}>
            Make a bank transfer to the account below, then contact our support team with your proof of payment.
          </Text>

          {/* Subscription Check Button */}
          <SubscriptionCheckButton />

          <View style={styles.plansGrid}>
            {subscriptions.map(plan => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </View>

          {accountInfo ? (
            <View style={[styles.accountInfoContainer, styles.cardShadow]}>
              <View style={styles.accountInfoHeader}>
                <Ionicons name="card" size={24} color="#6366F1" />
                <Text style={styles.accountInfoTitle}>Bank Transfer Details</Text>
              </View>
              
              <CopyField 
                label="Bank Name"
                value={accountInfo.bankName}
                onCopy={() => copyToClipboard(accountInfo.bankName, 'bank')}
              />
              
              <CopyField 
                label="Account Name"
                value={accountInfo.accountName}
                onCopy={() => copyToClipboard(accountInfo.accountName, 'name')}
              />
              
              <CopyField 
                label="Account Number"
                value={accountInfo.accountNumber}
                onCopy={() => copyToClipboard(accountInfo.accountNumber, 'number')}
              />

              {copiedField && (
                <View style={styles.copySuccess}>
                  <Ionicons name="checkmark" size={16} color="#10B981" />
                  <Text style={styles.copySuccessText}>Copied to clipboard!</Text>
                </View>
              )}

              <View style={styles.supportSection}>
                <Text style={styles.supportTitle}>After Payment:</Text>
                <Text style={styles.supportDescription}>
                  Contact support on live chat with your payment proof to activate your account.
                </Text>
                
                <TouchableOpacity 
                  style={styles.supportButton}
                  onPress={contactSupport}
                >
                  <Ionicons name="logo-whatsapp" size={20} color="#fff" />
                  <Text style={styles.supportButtonText}>Contact Support on WhatsApp</Text>
                </TouchableOpacity>

                <View style={styles.supportInfo}>
                  <Ionicons name="information-circle" size={16} color="#6366F1" />
                  <Text style={styles.supportInfoText}>
                    We'll automatically open WhatsApp with a ready-made message including your User ID: {userId}
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.errorCard}>
              <Ionicons name="warning" size={24} color="#EF4444" />
              <Text style={styles.errorCardText}>Account information not available</Text>
            </View>
          )}
        </View>
      );
    }

    // Automatic Tab Content
    return (
      <View>
        <View style={styles.sectionHeader}>
          <Ionicons name="flash" size={24} color="#6366F1" />
          <Text style={styles.sectionTitle}>Instant Subscription</Text>
        </View>
        
        <Text style={styles.sectionDescription}>
          Select a plan and pay securely with Paystack. Your subscription will be activated instantly after payment.
        </Text>
        
        {/* Subscription Check Button */}
        <SubscriptionCheckButton />
        
        <View style={styles.emailContainer}>
          <Ionicons name="mail" size={20} color="#94A3B8" style={styles.emailIcon} />
          <TextInput
            style={styles.emailInput}
            placeholder="Enter your email address"
            placeholderTextColor="#94A3B8"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>
        
        <View style={styles.plansGrid}>
          {subscriptions.map(plan => (
            <PlanCard 
              key={plan.id} 
              plan={plan} 
              onSelect={() => initializePayment(plan)}
              buttonText="Subscribe Now"
              loading={initializingPayment || processingPayment}
            />
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <CustomAlert
        visible={!!alertInfo}
        title={alertInfo?.title || ''}
        message={alertInfo?.message || ''}
        onClose={() => setAlertInfo(null)}
        showCopyButton={alertInfo?.showCopyButton || false}
        onCopy={alertInfo?.onCopy}
      />
      
      <PaymentModal
        visible={showPaymentModal}
        paymentUrl={paymentUrl}
        onSuccess={handlePaymentSuccess}
        onError={handlePaymentError}
        onClose={handlePaymentClose}
        processingPayment={processingPayment}
      />
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="diamond" size={32} color="#6366F1" />
          </View>
          <Text style={styles.headerTitle}>Choose Your Plan</Text>
          <Text style={styles.headerSubtitle}>Select the perfect plan for your needs</Text>
        </View>

        <View style={[styles.tabContainer, styles.cardShadow]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'automatic' && styles.activeTab]}
            onPress={() => setActiveTab('automatic')}
          >
            <Ionicons 
              name="flash" 
              size={18} 
              color={activeTab === 'automatic' ? '#6366F1' : '#94A3B8'} 
            />
            <Text style={[styles.tabText, activeTab === 'automatic' && styles.activeTabText]}>
              Instant Payment
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, activeTab === 'manual' && styles.activeTab]}
            onPress={() => setActiveTab('manual')}
          >
            <Ionicons 
              name="business" 
              size={18} 
              color={activeTab === 'manual' ? '#6366F1' : '#94A3B8'} 
            />
            <Text style={[styles.tabText, activeTab === 'manual' && styles.activeTabText]}>
              Bank Transfer
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {renderContent()}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    padding: 20,
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#64748B',
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
    lineHeight: 22,
  },
  retryButton: {
    backgroundColor: '#6366F1',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    paddingTop: 10,
  },
  headerIcon: {
    width: 64,
    height: 64,
    backgroundColor: '#EEF2FF',
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 6,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  activeTab: {
    backgroundColor: '#6366F1',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  activeTabText: {
    color: '#fff',
  },
  content: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  sectionDescription: {
    fontSize: 16,
    color: '#64748B',
    lineHeight: 24,
    marginBottom: 24,
  },
  checkSubscriptionButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 20,
  },
  checkSubscriptionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  emailIcon: {
    marginRight: 12,
  },
  emailInput: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  plansGrid: {
    gap: 16,
  },
  planCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
  },
  planCardInner: {
    padding: 24,
    position: 'relative',
  },
  popularBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#6366F1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  popularBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  planHeader: {
    marginBottom: 20,
  },
  planTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    flex: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  planDuration: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  featuresContainer: {
    marginBottom: 24,
    gap: 12,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureIcon: {
    marginTop: 2,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  subscribeButton: {
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  popularButton: {
    backgroundColor: '#6366F1',
  },
  disabledButton: {
    opacity: 0.6,
  },
  subscribeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  accountInfoContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  accountInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  accountInfoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  copyField: {
    marginBottom: 16,
  },
  copyLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
    fontWeight: '500',
  },
  copyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  copyValue: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
    flex: 1,
  },
  copySuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  copySuccessText: {
    color: '#166534',
    fontSize: 14,
    fontWeight: '500',
  },
  supportSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  supportTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  supportDescription: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 20,
  },
  supportButton: {
    backgroundColor: '#25D366',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginBottom: 12,
  },
  supportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  supportInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 8,
  },
  supportInfoText: {
    flex: 1,
    fontSize: 12,
    color: '#6366F1',
    lineHeight: 16,
  },
  errorCard: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  errorCardText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  cardShadow: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  // Alert Styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  alertContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 32,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  alertIcon: {
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  alertMessage: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 24,
    lineHeight: 24,
    textAlign: 'center',
  },
  alertButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  alertButton: {
    flex: 1,
    backgroundColor: '#6366F1',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#6366F1',
    flexDirection: 'row',
    gap: 8,
  },
  alertButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  secondaryButtonText: {
    color: '#6366F1',
    fontWeight: '600',
    fontSize: 16,
  },
  // WebView Styles
  webviewContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  webviewTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  webviewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  closeButton: {
    padding: 4,
  },
  webview: {
    flex: 1,
  },
  webviewLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    gap: 16,
  },
  liveChatButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 8,
    marginBottom: 12,
  },
  liveChatButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SubscriptionScreen;