import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setSelectedLocation } from '../redux/locationSlice';
import { getLocations } from '../sanity/utils/getLocations';

const LocationSelector = () => {
  const dispatch = useDispatch();
  const selectedLocation = useSelector(state => state.location.selectedLocation);
  const selectedFranchise = useSelector(state => state.franchise.selectedFranchise);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const data = await getLocations();
        const filtered = selectedFranchise
          ? data.filter(loc => loc.franchise?._id === selectedFranchise._id)
          : data;

        setLocations(filtered);
        setLoading(false);

        if (!selectedLocation && filtered.length > 0) {
          dispatch(setSelectedLocation(filtered[0]));
        }
      } catch (error) {
        console.error('Error fetching locations:', error);
        setLoading(false);
      }
    };

    fetchLocations();
  }, [dispatch, selectedLocation, selectedFranchise]);

  const handleChange = (e) => {
    const selected = locations.find(loc => loc._id === e.target.value);
    dispatch(setSelectedLocation(selected));
  };

  if (loading) return <p>Loading locations...</p>;

  return (
    <div className="location-selector">
      <label htmlFor="location-select">Select Location:</label>
      <select id="location-select" value={selectedLocation?._id || ''} onChange={handleChange}>
        {locations.map(loc => (
          <option key={loc._id} value={loc._id}>
            {loc.title}
          </option>
        ))}
      </select>
    </div>
  );
};

export default LocationSelector;