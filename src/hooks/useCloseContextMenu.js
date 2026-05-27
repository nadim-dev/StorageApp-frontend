import { useEffect } from "react";

const useCloseContextMenu = (setActiveContextMenu) => {
  useEffect(() => {
    const handleDocumentClick = (e) => {
      const clickedInsideMenu = e.target.closest(".context-menu");
      const clickedMenuTrigger = e.target.closest(".context-menu-trigger");

      if (clickedInsideMenu || clickedMenuTrigger) return;

      setActiveContextMenu(null);
    };

    document.addEventListener("click", handleDocumentClick);

    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [setActiveContextMenu]);
};

export default useCloseContextMenu;