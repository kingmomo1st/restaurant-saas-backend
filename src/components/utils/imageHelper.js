import imageUrlBuilder from "@sanity/image-url";
import sanityClient from "../../sanity/sanityClient";

const builder = imageUrlBuilder(sanityClient);

export function urlFor(source) {
  try {
    return builder.image(source).url();
  } catch (err) {
    console.error("Image URL builder failed:", err);
    return "/fallback.jpg"; // optional fallback
  }
}