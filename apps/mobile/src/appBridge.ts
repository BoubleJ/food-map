import type { NativeToWebMessage, WebToNativeMessage } from "@food-map/shared/bridge";
import { webToNativeMessageSchema } from "@food-map/shared/bridge";
import type { WebView } from "react-native-webview";

export function parseWebMessage(raw: string): WebToNativeMessage | null {
  try {
    return webToNativeMessageSchema.parse(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function sendToWeb(webView: WebView | null, message: NativeToWebMessage): void {
  if (!webView) return;
  const payload = JSON.stringify(message).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  webView.injectJavaScript(
    `window.dispatchEvent(new MessageEvent('message', { data: '${payload}' })); true;`,
  );
}
