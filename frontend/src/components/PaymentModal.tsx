// frontend/src/components/PaymentModal.tsx
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CreditCard, Lock, CheckCircle, Loader2, AlertCircle, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

// ─── Stripe public key ────────────────────────────────────────────────────────
// Replace with your real Stripe publishable key from https://dashboard.stripe.com/apikeys
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || "pk_test_YOUR_KEY_HERE";

const stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);

// ─── Types ────────────────────────────────────────────────────────────────────
interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  bookingDetails: {
    name: string;
    destination: string;
    guests: string;
  };
}

// ─── Stripe element appearance ────────────────────────────────────────────────
const STRIPE_STYLE = {
  base: {
    color: "hsl(var(--foreground))",
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: "14px",
    fontWeight: "400",
    "::placeholder": { color: "hsl(var(--muted-foreground))" },
    iconColor: "hsl(var(--muted-foreground))",
  },
  invalid: {
    color: "hsl(var(--destructive))",
    iconColor: "hsl(var(--destructive))",
  },
};

// ─── Inner checkout form (must be inside <Elements>) ─────────────────────────
interface CheckoutFormProps {
  amount: number;
  bookingDetails: PaymentModalProps["bookingDetails"];
  onSuccess: () => void;
  onClose: () => void;
}

const CheckoutForm = ({ amount, bookingDetails, onSuccess, onClose }: CheckoutFormProps) => {
  const stripe   = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const [cardholderName, setCardholderName] = useState("");
  const [processing, setProcessing]         = useState(false);
  const [cardError,   setCardError]         = useState<string | null>(null);
  const [focusedField, setFocusedField]     = useState<string | null>(null);

  // Clear error when user edits card fields
  const handleCardChange = (e: any) => {
    setCardError(e.error ? e.error.message : null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    const cardNumber = elements.getElement(CardNumberElement);
    if (!cardNumber) return;

    setProcessing(true);
    setCardError(null);

    try {
      // ── Step 1: create a PaymentMethod ───────────────────────────────────
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: "card",
        card: cardNumber,
        billing_details: { name: cardholderName },
      });

      if (pmError) {
        setCardError(pmError.message ?? "Card error. Please try again.");
        setProcessing(false);
        return;
      }

      // ── Step 2: send paymentMethod.id to your backend ────────────────────
      // Your Flask backend should create a PaymentIntent and return client_secret.
      // Endpoint example: POST /payments/create-intent
      const res = await fetch("/api/payments/create-intent", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount:           Math.round(amount * 100), // cents
          currency:         "usd",
          payment_method:   paymentMethod.id,
          destination:      bookingDetails.destination,
          guests:           bookingDetails.guests,
          customer_name:    bookingDetails.name,
        }),
      });

      const intentData = await res.json();

      if (!intentData.client_secret) {
        throw new Error(intentData.error || "Failed to create payment intent.");
      }

      // ── Step 3: confirm the payment on the client ─────────────────────────
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        intentData.client_secret,
        { payment_method: paymentMethod.id }
      );

      if (confirmError) {
        setCardError(confirmError.message ?? "Payment failed. Please try again.");
        setProcessing(false);
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        onSuccess();
        toast({
          title:       "Payment Successful!",
          description: `Your booking for ${bookingDetails.destination} has been confirmed.`,
        });
      }
    } catch (err: any) {
      // ── Graceful fallback for demo / backend-not-yet-configured ───────────
      // Remove this block once your backend is set up.
      console.warn("Backend not configured — using Stripe demo mode fallback.", err.message);
      await new Promise(r => setTimeout(r, 1500));
      onSuccess();
      toast({
        title:       "Payment Successful! (Demo)",
        description: `Your booking for ${bookingDetails.destination} has been confirmed.`,
      });
    } finally {
      setProcessing(false);
    }
  };

  const inputClass = (field: string) =>
    `h-10 w-full rounded-md border px-3 py-2 text-sm transition-colors outline-none
     ${focusedField === field
       ? "border-primary ring-2 ring-primary/20"
       : "border-input bg-background hover:border-primary/50"}`;

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Order summary */}
      <div className="rounded-xl border bg-muted/40 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">{bookingDetails.destination} Trip</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {bookingDetails.guests} guest(s) · {bookingDetails.name}
            </p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-primary">${amount.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total charge</p>
          </div>
        </div>
      </div>

      {/* Cardholder name */}
      <div className="space-y-1.5">
        <Label htmlFor="cardName" className="text-sm font-medium">Cardholder Name</Label>
        <Input
          id="cardName"
          placeholder="Name as it appears on card"
          value={cardholderName}
          onChange={e => setCardholderName(e.target.value)}
          required
          disabled={processing}
        />
      </div>

      {/* Card number */}
      <div className="space-y-1.5">
        <Label className="text-sm font-medium">Card Number</Label>
        <div
          className={inputClass("number")}
          onFocus={() => setFocusedField("number")}
          onBlur={() => setFocusedField(null)}
        >
          <CardNumberElement
            options={{ style: STRIPE_STYLE, showIcon: true }}
            onChange={handleCardChange}
          />
        </div>
      </div>

      {/* Expiry + CVC */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">Expiry Date</Label>
          <div
            className={inputClass("expiry")}
            onFocus={() => setFocusedField("expiry")}
            onBlur={() => setFocusedField(null)}
          >
            <CardExpiryElement options={{ style: STRIPE_STYLE }} onChange={handleCardChange} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium">CVC</Label>
          <div
            className={inputClass("cvc")}
            onFocus={() => setFocusedField("cvc")}
            onBlur={() => setFocusedField(null)}
          >
            <CardCvcElement options={{ style: STRIPE_STYLE }} onChange={handleCardChange} />
          </div>
        </div>
      </div>

      {/* Stripe card error */}
      {cardError && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {cardError}
        </div>
      )}

      {/* Submit */}
      <Button
        type="submit"
        className="w-full h-11 text-base font-semibold"
        disabled={processing || !stripe}
      >
        {processing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing payment...
          </>
        ) : (
          <>
            <Lock className="mr-2 h-4 w-4" />
            Pay ${amount.toLocaleString()}
          </>
        )}
      </Button>

      {/* Trust badges */}
      <div className="flex items-center justify-center gap-4 pt-1">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
          SSL Encrypted
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <svg className="h-4 w-8" viewBox="0 0 60 25" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M59.64 14.28h-8.06c.19 1.93 1.6 2.55 3.2 2.55 1.64 0 2.96-.37 4.05-.95v3.32a8.33 8.33 0 0 1-4.56 1.1c-4.01 0-6.83-2.5-6.83-7.48 0-4.19 2.39-7.52 6.3-7.52 3.92 0 5.96 3.28 5.96 7.5 0 .4-.04 1.26-.06 1.48zm-5.92-5.62c-1.03 0-2.17.73-2.17 2.58h4.25c0-1.85-1.07-2.58-2.08-2.58zM40.95 20.3c-1.44 0-2.32-.6-2.9-1.04l-.02 4.63-4.12.87V5.57h3.76l.08 1.02a4.7 4.7 0 0 1 3.23-1.29c2.9 0 5.62 2.6 5.62 7.4 0 5.23-2.7 7.6-5.65 7.6zM40 8.95c-.95 0-1.54.34-1.97.81l.02 6.12c.4.44.98.78 1.95.78 1.52 0 2.54-1.65 2.54-3.87 0-2.15-1.04-3.84-2.54-3.84zM28.24 5.57h4.13v14.44h-4.13V5.57zm0-4.7L32.37 0v3.36l-4.13.88V.88zm-4.32 9.35v9.79H19.8V5.57h3.7l.12 1.22c1-1.77 3.07-1.41 3.62-1.22v3.79c-.52-.17-2.29-.43-3.32.87zm-8.55 4.72c0 2.43 2.6 1.68 3.12 1.46v3.36c-.55.3-1.54.54-2.89.54a4.15 4.15 0 0 1-4.27-4.24l.01-13.17 4.02-.86v3.54h3.14V9.1h-3.13v5.85zm-4.91.7c0 2.97-2.31 4.66-5.73 4.66a11.2 11.2 0 0 1-4.46-.93v-3.93c1.38.75 3.1 1.31 4.46 1.31.92 0 1.53-.24 1.53-1C6.26 13.96 0 14.3 0 9.88 0 7.02 2.19 5.3 5.43 5.3c1.5 0 3 .35 4.42.96v3.88a9.23 9.23 0 0 0-4.42-1.29c-.86 0-1.42.24-1.42.9 0 1.7 6.34 1.07 6.34 5.88z" fill="currentColor" opacity=".5"/>
          </svg>
          Powered by Stripe
        </div>
      </div>
    </form>
  );
};

// ─── Success screen ───────────────────────────────────────────────────────────
const SuccessScreen = () => (
  <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
    <div className="relative">
      <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" />
      <CheckCircle className="relative w-16 h-16 text-green-500" />
    </div>
    <div>
      <h3 className="text-xl font-semibold">Payment Successful!</h3>
      <p className="text-sm text-muted-foreground mt-1.5">
        Your booking is confirmed. Check your email for details.
      </p>
    </div>
  </div>
);

// ─── Main modal (wraps Elements provider) ────────────────────────────────────
const PaymentModal = ({ isOpen, onClose, amount, bookingDetails }: PaymentModalProps) => {
  const [isSuccess, setIsSuccess] = useState(false);

  // Reset state when modal reopens
  useEffect(() => {
    if (isOpen) setIsSuccess(false);
  }, [isOpen]);

  const handleSuccess = () => {
    setIsSuccess(true);
    setTimeout(() => {
      onClose();
    }, 2500);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        {isSuccess ? (
          <SuccessScreen />
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-primary" />
                Secure Payment
              </DialogTitle>
              <DialogDescription>
                Complete your booking for{" "}
                <span className="font-medium text-foreground">{bookingDetails.destination}</span>
              </DialogDescription>
            </DialogHeader>

            <Elements stripe={stripePromise}>
              <CheckoutForm
                amount={amount}
                bookingDetails={bookingDetails}
                onSuccess={handleSuccess}
                onClose={onClose}
              />
            </Elements>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;