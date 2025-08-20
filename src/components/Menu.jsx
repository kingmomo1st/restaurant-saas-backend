import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import { addToCart as reduxAddToCart, setOrderType } from "../redux/cartSlice";
import { toast } from "react-toastify";
import sanityClient from "../sanity/sanityClient.ts";
import imageUrlBuilder from "@sanity/image-url";
import { useAuth } from "./AuthContext";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import "./css/Menu.css";

const builder = imageUrlBuilder(sanityClient);
const urlFor = (source) => builder.image(source).url();

const Menu = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const orderType = useSelector((state) => state.cart.orderType);
  const { user } = useAuth();

  const queryParams = new URLSearchParams(location.search);
  const selectedCategory = queryParams.get("category");

  const [menuSection, setMenuSection] = useState(null);
  const [wallpaper, setWallpaper] = useState(null);
  const [selectedSizes, setSelectedSizes] = useState({});
  const [loading, setLoading] = useState(true);
  const [reorderMode, setReorderMode] = useState(false);

  useEffect(() => {
    const fetchMenu = async () => {
      if (!selectedLocation?._id) return;
      setLoading(true);
      try {
        const res = await sanityClient.fetch(
          `*[_type == "menuSection" && location._ref == "${selectedLocation._id}"][0]{
            _id,
            menuSectionTitle,
            wallpaperImage,
            menuCategories[]{
              _key,
              title,
              image,
              wallpaperImage,
              items[]{
                _id,
                name,
                description,
                image,
                sizes,
                price,
                priceGlass,
                priceBottle,
                available,
                category
              }
            }
          }`
        );
        setMenuSection(res);
        // Set wallpaper from the same document
        setWallpaper(res?.wallpaperImage ? urlFor(res.wallpaperImage) : null);
      } catch (err) {
        console.error("Error fetching menu:", err);
      } finally {
        setLoading(false);
      }
    };
    

    fetchMenu();
    
  }, [selectedLocation]);

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

  useEffect(() => {
    if (selectedCategory && menuSection) {
      const el = document.getElementById(`category-${selectedCategory.toLowerCase()}`);
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }, [selectedCategory, menuSection]);

  const handleOrderTypeChange = (type) => {
    dispatch(setOrderType(type));
    toast.success(`Order type set to ${type}`);
  };

  const handleAddToCart = (item, size) => {
    if (!orderType) {
      toast.error("Please select pickup or delivery first");
      return;
    }

    let price = 0;
    let itemName = item.name;

    if (size === "Glass" && item.priceGlass) {
      price = item.priceGlass;
      itemName += " (Glass)";
    } else if (size === "Bottle" && item.priceBottle) {
      price = item.priceBottle;
      itemName += " (Bottle)";
    } else if (item.sizes?.length > 0) {
      const sizeOption = item.sizes.find((s) => s.name === size);
      price = sizeOption?.price || 0;
      itemName += ` (${size})`;
    } else {
      price = item.price || 0;
    }

    dispatch(
      reduxAddToCart({
        id: `${item._id}_${size || "standard"}`,
        name: itemName,
        price,
        quantity: 1,
        imageURL: item.image ? urlFor(item.image) : null,
        size: size || "standard",
      })
    );

    toast.success(`${itemName} added to cart`);
  };

  const handleCategoryDrag = async (result) => {
    if (!result.destination || !menuSection) return;

    const reordered = Array.from(menuSection.menuCategories);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);

    setMenuSection({
      ...menuSection,
      menuCategories: reordered,
    });

    try {
      await sanityClient
        .patch(menuSection._id)
        .set({ menuCategories: reordered })
        .commit();
      toast.success("Categories reordered");
    } catch (err) {
      console.error("Error saving order:", err);
      toast.error("Error saving order");
    }
  };

  const renderItemOptions = (item, categoryIndex, itemIndex) => {
    const itemKey = `${item._id}_${categoryIndex}_${itemIndex}`;

    if (item.category === "wines" || (item.priceGlass && item.priceBottle)) {
      return (
        <div className="wine-options">
          {item.priceGlass && (
            <button onClick={() => handleAddToCart(item, "Glass")}>
              Glass - ${item.priceGlass.toFixed(2)}
            </button>
          )}
          {item.priceBottle && (
            <button onClick={() => handleAddToCart(item, "Bottle")}>
              Bottle - ${item.priceBottle.toFixed(2)}
            </button>
          )}
        </div>
      );
    }

    if (item.sizes?.length > 0) {
      return (
        <div className="size-options">
          <select
            value={selectedSizes[itemKey] || ""}
            onChange={(e) =>
              setSelectedSizes((prev) => ({
                ...prev,
                [itemKey]: e.target.value,
              }))
            }
          >
            <option value="">Select Size</option>
            {item.sizes.map((s, idx) => (
              <option key={idx} value={s.name}>
                {s.name} - ${s.price.toFixed(2)}
              </option>
            ))}
          </select>
          <button
            disabled={!selectedSizes[itemKey]}
            onClick={() => {
              const size = selectedSizes[itemKey];
              if (size) {
                handleAddToCart(item, size);
              } else {
                toast.error("Please select a size");
              }
            }}
          >
            Add to Cart
          </button>
        </div>
      );
    }

    return (
      <div className="standard-options">
        <p>${item.price?.toFixed(2) || "0.00"}</p>
        <button onClick={() => handleAddToCart(item, null)}>Add to Cart</button>
      </div>
    );
  };

  if (loading || !selectedLocation) {
    return <div className="menu-loading">Loading menu…</div>;
  }

  if (!menuSection) {
    return (
      <div className="menu-container">
        <h2>Our Menu</h2>
        <p>No menu found for this location.</p>
      </div>
    );
  }

  const categoriesToShow = selectedCategory
    ? menuSection.menuCategories?.filter(
        (c) => c.title.toLowerCase() === selectedCategory.toLowerCase()
      )
    : menuSection.menuCategories;

  return (
    <div
      className="menu-container"
    >
      <h2>{menuSection.menuSectionTitle || "Our Menu"}</h2>

      <div className="order-type-selection">
        <h3>How would you like to receive your order?</h3>
        <div className="order-type-buttons">
          <button
            className={orderType === "pickup" ? "active" : ""}
            onClick={() => handleOrderTypeChange("pickup")}
          >
            🏪 Pickup
          </button>
          <button
            className={orderType === "delivery" ? "active" : ""}
            onClick={() => handleOrderTypeChange("delivery")}
          >
            🚚 Delivery
          </button>
        </div>
        {orderType && (
          <p className="order-type-confirmation">
            Selected: <strong>{orderType}</strong>
          </p>
        )}
      </div>

      {selectedCategory && (
        <div className="category-indicator">
          <p>
            Showing: <strong>{selectedCategory}</strong>
          </p>
          <a href="/menu">← Show All Categories</a>
        </div>
      )}

      {user?.role === "admin" && (
        <div className="reorder-toggle">
          <label>
            <input
              type="checkbox"
              checked={reorderMode}
              onChange={() => setReorderMode((prev) => !prev)}
            />
            Reorder Mode
          </label>
        </div>
      )}

      <DragDropContext onDragEnd={handleCategoryDrag}>
        <Droppable droppableId="categories">
          {(provided) => (
            <div ref={provided.innerRef} {...provided.droppableProps}>
              {categoriesToShow?.map((category, i) => (
                <Draggable
                  key={category._key}
                  draggableId={category._key}
                  index={i}
                  isDragDisabled={!reorderMode}
                >
                  {(provided) => (
                    <div
                      id={`category-${category.title.toLowerCase()}`}
                      className="menu-category-section"
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{
                        backgroundImage: category.wallpaperImage
                          ? `url(${urlFor(category.wallpaperImage)})`
                          : "none",
                      }}
                    >
                      <h3>{category.title}</h3>
                      <div className="menu-grid">
                      {category.items?.filter(item => item && item.name && item.name.trim() !== "").map((item,j) => (
                          <div key={item._id} className="menu-card">
                            {item.image &&(
                              <img
                                src={urlFor(item.image)}
                                alt={item.name}
                                onError={(e) => {
                                e.target.src = "https://via.placeholder.com/150";
                                }}
                                />
                              )}
                            <h4>{item.name}</h4>
                            <p>{item.description}</p>
                            {renderItemOptions(item, i, j)}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </div>
  );
};

export default Menu;