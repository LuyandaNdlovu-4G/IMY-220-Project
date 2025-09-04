import { useState } from 'react';

const usePopup = () => {
  const [isPopupVisible, setPopupVisible] = useState(false);

  const showPopup = () => {
    setPopupVisible(true);
  };

  const hidePopup = () => {
    setPopupVisible(false);
  };

  return { isPopupVisible, showPopup, hidePopup };
};

export default usePopup;