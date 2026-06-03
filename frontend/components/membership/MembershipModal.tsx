"use client";

import { useState } from "react";
import {
  Check,
  CreditCard,
  Loader2,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import { profilesApi } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

interface MembershipModalProps {
  onClose: () => void;
}

const PLANS = [
  {
    id: "monthly",
    label: "Monthly",
    price: "$9.99",
    period: "/month",
    tag: null,
  },
  {
    id: "yearly",
    label: "Yearly",
    price: "$79",
    period: "/year",
    tag: "Save 34%",
  },
];

const FREE_TIER = [
  "Top 10 AI-matched jobs (candidates)",
  "Top 10 AI-matched candidates per role (employers)",
  "Standard search & filters",
];

const MEMBER_PERKS = [
  "Unlimited AI job & candidate recommendations",
  "Priority placement in search results",
  "Verified member badge",
  "Early access to new features",
];

export function MembershipModal({ onClose }: MembershipModalProps) {
  const { refreshUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [step, setStep] = useState<"plan" | "payment" | "success">("plan");
  const [processing, setProcessing] = useState(false);
  const [cardData, setCardData] = useState({ number: "", expiry: "", cvv: "", name: "" });

  async function handlePayment(e: React.FormEvent) {
    e.preventDefault();
    setProcessing(true);
    // Simulate payment processing delay
    await new Promise(r => setTimeout(r, 1800));
    try {
      await profilesApi.upgradeMembership();
      await refreshUser();
      setStep("success");
    } catch {
      alert("Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content membership-modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} type="button"><X size={20} /></button>

        {step === "plan" && (
          <>
            <div className="membership-header">
              <Sparkles size={32} className="sparkle-icon" />
              <h2>Upgrade to Member</h2>
              <p>Free accounts get top 10 matches — members get unlimited</p>
            </div>

            <p className="membership-tier-label">Free plan includes</p>
            <ul className="perks-list perks-list--muted">
              {FREE_TIER.map(p => (
                <li key={p}>{p}</li>
              ))}
            </ul>

            <p className="membership-tier-label">Member unlocks</p>
            <ul className="perks-list">
              {MEMBER_PERKS.map(p => (
                <li key={p}><Check size={16} className="perk-check" />{p}</li>
              ))}
            </ul>

            <div className="plan-selector">
              {PLANS.map(plan => (
                <button
                  key={plan.id}
                  className={`plan-option ${selectedPlan === plan.id ? "selected" : ""}`}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  {plan.tag && <span className="plan-tag">{plan.tag}</span>}
                  <strong>{plan.label}</strong>
                  <span className="plan-price">{plan.price}<small>{plan.period}</small></span>
                </button>
              ))}
            </div>

            <button className="primary-action full-width" onClick={() => setStep("payment")}>
              <Zap size={18} />
              Continue to Payment
            </button>
          </>
        )}

        {step === "payment" && (
          <>
            <div className="membership-header">
              <CreditCard size={32} />
              <h2>Payment Details</h2>
              <p>{PLANS.find(p => p.id === selectedPlan)?.price}{PLANS.find(p => p.id === selectedPlan)?.period}</p>
            </div>

            <form className="payment-form" onSubmit={handlePayment}>
              <label>
                Cardholder name
                <input value={cardData.name} onChange={e => setCardData({ ...cardData, name: e.target.value })}
                  placeholder="John Doe" required />
              </label>
              <label>
                Card number
                <input value={cardData.number} onChange={e => setCardData({ ...cardData, number: e.target.value })}
                  placeholder="4242 4242 4242 4242" maxLength={19} required />
              </label>
              <div className="two-column">
                <label>
                  Expiry
                  <input value={cardData.expiry} onChange={e => setCardData({ ...cardData, expiry: e.target.value })}
                    placeholder="MM/YY" maxLength={5} required />
                </label>
                <label>
                  CVV
                  <input value={cardData.cvv} onChange={e => setCardData({ ...cardData, cvv: e.target.value })}
                    placeholder="123" maxLength={3} required />
                </label>
              </div>
              <div className="payment-actions">
                <button type="button" className="secondary-action" onClick={() => setStep("plan")}>
                  Back
                </button>
                <button type="submit" className="primary-action" disabled={processing}>
                  {processing ? <Loader2 className="spinner" size={18} /> : <CreditCard size={18} />}
                  {processing ? "Processing..." : "Pay Now"}
                </button>
              </div>
            </form>
          </>
        )}

        {step === "success" && (
          <div className="membership-success">
            <div className="success-icon">
              <Check size={48} />
            </div>
            <h2>Welcome, Member!</h2>
            <p>Your membership is now active. Enjoy unlimited recommendations!</p>
            <button className="primary-action full-width" onClick={onClose}>
              Get Started
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
