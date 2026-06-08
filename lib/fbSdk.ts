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
  const appId = process.env.NEXT_PUBLIC_META_APP_ID;
  console.log("[FB doInit] appId =", appId, "| FB object keys:", window.FB ? Object.keys(window.FB).slice(0, 8) : "none");
  window.FB.init({
    appId,
    cookie: true,
    xfbml: true,
    version: "v23.0",
  });
  console.log("[FB doInit] FB.init() called. Calling FB.getLoginStatus to verify...");
  try {
    window.FB.getLoginStatus((r: any) => console.log("[FB doInit] loginStatus response:", r?.status));
  } catch (e) {
    console.error("[FB doInit] getLoginStatus threw:", e);
  }
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
  if (window.__fbStarted) return;
  window.__fbStarted = true;

  window.fbAsyncInit = doInit;

  const old = document.getElementById("facebook-jssdk");
  if (old) old.remove();

  const script = document.createElement("script");
  script.id = "facebook-jssdk";
  script.src = "https://connect.facebook.net/en_US/sdk.js";
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}
