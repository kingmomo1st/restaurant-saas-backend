import client from "../sanityClient";

export const getFranchises = async () => {
  try {
    // Optional: Log all franchises for debugging
    const debugQuery = `*[_type == "franchise"]{
      _id,
      title,
      isActive,
      "locationCount": count(locations)
    }`;

    const debugData = await client.fetch(debugQuery);
    console.log("🔍 All franchises in Sanity (debug):", debugData);

    // Only fetch active franchises with their locations
    const query = `*[_type == "franchise" && isActive == true]{
      _id,
      title,
      ownerName,
      ownerEmail,
      isActive,
      locations[]->{
        _id,
        title,
        address,
        phone,
        email,
        hours,
        isActive
      }
    }`;

    const data = await client.fetch(query);
    console.log("📍 Active franchises from Sanity:", data);

    // Transform to format expected by the frontend
    const transformedData = data.map((franchise) => ({
      _id: franchise._id,
      title: franchise.title,
      franchiseTitle: franchise.title,
      slug: {
        current: franchise.title.toLowerCase().replace(/\s+/g, "-"),
      },
      franchise,
      locations: franchise.locations || [],
    }));

    console.log("📍 Transformed franchise data:", transformedData);
    console.log("📍 Number of franchises:", transformedData.length);

    return transformedData;
  } catch (error) {
    console.error("❌ Error fetching franchises from Sanity:", error);
    throw error;
  }
};