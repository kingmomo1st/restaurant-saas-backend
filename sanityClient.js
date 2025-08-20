// backend/sanityClient.js
const {createClient} = require('@sanity/client');

const client = createClient({
  projectId: "80utnltr", // your actual Sanity project ID
  dataset: "production",
  apiVersion: "2023-01-01",
  token: process.env.SANITY_WRITE_TOKEN,
  useCdn: false,
});

module.exports = client;