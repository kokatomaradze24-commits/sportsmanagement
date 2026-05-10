// Loads the PayPal JS SDK once and caches the promise.
// We enable: paypal, card, applepay, googlepay funding sources.

let sdkPromise: Promise<unknown> | null = null;
let lastClientId: string | null = null;
let lastCurrency: string | null = null;

declare global {
  interface Window {
    paypal?: any;
  }
}

export function loadPaypalSdk(clientId: string, currency: string): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));

  // If a previous load used different params, drop it
  if (sdkPromise && (lastClientId !== clientId || lastCurrency !== currency)) {
    sdkPromise = null;
    document.querySelectorAll('script[data-paypal-sdk]').forEach((el) => el.remove());
    delete window.paypal;
  }
  if (sdkPromise) return sdkPromise;

  lastClientId = clientId;
  lastCurrency = currency;

  sdkPromise = new Promise((resolve, reject) => {
    const params = new URLSearchParams({
      "client-id": clientId,
      currency,
      intent: "capture",
      components: "buttons,applepay,googlepay,card-fields",
      "enable-funding": "venmo,paylater",
    });
    const s = document.createElement("script");
    s.src = `https://www.paypal.com/sdk/js?${params.toString()}`;
    s.async = true;
    s.dataset.paypalSdk = "1";
    s.onload = () => {
      if (window.paypal) resolve(window.paypal);
      else reject(new Error("PayPal SDK loaded but window.paypal missing"));
    };
    s.onerror = () => reject(new Error("Failed to load PayPal SDK"));
    document.head.appendChild(s);
  });

  return sdkPromise;
}
