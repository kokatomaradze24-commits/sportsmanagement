// Loads the PayPal JS SDK once per (clientId, currency, mode) combo.
// Mode "checkout" → buttons + applepay/googlepay/card-fields for one-off orders.
// Mode "subscription" → buttons with vault=true & intent=subscription for recurring plans.

let sdkPromise: Promise<unknown> | null = null;
let lastKey: string | null = null;

declare global {
  interface Window {
    paypal?: any;
  }
}

export type PaypalMode = "checkout" | "subscription";

export function loadPaypalSdk(clientId: string, currency: string, mode: PaypalMode = "checkout"): Promise<any> {
  if (typeof window === "undefined") return Promise.reject(new Error("SSR"));

  const key = `${clientId}|${currency}|${mode}`;
  if (sdkPromise && lastKey !== key) {
    sdkPromise = null;
    document.querySelectorAll('script[data-paypal-sdk]').forEach((el) => el.remove());
    delete window.paypal;
  }
  if (sdkPromise) return sdkPromise;
  lastKey = key;

  sdkPromise = new Promise((resolve, reject) => {
    const params = new URLSearchParams({ "client-id": clientId, currency });

    if (mode === "subscription") {
      params.set("intent", "subscription");
      params.set("vault", "true");
      params.set("components", "buttons");
    } else {
      params.set("intent", "capture");
      params.set("components", "buttons,applepay,googlepay,card-fields");
      params.set("enable-funding", "card");
      params.set("disable-funding", "credit,paylater");
    }

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
