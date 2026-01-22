// app.config.js
module.exports = ({ config }) => {
  // Determine platform from environment
  const isWeb = process.env.EXPO_OS === 'web' || config.platform === 'web';
  
  return {
    expo: {
      name: "jambites",
      slug: "jambites",
      version: "1.0.0",
      orientation: "portrait",
      icon: "./assets/images/logo.jpg",
      scheme: "jambites",
      userInterfaceStyle: "automatic",
      newArchEnabled: true,
      
      ios: {
        supportsTablet: true,
        infoPlist: {
          "UIBackgroundModes": ["fetch", "remote-notification"]
        },
        bundleIdentifier: "com.abduliliyas.jambites"
      },
      
      android: {
        adaptiveIcon: {
          backgroundColor: "#E6F4FE",
          foregroundImage: "./assets/images/android-icon-foreground.png",
          backgroundImage: "./assets/images/android-icon-background.png",
          monochromeImage: "./assets/images/android-icon-monochrome.png"
        },
        edgeToEdgeEnabled: true,
        predictiveBackGestureEnabled: false,
        package: "com.abduliliyas.jambites",
        permissions: [
          "RECEIVE_BOOT_COMPLETED",
          "WAKE_LOCK",
          "VIBRATE",
          "POST_NOTIFICATIONS"
        ]
      },
      
      web: {
        output: "static",
        favicon: "./assets/images/favicon.png",
        bundler: "metro",
        // Use service worker for better offline support
        serviceWorker: {
          source: "service-worker.js",
          // Optional: specify cache strategies
          cache: [
            {
              urlPattern: "**/*",
              handler: "CacheFirst",
              options: {
                cacheName: "jambites-cache"
              }
            }
          ]
        },
        build: {
          babel: {
            include: ["expo-sqlite"]
          }
        }
      },
      
      plugins: [
        "expo-router",
        [
          "expo-splash-screen",
          {
            image: "./assets/images/splash.jpg",
            imageWidth: 200,
            resizeMode: "contain",
            backgroundColor: "#ffffff",
            dark: {
              backgroundColor: "#000000"
            }
          }
        ],
        [
          "expo-notifications",
          {
            icon: "./assets/logo.jpg",
            color: "#ffffff",
            defaultChannel: "default"
          }
        ],
        [
          "expo-background-fetch",
          {
            minimumInterval: 15,
            stopOnTerminate: false,
            startOnBoot: true
          }
        ],
        "expo-font",
        // Only include expo-sqlite for mobile platforms
        ...(isWeb ? [] : [
          [
            "expo-sqlite",
            {
              iosDatabaseLocation: "default",
              androidDatabaseImplementation: 2
            }
          ]
        ]),
        "expo-web-browser"
      ],
      
      experiments: {
        typedRoutes: true,
        reactCompiler: true
      },
      
      extra: {
        router: {
          origin: false
        },
        eas: {
          projectId: "f49a905f-7426-41f7-919f-5cbf6b3064e1"
        }
      },
      
      owner: "abduliliyas"
    }
  };
};