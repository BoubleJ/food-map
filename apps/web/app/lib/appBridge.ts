import type { NativeToWebMessage, WebToNativeMessage } from "@food-map/shared/bridge";
import { APP_BRIDGE_USER_AGENT_TAG, nativeToWebMessageSchema } from "@food-map/shared/bridge";

declare global {
  interface Window {
    ReactNativeWebView?: { postMessage: (message: string) => void };
  }
}

export function isInAppWebView(): boolean {
  if (typeof window === "undefined") return false;
  return (
    typeof window.ReactNativeWebView !== "undefined" ||
    navigator.userAgent.includes(APP_BRIDGE_USER_AGENT_TAG)
  );
}

export function postToNative(message: WebToNativeMessage): boolean {
  if (typeof window === "undefined" || !window.ReactNativeWebView) return false;
  window.ReactNativeWebView.postMessage(JSON.stringify(message));
  return true;
}

export function subscribeToNative(handler: (message: NativeToWebMessage) => void): () => void {
  if (typeof window === "undefined") return () => {};

  const listener = (event: MessageEvent): void => {
    const parsed = nativeToWebMessageSchema.safeParse(
      typeof event.data === "string" ? safeJsonParse(event.data) : event.data,
    );
    if (parsed.success) handler(parsed.data);
  };

  window.addEventListener("message", listener);
  return () => window.removeEventListener("message", listener);
}

function safeJsonParse(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
