import { createClient } from "@sanity/client";

const sanityClient = createClient({
  projectId: import.meta.env.VITE_SANITY_PROJECT_ID, // ✅ Vite uses import.meta.env
  dataset: "production",
  apiVersion: "2023-01-01",
  useCdn: false,
  token: import.meta.env.VITE_SANITY_WRITE_TOKEN, // ✅ also Vite-style
});



export default sanityClient;