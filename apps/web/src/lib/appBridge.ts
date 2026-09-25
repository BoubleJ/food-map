"use client";

import type { NativeToWebMessage, WebToNativeMessage } from "@food-map/shared/bridge";
import { APP_BRIDGE_USER_AGENT_TAG, nativeToWebMessageSchema } from "@food-map/shared/bridge";

/**
 * 웹 쪽 AppBridge.
 * 웹뷰 안이면 네이티브로, 일반 브라우저면 브라우저 API 로 떨어지게 감싼다.
 * 화면 코드는 이 파일 바깥의 window 객체를 직접 건드리지 않는다.
 */

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

/** 네이티브가 보내는 메시지를 구독한다. 반환값을 호출하면 구독이 끊긴다. */
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
