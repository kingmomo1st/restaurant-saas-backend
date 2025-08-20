// services/promotionService.js
import sanityClient from "../sanity/sanityClient.ts";

class PromotionService {
// 🎯 Fetch all promotion settings from CMS
static async fetchPromotionSettings(locationId) {
try {
const data = await sanityClient.fetch(
`*[_type == "promotionsSettings"${locationId ? ` && location._ref == “${locationId}”` : ''}][0]{ happyHour, loyaltyProgram }`
);


  console.log("🎉 Promotion settings from CMS:", data);

  return {
    happyHour: data?.happyHour || {
      enabled: false,
      days: [],
      startTime: "15:00",
      endTime: "18:00", 
      discount: 20
    },
    loyaltyProgram: data?.loyaltyProgram || {
      enabled: false,
      pointsPerDollar: 1,
      rewardThreshold: 100
    }
  };
} catch (error) {
  console.error("❌ Error fetching promotion settings:", error);
  
  // Return defaults if CMS fetch fails
  return {
    happyHour: {
      enabled: false,
      days: [],
      startTime: "15:00",
      endTime: "18:00",
      discount: 20
    },
    loyaltyProgram: {
      enabled: false,
      pointsPerDollar: 1,
      rewardThreshold: 100
    }
  };
}


}

// 🍷 Check if happy hour is currently active
static isHappyHourActive(happyHourSettings) {
if (!happyHourSettings.enabled) return false;


const now = new Date();
const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const currentDay = dayNames[now.getDay()];

// Check if today is included in happy hour days
if (!happyHourSettings.days.includes(currentDay)) return false;

// Check time range
const currentTime = now.toTimeString().slice(0, 5); // "HH:MM" format
const startTime = happyHourSettings.startTime;
const endTime = happyHourSettings.endTime;

return currentTime >= startTime && currentTime <= endTime;


}

// 💰 Calculate happy hour discount
static calculateHappyHourDiscount(subtotal, happyHourSettings) {
if (!this.isHappyHourActive(happyHourSettings)) return 0;


return (subtotal * happyHourSettings.discount) / 100;


}

// 🏆 Calculate loyalty points earned
static calculatePointsEarned(orderTotal, loyaltySettings) {
if (!loyaltySettings.enabled) return 0;


return Math.floor(orderTotal * loyaltySettings.pointsPerDollar);


}

// 💳 Calculate points redemption value
static calculatePointsValue(points, loyaltySettings) {
if (!loyaltySettings.enabled) return 0;


// Points to dollar conversion based on reward threshold
return points / loyaltySettings.rewardThreshold;


}

// 🎖️ Calculate customer tier based on total points
static calculateTier(totalPoints, loyaltySettings) {
if (!loyaltySettings.enabled) return "Bronze";


// Dynamic tier calculation based on reward threshold
const threshold = loyaltySettings.rewardThreshold;

if (totalPoints >= threshold * 10) return "Platinum";
if (totalPoints >= threshold * 5) return "Gold";
if (totalPoints >= threshold * 2) return "Silver";
return "Bronze";


}

// 📊 Get tier progress information
static getTierProgress(totalPoints, loyaltySettings) {
const threshold = loyaltySettings.rewardThreshold;
const currentTier = this.calculateTier(totalPoints, loyaltySettings);


let nextTierPoints = null;
let progress = 100;

switch (currentTier) {
  case "Bronze":
    nextTierPoints = threshold * 2;
    progress = (totalPoints / nextTierPoints) * 100;
    break;
  case "Silver":
    nextTierPoints = threshold * 5;
    progress = (totalPoints / nextTierPoints) * 100;
    break;
  case "Gold":
    nextTierPoints = threshold * 10;
    progress = (totalPoints / nextTierPoints) * 100;
    break;
  case "Platinum":
    progress = 100;
    nextTierPoints = null;
    break;
}

return {
  currentTier,
  nextTierPoints,
  progress: Math.min(progress, 100),
  pointsToNext: nextTierPoints ? Math.max(0, nextTierPoints - totalPoints) : 0
};


}

// 🎯 Apply all applicable discounts to order
static async calculateOrderDiscounts(orderData, locationId) {
const settings = await this.fetchPromotionSettings(locationId);


const discounts = {
  happyHour: 0,
  promo: orderData.promoDiscount || 0,
  loyaltyPoints: 0
};

// Calculate happy hour discount
discounts.happyHour = this.calculateHappyHourDiscount(
  orderData.subtotal, 
  settings.happyHour
);

// Calculate loyalty points redemption
if (orderData.redeemPoints && orderData.availablePoints) {
  const pointsValue = this.calculatePointsValue(
    orderData.availablePoints,
    settings.loyaltyProgram
  );
  
  // Don't exceed remaining order total
  const remainingTotal = orderData.subtotal - discounts.happyHour - discounts.promo;
  discounts.loyaltyPoints = Math.min(pointsValue, Math.max(0, remainingTotal));
}

return {
  discounts,
  settings,
  totalDiscount: Object.values(discounts).reduce((sum, discount) => sum + discount, 0)
};


}
}

export default PromotionService;