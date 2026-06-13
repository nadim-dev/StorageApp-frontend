import { useNavigate } from "react-router-dom";
import {
  FaFolderOpen,
  FaClock,
  FaStar,
  FaTrashAlt,
  FaDatabase,
  FaPlus,
  FaUserFriends,
  FaShareAlt
} from "react-icons/fa";
import Logo from "../assets/cloudnest-logo.svg";
import { formatFileSize } from "../utils/formatFile";
import { useAuth } from "../context/authContext.jsx";

const navItems = [
  { key: "my-drive", label: "My Drive", icon: FaFolderOpen, to: "/" },
  { key: "recent", label: "Recent", icon: FaClock, to: "/recent" },
  { key: "starred", label: "Starred", icon: FaStar, to: "/starred" },
  { key: "trash", label: "Trash", icon: FaTrashAlt, to: "/trash" },
  {key: "shared-with-me",label: "Shared with Me",icon: FaUserFriends,to: "/shared-with-me"},
  {key: "shared-by-me",label: "Shared by Me",icon: FaShareAlt,to: "/shared-by-me"}
];

function Sidebar({
  active = "my-drive",
  isMobileOpen = false,
  onNavigateComplete = () => {},
}) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const totalBytes = currentUser.maxStorageInBytes || 1 * 1024 ** 4;
  const usedBytes = currentUser.usedStorage;
  const usagePercent = Math.min(100, (usedBytes / totalBytes) * 100);
  const totalStorageTB = (totalBytes / 1024 ** 4).toFixed(2);

  function navigateSmoothly(to) {
    if (!to) return;
    const goToRoute = () => {
      navigate(to, { viewTransition: true });
    };

    if (window.innerWidth < 768) {
      onNavigateComplete();
      window.setTimeout(goToRoute, 140);
      return;
    }

    goToRoute();
    onNavigateComplete();
  }

  return (
    <aside
      className={`cloudnest-sidebar ${isMobileOpen ? "mobile-open" : ""}`}
      aria-label="CloudNest navigation"
    >
      <div className="sidebar-top">
        <button
          type="button"
          className="sidebar-brand"
        >
          <img src={Logo} alt="CloudNest logo" className="sidebar-logo" />
          <div>
            <p className="sidebar-brand-name">CloudNest</p>
            <p className="sidebar-brand-subtitle">Personal Drive</p>
          </div>
        </button>

        <button
          type="button"
          className="sidebar-mobile-close"
          aria-label="Close menu"
          onClick={onNavigateComplete}
        >
          x
        </button>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.key === active;
          return (
            <button
              key={item.key}
              className={`sidebar-nav-item ${isActive ? "active" : ""}`}
              onClick={() => {
                navigateSmoothly(item.to);
              }}
              type="button"
            >
              <Icon />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-storage-card">
        <p className="storage-title">
          <FaDatabase />
          <span>Storage</span>
        </p>
        <div className="storage-meter" aria-hidden>
          <div
            className="storage-meter-fill"
            style={{ width: `${usagePercent}%` }}
          />
        </div>
        <p className="storage-used">
          {formatFileSize(usedBytes)} of {totalStorageTB} TB used
        </p>

        <button
          type="button"
          className="storage-more-button"
          onClick={() => {
            navigateSmoothly("/plan");
          }}
        >
          <FaPlus />
          <span>More storage</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
