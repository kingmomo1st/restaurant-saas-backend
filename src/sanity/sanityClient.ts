import { createClient } from '@sanity/client';

const sanityClient = createClient({
  projectId: '80utnltr', // double-check this matches your actual Sanity project ID
  dataset: 'production',
  apiVersion: '2023-01-01', // make sure this matches what's in the error URL
  useCdn: true,
});

export default sanityClient;