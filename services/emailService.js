const nodemailer = require("nodemailer");
const EmailTemplateService = require("./emailTemplateService"); // 🔥 NEW IMPORT

const transporter = nodemailer.createTransport({
host: process.env.EMAIL_HOST,
port: process.env.EMAIL_PORT,
secure: process.env.EMAIL_PORT == 465, // true for 465, false for 587
auth: {
user: process.env.EMAIL_USER,
pass: process.env.EMAIL_PASS,
},
});

// 🔥 UPDATED: Gift card email sender with CMS templates
const sendGiftCardEmail = async (to, senderName, recipientName, message, giftCode, amount, locationId = null) => {
console.log("📧 Preparing CMS gift card email…");

try {
// 🔥 Get CMS template
const template = await EmailTemplateService.getGiftCardTemplate({
senderName,
recipientName,
message,
giftCode,
amount
}, locationId);


const mailOptions = {
  from: `"${senderName}" <${process.env.EMAIL_USER}>`,
  to,
  subject: template.subject,
  html: `
    <div style="font-family: 'Arial', sans-serif; padding: 20px; background-color: #fefaf6; color: #333;">
      ${template.body.split('\n').map(line => `<p>${line}</p>`).join('')}
      <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
        <h3 style="color: #c0392b;">Gift Code: ${giftCode}</h3>
        <h2 style="color: #c0392b;">$${amount.toFixed(2)}</h2>
        ${message ? `<p style="font-style: italic;">"${message}"</p>` : ""}
      </div>
      <p style="color: #888;">Grazie & Buon appetito!</p>
    </div>
  `,
};

const result = await transporter.sendMail(mailOptions);
console.log("✅ CMS gift card email sent:", result.messageId);
return result;


} catch (error) {
console.error("❌ Error sending CMS gift card email:", error);
throw error;
}
};

// 🔥 UPDATED: Reservation confirmation email with CMS templates
const sendReservationConfirmationEmail = async ({
to,
customerName,
partySize,
date,
time,
location,
reservationId,
locationId = null
}) => {
console.log("📧 Preparing CMS reservation confirmation email…");

try {
// 🔥 Get CMS template
const template = await EmailTemplateService.getReservationTemplate({
customerName,
partySize,
date,
time,
location,
reservationId
}, locationId);


const readableDate = new Date(date).toLocaleDateString("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
});

const mailOptions = {
  from: `"Reservation Team" <${process.env.EMAIL_USER}>`,
  to,
  subject: template.subject,
  html: `
    <div style="font-family: 'Arial', sans-serif; padding: 20px; background-color: #fefaf6; color: #333;">
      <h2 style="color: #8e2c2c;">Ciao ${customerName}!</h2>
      
      <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
        ${template.body.split('\n').map(line => `<p>${line}</p>`).join('')}
      </div>
      
      <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3>Reservation Details:</h3>
        <p><strong>📅 Date:</strong> ${readableDate}</p>
        <p><strong>🕐 Time:</strong> ${time}</p>
        <p><strong>👥 Party Size:</strong> ${partySize} guest(s)</p>
        <p><strong>📍 Location:</strong> ${location}</p>
        <p><strong>🔖 Confirmation #:</strong> ${reservationId}</p>
      </div>
      
      <p>Please arrive 10 minutes before your reservation time. If you need to make any changes, please call us.</p>
      <p style="color: #888;">Grazie mille! 🇮🇹</p>
    </div>
  `,
};

const result = await transporter.sendMail(mailOptions);
console.log("✅ CMS reservation confirmation email sent:", result.messageId);
return result;


} catch (error) {
console.error("❌ Error sending CMS reservation email:", error);
throw error;
}
};

// 🔥 UPDATED: Private dining inquiry confirmation with CMS templates
const sendPrivateDiningConfirmationEmail = async ({
to,
requesterName,
partySize,
date,
eventNature,
locationId = null
}) => {
console.log("📧 Preparing CMS private dining confirmation email…");

try {
// 🔥 Get CMS template
const template = await EmailTemplateService.getPrivateDiningTemplate({
requesterName,
partySize,
date,
eventNature
}, locationId);


const mailOptions = {
  from: `"Events Team" <${process.env.EMAIL_USER}>`,
  to,
  subject: template.subject,
  html: `
    <div style="font-family: 'Arial', sans-serif; padding: 20px; background-color: #fefaf6; color: #333;">
      <h2 style="color: #8e2c2c;">Ciao ${requesterName}!</h2>
      
      <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
        ${template.body.split('\n').map(line => `<p>${line}</p>`).join('')}
      </div>
      
      <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <h3>Your Inquiry Details:</h3>
        <p><strong>📅 Preferred Date:</strong> ${date}</p>
        <p><strong>👥 Party Size:</strong> ${partySize} guests</p>
        <p><strong>🎉 Event Type:</strong> ${eventNature}</p>
      </div>
      
      <p>Our events team will contact you within 24 hours to discuss your requirements and provide a customized proposal.</p>
      <p style="color: #888;">Grazie & looking forward to hosting you! 🇮🇹</p>
    </div>
  `,
};

const result = await transporter.sendMail(mailOptions);
console.log("✅ CMS private dining confirmation email sent:", result.messageId);
return result;


} catch (error) {
console.error("❌ Error sending CMS private dining email:", error);
throw error;
}
};

// 🔥 UPDATED: Abandoned cart email with CMS templates
const sendAbandonedCartEmail = async ({ to, customerName, cartItems, locationId = null }) => {
console.log("📧 Preparing CMS abandoned cart email…");

try {
// 🔥 Get CMS template
const template = await EmailTemplateService.getAbandonedCartTemplate({
customerName,
cartItems
}, locationId);


const itemsHtml = cartItems
  .map((item) => `<li style="margin-bottom: 5px;">🍽️ ${item.name} × ${item.quantity}</li>`)
  .join("");

const mailOptions = {
  from: `"Your Favorite Italian Restaurant" <${process.env.EMAIL_USER}>`,
  to,
  subject: template.subject,
  html: `
    <div style="font-family: 'Arial', sans-serif; padding: 20px; background-color: #fff9f4; color: #333;">
      <h2 style="color: #c0392b;">Ciao ${customerName || "Amico"},</h2>
      
      <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
        ${template.body.split('\n').map(line => `<p>${line}</p>`).join('')}
      </div>
      
      <p>Here's what you picked:</p>
      <ul>${itemsHtml}</ul>
      
      <a href="${process.env.FRONTEND_URL}/order-online" style="display:inline-block;margin-top:15px;padding:12px 20px;background-color:#c0392b;color:#fff;text-decoration:none;border-radius:5px;font-weight:bold;">Resume My Order</a>
      <p style="margin-top: 30px; color: #888;">Grazie! We can't wait to serve you again.</p>
    </div>
  `,
};

const result = await transporter.sendMail(mailOptions);
console.log("✅ CMS abandoned cart email sent:", result.messageId);
return result;


} catch (error) {
console.error("❌ Error sending CMS abandoned cart email:", error);
throw error;
}
};

// 🔥 UPDATED: Order receipt email with CMS templates
const sendReceiptEmail = async ({
to,
name,
orderId,
items,
total,
discount = 0,
pointsUsed = 0,
finalTotal,
locationId = null
}) => {
console.log("📧 Preparing CMS order receipt email…");

try {
// 🔥 Get CMS template
const template = await EmailTemplateService.getOrderTemplate({
name,
orderId,
orderType: "online",
total,
finalTotal
}, locationId);


const itemRows = items
  .map(
    (item) =>
      `<tr> <td>${item.name}</td> <td>${item.quantity}</td> <td>$${(item.price * item.quantity).toFixed(2)}</td> </tr>`
  )
  .join("");

const html = `
  <div style="font-family: 'Arial', sans-serif; padding: 20px; background-color: #fefaf6; color: #333;">
    <h2>Grazie, ${name}!</h2>
    
    <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0;">
      ${template.body.split('\n').map(line => `<p>${line}</p>`).join('')}
    </div>
    
    <p>Here is your receipt for Order <strong>${orderId}</strong>.</p>
    <table border="1" cellpadding="8" cellspacing="0" style="border-collapse: collapse; width: 100%;">
      <thead>
        <tr><th>Item</th><th>Qty</th><th>Subtotal</th></tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>
    
    <p><strong>Subtotal:</strong> $${total.toFixed(2)}</p>
    ${discount > 0 ? `<p><strong>Promo Discount:</strong> -$${discount.toFixed(2)}</p>` : ""}
    ${pointsUsed > 0 ? `<p><strong>Loyalty Points Used:</strong> -$${pointsUsed.toFixed(2)}</p>` : ""}
    <p><strong>Total Paid:</strong> $${finalTotal.toFixed(2)}</p>
    
    <p style="color: #888;">Grazie for choosing us! We hope to serve you again soon.</p>
  </div>
`;

const mailOptions = {
  from: `"Your Restaurant" <${process.env.EMAIL_USER}>`,
  to,
  subject: template.subject,
  html,
};

const result = await transporter.sendMail(mailOptions);
console.log("✅ CMS order receipt email sent:", result.messageId);
return result;


} catch (error) {
console.error("❌ Error sending CMS receipt email:", error);
throw error;
}
};

module.exports = {
sendGiftCardEmail,
sendReservationConfirmationEmail,
sendPrivateDiningConfirmationEmail,
sendAbandonedCartEmail,
sendReceiptEmail,
};