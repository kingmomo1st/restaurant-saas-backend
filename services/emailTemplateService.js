// services/emailTemplateService.js
const sanityClient = require("../src/sanity/sanityClient.node.js");

class EmailTemplateService {
// 🔥 Fetch email templates from CMS
static async fetchEmailTemplates(locationId) {
try {
const data = await sanityClient.fetch(
`*[_type == "emailTemplates"${locationId ? ` && location._ref == “${locationId}”` : ''}][0]{ reservationConfirmation, privateDiningInquiry, giftCardPurchase, orderConfirmation, abandonedCart, welcomeMessage }`
);


  console.log("📧 Email templates from CMS:", data);

  return {
    reservationConfirmation: data?.reservationConfirmation || {
      subject: "Reservation Confirmed - {{restaurantName}}",
      body: "Dear {{customerName}},\n\nYour reservation for {{guests}} guests on {{date}} at {{time}} has been confirmed.\n\nThank you!"
    },
    privateDiningInquiry: data?.privateDiningInquiry || {
      subject: "Private Dining Inquiry Received",
      body: "Thank you for your private dining inquiry. We'll contact you within 24 hours."
    },
    giftCardPurchase: data?.giftCardPurchase || {
      subject: "Your Gift Card is Ready!",
      body: "Your gift card code: {{giftCode}}\nAmount: ${{amount}}"
    },
    orderConfirmation: data?.orderConfirmation || {
      subject: "Order Confirmed - {{orderNumber}}",
      body: "Your order has been confirmed for {{orderType}}. Estimated time: {{estimatedTime}} minutes."
    },
    abandonedCart: data?.abandonedCart || {
      subject: "We Miss You – Your Cart is Waiting! ❤️",
      body: "We noticed you left your cart behind. Come back and complete your order!"
    },
    welcomeMessage: data?.welcomeMessage || {
      subject: "Welcome to {{restaurantName}}!",
      body: "Thank you for joining our restaurant family!"
    }
  };
} catch (error) {
  console.error("❌ Error fetching email templates:", error);
  
  // Return default templates if CMS fetch fails
  return {
    reservationConfirmation: {
      subject: "Reservation Confirmed - {{restaurantName}}",
      body: "Dear {{customerName}},\n\nYour reservation for {{guests}} guests on {{date}} at {{time}} has been confirmed.\n\nThank you!"
    },
    privateDiningInquiry: {
      subject: "Private Dining Inquiry Received",
      body: "Thank you for your private dining inquiry. We'll contact you within 24 hours."
    },
    giftCardPurchase: {
      subject: "Your Gift Card is Ready!",
      body: "Your gift card code: {{giftCode}}\nAmount: ${{amount}}"
    },
    orderConfirmation: {
      subject: "Order Confirmed - {{orderNumber}}",
      body: "Your order has been confirmed for {{orderType}}. Estimated time: {{estimatedTime}} minutes."
    },
    abandonedCart: {
      subject: "We Miss You – Your Cart is Waiting! ❤️",
      body: "We noticed you left your cart behind. Come back and complete your order!"
    },
    welcomeMessage: {
      subject: "Welcome to {{restaurantName}}!",
      body: "Thank you for joining our restaurant family!"
    }
  };
}


}

// 🔥 Replace template variables with actual values
static replaceTemplateVariables(template, variables) {
let { subject, body } = template;


// Replace all {{variable}} patterns with actual values
Object.entries(variables).forEach(([key, value]) => {
  const regex = new RegExp(`{{${key}}}`, 'g');
  subject = subject.replace(regex, value || '');
  body = body.replace(regex, value || '');
});

return { subject, body };


}

// 🔥 Get processed email template ready to send
static async getProcessedTemplate(templateType, variables, locationId) {
try {
const templates = await this.fetchEmailTemplates(locationId);
const template = templates[templateType];


  if (!template) {
    console.warn(`⚠️ Template ${templateType} not found, using default`);
    return {
      subject: `${templateType} - ${variables.restaurantName || 'Restaurant'}`,
      body: `Thank you for your ${templateType}!`
    };
  }

  return this.replaceTemplateVariables(template, variables);
} catch (error) {
  console.error("❌ Error processing email template:", error);
  return {
    subject: `${templateType} - ${variables.restaurantName || 'Restaurant'}`,
    body: `Thank you for your ${templateType}!`
  };
}


}

// 🔥 Helper: Get restaurant name from location
static async getRestaurantName(locationId) {
try {
if (!locationId) return "Restaurant";


  const location = await sanityClient.fetch(
    `*[_type == "location" && _id == "${locationId}"][0]{title}`
  );
  
  return location?.title || "Restaurant";
} catch (error) {
  console.error("❌ Error fetching restaurant name:", error);
  return "Restaurant";
}


}

// 🔥 Reservation confirmation template
static async getReservationTemplate(variables, locationId) {
const restaurantName = await this.getRestaurantName(locationId);


const templateVars = {
  restaurantName,
  customerName: variables.customerName,
  guests: variables.partySize || variables.guests,
  date: variables.date,
  time: variables.time,
  reservationId: variables.reservationId,
  location: variables.location || restaurantName
};

return this.getProcessedTemplate('reservationConfirmation', templateVars, locationId);


}

// 🔥 Private dining template
static async getPrivateDiningTemplate(variables, locationId) {
const restaurantName = await this.getRestaurantName(locationId);


const templateVars = {
  restaurantName,
  requesterName: variables.requesterName,
  customerName: variables.requesterName,
  partySize: variables.partySize,
  guests: variables.partySize,
  date: variables.date,
  eventNature: variables.eventNature,
  occasion: variables.occasion
};

return this.getProcessedTemplate('privateDiningInquiry', templateVars, locationId);


}

// 🔥 Gift card template
static async getGiftCardTemplate(variables, locationId) {
const restaurantName = await this.getRestaurantName(locationId);


const templateVars = {
  restaurantName,
  senderName: variables.senderName,
  recipientName: variables.recipientName,
  giftCode: variables.giftCode,
  amount: variables.amount,
  message: variables.message
};

return this.getProcessedTemplate('giftCardPurchase', templateVars, locationId);


}

// 🔥 Order confirmation template
static async getOrderTemplate(variables, locationId) {
const restaurantName = await this.getRestaurantName(locationId);


const templateVars = {
  restaurantName,
  customerName: variables.name,
  orderId: variables.orderId,
  orderNumber: variables.orderId,
  orderType: variables.orderType,
  estimatedTime: variables.estimatedTime || "30",
  total: variables.total,
  finalTotal: variables.finalTotal
};

return this.getProcessedTemplate('orderConfirmation', templateVars, locationId);


}

// 🔥 Abandoned cart template  
static async getAbandonedCartTemplate(variables, locationId) {
const restaurantName = await this.getRestaurantName(locationId);


const templateVars = {
  restaurantName,
  customerName: variables.customerName,
  cartItems: variables.cartItems ? variables.cartItems.map(item => item.name).join(', ') : 'your items'
};

return this.getProcessedTemplate('abandonedCart', templateVars, locationId);


}
}

module.exports = EmailTemplateService;