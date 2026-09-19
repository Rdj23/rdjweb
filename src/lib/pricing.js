import { CONVENIENCE_FEE_PER_TICKET, GST_RATE } from "./shows";

const round = (n) => Math.round(n * 100) / 100;

/** Seat tickets: convenience fee per ticket, GST charged on the fee only. */
export function cinemaTotals(seats = []) {
  const subtotal = seats.reduce((sum, seat) => sum + seat.price, 0);
  const fees = seats.length * CONVENIENCE_FEE_PER_TICKET;
  const tax = round(fees * GST_RATE);
  return {
    subtotal,
    fees,
    tax,
    total: round(subtotal + fees + tax),
    currency: "INR",
    feeLabel: `Convenience fee (${seats.length} × ₹${CONVENIENCE_FEE_PER_TICKET})`,
  };
}

/** Streaming passes: no booking fee, GST on the pass itself. */
export function passTotals(price) {
  const tax = round(price * GST_RATE);
  return {
    subtotal: price,
    fees: 0,
    tax,
    total: round(price + tax),
    currency: "INR",
    feeLabel: null,
  };
}

export const PAYMENT_METHODS = [
  { key: "upi", label: "UPI", detail: "GPay · PhonePe · Paytm" },
  { key: "card", label: "Credit / Debit card", detail: "Visa · Mastercard · RuPay" },
  { key: "netbanking", label: "Net banking", detail: "All major banks" },
  { key: "wallet", label: "Wallet", detail: "Pay from your balance" },
];
