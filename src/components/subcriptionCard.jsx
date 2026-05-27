import { Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";


function SubscriptionCard({
  plan,
  currentUserPlanId,
  loading,
  onUpgrade,
  currentUserLevel
}) {
  const isCurrentPlan = currentUserPlanId === plan.id;
  console.log("plan",plan.level);
  console.log("currentUserPlanId",currentUserPlanId);
  console.log("currentUserLevel",currentUserLevel);
  return (
    <Card
      className={`
        relative overflow-hidden rounded-2xl
        transition-all duration-300
        border bg-white

        ${plan.popular
          ? "border-blue-500 shadow-xl shadow-blue-100"
          : "border-slate-200"
        }

        ${isCurrentPlan
          ? `
            border-2 border-blue-600
            bg-gradient-to-b from-blue-50 via-white to-white
            scale-[1.01]
            shadow-2xl shadow-blue-200/60
          `
          : `
            hover:-translate-y-1
            hover:shadow-xl
            hover:border-blue-300
          `
        }
      `}
    >
      {/* Background Glow */}
      {isCurrentPlan && (
        <div className="absolute inset-0 bg-blue-500/5 pointer-events-none" />
      )}

      {/* Popular Badge */}
      {plan.popular && (
        <div
          className="
            absolute top-4 left-4 z-20
            bg-blue-600 text-white
            text-[10px] font-bold uppercase tracking-wide
            px-3 py-1 rounded-full shadow-md
          "
        >
          Most Popular
        </div>
      )}

      {/* Active Plan Badge */}
      {isCurrentPlan && (
        <div
          className="
            absolute top-4 right-4 z-20
            bg-green-100 text-green-700
            border border-green-200
            text-[10px] font-bold uppercase tracking-wide
            px-3 py-1 rounded-full
          "
        >
          ✓ Active
        </div>
      )}

      <CardContent className="relative z-10 p-6 flex flex-col h-full">
        {/* Header */}
        <div className="mb-5">
          <h3 className="text-2xl font-bold text-slate-900">
            {plan.name}
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Secure cloud storage for modern users.
          </p>
        </div>

        {/* Storage */}
        <div className="mb-6">
          <div
            className={`
              text-5xl font-black tracking-tight

              ${isCurrentPlan
                ? "text-blue-700"
                : "text-blue-600"
              }
            `}
          >
            {plan.storage}
          </div>

          <div className="text-sm font-medium text-slate-500 mt-1">
            Cloud Storage
          </div>
        </div>

        {/* Price */}
        <div className="border-t border-slate-200 pt-5 mb-6">
          <div className="flex items-end gap-1">
            <span className="text-4xl font-extrabold text-slate-900">
              ₹{plan.price}
            </span>

            <span className="text-sm text-slate-500 mb-1">
              /{plan.billingCycle}
            </span>
          </div>

          {plan.discount && (
            <div className="mt-2">
              <span
                className="
                  inline-flex
                  bg-green-100 text-green-700
                  text-xs font-semibold
                  px-2 py-1 rounded-md
                "
              >
                {plan.discount}
              </span>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="space-y-3 flex-1">
          {plan.features.map((feature) => (
            <div
              key={feature}
              className="flex items-center gap-3"
            >
              <div
                className="
                  flex items-center justify-center
                  w-5 h-5 rounded-full
                  bg-blue-100 text-blue-600
                  shrink-0
                "
              >
                <Check size={12} strokeWidth={3.5} />
              </div>

              <span className="text-sm font-medium text-slate-700">
                {feature}
              </span>
            </div>
          ))}
        </div>

        {/* Button */}
        <div className="mt-6">
          <Button
            disabled={loading || isCurrentPlan}
            onClick={() => onUpgrade(plan.id)}
            className={`
              w-full h-11 rounded-xl
              text-sm font-semibold
              transition-all duration-300

              ${isCurrentPlan
                ? `
                  bg-green-600
                  hover:bg-green-600
                  text-white
                  opacity-100
                  pointer-events-none
                  cursor-not-allowed
                `
                : plan.popular
                  ? `
                    bg-blue-600 hover:bg-blue-700
                    text-white shadow-lg
                  `
                  : `
                    bg-slate-900 hover:bg-slate-800
                    text-white
                  `
              }
            `}
          >
            {isCurrentPlan
              ? "✓ Current Plan"
              :  plan.level < currentUserLevel
                ? "Downgrade Plan"
                : "Upgrade Plan"}
          </Button>

          {isCurrentPlan && (
            <p className="text-center text-xs text-slate-500 mt-3">
              Your subscription is active
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default SubscriptionCard;