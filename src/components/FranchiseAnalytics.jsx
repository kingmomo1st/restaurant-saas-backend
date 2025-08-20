import React, { useEffect, useState } from "react";
import sanityClient from "../sanity/sanityClient";
import "./css/FranchiseAnalytics.css";

const FranchiseAnalytics = () => {
  const [franchiseStats, setFranchiseStats] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const [reservations, dining, giftcards, events] = await Promise.all([
        sanityClient.fetch(`*[_type == "reservation"]{ location->{franchise->{_id, title}} }`),
        sanityClient.fetch(`*[_type == "privateDiningEntry"]{ location->{franchise->{_id, title}} }`),
        sanityClient.fetch(`*[_type == "giftCardView"]{ location->{franchise->{_id, title}}, amount }`),
        sanityClient.fetch(`*[_type == "eventBooking"]{ location->{franchise->{_id, title}}, status }`),
      ]);

      const statsMap = {};

      const addToStats = (arr, type, countField = "count", valueField = null) => {
        arr.forEach((item) => {
          const franchise = item.location?.franchise;
          if (!franchise?._id) return;

          if (!statsMap[franchise._id]) {
            statsMap[franchise._id] = {
              id: franchise._id,
              title: franchise.title,
              reservations: 0,
              privateDining: 0,
              giftCardRevenue: 0,
              eventCount: 0,
              completedEvents: 0,
            };
          }

          if (type === "reservation") statsMap[franchise._id].reservations++;
          if (type === "privateDining") statsMap[franchise._id].privateDining++;
          if (type === "giftcard") statsMap[franchise._id].giftCardRevenue += item.amount || 0;
          if (type === "event") {
            statsMap[franchise._id].eventCount++;
            if (item.status?.toLowerCase() === "completed") {
              statsMap[franchise._id].completedEvents++;
            }
          }
        });
      };

      addToStats(reservations, "reservation");
      addToStats(dining, "privateDining");
      addToStats(giftcards, "giftcard");
      addToStats(events, "event");

      setFranchiseStats(Object.values(statsMap));
    };

    fetchData();
  }, []);

  return (
    <div className="franchise-analytics">
      <h2>Franchise Overview Analytics 📊</h2>
      <div className="franchise-card-grid">
        {franchiseStats.map((f) => (
          <div key={f.id} className="franchise-card">
            <h3>{f.title}</h3>
            <p><strong>Reservations:</strong> {f.reservations}</p>
            <p><strong>Private Dining:</strong> {f.privateDining}</p>
            <p><strong>Gift Card Revenue:</strong> ${f.giftCardRevenue.toFixed(2)}</p>
            <p><strong>Events:</strong> {f.eventCount}</p>
            <p><strong>Completed Events:</strong> {f.completedEvents}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FranchiseAnalytics;