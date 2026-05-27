import { useEffect, useState } from "react";
import DirectoryHeader from "./DireactoryHeader";
import Sidebar from "./sidebar";
import { useLocation } from "react-router-dom";

function DriveUILayout({
  active = "my-drive",
  query = "",
  setQuery = () => {},
  headerMode = "drive",
  headerProps = {},
  children,
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth >= 768) {
        setIsSidebarOpen(false);
      }
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (window.innerWidth < 768 && isSidebarOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }

    document.body.style.overflow = "";
    return undefined;
  }, [isSidebarOpen]);

  return (
    <div className="drive-shell">
      <Sidebar
        active={active}
        isMobileOpen={isSidebarOpen}
        onNavigateComplete={() => setIsSidebarOpen(false)}
      />
      <button
        type="button"
        className={`sidebar-overlay ${isSidebarOpen ? "open" : ""}`}
        aria-label="Close sidebar"
        onClick={() => setIsSidebarOpen(false)}
      />
      <div className="directory-view">
        <DirectoryHeader
          mode={headerMode}
          query={query}
          setQuery={setQuery}
          onSidebarToggle={() => setIsSidebarOpen((prev) => !prev)}
          isSidebarOpen={isSidebarOpen}
          {...headerProps}
        />
        <div key={location.pathname} className="drive-route-enter">
          {children}
        </div>
      </div>
    </div>
  );
}

export default DriveUILayout;
