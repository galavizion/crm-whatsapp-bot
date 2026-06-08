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
  if (window.__fbReady) return;   // Already initialized — button will enable via onFBReady
  if (window.__fbStarted) return; // Already loading — wait for fbAsyncInit to fire
  window.__fbStarted = true;

  // Set fbAsyncInit BEFORE loading the script.
  // The SDK calls this when it is fully ready — this is the only safe moment to call FB.init().
  // Never call FB.init() directly when window.FB already exists: the SDK may not be
  // in the right internal state yet even though the object is present (disk cache race).
  window.fbAsyncInit = doInit;

  // Remove stale script tag so the SDK re-executes and picks up the new fbAsyncInit.
  const old = document.getElementById("facebook-jssdk");
  if (old) old.remove();

  const script = document.createElement("script");
  script.id = "facebook-jssdk";
  script.src = "https://connect.facebook.net/en_US/sdk.js";
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
}
