import React, { useEffect, useState, useCallback } from "react";
import SubscriptionCard from "../components/subcriptionCard.jsx";
import Toast from "../components/Toast.jsx";
import useToast from "../hooks/useToast.js";
import "../SubscriptionPage.css";
import {subcribeStorage,getCurrentSubscription,} from "@/api/subcriptionApi.js";
import {SUBSCRIPTION_PLANS} from "../constants/subscriptionPlans.js" 
import { useNavigate } from "react-router-dom";


function loadRazorpaySdk() {
  const razorpayScript = document.querySelector("#razorpay-script");
  if (razorpayScript) return;

  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.async = true;
  script.id = "razorpay-script";
  document.body.appendChild(script);
}

export const SubcriptionPage = () => {
  const [mode, setMode] = useState("monthly");
  const [currentUserPlan, serCurrentUserPlan] = useState(null);
  const { toast, showToast, hideToast } = useToast();
  const navigate=useNavigate();
  
  useEffect(() => {
    const currentSubscriptionPlan = async () => {
      try {
        const data= await getCurrentSubscription();
        serCurrentUserPlan(data);
      } catch (err) {
        console.error("Failed to fetch current subscription:", err);
      }
    };
    currentSubscriptionPlan();
  }, []);

  useEffect(() => {
    loadRazorpaySdk();
  }, []);

  const openSubscriptionPopup = useCallback((subcriptionId) => {
    if (!window.Razorpay) {
      showToast("Payment checkout is still loading. Please try again.", {
        type: "warning",
        title: "Almost ready",
      });
      return;
    }

    const razorpay = new window.Razorpay({
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,
      subscription_id: subcriptionId,
      start_at: Math.floor(Date.now() / 1000),
      quantity:1,
      name: "CloudNest",
      handler: async function () {
        showToast("Your subscription was purchased successfully.", {
          type: "success",
          title: "Plan activated",
          duration: 1600,
        });
        setTimeout(()=>{
          navigate("/")
        },3000)
      },
    });

    razorpay.on("payment.failed", function (response) {
      console.log(response);
      showToast("Payment failed. Please try again or use another payment method.", {
        type: "error",
        title: "Payment failed",
      });
    });
    razorpay.open();
  }, [navigate, showToast]);

  const openUpgradePaymentPopup = useCallback((orderId) => {
    if (!window.Razorpay) {
      showToast("Payment checkout is still loading. Please try again.", {
        type: "warning",
        title: "Almost ready",
      });
      return;
    }

    const razorpay = new window.Razorpay({
      key: import.meta.env.VITE_RAZORPAY_KEY_ID,

      order_id: orderId,

      name: "CloudNest Payment Upgradation",

      handler(response) {
        console.log(response);
        showToast("Your plan upgrade payment was completed.", {
          type: "success",
          title: "Upgrade complete",
        });
        navigate("/");
      },
    });

    razorpay.on("payment.failed", function (response) {
      console.log(response);
      showToast("Upgrade payment failed. Please try again.", {
        type: "error",
        title: "Payment failed",
      });
    });

    razorpay.open();
  }, [showToast]);

  const onUpgrade = async (planId) => {
    try {
      const response = await subcribeStorage({ planId });
      console.log(response);
      if (response.type === "upgrade") openUpgradePaymentPopup(response.orderId);
      else{
        console.log("else part is running");
        openSubscriptionPopup(response.message);
      }
    } catch (err) {
      console.error("Failed to start subscription:", err);
      showToast("Could not start the subscription payment. Please try again.", {
        type: "error",
        title: "Something went wrong",
      });
    }
  };

  const plans = SUBSCRIPTION_PLANS[mode];


  return (
    <main className="subscription-page">
      <section className="subscription-page__header">
        <div>
          <p className="subscription-page__eyebrow">CloudNest plans</p>
          <h1 className="subscription-page__title">
            Choose the storage that fits your work
          </h1>
          <p className="subscription-page__subtitle">
            Upgrade when you need more space, faster recovery, and stronger
            sharing controls.
          </p>
        </div>

        <div
          className="subscription-page__billing-toggle"
          aria-label="Billing cycle"
        >
          <button
            type="button"
            className={mode === "monthly" ? "active" : ""}
            onClick={() => setMode("monthly")}
          >
            Monthly
          </button>
          <button
            type="button"
            className={mode === "yearly" ? "active" : ""}
            onClick={() => setMode("yearly")}
          >
            Yearly
          </button>
        </div>
      </section>

      <section className="subscription-page__grid">
        {plans.map((plan) => (
          <SubscriptionCard
            key={plan.id}
            plan={plan}
            currentUserPlanId={currentUserPlan?.planId}
            loading={false}
            onUpgrade={onUpgrade}
            currentUserLevel={currentUserPlan?.level}
          />
        ))}
      </section>
      <Toast toast={toast} onClose={hideToast} />
    </main>
  );
};
