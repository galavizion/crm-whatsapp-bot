"use client";

import Script from "next/script";

export default function FBSDKInit() {
  return (
    <Script
      id="facebook-jssdk"
      src="https://connect.facebook.net/en_US/sdk.js"
      strategy="afterInteractive"
      onLoad={() => {
        if (window.__fbReady || !window.FB) return;
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
      }}
    />
  );
}
