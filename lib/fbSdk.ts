declare global {
  interface Window {
    __fbReady?: boolean;
    __fbCallbacks?: Array<() => void>;
    fbAsyncInit?: () => void;
    FB: any;
  }
}

export function onFBReady(cb: () => void) {
  if (typeof window === "undefined") return;
  if (window.__fbReady) { cb(); return; }
  window.__fbCallbacks = window.__fbCallbacks ?? [];
  window.__fbCallbacks.push(cb);
}

// Kept as fallback for pages where FBSDKInit is not in the layout
export function initFBSDK() {
  if (typeof window === "undefined") return;
  if (window.__fbReady) return;

  if (window.FB) {
    window.FB.init({
      appId: process.env.NEXT_PUBLIC_META_APP_ID!,
      autoLogAppEvents: true,
      xfbml: true,
      version: "v23.0",
    });
    window.__fbReady = true;
    const cbs = window.__fbCallbacks ?? [];
    window.__fbCallbacks = [];
    cbs.forEach((cb) => cb());
    return;
  }
}
