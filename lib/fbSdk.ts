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
  if (window.__fbReady) return;
  window.FB.init({
    appId: process.env.NEXT_PUBLIC_META_APP_ID!,
    cookie: true,
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
  if (window.__fbReady || window.__fbStarted) return;
  window.__fbStarted = true;

  // fbAsyncInit must be set before the script loads — the SDK calls it when ready.
  // Never call FB.init() directly on an existing window.FB: the object may exist
  // (disk cache) before the SDK's internal state is ready to accept init.
  window.fbAsyncInit = doInit;

  const old = document.getElementById("facebook-jssdk");
  if (old) old.remove();

  const script = document.createElement("script");
  script.id = "facebook-jssdk";
  script.src = "https://connect.facebook.net/en_US/sdk.js";
  script.async = true;
  document.head.appendChild(script);
}
