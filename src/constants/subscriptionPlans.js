 export const SUBSCRIPTION_PLANS = {
    monthly: [
      {
        id: "plan_St80kbVck5HN6t",
        name: "Plus",
        level:1,
        storage: "2 TB",
        price: 199,
        billingCycle: "monthly",
        popular: false,

        features: [
          "2 TB secure cloud storage",
          "Fast uploads & downloads",
          "Cross-device sync",
          "File sharing",
        ],
      },

      {
        id: "plan_SreGUKh5S8Ajhh",
        name: "Pro",
        storage: "5 TB",
        level:2,
        price: 399,
        billingCycle: "monthly",
        popular: true,

        features: [
          "5 TB secure cloud storage",
          "Priority syncing",
          "30-day file recovery",
          "Advanced sharing controls",
          "Faster transfer speeds",
        ],
      },

      {
        id: "plan_StfZUyL605I6A9",
        name: "Ultra",
        storage: "10 TB",
        level:3,
        price: 4999,
        billingCycle: "monthly",
        popular: false,

        features: [
          "10 TB secure cloud storage",
          "Maximum upload speed",
          "Encrypted backups",
          "Priority support",
          "Advanced recovery tools",
        ],
      },
    ],

    yearly: [
      {
        id: "plan_SreJ2zeFpdsulz",
        name: "Plus",
        storage: "2 TB",
        level:1,
        price: 1990,
        billingCycle: "yearly",
        discount: "2 months free",
        popular: false,

        features: [
          "2 TB secure cloud storage",
          "Fast uploads & downloads",
          "Cross-device sync",
          "File sharing",
        ],
      },

      {
        id: "plan_SreMBv9HwLfubD",
        name: "Pro",
        storage: "5 TB",
        level:2,
        price: 3990,
        billingCycle: "yearly",
        discount: "2 months free",
        popular: true,

        features: [
          "5 TB secure cloud storage",
          "Priority syncing",
          "30-day file recovery",
          "Advanced sharing controls",
          "Faster transfer speeds",
        ],
      },

      {
        id: "plan_SreBn93KlV0Tua",
        name: "Ultra",
        storage: "10 TB",
        level:3,
        price: 6990,
        billingCycle: "yearly",
        discount: "2 months free",
        popular: false,
        features: [
          "10 TB secure cloud storage",
          "Maximum upload speed",
          "Encrypted backups",
          "Priority support",
          "Advanced recovery tools",
        ],
      },
    ],
  };