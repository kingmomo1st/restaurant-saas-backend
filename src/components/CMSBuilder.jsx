import React, { useState, useEffect } from "react";
import "./css/CMSBuilder.css";
import sanityClient from "../sanity/sanityClient.ts";
import imageUrlBuilder from "@sanity/image-url";
import { useAuth } from "./AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const builder = imageUrlBuilder(sanityClient);
function urlFor(source) {
  return builder.image(source);
}

const CMS_SECTIONS = [
  "Homepage Sections",
  "Menu Management",
  "Reservation Settings",
  "Private Dining",
  "Gift Card Settings",
  "Order Online Settings",
  "Contact Information",
  "Social Media Links",
  "Footer Content",
  "Email Templates",
  "SEO & Analytics",
  "Business Settings",
  "Customer Communications",
  "Promotions & Offers",
  "Social Media",
];

const SECTION_OPTIONS = [
  "heroSection",
  "welcomeSection",
  "menuSection",
  "gallerySection",
  "vibeSection",
  "customSection",
  "privateDining",
  "eventBookingSection",
];

const TIME_SLOTS = [
  "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM",
  "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM"
];

const GIFT_CARD_PRESETS = [25, 50, 75, 100, 150, 200];

function CMSBuilder() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const selectedLocation = useSelector((state) => state.location.selectedLocation);

  const [activeTab, setActiveTab] = useState("Homepage Sections");
  const [saving, setSaving] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);

  // All state declarations
  const [sections, setSections] = useState([]);
  const [pageId, setPageId] = useState(null);
  const [menuData, setMenuData] = useState(null);
  const [menuCategories, setMenuCategories] = useState([]);
  const [homepageSettings, setHomepageSettings] = useState({});



  const [reservationSettings, setReservationSettings] = useState({
    timeSlots: [...TIME_SLOTS],
    maxBookingsPerSlot: 5,
    advanceBookingDays: 30,
    heading: "",
    subtext: ""
  });

  const [privateDiningData, setPrivateDiningData] = useState({});

  const [giftCardSettings, setGiftCardSettings] = useState({
    presetAmounts: [...GIFT_CARD_PRESETS],
    minAmount: 10,
    maxAmount: 500,
    expiryMonths: 12,
    designTemplate: "classic"
  });

  const [orderOnlineSettings, setOrderOnlineSettings] = useState({});

  const [emailTemplates, setEmailTemplates] = useState({
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
  });

  const [seoSettings, setSeoSettings] = useState({
    metaTitle: "",
    metaDescription: "",
    keywords: [],
    googleAnalyticsId: "",
    facebookPixelId: "",
    structuredData: true
  });

  const [businessSettings, setBusinessSettings] = useState({
    businessHours: {
      monday: { open: "11:00", close: "22:00", closed: false },
      tuesday: { open: "11:00", close: "22:00", closed: false },
      wednesday: { open: "11:00", close: "22:00", closed: false },
      thursday: { open: "11:00", close: "22:00", closed: false },
      friday: { open: "11:00", close: "23:00", closed: false },
      saturday: { open: "11:00", close: "23:00", closed: false },
      sunday: { open: "12:00", close: "21:00", closed: false }
    },
    deliverySettings: {
      enabled: true,
      radius: 5,
      minimumOrder: 25,
      deliveryFee: 3.99,
      freeDeliveryThreshold: 50
    }
  });

  const [communicationSettings, setCommunicationSettings] = useState({
    welcomeMessages: {
      newCustomer: "Welcome to our restaurant family!",
      returningCustomer: "Welcome back! We’ve missed you."
    },
    notifications: {
      orderReady: "Your order is ready for pickup!",
      tableReady: "Your table is now ready.",
      specialOffers: "Check out our special offers this week!"
    }
  });

  const [promotionsSettings, setPromotionsSettings] = useState({
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
  });

  const [socialMediaSettings, setSocialMediaSettings] = useState({
    autoPosting: { enabled: false, platforms: [] },
    reviewResponses: {
      autoReply: false,
      templates: {
        positive: "Thank you for the wonderful review!",
        negative: "We appreciate your feedback and will address this immediately."
      }
    },
    hashtags: ["#italianfood", "#restaurant", "#delicious"]
  });

  const [contactInfo, setContactInfo] = useState({
    phoneNumber: "",
    email: "",
    address: "",
    googleMapsLink: "",
    hoursDisplay: "",
    emergencyContact: ""
  });
  
  const [socialMediaLinks, setSocialMediaLinks] = useState({
    facebook: "",
    instagram: "",
    twitter: "",
    tiktok: "",
    youtube: "",
    linkedin: "",
    googleBusiness: ""
  });
  
  const [footerContent, setFooterContent] = useState({
    copyrightText: "",
    privacyPolicyLink: "",
    termsOfServiceLink: "",
    aboutUsLink: "",
    additionalLinks: [],
    footerMessage: ""
  });
  
  

  if (loading) return <p>Loading CMS Builder…</p>;
  if (!user) return <p>⏳ Waiting for authentication…</p>;
  if (!isAdmin) return <p>🔒 Access restricted to admins only.</p>;

  useEffect(() => {
    if (!loading && !user) navigate("/login");
  }, [loading, user]);

  useEffect(() => {
    fetchCMSData();
  }, [selectedLocation]);

  // PART 1 CLEANED — READY FOR PART 2


// PART 2: Helper Functions & Data Management

const fetchCMSData = async () => {
  try {
    const locationId = selectedLocation?._id;
    if (!locationId) {
      console.log("❌ No location selected");
      return;
    }

    // 🔍 STEP 1: Find and clean up duplicate homepage documents
    console.log("🔍 Checking for duplicate homepage documents...");
    
    const allHomepages = await sanityClient.fetch(
      `*[_type == "homepage" && location._ref == $locId]{
        _id,
        _createdAt,
        _updatedAt,
        hidden,
        "isDraft": _id in path("drafts.**"),
        sections
      } | order(_updatedAt desc)`,
      { locId: locationId }
    );

    console.log("🏠 Found homepage documents:", allHomepages);

    // 🧹 STEP 2: Clean up duplicate homepages
    if (allHomepages.length > 1) {
      console.log("⚠️ Multiple homepage documents found, cleaning up...");
      
      // Keep the most recent non-hidden homepage
      const validHomepage = allHomepages.find(hp => !hp.hidden && !hp.isDraft) || allHomepages[0];
      
      // Delete extra homepages
      for (const homepage of allHomepages) {
        if (homepage._id !== validHomepage._id) {
          console.log("🗑️ Deleting duplicate homepage:", homepage._id);
          try {
            await sanityClient.delete(homepage._id);
          } catch (err) {
            console.log("⚠️ Could not delete duplicate:", err.message);
          }
        }
      }
      
      setPageId(validHomepage._id);
    }

    // 🔍 STEP 3: Fetch the correct homepage with better error handling
    const homePage = await sanityClient.fetch(
      `*[_type == "homepage" && location._ref == $locId && hidden != true && !(_id in path("drafts.**"))][0]{
        _id,
        wallpaperImage,
        sections[]{
          sectionRef->{
            _id, _key, _type, hidden,
            heroTitle, heroSubtitle, callToActionText, heroImage,
            title, description, image, visible,
            menuSectionTitle, menuCategories,
            ambianceImages, transitionStyle, duration,
            paragraphs, buttonText, buttonLink, galleryImages,
            sectionTitle, italianVibeImages, welcomeButtons
          },
          order,
          visible
        }
      }`,
      { locId: locationId }
    );
    
    if (homePage) {
      console.log("✅ FOUND CLEAN HOMEPAGE:", homePage);
      setPageId(homePage._id);
      
      // 🔧 EXTRACT SECTIONS WITH PROPER STRUCTURE
      const extractedSections = homePage.sections?.map(sec => {
        if (sec.sectionRef) {
          return {
            ...sec.sectionRef,
            _key: sec.sectionRef._key || sec.sectionRef._id || `${sec.sectionRef._type}-${Date.now()}`,
            order: sec.order || 0,
            visible: sec.visible !== false
          };
        }
        return null;
      }).filter(Boolean) || [];
      
      console.log("📋 CLEAN EXTRACTED SECTIONS:", extractedSections);
      setSections(extractedSections);
      
      // Set homepage wallpaper
      setHomepageSettings({ wallpaperImage: homePage.wallpaperImage });
      
    } else {
      console.log("❌ NO VALID HOMEPAGE FOUND - Creating new one");
      setSections([]);
      setPageId(null);
      setHomepageSettings({});
    }

    // 🍝 YOUR EXISTING MENU DATA FETCHING (PRESERVED)
    const menu = await sanityClient.fetch(
      `*[_type == "menuSection"${locationId ? ` && location._ref == "${locationId}"` : ''}][0]{
        _id, menuSectionTitle, menuCategories[]{ _key, title, image, items[]{_id, name, description, price, priceGlass, priceBottle, image, available, category, sizes} }
      }`
    );
    if (menu) {
      setMenuData(menu);
      setMenuCategories(menu.menuCategories || []);
    }

    // 🖼️ HOMEPAGE WALLPAPER FETCHING (PRESERVED)
    const homepageRes = await sanityClient.fetch(
      `*[_type == "homepage" && location._ref == "${locationId}"][0]{
        wallpaperImage
      }`
    );
    setHomepageSettings(prev => ({ ...prev, ...homepageRes }));

    // 🔧 YOUR EXISTING OTHER CMS DATA FETCHING (PRESERVED)
    const queries = [
      { key: 'reservationSettings', query: `*[_type == "tableBookingPage"${locationId ? ` && location._ref == "${locationId}"` : ''}][0]` },
      { key: 'privateDiningData', query: `*[_type == "privateDiningPage"${locationId ? ` && location._ref == "${locationId}"` : ''}][0]` },
      { key: 'orderOnlineSettings', query: `*[_type == "orderOnline"${locationId ? ` && location._ref == "${locationId}"` : ''}][0]` },
      { key: 'giftCardSettings', query: `*[_type == "giftCardSettings"${locationId ? ` && location._ref == "${locationId}"` : ''}][0]` },
      { key: 'emailTemplates', query: `*[_type == "emailTemplates"${locationId ? ` && location._ref == "${locationId}"` : ''}][0]` },
      { key: 'seoSettings', query: `*[_type == "seoSettings"${locationId ? ` && location._ref == "${locationId}"` : ''}][0]` },
      { key: 'businessSettings', query: `*[_type == "businessSettings"${locationId ? ` && location._ref == "${locationId}"` : ''}][0]` },
      { key: 'contactInfo', query: `*[_type == "contactInfo"${locationId ? ` && location._ref == "${locationId}"` : ''}][0]` },
      { key: 'socialMediaLinks', query: `*[_type == "socialMediaLinks"${locationId ? ` && location._ref == "${locationId}"` : ''}][0]` },
      { key: 'footerContent', query: `*[_type == "footerContent"${locationId ? ` && location._ref == "${locationId}"` : ''}][0]` }
    ];

    for (const { key, query } of queries) {
      const result = await sanityClient.fetch(query);
      if (result) {
        switch (key) {
          case 'reservationSettings': setReservationSettings(prev => ({ ...prev, ...result })); break;
          case 'privateDiningData': setPrivateDiningData(result); break;
          case 'orderOnlineSettings': setOrderOnlineSettings(result); break;
          case 'giftCardSettings': setGiftCardSettings(prev => ({ ...prev, ...result })); break;
          case 'emailTemplates': if (result) { setEmailTemplates(prev => ({ ...prev, ...result })); } break;
          case 'seoSettings': setSeoSettings(prev => ({ ...prev, ...result })); break;
          case 'businessSettings': setBusinessSettings(prev => ({ ...prev, ...result })); break;
          case 'contactInfo': setContactInfo(prev => ({ ...prev, ...result })); break;
          case 'socialMediaLinks': setSocialMediaLinks(prev => ({ ...prev, ...result })); break;
          case 'footerContent': setFooterContent(prev => ({ ...prev, ...result })); break;
        }
      }
    }

  } catch (err) {
    console.error("💥 Error fetching CMS data:", err);
    alert("❌ Error loading CMS data: " + err.message);
  }
};


// 🚑 RESTORE FUNCTION - SEPARATE
const restoreHomepage = async () => {
  try {
    console.log("🚑 Starting homepage restoration...");
    const locationId = selectedLocation?._id;

    if (!locationId) {
      alert("❌ No location selected for restoration");
      return;
    }

    // Find existing individual sections with better query
    const queries = [
      { type: "heroSection", query: `*[_type == "heroSection" && location._ref == "${locationId}"][0]{ _id, _type, _key, title, heroTitle, heroSubtitle, callToActionText, heroImage, hidden }` },
      { type: "welcomeSection", query: `*[_type == "welcomeSection" && location._ref == "${locationId}"][0]{ _id, _type, _key, title, description, image, hidden }` },
      { type: "menuSection", query: `*[_type == "menuSection" && location._ref == "${locationId}"][0]{ _id, _type, _key, title, description, image, hidden }` },
      { type: "gallerySection", query: `*[_type == "gallerySection" && location._ref == "${locationId}"][0]{ _id, _type, _key, title, description, image, hidden }` },
      { type: "vibeSection", query: `*[_type == "vibeSection" && location._ref == "${locationId}"][0]{ _id, _type, _key, title, description, image, hidden }` },
      { type: "customSection", query: `*[_type == "customSection" && location._ref == "${locationId}"][0]{ _id, _type, _key, title, description, image, hidden }` },
      { type: "privateDining", query: `*[_type == "privateDining" && location._ref == "${locationId}"][0]{ _id, _type, _key, title, description, image, hidden }` },
      { type: "eventBooking", query: `*[_type == "eventBooking" && location._ref == "${locationId}"][0]{ _id, _type, _key, title, description, image, hidden }` },
      { type: "ambianceSection", query: `*[_type == "ambianceSection" && location._ref == "${locationId}"][0]{ _id, _type, _key, title, description, image, hidden }` },
      { type: "cateringSection", query: `*[_type == "cateringSection" && location._ref == "${locationId}"][0]{ _id, _type, _key, title, description, image, hidden }` }
    ];

    const foundSections = [];
    const actualSections = [];

    for (const { type, query } of queries) {
      const section = await sanityClient.fetch(query);
      if (section) {
        console.log(`✅ Found ${type}:`, section);
        foundSections.push({
          sectionRef: { _ref: section._id },
          order: foundSections.length + 1,
          visible: true
        });
        actualSections.push(section);
      }
    }

    console.log("🔄 Sections to restore:", foundSections);

    if (foundSections.length === 0) {
      alert("❌ No sections found to restore. Create sections first in the CMS.");
      return;
    }

    let homepageId = pageId;

    if (!homepageId) {
      const newHomepage = await sanityClient.create({
        _type: "homepage",
        location: { _ref: locationId },
        sections: foundSections,
        hidden: false
      });
      homepageId = newHomepage._id;
      setPageId(homepageId);
    } else {
      await sanityClient.patch(homepageId).set({
        sections: foundSections,
        hidden: false
      }).commit();
    }

    setSections(actualSections);

    console.log("✅ Homepage structure restored!");
    alert("✅ Homepage restored successfully! Go refresh your homepage to see changes.");

  } catch (error) {
    console.error("💥 Restore error:", error);
    alert("❌ Restore failed: " + error.message);
  }
};


// 🔧 DISABLED SAVE FUNCTION - SEPARATE  
const saveToSanity = async (docType, data, successMessage) => {
  setSaving(true);
  try {
    const locationRef = selectedLocation?._id ? { location: { _ref: selectedLocation._id } } : {};

    if (docType === "homepage" || docType === "page") {
      console.log("🏠 Saving homepage sections with enhanced sync...");

      // 🔧 STEP 1: Ensure we have a valid homepage document
      let homepageId = pageId;
      
      if (!homepageId) {
        console.log("🆕 Creating new homepage document...");
        const newHomepage = await sanityClient.create({
          _type: "homepage",
          ...locationRef,
          hidden: false,
          sections: []
        });
        homepageId = newHomepage._id;
        setPageId(homepageId);
      }

      // 🔧 STEP 2: Save/update each individual section
      const updatedSectionRefs = [];
      
      for (const [index, section] of (data.sections || sections).entries()) {

        let sectionId = section._id;
        
        const sectionData = {
          title: section.title,
          description: section.description,
          heroTitle: section.heroTitle,
          heroSubtitle: section.heroSubtitle,
          callToActionText: section.callToActionText,
          hidden: section.hidden || false,
          visible: section.visible !== false,
          menuSectionTitle: section.menuSectionTitle,
          menuCategories: section.menuCategories,
          ambianceImages: section.ambianceImages,
          transitionStyle: section.transitionStyle,
          duration: section.duration,
          paragraphs: section.paragraphs,
          buttonText: section.buttonText,
          buttonLink: section.buttonLink,
          galleryImages: section.galleryImages,
          sectionTitle: section.sectionTitle,
          italianVibeImages: section.italianVibeImages,
          welcomeButtons: section.welcomeButtons,
          ...locationRef
        };

        if (sectionId) {
          // Update existing section
          console.log(`🔄 Updating section: ${section._type} (${sectionId})`);
          await sanityClient.patch(sectionId).set(sectionData).commit();
        } else {
          // Create new section
          console.log(`🆕 Creating new section: ${section._type}`);
          const newSection = await sanityClient.create({
            _type: section._type,
            _key: section._key || crypto.randomUUID?.() || `${section._type}-${Date.now()}`,
            ...sectionData
          });
          sectionId = newSection._id;
          
          // Update the sections array with new ID
          const updatedSections = [...sections];
          updatedSections[index]._id = sectionId;
          setSections(updatedSections);
        }

        // 🔧 STEP 3: Build reference for homepage sections array
        updatedSectionRefs.push({
          _key: `section-${index}`,
          sectionRef: {
            _type: "reference",
            _ref: sectionId
          },
          order: index,
          visible: !section.hidden
        });
      }

      // 🔧 STEP 4: Update homepage document with sections array
      console.log("🔄 Updating homepage sections array...");
      await sanityClient.patch(homepageId).set({
        sections: updatedSectionRefs
      }).commit();

      console.log("✅ Homepage sync completed successfully!");

    } else if (docType === "homepage" && data.wallpaperImage) {
      // Handle homepage wallpaper separately
      console.log("🖼️ Saving homepage wallpaper...");
      
      if (pageId) {
        await sanityClient.patch(pageId).set({
          wallpaperImage: data.wallpaperImage,
          ...locationRef
        }).commit();
      }
      
    } else {
      // Handle other document types normally
      console.log("📄 Saving document type:", docType);

      if (data._id) {
        await sanityClient.patch(data._id).set({ ...data, ...locationRef }).commit();
      } else {
        await sanityClient.create({ _type: docType, ...data, ...locationRef });
      }
    }

    alert(`✅ ${successMessage}`);

    // 🔄 STEP 5: Force refresh to verify sync
    console.log("🔄 Refreshing data to verify sync...");
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for Sanity to propagate
    await fetchCMSData();

  } catch (err) {
    console.error("💥 SAVE ERROR:", err);
    alert(`❌ Failed to save: ${err.message}`);
  } finally {
    setSaving(false);
  }
};
// 3. EMERGENCY SYNC REPAIR FUNCTION
const emergencySyncRepair = async () => {
  try {
    console.log("🚑 EMERGENCY SYNC REPAIR STARTING...");
    const locationId = selectedLocation?._id;

    if (!locationId) {
      alert("❌ No location selected for repair");
      return;
    }

    // Step 1: Find all homepage documents for this location
    const allHomepages = await sanityClient.fetch(
      `*[_type == "homepage" && location._ref == $locId]{
        _id, _createdAt, hidden, "isDraft": _id in path("drafts.**")
      }`,
      { locId: locationId }
    );

    console.log("Found homepages:", allHomepages);

    // Step 2: Delete ALL existing homepages for clean start
    for (const homepage of allHomepages) {
      try {
        await sanityClient.delete(homepage._id);
        console.log("🗑️ Deleted:", homepage._id);
      } catch (e) {
        console.log("⚠️ Could not delete:", homepage._id, e.message);
      }
    }

    // Step 3: Find all individual sections for this location
    const queries = [
      `*[_type == "heroSection" && location._ref == "${locationId}"][0]`,
      `*[_type == "welcomeSection" && location._ref == "${locationId}"][0]`,
      `*[_type == "menuSection" && location._ref == "${locationId}"][0]`,
      `*[_type == "gallerySection" && location._ref == "${locationId}"][0]`,
      `*[_type == "vibeSection" && location._ref == "${locationId}"][0]`,
      `*[_type == "customSection" && location._ref == "${locationId}"][0]`,
      `*[_type == "privateDining" && location._ref == "${locationId}"][0]`,
      `*[_type == "eventBooking" && location._ref == "${locationId}"][0]`,
      `*[_type == "ambianceSection" && location._ref == "${locationId}"][0]`,
      `*[_type == "cateringSection" && location._ref == "${locationId}"][0]`
    ];

    const foundSections = [];
    const actualSections = [];

    for (const query of queries) {
      const section = await sanityClient.fetch(query);
      if (section) {
        console.log(`✅ Found section: ${section._type}`);
        foundSections.push({
          _key: `section-${foundSections.length}`,
          sectionRef: { _type: "reference", _ref: section._id },
          order: foundSections.length,
          visible: true
        });
        actualSections.push(section);
      }
    }

    // Step 4: Create fresh homepage with proper structure
    const newHomepage = await sanityClient.create({
      _type: "homepage",
      location: { _ref: locationId },
      sections: foundSections,
      hidden: false
    });

    console.log("✅ Created new homepage:", newHomepage._id);

    // Step 5: Update state
    setPageId(newHomepage._id);
    setSections(actualSections);

    alert("✅ Emergency sync repair completed! Your homepage should now sync properly between CMS Builder and Sanity Studio.");

  } catch (error) {
    console.error("💥 Emergency repair failed:", error);
    alert("❌ Emergency repair failed: " + error.message);
  }
};

// 4. VERIFICATION FUNCTION
const verifySyncStatus = async () => {
  try {
    const locationId = selectedLocation?._id;
    if (!locationId) return;

    // Check CMS Builder state
    console.log("📊 CMS BUILDER STATE:");
    console.log("- Page ID:", pageId);
    console.log("- Sections count:", sections.length);
    console.log("- Section types:", sections.map(s => s._type));

    // Check Sanity Studio state
    const sanityHomepage = await sanityClient.fetch(
      `*[_type == "homepage" && location._ref == $locId]{
        _id, sections[]{sectionRef->{_type}}, "sectionsCount": count(sections)
      }`,
      { locId: locationId }
    );

    console.log("📊 SANITY STUDIO STATE:");
    console.log("- Homepage docs:", sanityHomepage.length);
    console.log("- Sections:", sanityHomepage[0]?.sections?.map(s => s.sectionRef._type));

    // Report sync status
    const cmsCount = sections.length;
    const sanityCount = sanityHomepage[0]?.sections?.length || 0;
    
    if (cmsCount === sanityCount && pageId) {
      alert("✅ SYNC STATUS: Good! CMS Builder and Sanity Studio are in sync.");
    } else {
      alert(`⚠️ SYNC STATUS: Mismatch detected!\nCMS Builder: ${cmsCount} sections\nSanity Studio: ${sanityCount} sections\nUse Emergency Repair to fix.`);
    }

  } catch (error) {
    console.error("💥 Verification failed:", error);
  }
};




// Homepage section handlers
const handleDragStart = (e, index) => e.dataTransfer.setData("dragIndex", index);

const handleDrop = (e, dropIndex) => {
  const dragIndex = parseInt(e.dataTransfer.getData("dragIndex"));
  if (dragIndex === dropIndex) return;
  const updated = [...sections];
  const dragged = updated.splice(dragIndex, 1)[0];
  updated.splice(dropIndex, 0, dragged);
  setSections(updated);
};

const allowDrop = (e) => e.preventDefault();

const handleFieldChange = (index, field, value) => {
  const updated = [...sections];
  updated[index][field] = value;
  setSections(updated);
};

const handleImageUpload = async (e, index, fieldName) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    console.log("📷 Uploading image...");

    if (!sections[index]._id) {
      alert("❌ Save section first, then upload image.");
      return;
    }

    const asset = await sanityClient.assets.upload("image", file);
    
    const result = await sanityClient.patch(sections[index]._id).set({
      [fieldName]: {
        _type: "image",
        asset: { _type: "reference", _ref: asset._id }
      }
    }).commit();

    console.log("✅ Image saved:", result);
    
    // Force complete data refresh
    await new Promise(resolve => setTimeout(resolve, 1000));
    await fetchCMSData();
    
    alert("✅ Image uploaded! Refresh complete.");

  } catch (err) {
    console.error("💥 Upload failed:", err);
    alert("❌ Upload failed: " + err.message);
  }
};

const handleRemoveSection = (index) => {
  const updated = [...sections];
  updated.splice(index, 1);
  setSections(updated);
};

const handleAddNewSection = async (type) => {
  try {
    console.log("🆕 Creating new section:", type);
    const locationRef = selectedLocation?._id ? { location: { _ref: selectedLocation._id } } : {};

    const newSection = await sanityClient.create({
      _type: type,
      _key: crypto.randomUUID?.() || `${type}-${Date.now()}`,
      title: `New ${type.replace(/([A-Z])/g, " $1").trim()}`,
      description: "Add your description here...",
      hidden: false,
      ...locationRef
    });

    console.log("✅ Created section:", newSection);

    setSections([
      ...sections,
      {
        _id: newSection._id,
        _type: type,
        _key: newSection._key,
        title: newSection.title,
        description: newSection.description,
        hidden: false
      }
    ]);

    alert(`✅ New ${type} section created!`);
  } catch (err) {
    console.error("💥 Error creating section:", err);
    alert("❌ Failed to create section: " + err.message);
  }
};

// Time slot management
const addTimeSlot = () => {
  const newTime = prompt("Enter new time slot (e.g., 10:00 PM):");
  if (newTime && !reservationSettings.timeSlots.includes(newTime)) {
    setReservationSettings(prev => ({
      ...prev,
      timeSlots: [...prev.timeSlots, newTime].sort()
    }));
  }
};

const removeTimeSlot = (time) => {
  setReservationSettings(prev => ({
    ...prev,
    timeSlots: prev.timeSlots.filter(slot => slot !== time)
  }));
};

// Gift card management
const addGiftCardPreset = () => {
  const amount = prompt("Enter gift card amount ($):");
  const numAmount = parseFloat(amount);
  if (numAmount && !giftCardSettings.presetAmounts.includes(numAmount)) {
    setGiftCardSettings(prev => ({
      ...prev,
      presetAmounts: [...prev.presetAmounts, numAmount].sort((a, b) => a - b)
    }));
  }
};

const removeGiftCardPreset = (amount) => {
  setGiftCardSettings(prev => ({
    ...prev,
    presetAmounts: prev.presetAmounts.filter(preset => preset !== amount)
  }));
};

// Business hours management
const updateBusinessHours = (day, field, value) => {
  setBusinessSettings(prev => ({
    ...prev,
    businessHours: {
      ...prev.businessHours,
      [day]: {
        ...prev.businessHours[day],
        [field]: value
      }
    }
  }));
};
const handleMenuCategoryChange = (catIndex, field, value) => {
  const updated = [...menuCategories];
  updated[catIndex][field] = value;
  setMenuCategories(updated);
};

// 🔧 ENHANCED MENU ITEM MANAGEMENT FUNCTIONS

const handleMenuItemChange = (catIndex, itemIndex, field, value) => {
  const updated = [...menuCategories];
  
  // Ensure category exists
  if (!updated[catIndex]) return;
  
  // Ensure items array exists
  if (!updated[catIndex].items) updated[catIndex].items = [];
  
  // Ensure item exists with PROPER DEFAULTS
  if (!updated[catIndex].items[itemIndex]) {
    updated[catIndex].items[itemIndex] = {
      _id: crypto.randomUUID?.() || `item-${Date.now()}`,
      name: "",
      description: "",
      price: 0,
      priceGlass: null,
      priceBottle: null,
      available: true,
      category: "",
      sizes: [],
      image: null  // ← This prevents image errors
    };
  }
  
  // Handle price fields to prevent NaN
  if (field === 'price' || field === 'priceGlass' || field === 'priceBottle') {
    updated[catIndex].items[itemIndex][field] = isNaN(value) ? 0 : value;
  } else {
    updated[catIndex].items[itemIndex][field] = value;
  }
  
  setMenuCategories(updated);
};

const addNewMenuItem = (catIndex) => {
  const updated = [...menuCategories];
  if (!updated[catIndex]) return; // Safety check
  if (!updated[catIndex].items) updated[catIndex].items = [];
  
  updated[catIndex].items.push({
    _id: crypto.randomUUID?.() || `item-${Date.now()}`,
    name: "",
    description: "",
    price: 0,
    priceGlass: null,
    priceBottle: null,
    available: true,
    category: "",
    sizes: [],
    image: null
  });
  
  setMenuCategories(updated);
  console.log(`Added item to category ${catIndex}:`, updated[catIndex]);
};

const removeMenuItem = (catIndex, itemIndex) => {
  if (confirm("Are you sure you want to remove this menu item?")) {
    const updated = [...menuCategories];
    updated[catIndex].items.splice(itemIndex, 1);
    setMenuCategories(updated);
  }
};

const addNewCategory = () => {
  setMenuCategories([
    ...menuCategories,
    {
      _key: crypto.randomUUID?.() || `cat-${Date.now()}`,
      title: "",
      items: [],
      image: null
    }
  ]);
};
// 📐 SIZE OPTIONS MANAGEMENT
const handleSizeChange = (catIndex, itemIndex, sizeIndex, field, value) => {
  const updated = [...menuCategories];
  if (!updated[catIndex].items[itemIndex].sizes) {
    updated[catIndex].items[itemIndex].sizes = [];
  }
  if (!updated[catIndex].items[itemIndex].sizes[sizeIndex]) {
    updated[catIndex].items[itemIndex].sizes[sizeIndex] = {};
  }
  updated[catIndex].items[itemIndex].sizes[sizeIndex][field] = value;
  setMenuCategories(updated);
};

const addSizeOption = (catIndex, itemIndex) => {
  const updated = [...menuCategories];
  if (!updated[catIndex].items[itemIndex].sizes) {
    updated[catIndex].items[itemIndex].sizes = [];
  }
  updated[catIndex].items[itemIndex].sizes.push({
    name: "",
    price: 0
  });
  setMenuCategories(updated);
};

const removeSizeOption = (catIndex, itemIndex, sizeIndex) => {
  const updated = [...menuCategories];
  updated[catIndex].items[itemIndex].sizes.splice(sizeIndex, 1);
  setMenuCategories(updated);
};

// 📷 IMAGE UPLOAD HANDLERS
const handleCategoryImageUpload = async (e, catIndex) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    console.log("📷 Uploading category image...");
    const asset = await sanityClient.assets.upload("image", file);

    const updated = [...menuCategories];
    updated[catIndex].image = {
      _type: "image",
      asset: { _type: "reference", _ref: asset._id }
    };
    setMenuCategories(updated);

    alert("✅ Category image uploaded!");
  } catch (err) {
    console.error("💥 Upload failed:", err);
    alert("❌ Upload failed: " + err.message);
  }
};

const handleItemImageUpload = async (e, catIndex, itemIndex) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    console.log("📷 Uploading item image...");
    const asset = await sanityClient.assets.upload("image", file);

    const updated = [...menuCategories];
    updated[catIndex].items[itemIndex].image = {
      _type: "image",
      asset: { _type: "reference", _ref: asset._id }
    };
    setMenuCategories(updated);

    alert("✅ Item image uploaded!");
  } catch (err) {
    console.error("💥 Upload failed:", err);
    alert("❌ Upload failed: " + err.message);
  }
};
const cleanBadMenuData = () => {
  const cleaned = menuCategories.map(category => ({
    ...category,
    items: (category.items || []).filter(item => 
      item && 
      typeof item === 'object' && 
      item.name && 
      item.name.trim() !== ""
    )
  }));
  setMenuCategories(cleaned);
  console.log("Cleaned menu data:", cleaned);
};
const updateEmailTemplate = (templateKey, field, value) => {
  setEmailTemplates(prev => ({
    ...prev,
    [templateKey]: {
      ...(prev[templateKey] ||{}),
      [field]: value
    }
  }));
};

const updateSEOSetting = (field, value) => {
  setSeoSettings(prev => ({
    ...prev,
    [field]: value
  }));
};

const updateDeliverySetting = (field, value) => {
  setBusinessSettings(prev => ({
    ...prev,
    deliverySettings: {
      ...prev.deliverySettings,
      [field]: value
    }
  }));
};

const updateCommunicationSetting = (category, field, value) => {
  setCommunicationSettings(prev => ({
    ...prev,
    [category]: {
      ...prev[category],
      [field]: value
    }
  }));
};

const updatePromotionSetting = (category, field, value) => {
  setPromotionsSettings(prev => ({
    ...prev,
    [category]: {
      ...prev[category],
      [field]: value
    }
  }));
};

const updateSocialMediaSetting = (category, field, value) => {
  setSocialMediaSettings(prev => ({
    ...prev,
    [category]: {
      ...prev[category],
      [field]: value
    }
  }));
};

const updateHashtags = (hashtagString) => {
  const hashtags = hashtagString.split(' ').filter(tag => tag.trim());
  setSocialMediaSettings(prev => ({
    ...prev,
    hashtags
  }));
};

const updateReviewTemplate = (type, value) => {
  setSocialMediaSettings(prev => ({
    ...prev,
    reviewResponses: {
      ...prev.reviewResponses,
      templates: {
        ...prev.reviewResponses.templates,
        [type]: value
      }
    }
  }));
};

const handleOrderOnlineWallpaperUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    console.log("📷 Uploading Order Online wallpaper...");
    const asset = await sanityClient.assets.upload("image", file);

    const updated = {
      ...orderOnlineSettings,
      wallpaperImage: {
        _type: "image",
        asset: { _type: "reference", _ref: asset._id }
      }
    };
    setOrderOnlineSettings(updated);
    alert("✅ Order Online wallpaper uploaded!");
  } catch (err) {
    console.error("💥 Upload failed:", err);
    alert("❌ Upload failed: " + err.message);
  }
};

const handleMenuWallpaperUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    console.log("📷 Uploading Menu page wallpaper...");
    const asset = await sanityClient.assets.upload("image", file);

    const updated = {
      ...menuData,
      wallpaperImage: {
        _type: "image",
        asset: { _type: "reference", _ref: asset._id }
      }
    };
    setMenuData(updated);
    alert("✅ Menu page wallpaper uploaded!");
  } catch (err) {
    console.error("💥 Upload failed:", err);
    alert("❌ Upload failed: " + err.message);
  }
};

const handlePrivateDiningWallpaperUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    console.log("📷 Uploading Private Dining wallpaper...");
    const asset = await sanityClient.assets.upload("image", file);

    const updated = {
      ...privateDiningData,
      wallpaperImage: {
        _type: "image",
        asset: { _type: "reference", _ref: asset._id }
      }
    };
    setPrivateDiningData(updated);
    alert("✅ Private Dining wallpaper uploaded!");
  } catch (err) {
    console.error("💥 Upload failed:", err);
    alert("❌ Upload failed: " + err.message);
  }
};


const handleReservationWallpaperUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    console.log("📷 Uploading Reservation wallpaper...");
    const asset = await sanityClient.assets.upload("image", file);

    const updated = {
      ...reservationSettings,
      wallpaperImage: {
        _type: "image",
        asset: { _type: "reference", _ref: asset._id }
      }
    };
    setReservationSettings(updated);
    alert("✅ Reservation wallpaper uploaded!");
  } catch (err) {
    console.error("💥 Upload failed:", err);
    alert("❌ Upload failed: " + err.message);
  }
};

// Add this handler with your other handlers
const handleHomepageWallpaperUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    setSaving(true);
    
    const asset = await sanityClient.assets.upload('image', file, {
      filename: file.name,
    });

    setHomepageSettings(prev => ({
      ...prev,
      wallpaperImage: {
        _type: 'image',
        asset: {
          _type: 'reference',
          _ref: asset._id,
        },
      },
    }));

    console.log("✅ Homepage wallpaper uploaded:", asset._id);
    
  } catch (error) {
    console.error("❌ Error uploading homepage wallpaper:", error);
    alert("Error uploading wallpaper: " + error.message);
  } finally {
    setSaving(false);
  }
};

// PART 3A: Core Render Functions
const renderFields = (section, i) => {
  const saveIndividualSection = async () => {
    console.log("💾 Saving individual section:", section._type);
  
    if (!section._id) {
      alert("❌ Cannot save section without ID. Create the section first or use 'Save All'.");
      return;
    }
  
    setSaving(true);
    try {
      const locationRef = selectedLocation?._id ? { location: { _ref: selectedLocation._id } } : {};
      const updateData = { ...locationRef };
  
      if (section.title !== undefined) updateData.title = section.title;
      if (section.description !== undefined) updateData.description = section.description;
      if (section.heroTitle !== undefined) updateData.heroTitle = section.heroTitle;
      if (section.heroSubtitle !== undefined) updateData.heroSubtitle = section.heroSubtitle;
      if (section.callToActionText !== undefined) updateData.callToActionText = section.callToActionText;
      if (section.hidden !== undefined) updateData.hidden = section.hidden;
      if (section.image) updateData.image = section.image;
      if (section.heroImage) updateData.heroImage = section.heroImage;
      if (section.welcomeButtons) updateData.welcomeButtons = section.welcomeButtons;
      if (section.menuCategories) updateData.menuCategories = section.menuCategories;
      if (section.menuSectionTitle !== undefined) updateData.menuSectionTitle = section.menuSectionTitle;
      if (section.ambianceImages) updateData.ambianceImages = section.ambianceImages;
      if (section.transitionStyle !== undefined) updateData.transitionStyle = section.transitionStyle;
      if (section.duration !== undefined) updateData.duration = section.duration;
      if (section.visible !== undefined) updateData.visible = section.visible;
      if (section.paragraphs) updateData.paragraphs = section.paragraphs;
      if (section.buttonText !== undefined) updateData.buttonText = section.buttonText;
      if (section.buttonLink !== undefined) updateData.buttonLink = section.buttonLink;
      if (section.galleryImages) updateData.galleryImages = section.galleryImages;
      if (section.sectionTitle !== undefined) updateData.sectionTitle = section.sectionTitle;
      if (section.italianVibeImages) updateData.italianVibeImages = section.italianVibeImages;
  
      console.log("💾 Updating section with:", updateData);
  
      await sanityClient.patch(section._id).set(updateData).commit();
      alert(`✅ ${section._type} saved successfully!`);
    } catch (err) {
      console.error("💥 Save error:", err);
      alert("❌ Failed to save section: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const commonFields = (
    <div key={`common-${section._id || i}`}>
      <div className="form-group">
        <label>Title</label>
        <input
          value={section.title || ""}
          onChange={(e) => handleFieldChange(i, "title", e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <label>Description</label>
        <textarea
          value={
            Array.isArray(section.description) 
              ? section.description.map(block => 
                  block.children?.map(child => child.text).join('') || ''
                ).join('\n')
              : section.description || ""
          }
          onChange={(e) => {
            const blockContent = [{
              _type: 'block',
              children: [{ _type: 'span', text: e.target.value }]
            }];
            handleFieldChange(i, "description", blockContent);
          }}
          required
        />
      </div>

      <div className="form-group">
        <label>Image</label>
        {section.image?.asset && (
          <div className="image-preview">
            <img src={urlFor(section.image).width(300).url()} alt="Preview" />
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleImageUpload(e, i, "image")}
        />
      </div>

      <button
        onClick={saveIndividualSection}
        disabled={saving}
        className="save-section-btn"
        style={{
          backgroundColor: "#28a745",
          color: "white",
          padding: "8px 16px",
          border: "none",
          borderRadius: "4px",
          marginTop: "10px",
          cursor: "pointer"
        }}
      >
        {saving ? "Saving..." : `💾 Save ${section._type}`}
      </button>
    </div>
  );

  if (section._type === "heroSection") {
    return (
      <div key={`hero-${section._id || i}`}>
        <div className="form-group">
          <label>Hero Title</label>
          <input
            value={section.heroTitle || ""}
            onChange={(e) => handleFieldChange(i, "heroTitle", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Hero Subtitle</label>
          <input
            value={section.heroSubtitle || ""}
            onChange={(e) => handleFieldChange(i, "heroSubtitle", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Call to Action Text</label>
          <input
            value={section.callToActionText || ""}
            onChange={(e) => handleFieldChange(i, "callToActionText", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Hero Background Image</label>
          {section.heroImage?.asset && (
            <div className="image-preview">
              <img src={urlFor(section.heroImage).width(300).url()} alt="Hero" />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageUpload(e, i, "heroImage")}
          />
        </div>

        <button
          onClick={saveIndividualSection}
          disabled={saving}
          className="save-section-btn"
          style={{
            backgroundColor: "#28a745",
            color: "white",
            padding: "8px 16px",
            border: "none",
            borderRadius: "4px",
            marginTop: "10px",
            cursor: "pointer"
          }}
        >
          {saving ? "Saving..." : "💾 Save Hero Section"}
        </button>
      </div>
    );
  }

  if (section._type === "welcomeSection") {
    return (
      <div key={`welcome-${section._id || i}`}>
        <div className="form-group">
          <label>Title</label>
          <input
            value={section.title || ""}
            onChange={(e) => handleFieldChange(i, "title", e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label>Description</label>
          <textarea
            value={
              Array.isArray(section.description) 
                ? section.description.map(block => 
                    block.children?.map(child => child.text).join('') || ''
                  ).join('\n')
                : section.description || ""
            }
            onChange={(e) => {
              const blockContent = [{
                _type: 'block',
                children: [{ _type: 'span', text: e.target.value }]
              }];
              handleFieldChange(i, "description", blockContent);
            }}
            required
          />
        </div>

        <div className="form-group">
          <label>Welcome Buttons</label>
          {(section.welcomeButtons || []).map((button, btnIndex) => (
            <div key={btnIndex} className="button-editor">
              <input
                placeholder="Button Text"
                value={button.text || ""}
                onChange={(e) => {
                  const updated = [...sections];
                  if (!updated[i].welcomeButtons) updated[i].welcomeButtons = [];
                  updated[i].welcomeButtons[btnIndex] = { ...button, text: e.target.value };
                  setSections(updated);
                }}
              />
              <input
                placeholder="Button Link"
                value={button.link || ""}
                onChange={(e) => {
                  const updated = [...sections];
                  if (!updated[i].welcomeButtons) updated[i].welcomeButtons = [];
                  updated[i].welcomeButtons[btnIndex] = { ...button, link: e.target.value };
                  setSections(updated);
                }}
              />
              <button onClick={() => {
                const updated = [...sections];
                updated[i].welcomeButtons.splice(btnIndex, 1);
                setSections(updated);
              }}>Remove</button>
            </div>
          ))}
          <button onClick={() => {
            const updated = [...sections];
            if (!updated[i].welcomeButtons) updated[i].welcomeButtons = [];
            updated[i].welcomeButtons.push({ text: "", link: "" });
            setSections(updated);
          }}>Add Button</button>
        </div>

        <button
          onClick={saveIndividualSection}
          disabled={saving}
          className="save-section-btn"
          style={{
            backgroundColor: "#28a745",
            color: "white",
            padding: "8px 16px",
            border: "none",
            borderRadius: "4px",
            marginTop: "10px",
            cursor: "pointer"
          }}
        >
          {saving ? "Saving..." : "💾 Save Welcome Section"}
        </button>
      </div>
    );
  }
  if (section._type === "menuSection") {
    return (
      <div key={`menu-${section._id || i}`}>
        <div className="form-group">
          <label>Menu Section Title</label>
          <input
            value={section.menuSectionTitle || ""}
            onChange={(e) => handleFieldChange(i, "menuSectionTitle", e.target.value)}
            placeholder="Our Menu"
          />
        </div>
  
        <div className="form-group">
          <label>Menu Categories</label>
          {(section.menuCategories || []).map((category, catIndex) => (
            <div key={catIndex} className="category-editor" style={{ border: "1px solid #ddd", padding: "15px", margin: "10px 0" }}>
              <h4>Category {catIndex + 1}</h4>
              
              <input
                placeholder="Category Title (e.g. Pizza, Wine)"
                value={category.title || ""}
                onChange={(e) => {
                  const updated = [...sections];
                  if (!updated[i].menuCategories) updated[i].menuCategories = [];
                  updated[i].menuCategories[catIndex] = { ...category, title: e.target.value };
                  setSections(updated);
                }}
                style={{ width: "100%", margin: "5px 0" }}
              />
  
              <div style={{ margin: "10px 0" }}>
                <label>Category Image:</label>
                {category.image?.asset && (
                  <div className="image-preview">
                    <img src={urlFor(category.image).width(200).url()} alt="Category" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, i, `menuCategories[${catIndex}].image`)}
                />
              </div>
  
              <button 
                onClick={() => {
                  const updated = [...sections];
                  updated[i].menuCategories.splice(catIndex, 1);
                  setSections(updated);
                }}
                style={{ backgroundColor: "#ff4444", color: "white", padding: "5px 10px", border: "none", borderRadius: "3px" }}
              >
                Remove Category
              </button>
            </div>
          ))}
          
          <button 
            onClick={() => {
              const updated = [...sections];
              if (!updated[i].menuCategories) updated[i].menuCategories = [];
              updated[i].menuCategories.push({ title: "", _key: Date.now().toString() });
              setSections(updated);
            }}
            style={{ backgroundColor: "#28a745", color: "white", padding: "8px 16px", border: "none", borderRadius: "4px" }}
          >
            Add Category
          </button>
        </div>
  
        <button
          onClick={saveIndividualSection}
          disabled={saving}
          className="save-section-btn"
          style={{
            backgroundColor: "#28a745",
            color: "white",
            padding: "8px 16px",
            border: "none",
            borderRadius: "4px",
            marginTop: "10px",
            cursor: "pointer"
          }}
        >
          {saving ? "Saving..." : "💾 Save Menu Section"}
        </button>
      </div>
    );
  }
  if (section._type === "ambianceSection") {
    return (
      <div key={`ambiance-${section._id || i}`}>
        <div className="form-group">
          <label>Section Title</label>
          <input
            value={section.title || ""}
            onChange={(e) => handleFieldChange(i, "title", e.target.value)}
            placeholder="Our Ambiance"
          />
        </div>
  
        <div className="form-group">
          <label>Slideshow Images</label>
          {(section.ambianceImages || []).map((image, imgIndex) => (
            <div key={imgIndex} className="image-item" style={{ border: "1px solid #ddd", padding: "10px", margin: "5px 0" }}>
              <div>Image {imgIndex + 1}</div>
              {image?.asset && (
                <div className="image-preview">
                  <img src={urlFor(image).width(200).url()} alt={`Ambiance ${imgIndex + 1}`} />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, i, `ambianceImages[${imgIndex}]`)}
              />
              <input
                placeholder="Alt Text"
                value={image?.alt || ""}
                onChange={(e) => {
                  const updated = [...sections];
                  if (!updated[i].ambianceImages) updated[i].ambianceImages = [];
                  updated[i].ambianceImages[imgIndex] = { ...image, alt: e.target.value };
                  setSections(updated);
                }}
                style={{ width: "100%", margin: "5px 0" }}
              />
              <button 
                onClick={() => {
                  const updated = [...sections];
                  updated[i].ambianceImages.splice(imgIndex, 1);
                  setSections(updated);
                }}
                style={{ backgroundColor: "#ff4444", color: "white", padding: "5px 10px", border: "none", borderRadius: "3px" }}
              >
                Remove Image
              </button>
            </div>
          ))}
          
          <button 
            onClick={() => {
              const updated = [...sections];
              if (!updated[i].ambianceImages) updated[i].ambianceImages = [];
              updated[i].ambianceImages.push({ alt: "" });
              setSections(updated);
            }}
            style={{ backgroundColor: "#28a745", color: "white", padding: "8px 16px", border: "none", borderRadius: "4px" }}
          >
            Add Image
          </button>
        </div>
  
        <div className="form-group">
          <label>Transition Style</label>
          <select
            value={section.transitionStyle || "fade"}
            onChange={(e) => handleFieldChange(i, "transitionStyle", e.target.value)}
          >
            <option value="fade">Fade</option>
            <option value="slide">Slide</option>
            <option value="zoom">Zoom</option>
          </select>
        </div>
  
        <div className="form-group">
          <label>Duration Between Slides (seconds)</label>
          <input
            type="number"
            min="1"
            max="10"
            value={section.duration || 3}
            onChange={(e) => handleFieldChange(i, "duration", parseInt(e.target.value))}
          />
        </div>
  
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={section.visible !== false}
              onChange={(e) => handleFieldChange(i, "visible", e.target.checked)}
            />
            Visible
          </label>
        </div>
  
        <button
          onClick={saveIndividualSection}
          disabled={saving}
          className="save-section-btn"
          style={{
            backgroundColor: "#28a745",
            color: "white",
            padding: "8px 16px",
            border: "none",
            borderRadius: "4px",
            marginTop: "10px",
            cursor: "pointer"
          }}
        >
          {saving ? "Saving..." : "💾 Save Ambiance Section"}
        </button>
      </div>
    );
  }

  if (section._type === "privateDining") {
    return (
      <div key={`privateDining-${section._id || i}`}>
        <div className="form-group">
          <label>Section Title</label>
          <input
            value={section.title || ""}
            onChange={(e) => handleFieldChange(i, "title", e.target.value)}
            placeholder="Private Dining"
            required
          />
        </div>
  
        <div className="form-group">
          <label>Paragraphs</label>
          {(section.paragraphs || []).map((paragraph, paraIndex) => (
            <div key={paraIndex} style={{ margin: "10px 0" }}>
              <textarea
                placeholder={`Paragraph ${paraIndex + 1}`}
                value={paragraph || ""}
                onChange={(e) => {
                  const updated = [...sections];
                  if (!updated[i].paragraphs) updated[i].paragraphs = [];
                  updated[i].paragraphs[paraIndex] = e.target.value;
                  setSections(updated);
                }}
                style={{ width: "100%", minHeight: "80px", margin: "5px 0" }}
              />
              <button 
                onClick={() => {
                  const updated = [...sections];
                  updated[i].paragraphs.splice(paraIndex, 1);
                  setSections(updated);
                }}
                style={{ backgroundColor: "#ff4444", color: "white", padding: "5px 10px", border: "none", borderRadius: "3px" }}
              >
                Remove Paragraph
              </button>
            </div>
          ))}
          
          <button 
            onClick={() => {
              const updated = [...sections];
              if (!updated[i].paragraphs) updated[i].paragraphs = [];
              updated[i].paragraphs.push("");
              setSections(updated);
            }}
            style={{ backgroundColor: "#28a745", color: "white", padding: "8px 16px", border: "none", borderRadius: "4px" }}
          >
            Add Paragraph
          </button>
        </div>
  
        <div className="form-group">
          <label>Button Text</label>
          <input
            value={section.buttonText || ""}
            onChange={(e) => handleFieldChange(i, "buttonText", e.target.value)}
            placeholder="Inquire Now"
          />
        </div>
  
        <div className="form-group">
          <label>Button Link</label>
          <input
            value={section.buttonLink || ""}
            onChange={(e) => handleFieldChange(i, "buttonLink", e.target.value)}
            placeholder="/private-dining"
          />
        </div>
  
        <div className="form-group">
          <label>Gallery Images</label>
          {(section.galleryImages || []).map((image, imgIndex) => (
            <div key={imgIndex} className="image-item" style={{ border: "1px solid #ddd", padding: "10px", margin: "5px 0" }}>
              <div>Gallery Image {imgIndex + 1}</div>
              {image?.asset && (
                <div className="image-preview">
                  <img src={urlFor(image).width(200).url()} alt={`Gallery ${imgIndex + 1}`} />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, i, `galleryImages[${imgIndex}]`)}
              />
              <button 
                onClick={() => {
                  const updated = [...sections];
                  updated[i].galleryImages.splice(imgIndex, 1);
                  setSections(updated);
                }}
                style={{ backgroundColor: "#ff4444", color: "white", padding: "5px 10px", border: "none", borderRadius: "3px" }}
              >
                Remove Image
              </button>
            </div>
          ))}
          
          <button 
            onClick={() => {
              const updated = [...sections];
              if (!updated[i].galleryImages) updated[i].galleryImages = [];
              updated[i].galleryImages.push({});
              setSections(updated);
            }}
            style={{ backgroundColor: "#28a745", color: "white", padding: "8px 16px", border: "none", borderRadius: "4px" }}
          >
            Add Gallery Image
          </button>
        </div>
  
        <button
          onClick={saveIndividualSection}
          disabled={saving}
          className="save-section-btn"
          style={{
            backgroundColor: "#28a745",
            color: "white",
            padding: "8px 16px",
            border: "none",
            borderRadius: "4px",
            marginTop: "10px",
            cursor: "pointer"
          }}
        >
          {saving ? "Saving..." : "💾 Save Private Dining Section"}
        </button>
      </div>
    );
  }
  if (section._type === "vibeSection") {
    return (
      <div key={`vibe-${section._id || i}`}>
        <div className="form-group">
          <label>Section Title (Optional)</label>
          <input
            value={section.sectionTitle || ""}
            onChange={(e) => handleFieldChange(i, "sectionTitle", e.target.value)}
            placeholder="Our Atmosphere"
          />
        </div>
  
        <div className="form-group">
          <label>Italian Vibe Images</label>
          {(section.italianVibeImages || []).map((image, imgIndex) => (
            <div key={imgIndex} className="image-item" style={{ border: "1px solid #ddd", padding: "10px", margin: "5px 0" }}>
              <div>Vibe Image {imgIndex + 1}</div>
              {image?.asset && (
                <div className="image-preview">
                  <img src={urlFor(image).width(200).url()} alt={`Vibe ${imgIndex + 1}`} />
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleImageUpload(e, i, `italianVibeImages[${imgIndex}]`)}
              />
              <button 
                onClick={() => {
                  const updated = [...sections];
                  updated[i].italianVibeImages.splice(imgIndex, 1);
                  setSections(updated);
                }}
                style={{ backgroundColor: "#ff4444", color: "white", padding: "5px 10px", border: "none", borderRadius: "3px" }}
              >
                Remove Image
              </button>
            </div>
          ))}
          
          <button 
            onClick={() => {
              const updated = [...sections];
              if (!updated[i].italianVibeImages) updated[i].italianVibeImages = [];
              updated[i].italianVibeImages.push({});
              setSections(updated);
            }}
            style={{ backgroundColor: "#28a745", color: "white", padding: "8px 16px", border: "none", borderRadius: "4px" }}
          >
            Add Vibe Image
          </button>
        </div>
  
        <button
          onClick={saveIndividualSection}
          disabled={saving}
          className="save-section-btn"
          style={{
            backgroundColor: "#28a745",
            color: "white",
            padding: "8px 16px",
            border: "none",
            borderRadius: "4px",
            marginTop: "10px",
            cursor: "pointer"
          }}
        >
          {saving ? "Saving..." : "💾 Save Vibe Section"}
        </button>
      </div>
    );
  }


  return commonFields;
};

const renderHomepageTab = () => (
  <div>
    <div className="cms-header">
      <h3>Homepage Sections Management</h3>
      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
        <button onClick={() => setPreviewMode(!previewMode)}>
          {previewMode ? "📝 Edit Mode" : "👁️ Preview Mode"}
        </button>
      </div>
    </div>

    {/* 🚑 SYNC CONTROL PANEL */}
    <div className="sync-control-panel" style={{ 
      backgroundColor: "#fff3cd", 
      padding: "20px", 
      borderRadius: "8px", 
      margin: "20px 0",
      border: "2px solid #ffeaa7"
    }}>
      <h4>🔄 Homepage Sync Controls</h4>
      <p>Use these tools to diagnose and fix sync issues between CMS Builder and Sanity Studio.</p>
      
      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button 
          onClick={verifySyncStatus}
          style={{ 
            backgroundColor: "#17a2b8", 
            color: "white", 
            padding: "10px 20px", 
            border: "none", 
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          🔍 Check Sync Status
        </button>
        
        <button 
          onClick={emergencySyncRepair}
          style={{ 
            backgroundColor: "#dc3545", 
            color: "white", 
            padding: "10px 20px", 
            border: "none", 
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          🚑 Emergency Sync Repair
        </button>
        
        <button 
          onClick={fetchCMSData}
          style={{ 
            backgroundColor: "#28a745", 
            color: "white", 
            padding: "10px 20px", 
            border: "none", 
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          🔄 Refresh Data
        </button>
      </div>
      
      <div style={{ marginTop: "10px", fontSize: "14px", color: "#856404" }}>
        <strong>Debug Info:</strong> Page ID: {pageId || "None"} | Sections: {sections.length} | Location: {selectedLocation?.title || "None"}
      </div>
    </div>

    {/* 🖼️ HOMEPAGE WALLPAPER SECTION */}
    <div className="setting-group" style={{ 
      backgroundColor: "#f8f9fa", 
      padding: "20px", 
      borderRadius: "8px", 
      margin: "20px 0",
      border: "2px solid #e9ecef"
    }}>
      <h4>🖼️ Homepage Background Wallpaper</h4>
      
      <div className="form-group">
        <label>Homepage Background Image</label>
        {homepageSettings?.wallpaperImage?.asset && (
          <div className="image-preview" style={{ margin: "10px 0" }}>
            <img 
              src={urlFor(homepageSettings.wallpaperImage).width(300).url()} 
              alt="Homepage Background" 
              style={{ maxHeight: "200px", borderRadius: "6px" }}
            />
          </div>
        )}
        <input
          type="file"
          accept="image/*"
          onChange={handleHomepageWallpaperUpload}
          style={{ 
            width: "100%", 
            padding: "8px", 
            margin: "8px 0", 
            borderRadius: "4px", 
            border: "1px solid #ccc" 
          }}
        />
        <small style={{ color: "#666" }}>
          This background image will appear behind all homepage sections
        </small>
      </div>

      <button
        onClick={() => saveToSanity("homepage", homepageSettings, "Homepage wallpaper saved!")}
        disabled={saving}
        style={{
          backgroundColor: "#28a745",
          color: "white",
          padding: "10px 20px",
          border: "none",
          borderRadius: "4px",
          fontSize: "14px",
          cursor: "pointer",
          marginTop: "10px"
        }}
      >
        {saving ? "Saving..." : "💾 Save Homepage Wallpaper"}
      </button>
    </div>

    {/* 🔧 SECTION MANAGEMENT */}
    <div className="add-section-dropdown" style={{ margin: "20px 0" }}>
      <select onChange={(e) => handleAddNewSection(e.target.value)} defaultValue="">
        <option value="" disabled>➕ Add New Section</option>
        {SECTION_OPTIONS.map((type) => (
          <option key={type} value={type}>
            {type.replace(/([A-Z])/g, " $1").trim()}
          </option>
        ))}
      </select>
    </div>

    {/* 📋 SECTIONS LIST */}
    <div className="cms-section-list">
      {sections.length === 0 && (
        <div style={{ 
          textAlign: "center", 
          padding: "40px", 
          backgroundColor: "#f8f9fa", 
          borderRadius: "8px",
          color: "#6c757d"
        }}>
          <h4>📋 No sections found</h4>
          <p>Add sections using the dropdown above or use the Emergency Sync Repair if you expect sections to be here.</p>
        </div>
      )}

      {sections.map((section, i) => (
        <div
          key={section._id || section._key || `section-${i}`}
          className={`cms-section-card editable ${section.hidden ? "section-hidden" : ""}`}
          draggable={!previewMode}
          onDragStart={(e) => handleDragStart(e, i)}
          onDragOver={allowDrop}
          onDrop={(e) => handleDrop(e, i)}
          style={{
            border: "2px solid #dee2e6",
            borderRadius: "8px",
            padding: "20px",
            margin: "15px 0",
            backgroundColor: section.hidden ? "#f8f9fa" : "white"
          }}
        >
          <div className="cms-section-header" style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            marginBottom: "15px"
          }}>
            <h3 style={{ margin: 0, color: section.hidden ? "#6c757d" : "#333" }}>
              {section._type?.replace(/([A-Z])/g, " $1").trim() || "Unknown Section"}
              {section._id && <small style={{ marginLeft: "10px", color: "#666" }}>ID: {section._id.slice(-8)}</small>}
            </h3>
            {!previewMode && (
              <button 
                className="remove-btn" 
                onClick={() => handleRemoveSection(i)}
                style={{
                  backgroundColor: "#dc3545",
                  color: "white",
                  padding: "6px 12px",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                ❌ Remove
              </button>
            )}
          </div>

          <div className="toggle-wrapper" style={{ marginBottom: "15px" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <input
                type="checkbox"
                checked={section.hidden !== true}
                onChange={(e) => handleFieldChange(i, "hidden", !e.target.checked)}
                disabled={previewMode}
              />
              <span>Show this section on homepage</span>
            </label>
          </div>

          {!previewMode && renderFields(section, i)}

          {previewMode && (
            <div className="section-preview" style={{
              padding: "15px",
              backgroundColor: "#f8f9fa",
              borderRadius: "6px"
            }}>
              <h4>{section.title || section.heroTitle || "No Title"}</h4>
              <p>{section.description || section.heroSubtitle || "No Description"}</p>
              {(section.image?.asset || section.heroImage?.asset) && (
                <img 
                  src={urlFor(section.image || section.heroImage).width(200).url()} 
                  alt="Preview" 
                  style={{ borderRadius: "4px", maxHeight: "100px" }}
                />
              )}
            </div>
          )}
        </div>
      ))}
    </div>

    {/* 💾 SAVE BUTTON */}
    <div style={{ textAlign: "center", margin: "30px 0" }}>
      <button
        className="save-btn"
        onClick={() => saveToSanity("homepage", { 
            _id: pageId, 
             sections: sections.map((section, index) => ({
              sectionRef: { _type: "reference", _ref: section._id || section._key },
              order: index,
               visible: !section.hidden 
            })) 
           }, "Homepage sections saved and synced!")}
          
        disabled={saving || sections.length === 0}
        style={{
          backgroundColor: sections.length === 0 ? "#6c757d" : "#007bff",
          color: "white",
          padding: "15px 30px",
          border: "none",
          borderRadius: "6px",
          fontSize: "16px",
          cursor: sections.length === 0 ? "not-allowed" : "pointer",
          opacity: sections.length === 0 ? 0.6 : 1
        }}
      >
        {saving ? "Saving..." : "💾 Save All Homepage Sections"}
      </button>
      
      {sections.length === 0 && (
        <p style={{ color: "#6c757d", marginTop: "10px" }}>
          Add sections above before saving
        </p>
      )}
    </div>

    {/* ℹ️ HELP SECTION */}
    <div style={{ 
      backgroundColor: "#d1ecf1", 
      padding: "15px", 
      borderRadius: "6px", 
      margin: "20px 0",
      border: "1px solid #bee5eb"
    }}>
      <h4>ℹ️ Troubleshooting Sync Issues</h4>
      <ol>
        <li><strong>Check Sync Status</strong> - Verifies if CMS Builder and Sanity Studio have the same sections</li>
        <li><strong>Emergency Sync Repair</strong> - Deletes duplicate homepages and rebuilds from scratch</li>
        <li><strong>Refresh Data</strong> - Reloads data from Sanity to check if changes were saved</li>
        <li><strong>If sections disappear</strong> - Use Emergency Sync Repair to rebuild the homepage</li>
        <li><strong>If sync still fails</strong> - Check the browser console for detailed error messages</li>
      </ol>
    </div>
  </div>
);

const renderContactTab = () => (
  <div>
    <h3>📞 Contact Information Management</h3>

    <div className="settings-grid">
      <div className="setting-group">
        <h4>Primary Contact Details</h4>

        <div className="form-group">
          <label>Phone Number</label>
          <input
            value={contactInfo.phoneNumber || ""}
            onChange={(e) => setContactInfo({ ...contactInfo, phoneNumber: e.target.value })}
            placeholder="(555) 123-4567"
          />
          <small>Main restaurant phone number for orders and inquiries</small>
        </div>

        <div className="form-group">
          <label>Email Address</label>
          <input
            type="email"
            value={contactInfo.email || ""}
            onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
            placeholder="info@restaurant.com"
          />
          <small>Primary email for customer inquiries</small>
        </div>

        <div className="form-group">
          <label>Restaurant Address</label>
          <textarea
            value={contactInfo.address || ""}
            onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
            placeholder="123 Main Street, City, State 12345"
            rows="3"
          />
          <small>Full address displayed on website and order confirmations</small>
        </div>

        <div className="form-group">
          <label>Google Maps Link</label>
          <input
            value={contactInfo.googleMapsLink || ""}
            onChange={(e) => setContactInfo({ ...contactInfo, googleMapsLink: e.target.value })}
            placeholder="https://maps.google.com/..."
          />
          <small>Link to your Google Maps location for directions</small>
        </div>
      </div>

      <div className="setting-group">
        <h4>Additional Contact Info</h4>

        <div className="form-group">
          <label>Hours Display Text</label>
          <textarea
            value={contactInfo.hoursDisplay || ""}
            onChange={(e) => setContactInfo({ ...contactInfo, hoursDisplay: e.target.value })}
            placeholder="Mon-Thu: 11am-9pm, Fri-Sat: 11am-10pm, Sun: 12pm-8pm"
            rows="2"
          />
          <small>Simplified hours text for quick display (detailed hours are in Business Settings)</small>
        </div>

        <div className="form-group">
          <label>Emergency/After Hours Contact</label>
          <input
            value={contactInfo.emergencyContact || ""}
            onChange={(e) => setContactInfo({ ...contactInfo, emergencyContact: e.target.value })}
            placeholder="(555) 987-6543"
          />
          <small>Contact for urgent matters or catering inquiries</small>
        </div>
      </div>
    </div>

    <button
      className="save-btn"
      onClick={() => saveToSanity("contactInfo", contactInfo, "Contact information saved!")}
      disabled={saving}
    >
      {saving ? "Saving..." : "💾 Save Contact Information"}
    </button>
  </div>
);

const renderSocialMediaLinksTab = () => (
  <div>
    <h3>📱 Social Media Links Management</h3>

    <div className="settings-grid">
      <div className="setting-group">
        <h4>Primary Social Platforms</h4>

        <div className="form-group">
          <label>📘 Facebook Page URL</label>
          <input
            value={socialMediaLinks.facebook || ""}
            onChange={(e) => setSocialMediaLinks({ ...socialMediaLinks, facebook: e.target.value })}
            placeholder="https://facebook.com/yourrestaurant"
          />
        </div>

        <div className="form-group">
          <label>📸 Instagram Profile URL</label>
          <input
            value={socialMediaLinks.instagram || ""}
            onChange={(e) => setSocialMediaLinks({ ...socialMediaLinks, instagram: e.target.value })}
            placeholder="https://instagram.com/yourrestaurant"
          />
        </div>

        <div className="form-group">
          <label>🐦 Twitter/X Profile URL</label>
          <input
            value={socialMediaLinks.twitter || ""}
            onChange={(e) => setSocialMediaLinks({ ...socialMediaLinks, twitter: e.target.value })}
            placeholder="https://twitter.com/yourrestaurant"
          />
        </div>

        <div className="form-group">
          <label>🎵 TikTok Profile URL</label>
          <input
            value={socialMediaLinks.tiktok || ""}
            onChange={(e) => setSocialMediaLinks({ ...socialMediaLinks, tiktok: e.target.value })}
            placeholder="https://tiktok.com/@yourrestaurant"
          />
        </div>
      </div>

      <div className="setting-group">
        <h4>Additional Platforms</h4>

        <div className="form-group">
          <label>📹 YouTube Channel URL</label>
          <input
            value={socialMediaLinks.youtube || ""}
            onChange={(e) => setSocialMediaLinks({ ...socialMediaLinks, youtube: e.target.value })}
            placeholder="https://youtube.com/c/yourrestaurant"
          />
        </div>

        <div className="form-group">
          <label>💼 LinkedIn Page URL</label>
          <input
            value={socialMediaLinks.linkedin || ""}
            onChange={(e) => setSocialMediaLinks({ ...socialMediaLinks, linkedin: e.target.value })}
            placeholder="https://linkedin.com/company/yourrestaurant"
          />
        </div>

        <div className="form-group">
          <label>🏢 Google Business Profile</label>
          <input
            value={socialMediaLinks.googleBusiness || ""}
            onChange={(e) => setSocialMediaLinks({ ...socialMediaLinks, googleBusiness: e.target.value })}
            placeholder="https://business.google.com/..."
          />
        </div>
      </div>
    </div>

    <div style={{ marginTop: "20px", padding: "15px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
      <h4>🔍 Preview Links</h4>
      {Object.entries(socialMediaLinks).map(([platform, url]) => (
        url && (
          <div key={platform} style={{ margin: "5px 0" }}>
            <strong>{platform}:</strong>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ marginLeft: "10px", color: "#007bff" }}
            >
              {url}
            </a>
          </div>
        )
      ))}
    </div>

    <button
      className="save-btn"
      onClick={() => saveToSanity("socialMediaLinks", socialMediaLinks, "Social media links saved!")}
      disabled={saving}
    >
      {saving ? "Saving..." : "💾 Save Social Media Links"}
    </button>
  </div>
);

const renderFooterContentTab = () => (
  <div>
    <h3>🦶 Footer Content Management</h3>

    <div className="settings-grid">
      <div className="setting-group">
        <h4>Legal & Informational Links</h4>

        <div className="form-group">
          <label>📄 Copyright Text</label>
          <input
            value={footerContent.copyrightText || ""}
            onChange={(e) => setFooterContent({ ...footerContent, copyrightText: e.target.value })}
            placeholder="© 2025 Your Restaurant. All rights reserved."
          />
        </div>

        <div className="form-group">
          <label>🔐 Privacy Policy URL</label>
          <input
            value={footerContent.privacyPolicyLink || ""}
            onChange={(e) => setFooterContent({ ...footerContent, privacyPolicyLink: e.target.value })}
            placeholder="https://yourrestaurant.com/privacy"
          />
        </div>

        <div className="form-group">
          <label>📜 Terms of Service URL</label>
          <input
            value={footerContent.termsOfServiceLink || ""}
            onChange={(e) => setFooterContent({ ...footerContent, termsOfServiceLink: e.target.value })}
            placeholder="https://yourrestaurant.com/terms"
          />
        </div>

        <div className="form-group">
          <label>ℹ️ About Us Page URL</label>
          <input
            value={footerContent.aboutUsLink || ""}
            onChange={(e) => setFooterContent({ ...footerContent, aboutUsLink: e.target.value })}
            placeholder="https://yourrestaurant.com/about"
          />
        </div>
      </div>

      <div className="setting-group">
        <h4>Miscellaneous</h4>

        <div className="form-group">
          <label>🔗 Additional Footer Links (optional)</label>
          <textarea
            rows="3"
            value={footerContent.additionalLinks?.join("\n") || ""}
            onChange={(e) =>
              setFooterContent({
                ...footerContent,
                additionalLinks: e.target.value.split("\n").filter(Boolean)
              })
            }
            placeholder={"https://link1.com\nhttps://link2.com"}
          />
          <small>One URL per line</small>
        </div>

        <div className="form-group">
          <label>💬 Footer Message</label>
          <textarea
            rows="2"
            value={footerContent.footerMessage || ""}
            onChange={(e) => setFooterContent({ ...footerContent, footerMessage: e.target.value })}
            placeholder="Thank you for supporting local!"
          />
        </div>
      </div>
    </div>

    <button
      className="save-btn"
      onClick={() => saveToSanity("footerContent", footerContent, "Footer content saved!")}
      disabled={saving}
    >
      {saving ? "Saving..." : "💾 Save Footer Content"}
    </button>
  </div>
);

const renderMenuTab = () => (
  <div>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
      <h3>🍝 Menu & Inventory Management</h3>
      <button 
        onClick={addNewCategory}
        style={{ 
          backgroundColor: "#28a745", 
          color: "white", 
          padding: "12px 24px", 
          border: "none", 
          borderRadius: "6px", 
          fontSize: "16px",
          cursor: "pointer"
        }}
      >
        ➕ Add New Category
      </button>
    </div>
  <div>
    <button 
      onClick={cleanBadMenuData}
      style={{ 
        backgroundColor: "#ffc107", 
        color: "black", 
        padding: "12px 24px", 
        border: "none", 
        borderRadius: "6px", 
        fontSize: "16px",
        cursor: "pointer",
        marginRight: "10px"
      }}
    >
      🧹 Clean Bad Data
    </button>
    
</div>

    <div className="form-group" style={{ marginBottom: "30px" }}>
      <label style={{ fontSize: "16px", fontWeight: "bold" }}>Menu Section Title</label>
      <input
        value={menuData?.menuSectionTitle || ""}
        onChange={(e) => setMenuData({ ...menuData, menuSectionTitle: e.target.value })}
        placeholder="Our Menu"
        style={{ 
          width: "100%", 
          padding: "12px", 
          fontSize: "16px", 
          borderRadius: "6px", 
          border: "2px solid #ddd",
          marginTop: "8px"
        }}
      />
    </div>
    
    <div className="form-group" style={{ marginBottom: "30px" }}>
  <label style={{ fontSize: "16px", fontWeight: "bold" }}>Menu Page Background Image</label>
  {menuData?.wallpaperImage?.asset && (
    <div className="image-preview" style={{ margin: "10px 0" }}>
      <img 
        src={urlFor(menuData.wallpaperImage).width(300).url()} 
        alt="Menu Page Background" 
        style={{ maxHeight: "200px", borderRadius: "6px" }}
      />
    </div>
  )}
  <input
    type="file"
    accept="image/*"
    onChange={handleMenuWallpaperUpload}
    style={{ 
      width: "100%", 
      padding: "12px", 
      marginTop: "8px",
      borderRadius: "6px", 
      border: "2px solid #ddd"
    }}
  />
  <small style={{ color: "#6c757d" }}>Background image for the entire menu page</small>
</div>

    {menuCategories.length === 0 && (
      <div style={{ 
        textAlign: "center", 
        padding: "40px", 
        backgroundColor: "#f8f9fa", 
        borderRadius: "8px",
        color: "#6c757d",
        fontSize: "18px"
      }}>
        🍽️ No menu categories yet. Click "Add New Category" to get started!
      </div>
    )}

    {menuCategories.map((category, catIndex) => (
      <div key={category._key} style={{ 
        border: "2px solid #e9ecef", 
        borderRadius: "12px", 
        marginBottom: "30px",
        overflow: "hidden"
      }}>
        {/* CATEGORY HEADER */}
        <div style={{ 
          backgroundColor: "#f8f9fa", 
          padding: "20px", 
          borderBottom: "1px solid #dee2e6",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ flex: 1 }}>
            <input
              value={category.title || ""}
              onChange={(e) => handleMenuCategoryChange(catIndex, "title", e.target.value)}
              placeholder="Category Name (e.g., Pizza, Wine, Appetizers)"
              style={{ 
                width: "100%", 
                padding: "12px", 
                fontSize: "18px", 
                fontWeight: "bold",
                border: "2px solid #ddd", 
                borderRadius: "6px",
                backgroundColor: "white"
              }}
            />
          </div>
          <button 
            onClick={() => {
              if (confirm(`Delete the entire "${category.title || 'Untitled'}" category and all its items?`)) {
                const updated = [...menuCategories];
                updated.splice(catIndex, 1);
                setMenuCategories(updated);
              }
            }}
            style={{ 
              backgroundColor: "#dc3545", 
              color: "white", 
              padding: "8px 16px", 
              border: "none", 
              borderRadius: "6px",
              marginLeft: "15px",
              cursor: "pointer"
            }}
          >
            🗑️ Delete Category
          </button>
        </div>

        {/* CATEGORY IMAGE */}
        <div style={{ padding: "20px", borderBottom: "1px solid #dee2e6" }}>
          <label style={{ fontSize: "14px", fontWeight: "bold", color: "#495057" }}>Category Image</label>
          {category.image?.asset && (
            <div style={{ margin: "10px 0" }}>
              <img src={urlFor(category.image).width(200).url()} alt="Category" style={{ borderRadius: "6px", maxHeight: "120px" }} />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleCategoryImageUpload(e, catIndex)}
            style={{ marginTop: "8px" }}
          />
        </div>

               {/* MENU ITEMS */}
               <div style={{ padding: "20px" }}>
          {category.items?.map((item, itemIndex) => (
            <div
              key={item._id || `item-${itemIndex}`}
              style={{
                border: "1px solid #dee2e6",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "20px",
                backgroundColor: "#fff"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h4 style={{ margin: 0 }}>{item.name || "Untitled Item"}</h4>
                <button
                  onClick={() => removeMenuItem(catIndex, itemIndex)}
                  style={{
                    backgroundColor: "#dc3545",
                    color: "white",
                    padding: "6px 12px",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  ❌ Remove
                </button>
              </div>

              <input
                value={item.name}
                onChange={(e) => handleMenuItemChange(catIndex, itemIndex, "name", e.target.value)}
                placeholder="Item Name"
                style={{ width: "100%", padding: "8px", marginTop: "10px", fontSize: "15px", borderRadius: "4px", border: "1px solid #ccc" }}
              />

              <textarea
                value={item.description}
                onChange={(e) => handleMenuItemChange(catIndex, itemIndex, "description", e.target.value)}
                placeholder="Item Description"
                style={{ width: "100%", padding: "8px", marginTop: "10px", fontSize: "15px", borderRadius: "4px", border: "1px solid #ccc" }}
              />

              <input
                type="number"
                value={item.price}
                onChange={(e) => handleMenuItemChange(catIndex, itemIndex, "price", parseFloat(e.target.value))}
                placeholder="Price"
                style={{ width: "100%", padding: "8px", marginTop: "10px", fontSize: "15px", borderRadius: "4px", border: "1px solid #ccc" }}
              />
              {/* WINE PRICING */}
{(category.title?.toLowerCase().includes('wine') || item.category === 'wines') && (
  <div style={{ backgroundColor: "#fff3cd", padding: "10px", borderRadius: "6px", marginTop: "10px" }}>
    <h6>🍷 Wine Pricing</h6>
    <input
      type="number"
      step="0.01"
      value={item.priceGlass || ""}
      onChange={(e) => handleMenuItemChange(catIndex, itemIndex, "priceGlass", parseFloat(e.target.value) || null)}
      placeholder="Glass Price"
      style={{ width: "48%", padding: "8px", marginRight: "4%", borderRadius: "4px", border: "1px solid #ccc" }}
    />
    <input
      type="number"
      step="0.01"
      value={item.priceBottle || ""}
      onChange={(e) => handleMenuItemChange(catIndex, itemIndex, "priceBottle", parseFloat(e.target.value) || null)}
      placeholder="Bottle Price"
      style={{ width: "48%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
    />
  </div>
)}



{/* SETTINGS */}
<div style={{ marginTop: "15px", padding: "10px", backgroundColor: "#f8f9fa", borderRadius: "6px" }}>
  <label style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
    <input
      type="checkbox"
      checked={item.available !== false}
      onChange={(e) => handleMenuItemChange(catIndex, itemIndex, "available", e.target.checked)}
    />
    Available for ordering
  </label>
  
  <select
    value={item.category || ""}
    onChange={(e) => handleMenuItemChange(catIndex, itemIndex, "category", e.target.value)}
    style={{ width: "100%", padding: "8px", borderRadius: "4px", border: "1px solid #ccc" }}
  >
    <option value="">Select category type</option>
    <option value="appetizers">Appetizers</option>
    <option value="mains">Main Courses</option>
    <option value="pasta">Pasta</option>
    <option value="pizza">Pizza</option>
    <option value="wines">Wines</option>
    <option value="desserts">Desserts</option>
    <option value="beverages">Beverages</option>
  </select>
</div>

              {/* ITEM IMAGE */}
              <div style={{ marginTop: "12px" }}>
                <label style={{ fontWeight: "bold" }}>Item Image</label>
                {item.image?.asset && (
                  <div style={{ margin: "10px 0" }}>
                    <img src={urlFor(item.image).width(150).url()} alt="Item" style={{ borderRadius: "6px", maxHeight: "100px" }} />
                  </div>
                )}
                <input type="file" accept="image/*" onChange={(e) => handleItemImageUpload(e, catIndex, itemIndex)} />
              </div>

              {/* SIZE OPTIONS */}
              <div style={{ marginTop: "20px" }}>
                <h5>🍕 Size Options</h5>
                {item.sizes?.map((size, sizeIndex) => (
                  <div key={sizeIndex} style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                    <input
                      value={size.name}
                      onChange={(e) => handleSizeChange(catIndex, itemIndex, sizeIndex, "name", e.target.value)}
                      placeholder="Size Name"
                      style={{ flex: 1, padding: "6px", borderRadius: "4px", border: "1px solid #ccc" }}
                    />
                    <input
                      type="number"
                      value={size.price}
                      onChange={(e) => handleSizeChange(catIndex, itemIndex, sizeIndex, "price", parseFloat(e.target.value))}
                      placeholder="Size Price"
                      style={{ flex: 1, padding: "6px", borderRadius: "4px", border: "1px solid #ccc" }}
                    />
                    <button
                      onClick={() => removeSizeOption(catIndex, itemIndex, sizeIndex)}
                      style={{ backgroundColor: "#ffc107", border: "none", borderRadius: "4px", padding: "4px 10px", cursor: "pointer" }}
                    >
                      🗑️
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addSizeOption(catIndex, itemIndex)}
                  style={{ marginTop: "10px", backgroundColor: "#17a2b8", color: "white", padding: "6px 14px", border: "none", borderRadius: "4px", cursor: "pointer" }}
                >
                  ➕ Add Size Option
                </button>
              </div>
            </div>
          ))}

          <button
            onClick={() => addNewMenuItem(catIndex)}
            style={{
              backgroundColor: "#007bff",
              color: "white",
              padding: "10px 20px",
              border: "none",
              borderRadius: "6px",
              marginTop: "20px",
              cursor: "pointer"
            }}
          >
            ➕ Add New Item
          </button>
        </div>
      </div>
    ))}

    {/* SAVE BUTTON */}
    <div style={{ marginTop: "40px", textAlign: "center" }}>
      <button
       onClick={() =>
        saveToSanity("menuSection", {
          _id: menuData?._id,
          menuCategories,
          menuSectionTitle: menuData?.menuSectionTitle,
          wallpaperImage: menuData?.wallpaperImage
        }, "Menu data saved!")
      }
        disabled={saving}
        style={{
          backgroundColor: "#28a745",
          color: "white",
          padding: "16px 40px",
          fontSize: "18px",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer"
        }}
      >
        {saving ? "Saving..." : "💾 Save Menu"}
      </button>
    </div>
  </div>
);
// PART 3B: Advanced Settings Tabs

// FIXED renderEmailTemplatesTab function - replace the existing one in your CMSBuilder.jsx

const renderEmailTemplatesTab = () => {
  // Filter out Sanity system fields and only show actual email templates
  const actualEmailTemplates = emailTemplates && typeof emailTemplates === 'object' 
    ? Object.entries(emailTemplates).filter(([key, value]) => {
        // Only include entries that don't start with underscore (system fields)
        // and have the structure of email templates (subject/body)
        return !key.startsWith('_') && 
               value && 
               typeof value === 'object' && 
               (value.hasOwnProperty('subject') || value.hasOwnProperty('body'));
      })
    : [];

  return (
    <div>
      <h3>📧 Email Template Manager</h3>

      <div className="template-info" style={{ 
        backgroundColor: "#f8f9fa", 
        padding: "15px", 
        borderRadius: "6px", 
        marginBottom: "20px" 
      }}>
        <h4>📝 Available Template Variables:</h4>
        <p><strong>General:</strong> {`{{restaurantName}}, {{customerName}}, {{date}}, {{time}}`}</p>
        <p><strong>Reservations:</strong> {`{{guests}}, {{reservationId}}, {{location}}`}</p>
        <p><strong>Orders:</strong> {`{{orderNumber}}, {{orderType}}, {{estimatedTime}}, {{total}}`}</p>
        <p><strong>Gift Cards:</strong> {`{{giftCode}}, {{amount}}, {{senderName}}, {{recipientName}}, {{message}}`}</p>
        <p><strong>Private Dining:</strong> {`{{requesterName}}, {{partySize}}, {{eventNature}}`}</p>
      </div>

      {/* Debug info */}
      <div style={{ 
        backgroundColor: "#e9ecef", 
        padding: "10px", 
        borderRadius: "4px", 
        marginBottom: "20px",
        fontSize: "12px"
      }}>
        <strong>Debug:</strong> Found {actualEmailTemplates.length} email templates
        {actualEmailTemplates.length === 0 && (
          <div style={{ color: "#dc3545", marginTop: "5px" }}>
            ⚠️ No email templates found. Raw emailTemplates: {JSON.stringify(emailTemplates, null, 2)}
          </div>
        )}
      </div>

      {actualEmailTemplates.length > 0 ? (
        actualEmailTemplates.map(([templateKey, template]) => (
          <div key={templateKey} className="email-template-editor" style={{
            border: "1px solid #ddd",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "20px",
            backgroundColor: "#fff"
          }}>
            <h4 style={{ 
              color: "#007bff",
              marginBottom: "15px",
              textTransform: "capitalize"
            }}>
              {templateKey.replace(/([A-Z])/g, " $1").trim()}
            </h4>

            <div className="form-group" style={{ marginBottom: "15px" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "5px", 
                fontWeight: "bold" 
              }}>
                Subject Line
              </label>
              <input
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px"
                }}
                value={template?.subject || ""}
                onChange={(e) => updateEmailTemplate(templateKey, "subject", e.target.value)}
                placeholder="Enter email subject..."
              />
            </div>

            <div className="form-group" style={{ marginBottom: "15px" }}>
              <label style={{ 
                display: "block", 
                marginBottom: "5px", 
                fontWeight: "bold" 
              }}>
                Email Body
              </label>
              <textarea
                style={{
                  width: "100%",
                  padding: "10px",
                  border: "1px solid #ccc",
                  borderRadius: "4px",
                  fontSize: "14px",
                  minHeight: "120px",
                  resize: "vertical"
                }}
                rows="5"
                value={template?.body || ""}
                onChange={(e) => updateEmailTemplate(templateKey, "body", e.target.value)}
                placeholder="Enter email content... Use {{variables}} for dynamic content."
              />
            </div>

            <div className="template-preview" style={{
              backgroundColor: "#f1f3f4",
              padding: "10px",
              borderRadius: "4px",
              marginTop: "10px"
            }}>
              <small style={{ color: "#666" }}>
                <strong>Preview:</strong> {template?.subject || "No subject"} | 
                {template?.body ? ` ${template.body.substring(0, 100)}...` : " No content"}
              </small>
            </div>
          </div>
        ))
      ) : (
        <div style={{ 
          backgroundColor: "#fff3cd", 
          padding: "20px", 
          borderRadius: "6px", 
          textAlign: "center"
        }}>
          <h4>🔄 Loading Email Templates...</h4>
          <p>If templates don't appear, check that your emailTemplates state is properly initialized.</p>
        </div>
      )}

      <button
        className="save-btn"
        onClick={() => saveToSanity("emailTemplates", emailTemplates, "Email templates saved!")}
        disabled={saving}
        style={{
          backgroundColor: "#28a745",
          color: "white",
          padding: "12px 24px",
          border: "none",
          borderRadius: "6px",
          fontSize: "16px",
          cursor: "pointer",
          marginTop: "20px"
        }}
      >
        {saving ? "Saving..." : "💾 Save Email Templates"}
      </button>

      <div style={{ 
        marginTop: "20px", 
        padding: "15px", 
        backgroundColor: "#fff3cd", 
        borderRadius: "6px" 
      }}>
        <h4>🧪 Testing Your Templates:</h4>
        <ol>
          <li>Edit a template above and click "Save Email Templates"</li>
          <li>Make a test reservation or order through your app</li>
          <li>Check your email - it should use the content from this CMS!</li>
          <li>Look for console logs showing "📧 Preparing CMS email..."</li>
        </ol>
      </div>
    </div>
  );
};
const renderSEOTab = () => (
  <div>
    <h3>🔍 SEO & Analytics Management</h3>

    <div className="settings-grid">
      <div className="setting-group">
        <h4>SEO Settings</h4>

        <div className="form-group">
          <label>Meta Title</label>
          <input
            value={seoSettings.metaTitle}
            onChange={(e) => updateSEOSetting("metaTitle", e.target.value)}
            maxLength="60"
          />
          <small>{seoSettings.metaTitle.length}/60 characters</small>
        </div>

        <div className="form-group">
          <label>Meta Description</label>
          <textarea
            value={seoSettings.metaDescription}
            onChange={(e) => updateSEOSetting("metaDescription", e.target.value)}
            maxLength="160"
          />
          <small>{seoSettings.metaDescription.length}/160 characters</small>
        </div>

        <div className="form-group">
          <label>Keywords (comma separated)</label>
          <input
            value={seoSettings.keywords.join(', ')}
            onChange={(e) => updateSEOSetting("keywords", e.target.value.split(',').map(k => k.trim()))}
          />
        </div>
      </div>

      <div className="setting-group">
        <h4>Analytics</h4>

        <div className="form-group">
          <label>Google Analytics ID</label>
          <input
            value={seoSettings.googleAnalyticsId}
            onChange={(e) => updateSEOSetting("googleAnalyticsId", e.target.value)}
            placeholder="G-XXXXXXXXXX"
          />
        </div>

        <div className="form-group">
          <label>Facebook Pixel ID</label>
          <input
            value={seoSettings.facebookPixelId}
            onChange={(e) => updateSEOSetting("facebookPixelId", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={seoSettings.structuredData}
              onChange={(e) => updateSEOSetting("structuredData", e.target.checked)}
            />
            Enable Structured Data (Schema.org)
          </label>
        </div>
      </div>
    </div>

    <button
      className="save-btn"
      onClick={() => saveToSanity("seoSettings", seoSettings, "SEO settings saved!")}
      disabled={saving}
    >
      {saving ? "Saving..." : "💾 Save SEO Settings"}
    </button>
  </div>
);

const renderBusinessSettingsTab = () => (
  <div>
    <h3>🏪 Business Operations</h3>

    <div className="settings-grid">
      <div className="setting-group">
        <h4>Business Hours</h4>
        {Object.entries(businessSettings.businessHours).map(([day, hours]) => (
          <div key={day} className="business-hours-row">
            <span className="day-label">{day.charAt(0).toUpperCase() + day.slice(1)}</span>
            <label>
              <input
                type="checkbox"
                checked={!hours.closed}
                onChange={(e) => updateBusinessHours(day, "closed", !e.target.checked)}
              />
              Open
            </label>
            {!hours.closed && (
              <>
                <input
                  type="time"
                  value={hours.open}
                  onChange={(e) => updateBusinessHours(day, "open", e.target.value)}
                />
                <span>to</span>
                <input
                  type="time"
                  value={hours.close}
                  onChange={(e) => updateBusinessHours(day, "close", e.target.value)}
                />
              </>
            )}
          </div>
        ))}
      </div>

      <div className="setting-group">
        <h4>Delivery Settings</h4>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={businessSettings.deliverySettings.enabled}
              onChange={(e) => updateDeliverySetting("enabled", e.target.checked)}
            />
            Enable Delivery
          </label>
        </div>

        <div className="form-group">
          <label>Delivery Radius (miles)</label>
          <input
            type="number"
            value={businessSettings.deliverySettings.radius}
            onChange={(e) => updateDeliverySetting("radius", parseFloat(e.target.value))}
          />
        </div>

        <div className="form-group">
          <label>Minimum Order ($)</label>
          <input
            type="number"
            step="0.01"
            value={businessSettings.deliverySettings.minimumOrder}
            onChange={(e) => updateDeliverySetting("minimumOrder", parseFloat(e.target.value))}
          />
        </div>

        <div className="form-group">
          <label>Delivery Fee ($)</label>
          <input
            type="number"
            step="0.01"
            value={businessSettings.deliverySettings.deliveryFee}
            onChange={(e) => updateDeliverySetting("deliveryFee", parseFloat(e.target.value))}
          />
        </div>

        <div className="form-group">
          <label>Free Delivery Threshold ($)</label>
          <input
            type="number"
            step="0.01"
            value={businessSettings.deliverySettings.freeDeliveryThreshold}
            onChange={(e) => updateDeliverySetting("freeDeliveryThreshold", parseFloat(e.target.value))}
          />
        </div>
      </div>
    </div>

    <button
      className="save-btn"
      onClick={() => saveToSanity("businessSettings", businessSettings, "Business settings saved!")}
      disabled={saving}
    >
      {saving ? "Saving..." : "💾 Save Business Settings"}
    </button>
  </div>
);
// PART 3C: Communication & Marketing Tabs

const renderCommunicationTab = () => (
  <div>
    <h3>💬 Customer Communication Center</h3>

    <div className="settings-grid">
      <div className="setting-group">
        <h4>Welcome Messages</h4>
        <div className="form-group">
          <label>New Customer Welcome</label>
          <textarea
            value={communicationSettings.welcomeMessages.newCustomer}
            onChange={(e) => updateCommunicationSetting("welcomeMessages", "newCustomer", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Returning Customer Welcome</label>
          <textarea
            value={communicationSettings.welcomeMessages.returningCustomer}
            onChange={(e) => updateCommunicationSetting("welcomeMessages", "returningCustomer", e.target.value)}
          />
        </div>
      </div>

      <div className="setting-group">
        <h4>Automated Notifications</h4>
        <div className="form-group">
          <label>Order Ready Message</label>
          <input
            value={communicationSettings.notifications.orderReady}
            onChange={(e) => updateCommunicationSetting("notifications", "orderReady", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Table Ready Message</label>
          <input
            value={communicationSettings.notifications.tableReady}
            onChange={(e) => updateCommunicationSetting("notifications", "tableReady", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Special Offers Message</label>
          <input
            value={communicationSettings.notifications.specialOffers}
            onChange={(e) => updateCommunicationSetting("notifications", "specialOffers", e.target.value)}
          />
        </div>
      </div>
    </div>

    <button
      className="save-btn"
      onClick={() => saveToSanity("communicationSettings", communicationSettings, "Communication settings saved!")}
      disabled={saving}
    >
      {saving ? "Saving..." : "💾 Save Communication Settings"}
    </button>
  </div>
);

const renderPromotionsTab = () => (
  <div>
    <h3>🎉 Promotions & Special Offers</h3>

    <div className="settings-grid">
      <div className="setting-group">
        <h4>Happy Hour Settings</h4>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={promotionsSettings.happyHour.enabled}
              onChange={(e) => updatePromotionSetting("happyHour", "enabled", e.target.checked)}
            />
            Enable Happy Hour
          </label>
        </div>

        <div className="form-group">
          <label>Discount Percentage</label>
          <input
            type="number"
            value={promotionsSettings.happyHour.discount}
            onChange={(e) => updatePromotionSetting("happyHour", "discount", parseInt(e.target.value))}
          />
        </div>

        <div className="form-group">
          <label>Start Time</label>
          <input
            type="time"
            value={promotionsSettings.happyHour.startTime}
            onChange={(e) => updatePromotionSetting("happyHour", "startTime", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>End Time</label>
          <input
            type="time"
            value={promotionsSettings.happyHour.endTime}
            onChange={(e) => updatePromotionSetting("happyHour", "endTime", e.target.value)}
          />
        </div>
      </div>

      <div className="setting-group">
        <h4>Loyalty Program</h4>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={promotionsSettings.loyaltyProgram.enabled}
              onChange={(e) => updatePromotionSetting("loyaltyProgram", "enabled", e.target.checked)}
            />
            Enable Loyalty Program
          </label>
        </div>

        <div className="form-group">
          <label>Points Per Dollar Spent</label>
          <input
            type="number"
            value={promotionsSettings.loyaltyProgram.pointsPerDollar}
            onChange={(e) => updatePromotionSetting("loyaltyProgram", "pointsPerDollar", parseInt(e.target.value))}
          />
        </div>

        <div className="form-group">
          <label>Reward Threshold (Points)</label>
          <input
            type="number"
            value={promotionsSettings.loyaltyProgram.rewardThreshold}
            onChange={(e) => updatePromotionSetting("loyaltyProgram", "rewardThreshold", parseInt(e.target.value))}
          />
        </div>
      </div>
    </div>

    <button
      className="save-btn"
      onClick={() => saveToSanity("promotionsSettings", promotionsSettings, "Promotions saved!")}
      disabled={saving}
    >
      {saving ? "Saving..." : "💾 Save Promotions"}
    </button>
  </div>
);

const renderSocialMediaTab = () => (
  <div>
    <h3>📱 Social Media Management</h3>

    <div className="settings-grid">
      <div className="setting-group">
        <h4>Auto-Posting Settings</h4>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={socialMediaSettings.autoPosting.enabled}
              onChange={(e) => updateSocialMediaSetting("autoPosting", "enabled", e.target.checked)}
            />
            Enable Auto-Posting
          </label>
        </div>

        <div className="form-group">
          <label>Default Hashtags</label>
          <input
            value={socialMediaSettings.hashtags.join(' ')}
            onChange={(e) => updateHashtags(e.target.value)}
            placeholder="#restaurant #italianfood #delicious"
          />
        </div>
      </div>

      <div className="setting-group">
        <h4>Review Response Templates</h4>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={socialMediaSettings.reviewResponses.autoReply}
              onChange={(e) => updateSocialMediaSetting("reviewResponses", "autoReply", e.target.checked)}
            />
            Auto-Reply to Reviews
          </label>
        </div>

        <div className="form-group">
          <label>Positive Review Response</label>
          <textarea
            value={socialMediaSettings.reviewResponses.templates.positive}
            onChange={(e) => updateReviewTemplate("positive", e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Negative Review Response</label>
          <textarea
            value={socialMediaSettings.reviewResponses.templates.negative}
            onChange={(e) => updateReviewTemplate("negative", e.target.value)}
          />
        </div>
      </div>
    </div>

    <button
      className="save-btn"
      onClick={() => saveToSanity("socialMediaSettings", socialMediaSettings, "Social media settings saved!")}
      disabled={saving}
    >
      {saving ? "Saving..." : "💾 Save Social Media Settings"}
    </button>
  </div>
);
// PART 3D COMPLETE: Additional Tab Renders

const renderReservationTab = () => (
  <div>
    <h3>🍽️ Reservation & Table Management</h3>

    <div className="settings-grid">
      <div className="setting-group">
        <h4>Basic Settings</h4>

        <div className="form-group">
          <label>Page Heading</label>
          <input
            value={reservationSettings.heading || ""}
            onChange={(e) =>
              setReservationSettings({ ...reservationSettings, heading: e.target.value })
            }
          />
        </div>

        <div className="form-group">
          <label>Subtext</label>
          <textarea
            value={reservationSettings.subtext || ""}
            onChange={(e) =>
              setReservationSettings({ ...reservationSettings, subtext: e.target.value })
            }
          />
        </div>

        <div className="form-group">
          <label>Max Bookings Per Time Slot</label>
          <input
            type="number"
            value={reservationSettings.maxBookingsPerSlot}
            onChange={(e) =>
              setReservationSettings({ ...reservationSettings, maxBookingsPerSlot: parseInt(e.target.value) })
            }
          />
        </div>

        <div className="form-group">
          <label>Advance Booking (Days)</label>
          <input
            type="number"
            value={reservationSettings.advanceBookingDays}
            onChange={(e) =>
              setReservationSettings({ ...reservationSettings, advanceBookingDays: parseInt(e.target.value) })
            }
          />
        </div>
      </div>

      <div className="setting-group">
        <h4>Available Time Slots</h4>
        <div className="time-slots-manager">
          {reservationSettings.timeSlots.map((slot, index) => (
            <div key={index} className="time-slot-item">
              <span>{slot}</span>
              <button onClick={() => removeTimeSlot(slot)}>❌</button>
            </div>
          ))}
          <button onClick={addTimeSlot} className="add-btn">➕ Add Time Slot</button>
        </div>
      </div>
    </div>
    <div className="setting-group">
  <h4>Page Appearance</h4>

  <div className="form-group">
    <label>Background Wallpaper Image</label>
    {reservationSettings?.wallpaperImage?.asset && (
      <div className="image-preview">
        <img 
          src={urlFor(reservationSettings.wallpaperImage).width(300).url()} 
          alt="Reservation Background" 
          style={{ maxHeight: "200px", borderRadius: "6px" }}
        />
      </div>
    )}
    <input
      type="file"
      accept="image/*"
      onChange={handleReservationWallpaperUpload}
    />
    <small>Background image for the Table Booking/Reservation page</small>
  </div>
</div>

    <button
      className="save-btn"
      onClick={() => saveToSanity("tableBookingPage", reservationSettings, "Reservation settings saved!")}
      disabled={saving}
    >
      {saving ? "Saving..." : "💾 Save Reservation Settings"}
    </button>
  </div>
);

const renderPrivateDiningTab = () => (
  <div>
    <h3>🥂 Private Dining Management</h3>

    <div className="form-group">
      <label>Page Heading</label>
      <input
        value={privateDiningData.heading || ""}
        onChange={(e) => setPrivateDiningData({ ...privateDiningData, heading: e.target.value })}
      />
    </div>

    <div className="setting-group">
  <h4>Page Appearance</h4>
  
  <div className="form-group">
    <label>Background Wallpaper Image</label>
    {privateDiningData?.wallpaperImage?.asset && (
      <div className="image-preview">
        <img 
          src={urlFor(privateDiningData.wallpaperImage).width(300).url()} 
          alt="Private Dining Background" 
          style={{ maxHeight: "200px", borderRadius: "6px" }}
        />
      </div>
    )}
    <input
      type="file"
      accept="image/*"
      onChange={handlePrivateDiningWallpaperUpload}
    />
    <small>Background image for the Private Dining page</small>
  </div>
</div>

    <div className="form-group">
      <label>Subtext</label>
      <textarea
        value={privateDiningData.subtext || ""}
        onChange={(e) => setPrivateDiningData({ ...privateDiningData, subtext: e.target.value })}
      />
    </div>

    <div className="form-group">
      <label>Package Description</label>
      <textarea
        value={privateDiningData.packageDescription || ""}
        onChange={(e) => setPrivateDiningData({ ...privateDiningData, packageDescription: e.target.value })}
        placeholder="Describe your private dining packages and options..."
      />
    </div>

    <div className="form-group">
      <label>Minimum Party Size</label>
      <input
        type="number"
        value={privateDiningData.minimumPartySize || 8}
        onChange={(e) => setPrivateDiningData({ ...privateDiningData, minimumPartySize: parseInt(e.target.value) })}
      />
    </div>

    <div className="form-group">
      <label>Maximum Party Size</label>
      <input
        type="number"
        value={privateDiningData.maximumPartySize || 50}
        onChange={(e) => setPrivateDiningData({ ...privateDiningData, maximumPartySize: parseInt(e.target.value) })}
      />
    </div>

    <div className="form-group">
      <label>Advance Notice Required (Days)</label>
      <input
        type="number"
        value={privateDiningData.advanceNotice || 7}
        onChange={(e) => setPrivateDiningData({ ...privateDiningData, advanceNotice: parseInt(e.target.value) })}
      />
    </div>

    <button
      className="save-btn"
      onClick={() => saveToSanity("privateDiningPage", privateDiningData, "Private dining settings saved!")}
      disabled={saving}
    >
      {saving ? "Saving..." : "💾 Save Private Dining Settings"}
    </button>
  </div>
);

const renderGiftCardTab = () => (
  <div>
    <h3>🎁 Gift Card Management</h3>

    <div className="settings-grid">
      <div className="setting-group">
        <h4>Preset Amounts</h4>
        <div className="gift-card-presets">
          {giftCardSettings.presetAmounts.map((amount, index) => (
            <div key={index} className="preset-item">
              <span>${amount}</span>
              <button onClick={() => removeGiftCardPreset(amount)}>❌</button>
            </div>
          ))}
          <button onClick={addGiftCardPreset} className="add-btn">➕ Add Amount</button>
        </div>
      </div>

      <div className="setting-group">
        <h4>Gift Card Rules</h4>
        <div className="form-group">
          <label>Minimum Amount ($)</label>
          <input
            type="number"
            value={giftCardSettings.minAmount}
            onChange={(e) => setGiftCardSettings({ ...giftCardSettings, minAmount: parseFloat(e.target.value) })}
          />
        </div>

        <div className="form-group">
          <label>Maximum Amount ($)</label>
          <input
            type="number"
            value={giftCardSettings.maxAmount}
            onChange={(e) => setGiftCardSettings({ ...giftCardSettings, maxAmount: parseFloat(e.target.value) })}
          />
        </div>

        <div className="form-group">
          <label>Expiry Period (Months)</label>
          <input
            type="number"
            value={giftCardSettings.expiryMonths}
            onChange={(e) => setGiftCardSettings({ ...giftCardSettings, expiryMonths: parseInt(e.target.value) })}
          />
        </div>

        <div className="form-group">
          <label>Design Template</label>
          <select
            value={giftCardSettings.designTemplate}
            onChange={(e) => setGiftCardSettings({ ...giftCardSettings, designTemplate: e.target.value })}
          >
            <option value="classic">Classic</option>
            <option value="modern">Modern</option>
            <option value="elegant">Elegant</option>
            <option value="festive">Festive</option>
          </select>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={giftCardSettings.allowCustomAmounts || false}
              onChange={(e) =>
                setGiftCardSettings({ ...giftCardSettings, allowCustomAmounts: e.target.checked })
              }
            />
            Allow Custom Amounts
          </label>
        </div>
      </div>

      <div className="setting-group">
        <h4>Gift Card Messages</h4>
        <div className="form-group">
          <label>Default Gift Message</label>
          <textarea
            value={giftCardSettings.defaultMessage || ""}
            onChange={(e) => setGiftCardSettings({ ...giftCardSettings, defaultMessage: e.target.value })}
            placeholder="Enjoy a wonderful dining experience at our restaurant!"
          />
        </div>

        <div className="form-group">
          <label>Terms & Conditions</label>
          <textarea
            value={giftCardSettings.termsAndConditions || ""}
            onChange={(e) => setGiftCardSettings({ ...giftCardSettings, termsAndConditions: e.target.value })}
            placeholder="Gift cards expire 12 months from purchase date. Non-refundable..."
          />
        </div>
      </div>
    </div>

    <button
      className="save-btn"
      onClick={() => saveToSanity("giftCardSettings", giftCardSettings, "Gift card settings saved!")}
      disabled={saving}
    >
      {saving ? "Saving..." : "💾 Save Gift Card Settings"}
    </button>
  </div>
);

const renderOrderOnlineTab = () => (
  <div>
    <h3>🛒 Order Online Configuration</h3>

    <div className="settings-grid">
      <div className="setting-group">
        <h4>Page Content</h4>

        <div className="form-group">
          <label>Page Title</label>
          <input
            value={orderOnlineSettings?.title || ""}
            onChange={(e) => setOrderOnlineSettings({ ...orderOnlineSettings, title: e.target.value })}
            placeholder="Order Online"
          />
        </div>

        <div className="form-group">
          <label>Subtitle</label>
          <textarea
            value={orderOnlineSettings?.subtitle || ""}
            onChange={(e) => setOrderOnlineSettings({ ...orderOnlineSettings, subtitle: e.target.value })}
            placeholder="Enjoy the best Italian food from the comfort of your home."
          />
        </div>

        <div className="form-group">
          <label>Special Instructions Text</label>
          <input
            value={orderOnlineSettings?.specialInstructionsText || ""}
            onChange={(e) =>
              setOrderOnlineSettings({ ...orderOnlineSettings, specialInstructionsText: e.target.value })
            }
            placeholder="Special Instructions (Optional)"
          />
        </div>
      </div>

      <div className="setting-group">
  <h4>Page Appearance</h4>

  <div className="form-group">
    <label>Background Wallpaper Image</label>
    {orderOnlineSettings?.wallpaperImage?.asset && (
      <div className="image-preview">
        <img 
          src={urlFor(orderOnlineSettings.wallpaperImage).width(300).url()} 
          alt="Order Online Background" 
          style={{ maxHeight: "200px", borderRadius: "6px" }}
        />
      </div>
    )}
    <input
      type="file"
      accept="image/*"
      onChange={handleOrderOnlineWallpaperUpload}
    />
    <small>This background image will appear behind the entire Order Online page</small>
  </div>
</div>

      <div className="setting-group">
        <h4>Order Settings</h4>

        <div className="form-group">
          <label>Minimum Order Amount ($)</label>
          <input
            type="number"
            step="0.01"
            value={orderOnlineSettings?.minimumOrderAmount || 15}
            onChange={(e) =>
              setOrderOnlineSettings({ ...orderOnlineSettings, minimumOrderAmount: parseFloat(e.target.value) })
            }
          />
        </div>

        <div className="form-group">
          <label>Estimated Pickup Time (Minutes)</label>
          <input
            type="number"
            value={orderOnlineSettings?.estimatedPickupTime || 20}
            onChange={(e) =>
              setOrderOnlineSettings({ ...orderOnlineSettings, estimatedPickupTime: parseInt(e.target.value) })
            }
          />
        </div>

        <div className="form-group">
          <label>Estimated Delivery Time (Minutes)</label>
          <input
            type="number"
            value={orderOnlineSettings?.estimatedDeliveryTime || 35}
            onChange={(e) =>
              setOrderOnlineSettings({ ...orderOnlineSettings, estimatedDeliveryTime: parseInt(e.target.value) })
            }
          />
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={orderOnlineSettings?.allowSpecialInstructions !== false}
              onChange={(e) =>
                setOrderOnlineSettings({ ...orderOnlineSettings, allowSpecialInstructions: e.target.checked })
              }
            />
            Allow Special Instructions
          </label>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={orderOnlineSettings?.showNutritionInfo || false}
              onChange={(e) =>
                setOrderOnlineSettings({ ...orderOnlineSettings, showNutritionInfo: e.target.checked })
              }
            />
            Show Nutrition Information
          </label>
        </div>
      </div>

      <div className="setting-group">
        <h4>Order Confirmation</h4>

        <div className="form-group">
          <label>Success Message</label>
          <textarea
            value={orderOnlineSettings?.successMessage || ""}
            onChange={(e) => setOrderOnlineSettings({ ...orderOnlineSettings, successMessage: e.target.value })}
            placeholder="Your order has been confirmed! You'll receive a confirmation email shortly."
          />
        </div>

        <div className="form-group">
          <label>Pickup Instructions</label>
          <textarea
            value={orderOnlineSettings?.pickupInstructions || ""}
            onChange={(e) => setOrderOnlineSettings({ ...orderOnlineSettings, pickupInstructions: e.target.value })}
            placeholder="Please come to the front counter when you arrive for pickup."
          />
        </div>
      </div>
    </div>

    <button
      className="save-btn"
      onClick={() => saveToSanity("orderOnline", orderOnlineSettings, "Order online settings saved!")}
      disabled={saving}
    >
      {saving ? "Saving..." : "💾 Save Order Online Settings"}
    </button>
  </div>
);
// MAIN TAB CONTENT ROUTER
const renderTabContent = () => {
  switch (activeTab) {
    case "Homepage Sections":
      return renderHomepageTab();
    case "Menu Management":
      return renderMenuTab();
    case "Reservation Settings":
      return renderReservationTab();
    case "Private Dining":
      return renderPrivateDiningTab();
    case "Gift Card Settings":
      return renderGiftCardTab();
    case "Order Online Settings":
      return renderOrderOnlineTab();
    case "Email Templates":
      return renderEmailTemplatesTab();
    case "SEO & Analytics":
      return renderSEOTab();
    case "Business Settings":
      return renderBusinessSettingsTab();
    case "Customer Communications":
      return renderCommunicationTab();
    case "Promotions & Offers":
      return renderPromotionsTab();
    case "Social Media":
      return renderSocialMediaTab();
        case "Contact Information":
          return renderContactTab();
        case "Social Media Links":
          return renderSocialMediaLinksTab();
        case "Footer Content":
          return renderFooterContentTab();
    default:
      return <div className="cms-placeholder">Select a section to edit</div>;
  }
};

// MAIN COMPONENT RETURN
return (
  <div className="cms-builder-container">
    <div className="cms-header-bar">
      <h2>🧠 Ultimate CMS Builder</h2>
      {selectedLocation && (
        <div className="location-indicator">
          📍 Editing: <strong>{selectedLocation.title}</strong>
        </div>
      )}
    </div>

    <div className="cms-tabs">
      {CMS_SECTIONS.map((tab) => (
        <button
          key={tab}
          className={activeTab === tab ? "active" : ""}
          onClick={() => setActiveTab(tab)}
        >
          {tab}
        </button>
      ))}
    </div>

    <div className="cms-tab-content">
      {renderTabContent()}
    </div>

    <div className="cms-footer">
      <p>💡 <strong>Pro Tip:</strong> Changes are saved to your selected location. Switch locations using the franchise selector to manage different restaurant settings.</p>
      <div className="cms-stats">
        <span>🔧 Total Sections: {CMS_SECTIONS.length}</span>
        <span>📍 Location: {selectedLocation?.title || "No location selected"}</span>
        <span>💾 Auto-save: {saving ? "Saving..." : "Ready"}</span>
      </div>
    </div>
  </div>
);
}


export default CMSBuilder;