// src/sanity/utils/getLocations.js
import client from '../sanityClient';

export const getLocations = async () => {
  const query = `*[_type == "location" && isActive == true]{
    _id,
    title,
    address,
    phone,
    email,
    hours,
    franchise->{
      _id,
      title
    }
  }`;

  const data = await client.fetch(query);
  return data;
};