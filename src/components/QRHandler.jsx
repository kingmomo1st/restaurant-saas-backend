import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { setTableId, setLocationId } from "../redux/tableSlice"; // You'll create this
import { toast } from "react-toastify";

const QRHandler = () => {
  const [searchParams] = useSearchParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const tableId = searchParams.get("table");
    const locationId = searchParams.get("location");

    if (tableId && locationId) {
      dispatch(setTableId(tableId));
      dispatch(setLocationId(locationId));
      localStorage.setItem("qr_tableId", tableId);
      localStorage.setItem("qr_locationId", locationId);
      toast.success("🔒 Table session active.");
      navigate("/menu"); // or /order-online if you prefer
    } else {
      toast.error("❌ Invalid QR code.");
      navigate("/"); // fallback
    }
  }, []);

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>Scanning QR Code...</h2>
    </div>
  );
};

export default QRHandler;