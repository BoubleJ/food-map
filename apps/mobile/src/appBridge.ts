import type { NativeToWebMessage, WebToNativeMessage } from "@food-map/shared/bridge";
import { webToNativeMessageSchema } from "@food-map/shared/bridge";
import type { WebView } from "react-native-webview";

/**
 * 네이티브 쪽 AppBridge.
 * 웹에서 온 문자열을 타입으로 좁히고, 네이티브 응답을 웹으로 돌려준다.
 * 웹뷰 전송 수단(postMessage)이 바뀌어도 화면 코드는 건드리지 않게 여기에 가둔다.
 */

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
