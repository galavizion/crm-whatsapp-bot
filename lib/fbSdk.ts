declare global {
  interface Window {
    __fbReady?: boolean;
    __fbStarted?: boolean;
    __fbCallbacks?: Array<() => void>;
    fbAsyncInit?: () => void;
    FB: any;
  }
}

function doInit() {
  if (typeof window === "undefined" || window.__fbReady) return;
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
}

export function onFBReady(cb: () => void) {
  if (typeof window === "undefined") return;
  if (window.__fbReady) { cb(); return; }
  window.__fbCallbacks = window.__fbCallbacks ?? [];
  window.__fbCallbacks.push(cb);
}

export function initFBSDK() {
  if (typeof window === "undefined") return;
  if (window.__fbReady) return;

  // SDK already loaded (from previous navigation), just init
  if (window.FB) {
    doInit();
    return;
  }

  // Only start the loading process once
  if (window.__fbStarted) return;
  window.__fbStarted = true;

  window.fbAsyncInit = doInit;

  if (!document.getElementById("facebook-jssdk")) {
    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (!window.__fbReady && window.FB) doInit();
    };
    document.head.appendChild(script);
  }
}
