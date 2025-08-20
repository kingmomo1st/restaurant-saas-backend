// /components/franchise2/LayoutSalumeria.jsx
import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import sanityClient from "../sanity/sanityClient";
import imageUrlBuilder from "@sanity/image-url";
import NavbarSalumeria from "./NavbarSalumeria";
import FooterSalumeria from "./FooterSalumeria";
import "./css/globalFranchise2.css";

const builder = imageUrlBuilder(sanityClient);
const urlFor = (source) => builder.image(source).url();

const LayoutSalumeria = ({ children }) => {
  console.log("🏗️ LayoutSalumeria rendering at:", Date.now());
  console.log("LayoutSalumeria INSTANCE created at:", Date.now(), "with children:", children?.type.name)

  const selectedLocation = useSelector((state) => state.location.selectedLocation);
  const [layoutData, setLayoutData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchedLocationRef = useRef(null);

  useEffect(() => {
    const fetchLayout = async () => {
      if (!selectedLocation?._id) {
        console.warn("⚠️ No selectedLocation in LayoutSalumeria");
        setIsLoading(false);
        return;
      }

      // Prevent refetching the same location
      if (fetchedLocationRef.current === selectedLocation._id) {
        console.log("✅ Layout already fetched for this location");
        return;
      }

      try {
        setIsLoading(true);
        const result = await sanityClient.fetch(
          `*[_type == "layoutSalumeria" && location._ref == $locId][0]`,
          { locId: selectedLocation._id }
        );
        setLayoutData(result);
        fetchedLocationRef.current = selectedLocation._id;
        console.log("✅ LayoutSalumeria fetched:", result);
      } catch (err) {
        console.error("❌ LayoutSalumeria fetch failed:", err.message || err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLayout();
  }, [selectedLocation?._id]);

  if (isLoading) return <div className="loading">Loading layout…</div>;

  return (
    <div
      className="layout-salumeria"
      style={{
        fontFamily: layoutData?.fontFamily || "Playfair Display",
        backgroundColor: layoutData?.backgroundColor || "#ffffff",
      }}
    >
      <NavbarSalumeria
        logoUrl={layoutData?.navbarLogo ? urlFor(layoutData.navbarLogo) : null}
        navLinks={layoutData?.navLinks || []}
      />
      <main>{children}</main>
      <FooterSalumeria />
    </div>
  );
};

export default LayoutSalumeria;