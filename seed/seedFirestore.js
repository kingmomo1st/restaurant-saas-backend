// premiumSeeder.js
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import serviceAccount from '../private-key/serviceAccountKey.json' assert { type: 'json' };

// Initialize Firebase Admin
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

// Enhanced Configuration
const CONFIG = {
  franchiseId: 'fallback1',
  locationId: '2d61d79d-ef5f-498e-97e4-0224ac4841b7',
  users: 75,
  monthsToGenerate: 3,
  batchSize: 50,
  delayBetweenBatches: 100,
};

// Monthly revenue targets
const monthlyTargets = {
  '2025-05': { orders: 20000, privateDining: 8000, giftCards: 2500, reservations: 150 },
  '2025-06': { orders: 25000, privateDining: 10000, giftCards: 3000, reservations: 200 },
  '2025-07': { orders: 22000, privateDining: 7000, giftCards: 2000, reservations: 120 },
};

// Utility functions
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => Math.random() * (max - min) + min;
const randomChoice = (array) => array[randomInt(0, array.length - 1)];
const randomBool = (probability = 0.5) => Math.random() < probability;

const generateDateInMonth = (yearMonth) => {
  const [year, month] = yearMonth.split('-');
  const maxDay = yearMonth === '2025-07' ? 10 : new Date(year, month, 0).getDate();
  const day = randomInt(1, maxDay);
  const hour = randomInt(9, 21);
  const minute = randomInt(0, 59);
  return new Date(year, month - 1, day, hour, minute);
};
// Generate unique gift card code
const generateGiftCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

// Batch writing utility
const batchWrite = async (operations) => {
  const batches = [];
  for (let i = 0; i < operations.length; i += CONFIG.batchSize) {
    batches.push(operations.slice(i, i + CONFIG.batchSize));
  }

  for (const batch of batches) {
    const writeBatch = db.batch();
    batch.forEach(({ ref, data }) => writeBatch.set(ref, data));
    await writeBatch.commit();
    await delay(CONFIG.delayBetweenBatches);
  }
};

// Sample menu items
const MENU_ITEMS = [
  { id: "margherita", name: "Margherita Pizza", price: 24.99, category: "pizza" },
  { id: "carbonara", name: "Spaghetti Carbonara", price: 28.99, category: "pasta" },
  { id: "risotto", name: "Mushroom Risotto", price: 26.99, category: "risotto" },
  { id: "osso_buco", name: "Osso Buco", price: 42.99, category: "main" },
  { id: "tiramisu", name: "Tiramisu", price: 12.99, category: "dessert" },
  { id: "wine_chianti", name: "Chianti Classico", price: 35.99, category: "wine" },
  { id: "bruschetta", name: "Bruschetta Trio", price: 16.99, category: "appetizer" },
  { id: "seafood_pasta", name: "Seafood Linguine", price: 34.99, category: "pasta" },
];// Promo codes
const PROMO_CODES = [
  { code: "WELCOME10", discount: 0.10, type: "percentage" },
  { code: "FAMILY20", discount: 0.20, type: "percentage" },
  { code: "SAVE5", discount: 5.00, type: "fixed" },
  { code: "STUDENT15", discount: 0.15, type: "percentage" },
];

const runEnhancedPremiumSeeder = async () => {
  console.log("🚀 Starting Enhanced Premium Seeder...");
  console.log("📊 Target:", CONFIG.users, "users,", CONFIG.monthsToGenerate, "months");

  const users = [];
  const orders = [];
  const privateDining = [];
  const giftCards = [];
  const reservations = [];
  const events = [];
  const reviews = [];
  const promoRedemptions = [];

  // 1. Create Users with Proper Tier Distribution
  console.log("👥 Creating users with loyalty tiers...");
  const userOps = [];

  for (let i = 0; i < CONFIG.users; i++) {
    const userRef = db.collection("users").doc();


// Generate loyalty points based on realistic distribution
let loyaltyPoints;
const rand = Math.random();
if (rand < 0.4) loyaltyPoints = randomInt(50, 249); // Bronze
else if (rand < 0.7) loyaltyPoints = randomInt(250, 499); // Silver
else if (rand < 0.9) loyaltyPoints = randomInt(500, 999); // Gold
else loyaltyPoints = randomInt(1000, 2500); // Platinum

const userData = {
  id: userRef.id,
  name: "Premium Customer " + (i + 1),
  email: "customer" + (i + 1) + "@italianrest.com",
  phone: "+1555" + String(i + 1).padStart(4, "0"),
  loyaltyPoints: loyaltyPoints,
  totalSpent: loyaltyPoints * randomFloat(0.8, 1.5), // Realistic spent-to-points ratio
  orderCount: 0,
  privateDiningCount: 0,
  lastOrderDate: null,
  membershipLevel: randomChoice(["bronze", "silver", "gold", "platinum"]),
  preferences: randomChoice(["vegetarian", "gluten-free", "standard", "premium"]),
  status: "active",
  franchiseId: CONFIG.franchiseId,
  locationId: CONFIG.locationId,
  createdAt: generateDateInMonth("2025-04").toISOString(),
  updatedAt: new Date().toISOString(),
};

users.push(userData);
userOps.push({ ref: userRef, data: userData });


}

await batchWrite(userOps);
console.log("✅ Created”, users.length, “users with loyalty tiers");

// 2. Generate Orders with Customer Types
console.log("🛒 Generating orders with customer tracking…");
const orderOps = [];

for (const [month, targets] of Object.entries(monthlyTargets)) {
let monthRevenue = 0;
const ordersNeeded = Math.ceil(targets.orders / 75);


for (let i = 0; i < ordersNeeded; i++) {
  const isLoyalCustomer = randomBool(0.65); // 65% loyal customers
  const user = isLoyalCustomer ? randomChoice(users) : null;
  const orderDate = generateDateInMonth(month);

  // Generate order items
  const itemCount = randomInt(1, 4);
  const items = [];
  let subtotal = 0;

  for (let j = 0; j < itemCount; j++) {
    const item = randomChoice(MENU_ITEMS);
    const quantity = randomInt(1, 2);
    const itemTotal = item.price * quantity;

    items.push({
      menuItemId: item.id,
      name: item.name,
      price: item.price,
      quantity: quantity,
      total: itemTotal,
      category: item.category,
    });

    subtotal += itemTotal;
  }

  // Apply promo code sometimes
  const hasPromo = randomBool(0.3);
  let promoCode = null;
  let discount = 0;

  if (hasPromo) {
    const promo = randomChoice(PROMO_CODES);
    promoCode = promo.code;
    discount = promo.type === "percentage" ? subtotal * promo.discount : promo.discount;
    discount = Math.min(discount, subtotal * 0.5);
  }

  const tax = (subtotal - discount) * 0.08;
  const total = subtotal - discount + tax;

  const orderRef = db.collection("orders").doc();
  const orderData = {
    id: orderRef.id,
    orderNumber: "ORD-" + month.replace("-", "") + "-" + String(i + 1).padStart(4, "0"),
    customerType: isLoyalCustomer ? "customer" : "guest",
    customerId: isLoyalCustomer ? user.id : null,
    customerName: isLoyalCustomer ? user.name : "Guest " + (i + 1),
    customerEmail: isLoyalCustomer ? user.email : "guest" + (i + 1) + "@temp.com",
    orderType: randomChoice(["pickup", "delivery", "dine-in"]),
    items: items,
    subtotal: Math.round(subtotal * 100) / 100,
    discount: Math.round(discount * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    total: Math.round(total * 100) / 100,
    promoCode: promoCode,
    status: randomChoice(["completed", "completed", "completed", "cancelled"]),
    paymentMethod: randomChoice(["card", "cash", "gift_card"]),
    franchiseId: CONFIG.franchiseId,
    locationId: CONFIG.locationId,
    createdAt: orderDate.toISOString(),
    completedAt: new Date(orderDate.getTime() + randomInt(15, 45) * 60000).toISOString(),
  };

  orders.push(orderData);
  orderOps.push({ ref: orderRef, data: orderData });

  // Update user stats for loyal customers
  if (isLoyalCustomer && orderData.status === "completed") {
    user.totalSpent += total;
    user.loyaltyPoints += Math.floor(total);
    user.orderCount += 1;
    user.lastOrderDate = orderDate.toISOString();
    monthRevenue += total;
  } else if (!isLoyalCustomer && orderData.status === "completed") {
    monthRevenue += total;
  }

  // Track promo redemptions
  if (promoCode) {
    promoRedemptions.push({
      orderId: orderRef.id,
      promoCode: promoCode,
      customerId: isLoyalCustomer ? user.id : null,
      discountAmount: discount,
      createdAt: orderDate.toISOString(),
    });
  }
}

console.log("✅", month + ":", ordersNeeded, "orders, $" + Math.round(monthRevenue));


}

await batchWrite(orderOps);
console.log("✅ Created", orders.length, "orders");

// 3. Generate Reservations
console.log("🍽️ Creating reservations…");
const reservationOps = [];

for (const [month, targets] of Object.entries(monthlyTargets)) {
const reservationsNeeded = targets.reservations;


for (let i = 0; i < reservationsNeeded; i++) {
  const isCustomer = randomBool(0.7);
  const user = isCustomer ? randomChoice(users) : null;
  const reservationDate = generateDateInMonth(month);
  
  // Future reservation date
  const futureDate = new Date(reservationDate.getTime() + randomInt(1, 30) * 24 * 3600000);

  const reservationRef = db.collection("reservations").doc();
  const reservationData = {
    id: reservationRef.id,
    customerType: isCustomer ? "customer" : "guest",
    customerId: isCustomer ? user.id : null,
    customerName: isCustomer ? user.name : "Guest Reservation " + (i + 1),
    customerEmail: isCustomer ? user.email : "guestreservation" + (i + 1) + "@temp.com",
    phone: isCustomer ? user.phone : "+1555" + String(randomInt(1000, 9999)),
    partySize: randomInt(2, 8),
    reservationDate: futureDate.toISOString().split("T")[0],
    reservationTime: randomChoice(["17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00", "20:30"]),
    status: randomChoice(["confirmed", "confirmed", "pending", "cancelled"]),
    specialRequests: randomChoice(["None", "Birthday celebration", "Anniversary", "Window seat", "Quiet table"]),
    franchiseId: CONFIG.franchiseId,
    locationId: CONFIG.locationId,
    createdAt: reservationDate.toISOString(),
    updatedAt: reservationDate.toISOString(),
  };

  reservations.push(reservationData);
  reservationOps.push({ ref: reservationRef, data: reservationData });
}


}

await batchWrite(reservationOps);
console.log("✅ Created", reservations.length, "reservations");

// 4. Private Dining Events
console.log("🍽️ Creating private dining events…");
const pdOps = [];

for (const [month, targets] of Object.entries(monthlyTargets)) {
const eventsNeeded = randomInt(3, 6);


for (let i = 0; i < eventsNeeded; i++) {
  const isCustomer = randomBool(0.7);
  const user = isCustomer ? randomChoice(users) : null;
  const eventDate = generateDateInMonth(month);
  const amount = (targets.privateDining / eventsNeeded) + randomFloat(-500, 500);

  const pdRef = db.collection("privateDining").doc();
  const pdData = {
    id: pdRef.id,
    requesterType: isCustomer ? "customer" : "guest",
    customerId: isCustomer ? user.id : null,
    requesterName: isCustomer ? user.name : "Corporate Client " + (i + 1),
    requesterEmail: isCustomer ? user.email : "corp" + (i + 1) + "@company.com",
    eventDate: eventDate.toISOString().split("T")[0],
    eventTime: randomChoice(["17:00", "18:00", "19:00", "20:00"]),
    partySize: randomInt(10, 35),
    eventType: randomChoice(["birthday", "anniversary", "corporate", "celebration", "wedding"]),
    specialRequests: randomChoice(["None", "Vegetarian options", "Birthday cake", "Wine pairing", "Custom menu"]),
    totalAmount: Math.round(amount * 100) / 100,
    deposit: Math.round(amount * 0.3 * 100) / 100,
    status: randomChoice(["confirmed", "completed", "completed", "pending"]),
    franchiseId: CONFIG.franchiseId,
    locationId: CONFIG.locationId,
    createdAt: eventDate.toISOString(),
    confirmedAt: new Date(eventDate.getTime() + randomInt(1, 24) * 3600000).toISOString(),
  };

  privateDining.push(pdData);
  pdOps.push({ ref: pdRef, data: pdData });

  if (isCustomer && pdData.status === "completed") {
    user.totalSpent += amount;
    user.loyaltyPoints += Math.floor(amount * 0.5);
    user.privateDiningCount += 1;
  }
}


}

await batchWrite(pdOps);
console.log("✅ Created", privateDining.length, "private dining events");

// 5. Enhanced Gift Cards with Proper API Structure
console.log("🎁 Creating gift cards with proper structure…");
const gcOps = [];

for (const [month, targets] of Object.entries(monthlyTargets)) {
const cardsNeeded = randomInt(8, 15);


for (let i = 0; i < cardsNeeded; i++) {
  const purchaser = randomChoice(users);
  const amount = (targets.giftCards / cardsNeeded) + randomFloat(-50, 50);
  const purchaseDate = generateDateInMonth(month);
  const giftCode = generateGiftCode();

  // Calculate realistic redemption
  const isPartiallyUsed = randomBool(0.4);
  const remainingAmount = isPartiallyUsed ? amount * randomFloat(0.2, 0.8) : amount;

  const gcRef = db.collection("giftcards").doc(); // Note: 'giftcards' not 'giftCards'
  const gcData = {
    id: gcRef.id,
    giftCode: giftCode,
    senderName: purchaser.name,
    recipientName: "Gift Recipient " + (i + 1),
    recipientEmail: "recipient" + (i + 1) + "@email.com",
    message: randomChoice(["Happy Birthday!", "Congratulations!", "Enjoy your meal!", "Gift from family"]),
    amount: Math.round(amount * 100) / 100,
    initialAmount: Math.round(amount * 100) / 100,
    remainingAmount: Math.round(remainingAmount * 100) / 100,
    status: remainingAmount > 0 ? (remainingAmount < amount ? "partially_used" : "active") : "redeemed",
    redeemed: remainingAmount <= 0,
    franchiseId: CONFIG.franchiseId,
    locationId: CONFIG.locationId,
    createdAt: purchaseDate.toISOString(),
    updatedAt: purchaseDate.toISOString(),
    expiresAt: new Date(purchaseDate.getTime() + 365 * 24 * 3600000).toISOString(),
  };

  giftCards.push(gcData);
  gcOps.push({ ref: gcRef, data: gcData });
}


}

await batchWrite(gcOps);
console.log("✅ Created", giftCards.length, "gift cards");

// 6. Generate Events with Ticket Sales
console.log("🎫 Creating events with ticket sales…");
const eventOps = [];

for (const [month] of Object.entries(monthlyTargets)) {
const eventsCount = randomInt(2, 4);


for (let i = 0; i < eventsCount; i++) {
  const eventDate = generateDateInMonth(month);
  const ticketPrice = randomFloat(25, 75);
  const ticketsSold = randomInt(20, 100);

  const eventRef = db.collection("events").doc();
  const eventData = {
    id: eventRef.id,
    title: randomChoice(["Wine Tasting Evening", "Live Jazz Night", "Chef's Table Experience", "Italian Cooking Class"]),
    description: "Special event at our restaurant",
    date: eventDate.toISOString().split("T")[0],
    time: randomChoice(["18:00", "19:00", "20:00"]),
    ticketPrice: Math.round(ticketPrice * 100) / 100,
    ticketsSold: ticketsSold,
    maxTickets: ticketsSold + randomInt(10, 50),
    status: randomChoice(["completed", "upcoming", "completed"]),
    eventType: randomChoice(["dining", "entertainment", "educational", "special"]),
    franchiseId: CONFIG.franchiseId,
    locationId: CONFIG.locationId,
    createdAt: eventDate.toISOString(),
    updatedAt: eventDate.toISOString(),
  };

  events.push(eventData);
  eventOps.push({ ref: eventRef, data: eventData });
}


}

await batchWrite(eventOps);
console.log("✅ Created", events.length, "events");

// 7. Update User Stats with Proper Tier Calculation
console.log("📊 Updating user statistics and tiers…");

for (const user of users) {
// Calculate proper tier based on loyalty points
let tier = "Bronze";
if (user.loyaltyPoints >= 1000) tier = "Platinum";
else if (user.loyaltyPoints >= 500) tier = "Gold";
else if (user.loyaltyPoints >= 250) tier = "Silver";


if (user.orderCount > 0 || user.privateDiningCount > 0) {
  await db.collection("users").doc(user.id).update({
    totalSpent: Math.round(user.totalSpent * 100) / 100,
    loyaltyPoints: user.loyaltyPoints,
    orderCount: user.orderCount,
    privateDiningCount: user.privateDiningCount || 0,
    lastOrderDate: user.lastOrderDate,
    tier: tier, // Add proper tier
    updatedAt: new Date().toISOString(),
  });
  await delay(50);
}


}

console.log("✅ Updated user records with proper tiers");

// 8. Final Summary
console.log("\n🎉 Enhanced Premium Seeder Complete!");
console.log("📊 Summary:");
console.log("👥 Users:", users.length);
console.log("🛒 Orders:", orders.length);
console.log("📋 Reservations:", reservations.length);
console.log("🍽️ Private Dining:", privateDining.length);
console.log("🎁 Gift Cards:", giftCards.length);
console.log("🎫 Events:", events.length);

// Calculate totals
const totalOrderRevenue = orders
  .filter((o) => o.status === "completed")
  .reduce((sum, o) => sum + o.total, 0);

const totalPDRevenue = privateDining
  .filter((pd) => ["confirmed", "completed"].includes(pd.status))
  .reduce((sum, pd) => sum + pd.totalAmount, 0);

const totalGiftCardSales = giftCards.reduce((sum, gc) => sum + gc.amount, 0);

const totalEventRevenue = events
  .filter((e) => e.status === "completed")
  .reduce((sum, e) => sum + e.ticketPrice * e.ticketsSold, 0);

console.log("\n💰 Revenue Breakdown:");
console.log("🛒 Order Revenue: $" + totalOrderRevenue.toLocaleString());
console.log("🍽️ Private Dining: $" + totalPDRevenue.toLocaleString());
console.log("🎁 Gift Card Sales: $" + totalGiftCardSales.toLocaleString());
console.log("🎫 Event Revenue: $" + totalEventRevenue.toLocaleString());
console.log(
  "🏆 Total Revenue: $" +
    (totalOrderRevenue + totalPDRevenue + totalGiftCardSales + totalEventRevenue).toLocaleString()
);

console.log("\n✅ All data is connected and ready for premium analytics!");
};

// Run the enhanced seeder
runEnhancedPremiumSeeder().catch(console.error);