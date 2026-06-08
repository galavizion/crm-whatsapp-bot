let initialized = false;
const callbacks: (() => void)[] = [];

export function onFBReady(cb: () => void) {
  if (typeof window === "undefined") return;
  if (initialized) { cb(); return; }
  callbacks.push(cb);
}

export function initFBSDK() {
  if (typeof window === "undefined") return;
  if (initialized) return;

  const doInit = () => {
    window.FB.init({
      appId: process.env.NEXT_PUBLIC_META_APP_ID!,
      autoLogAppEvents: true,
      xfbml: true,
      version: "v23.0",
    });
    initialized = true;
    callbacks.forEach((cb) => cb());
    callbacks.length = 0;
  };

  if ((window as any).FB) { doInit(); return; }

  (window as any).fbAsyncInit = doInit;

  if (!document.getElementById("facebook-jssdk")) {
    const script = document.createElement("script");
    script.id = "facebook-jssdk";
    script.src = "https://connect.facebook.net/en_US/sdk.js";
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }
}
