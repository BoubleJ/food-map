import Constants from "expo-constants";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import { useRef } from "react";
import { StyleSheet } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { APP_BRIDGE_USER_AGENT_TAG } from "@food-map/shared/bridge";
import { parseWebMessage, sendToWeb } from "./src/appBridge";

const WEB_URL = (Constants.expoConfig?.extra?.webUrl as string | undefined) ?? "http://localhost:3000";

export default function App() {
  const webViewRef = useRef<WebView>(null);

  async function handleMessage(event: WebViewMessageEvent): Promise<void> {
    const message = parseWebMessage(event.nativeEvent.data);
    if (!message) return;

    if (message.type === "REQUEST_LOCATION") {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        sendToWeb(webViewRef.current, { type: "LOCATION_DENIED" });
        return;
      }
      const { coords } = await Location.getCurrentPositionAsync({});
      sendToWeb(webViewRef.current, {
        type: "LOCATION",
        payload: { lat: coords.latitude, lng: coords.longitude },
      });
    }
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar style="auto" />
        <WebView
          ref={webViewRef}
          source={{ uri: WEB_URL }}
          onMessage={(event) => void handleMessage(event)}
          applicationNameForUserAgent={APP_BRIDGE_USER_AGENT_TAG}
          allowsBackForwardNavigationGestures
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
