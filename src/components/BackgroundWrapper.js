// components/BackgroundWrapper.js
import { useEffect } from "react";

const BackgroundWrapper = ({ children }) => {
  useEffect(() => {
    document.body.style.backgroundImage = "url('images/moneypic1.jpg')";
    document.body.style.backgroundSize = "cover";
    document.body.style.backgroundAttachment = "fixed";
    document.body.style.backgroundPosition = "center";
    document.body.style.backgroundRepeat = "repeat";

    return () => {
      document.body.style.backgroundImage = "none";
    };
  }, []);

  return <>{children}</>;
};

export default BackgroundWrapper;