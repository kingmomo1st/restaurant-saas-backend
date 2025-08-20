import React, { useEffect, useRef, useState } from "react";
import "./css/OrderOnline.css";
import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { addToCart as addToCartAction, setOrderType } from "../redux/cartSlice";
import { setCategory } from "../redux/categoryFilterSlice";
import sanityClient from "../sanity/sanityClient.ts";
import imageUrlBuilder from "@sanity/image-url";
import ReviewSection from "./ReviewSection";
import { toast } from "react-toastify";

const builder = imageUrlBuilder(sanityClient);
const urlFor = (source) => builder.image(source).url();

const PizzaOptions = ({ item }) => {
  const dispatch = useDispatch();
  const orderType = useSelector((state) => state.cart.orderType);
  const [selectedSize, setSelectedSize] = useState(item.sizes?.[0]?.name || "");
  const [selectedModifiers, setSelectedModifiers] = useState([]);

  const handleModifierChange = (modName) => {
    setSelectedModifiers((prev) =>
      prev.includes(modName)
        ? prev.filter((m) => m !== modName)
        : [...prev, modName]
    );
  };

  const handleAddToCart = () => {
    if (!orderType) {
      toast.error("Please select pickup or delivery first");
      return;
    }


const sizeData = item.sizes?.find((s) => s.name === selectedSize);
if (!sizeData) return;

const modifiersPrice = selectedModifiers.reduce((sum, name) => {
  const mod = item.modifiers?.find((m) => m.name === name);
  return sum + (mod?.price || 0);
}, 0);

dispatch(
  addToCartAction({
    id: `${item._id}_${sizeData.name}_${selectedModifiers.join("-")}`,
    name: `${item.name} (${sizeData.name})`,
    price: sizeData.price + modifiersPrice,
    quantity: 1,
    size: sizeData.name,
    modifiers: selectedModifiers,
    imageURL: item.image ? urlFor(item.image) : null,
  })
);

toast.success(`${item.name} added to cart`);


};

return (
<div className="pizza-options">
<select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)}>
{item.sizes?.map((size, idx) => (
<option key={idx} value={size.name}>
{size.name} - ${size.price}
</option>
))}
</select>


  {item.modifiers?.length > 0 && (
    <div className="modifiers">
      {item.modifiers.map((mod, i) => (
        <label key={i}>
          <input
            type="checkbox"
            value={mod.name}
            onChange={() => handleModifierChange(mod.name)}
            checked={selectedModifiers.includes(mod.name)}
          />
          {mod.name} (+${mod.price})
        </label>
      ))}
    </div>
  )}

  <button onClick={handleAddToCart}>Add to Cart</button>
</div>


);
};

const OrderOnline = () => {
const location = useLocation();
const queryParams = new URLSearchParams(location.search);
const initialCategory = queryParams.get("category");

const selectedLocation = useSelector((state) => state.location.selectedLocation);
const selectedCategory = useSelector((state) => state.categoryFilter.selectedCategory);
const orderType = useSelector((state) => state.cart.orderType);
const cart = useSelector((state) => state.cart.items);
const dispatch = useDispatch();

const [menuSection, setMenuSection] = useState(null);
const [orderOnlineSettings, setOrderOnlineSettings] = useState(null); // 🔥 NEW: CMS Settings
const [loading, setLoading] = useState(true);
const [wallpaper, setWallpaper] = useState(null);

useEffect(() => {
const fetchData = async () => {
if (!selectedLocation?._id) return;


  try {
    // 🔥 FETCH BOTH MENU AND CMS SETTINGS
    const [menuRes, settingsRes] = await Promise.all([
      // Menu data
      sanityClient.fetch(
        `*[_type == "menuSection" && location._ref == "${selectedLocation._id}"][0]{
          menuSectionTitle,
          menuCategories[]{
            _key,
            title,
            image,
            wallpaperImage,
            items[]{
              _id,
              name,
              description,
              category,
              image,
              sizes,
              modifiers,
              priceGlass,
              priceBottle,
              price,
              available,
              nutrition
            }
          }
        }`
      ),
      // 🔥 CMS Settings for Order Online (includes wallpaperImage)
      sanityClient.fetch(
        `*[_type == "orderOnline" && location._ref == "${selectedLocation._id}"][0]{
          title,
          subtitle,
          specialInstructionsText,
          minimumOrderAmount,
          estimatedPickupTime,
          estimatedDeliveryTime,
          allowSpecialInstructions,
          showNutritionInfo,
          successMessage,
          pickupInstructions,
          wallpaperImage
        }`
      )
    ]);
    
    setMenuSection(menuRes);
    setOrderOnlineSettings(settingsRes);
    
    // 🔥 Set wallpaper from settingsRes (not separate wallpaperRes)
    if (settingsRes?.wallpaperImage) {
      setWallpaper(urlFor(settingsRes.wallpaperImage));
      console.log("✅ Order Online wallpaper set:", urlFor(settingsRes.wallpaperImage));
    } else {
      console.log("⚠️ No wallpaper found in orderOnline document");
      setWallpaper(null);
    }
    
    console.log("📊 Order Online Settings from CMS:", settingsRes);
    
  } catch (err) {
    console.error("Data fetch error:", err);
  } finally {
    setLoading(false);
  }
};

if (selectedLocation?._id) {
  fetchData();
}


}, [selectedLocation]);

useEffect(() => {
if (initialCategory) {
const decodedCategory = decodeURIComponent(initialCategory).toLowerCase();
dispatch(setCategory(decodedCategory));
} else {
dispatch(setCategory(null));
}
}, [initialCategory, dispatch]);

// NEW useEffect for full-page wallpaper
useEffect(() => {
  if (wallpaper) {
    // Apply to body for true full-page coverage
    document.body.style.backgroundImage = `url(${wallpaper})`;
    document.body.style.backgroundSize = 'cover';
    document.body.style.backgroundPosition = 'center';
    document.body.style.backgroundRepeat = 'no-repeat';
    document.body.style.backgroundAttachment = 'fixed';
  }
  
  return () => {
    // Clean up when leaving page
    document.body.style.backgroundImage = '';
    document.body.style.backgroundSize = '';
    document.body.style.backgroundPosition = '';
    document.body.style.backgroundRepeat = '';
    document.body.style.backgroundAttachment = '';
  };
}, [wallpaper]);

const allItems =
menuSection?.menuCategories?.flatMap((category) =>
category.items?.map((item) => ({...item,
categoryTitle: category.title.toLowerCase(),
})) || []
) || [];

const filteredItems = selectedCategory
? allItems.filter(
(item) =>
item.categoryTitle === selectedCategory.toLowerCase() ||
item.category?.toLowerCase() === selectedCategory.toLowerCase()
)
: allItems;

const availableCategories =
menuSection?.menuCategories?.map((cat) => ({
key: cat.title.toLowerCase(),
title: cat.title,
items: cat.items || [],
})) || [];

const handleOrderTypeChange = (type) => {
dispatch(setOrderType(type));
toast.success(`Order type set to ${type}`);
};

const handleAddToCart = (item, options = {}) => {
if (!orderType) {
toast.error("Please select pickup or delivery first");
return;
}


// 🔥 CHECK MINIMUM ORDER AMOUNT FROM CMS
const currentCartTotal = cart.reduce((acc, cartItem) => acc + cartItem.price * cartItem.quantity, 0);
const itemPrice = options.price || item.price;
const newTotal = currentCartTotal + itemPrice;

const minimumOrder = orderOnlineSettings?.minimumOrderAmount || 15;

// Only warn if this would be the first item and it's below minimum
if (cart.length === 0 && itemPrice < minimumOrder) {
  toast.warning(`Minimum order is $${minimumOrder}. Add more items to reach minimum.`);
}

dispatch(
  addToCartAction({
    id: options.id || item._id,
    name: options.name || item.name,
    price: options.price || item.price,
    quantity: 1,
    size: options.size || "standard",
    imageURL: item.image ? urlFor(item.image) : null,
  })
);

toast.success(`${options.name || item.name} added to cart`);


};

if (loading) {
return (
<div className="loading">
{[...Array(6)].map((_, i) => (
<div key={i} className="skeleton-item"></div>
))}
</div>
);
}

if (!menuSection) {
return (
<div className="order-online-container">
<div className="order-online-header">
<h1>{orderOnlineSettings?.title || "Order Online"}</h1>
<p>No menu found for this location. Please check back later.</p>
</div>
</div>
);
}

return (
<div
className="order-online-container">
<div className="order-online-header">
{/* 🔥 USE CMS TITLE AND SUBTITLE */}
<h1>{orderOnlineSettings?.title || "Order Online"}</h1>
<p>{orderOnlineSettings?.subtitle || "Enjoy the best Italian food from the comfort of your home."}</p>


    {/* 🔥 SHOW MINIMUM ORDER FROM CMS */}
    {orderOnlineSettings?.minimumOrderAmount && (
      <div className="minimum-order-notice">
        <p>💰 Minimum order: <strong>${orderOnlineSettings.minimumOrderAmount}</strong></p>
      </div>
    )}

    <div className="order-method-toggle">
      <h3>How would you like to receive your order?</h3>
      <div className="order-type-buttons">
        <label>
          <input
            type="radio"
            name="orderMethod"
            value="pickup"
            checked={orderType === "pickup"}
            onChange={(e) => handleOrderTypeChange(e.target.value)}
          />
          🏪 Pickup
          {/* 🔥 SHOW ESTIMATED TIME FROM CMS */}
          {orderOnlineSettings?.estimatedPickupTime && (
            <span className="estimated-time">
              ({orderOnlineSettings.estimatedPickupTime} min)
            </span>
          )}
        </label>
        <label>
          <input
            type="radio"
            name="orderMethod"
            value="delivery"
            checked={orderType === "delivery"}
            onChange={(e) => handleOrderTypeChange(e.target.value)}
          />
          🚚 Delivery
          {/* 🔥 SHOW ESTIMATED TIME FROM CMS */}
          {orderOnlineSettings?.estimatedDeliveryTime && (
            <span className="estimated-time">
              ({orderOnlineSettings.estimatedDeliveryTime} min)
            </span>
          )}
        </label>
      </div>
      {orderType && (
        <p className="order-type-confirmation">
          Selected: <strong>{orderType}</strong>
        </p>
      )}
    </div>
  </div>

  <div className="order-online-categories">
    <button
      onClick={() => dispatch(setCategory(null))}
      className={!selectedCategory ? "active" : ""}
    >
      All
    </button>
    {availableCategories.map((category) => (
      <button
        key={category.key}
        onClick={() => dispatch(setCategory(category.key))}
        className={selectedCategory === category.key ? "active" : ""}
      >
        {category.title}
      </button>
    ))}
  </div>

  <div className="menu-items-container">
    {filteredItems.length === 0 ? (
      <div className="no-items">
        <p>No items found in this category.</p>
      </div>
    ) : (
      filteredItems.map((item) =>
        item.available === false ? null : (
          <div key={item._id} className="menu-item">
            <img
              src={item.image ? urlFor(item.image) : "https://via.placeholder.com/150"}
              alt={item.name}
              className="menu-image"
            />
            <h3>{item.name}</h3>
            <p>{item.description}</p>

            {/* 🔥 SHOW NUTRITION INFO BASED ON CMS SETTING */}
            {orderOnlineSettings?.showNutritionInfo && item.nutrition && (
              <p className="nutrition-info">
                {item.nutrition.calories && <span>{item.nutrition.calories} kcal</span>}{" "}
                {item.nutrition.vegan && <span>🌱 Vegan</span>}{" "}
                {item.nutrition.containsAllergens && <span>⚠️ Allergens</span>}
              </p>
            )}

            {item.category === "pizza" || item.categoryTitle === "pizza" ? (
              <PizzaOptions item={item} />
            ) : item.category === "wines" || item.categoryTitle === "wines" ? (
              <>
                {item.priceGlass && (
                  <button
                    onClick={() =>
                      handleAddToCart(item, {
                        id: item._id + "_glass",
                        name: `${item.name} (glass)`,
                        price: item.priceGlass,
                        size: "Glass",
                      })
                    }
                  >
                    Glass - ${item.priceGlass}
                  </button>
                )}
                {item.priceBottle && (
                  <button
                    onClick={() =>
                      handleAddToCart(item, {
                        id: item._id + "_bottle",
                        name: `${item.name} (bottle)`,
                        price: item.priceBottle,
                        size: "Bottle",
                      })
                    }
                  >
                    Bottle - ${item.priceBottle}
                  </button>
                )}
              </>
            ) : (
              <>
                <p>${item.price}</p>
                <button onClick={() => handleAddToCart(item)}>Add to Cart</button>
              </>
            )}

            <ReviewSection menuItemId={item._id} />
          </div>
        )
      )
    )}
  </div>

  <div className="cart-summary">
    <h2>Your Cart</h2>
    {!orderType && (
      <div className="order-type-reminder">
        <p>⚠️ Please select pickup or delivery above to add items to cart</p>
      </div>
    )}
    {cart.length === 0 ? (
      <p>Your Cart is empty.</p>
    ) : (
      <div>
        <div className="current-order-type">
          <p>
            <strong>Order Type:</strong>{" "}
            {orderType === "pickup" ? "🏪 Pickup" : "🚚 Delivery"}
          </p>
        </div>
        <ul>
          {cart.map((item) => (
            <li key={item.id}>
              {item.name} - {item.quantity} x ${item.price.toFixed(2)} = $
              {(item.price * item.quantity).toFixed(2)}
            </li>
          ))}
        </ul>
        
        {/* 🔥 SHOW MINIMUM ORDER VALIDATION */}
        {orderOnlineSettings?.minimumOrderAmount && (
          <div className="order-validation">
            {cart.reduce((acc, item) => acc + item.price * item.quantity, 0) < orderOnlineSettings.minimumOrderAmount ? (
              <p className="minimum-warning">
                ⚠️ Minimum order is ${orderOnlineSettings.minimumOrderAmount}. 
                Add ${(orderOnlineSettings.minimumOrderAmount - cart.reduce((acc, item) => acc + item.price * item.quantity, 0)).toFixed(2)} more.
              </p>
            ) : (
              <p className="minimum-met">✅ Minimum order requirement met!</p>
            )}
          </div>
        )}
        
        <div className="total">
          <strong>
            Total: $
            {cart.reduce((acc, item) => acc + item.price * item.quantity, 0).toFixed(2)}
          </strong>
        </div>
        
        {/* 🔥 DISABLE CHECKOUT IF BELOW MINIMUM */}
        <Link to="/checkout">
          <button 
            className="checkout-btn"
            disabled={
              orderOnlineSettings?.minimumOrderAmount && 
              cart.reduce((acc, item) => acc + item.price * item.quantity, 0) < orderOnlineSettings.minimumOrderAmount
            }
          >
            Checkout
          </button>
        </Link>
        
        {/* 🔥 SHOW PICKUP INSTRUCTIONS FROM CMS */}
        {orderType === "pickup" && orderOnlineSettings?.pickupInstructions && (
          <div className="pickup-instructions">
            <h4>📋 Pickup Instructions:</h4>
            <p>{orderOnlineSettings.pickupInstructions}</p>
          </div>
        )}
      </div>
    )}
  </div>

  {/* 🔥 SHOW SPECIAL INSTRUCTIONS OPTION FROM CMS */}
  {orderOnlineSettings?.allowSpecialInstructions && cart.length > 0 && (
    <div className="special-instructions">
      <h3>{orderOnlineSettings.specialInstructionsText || "Special Instructions (Optional)"}</h3>
      <textarea 
        placeholder="Any special requests or dietary restrictions?"
        rows="3"
      />
    </div>
  )}

  <div className="back-btn">
    <Link to="/" className="back-link">
      Back to Menu
    </Link>
  </div>
</div>


);
};

export default OrderOnline;