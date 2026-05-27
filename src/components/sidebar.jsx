import { useNavigate } from "react-router-dom";
import {
  FaFolderOpen,
  FaClock,
  FaStar,
  FaTrashAlt,
  FaDatabase,
  FaRocket,
  FaCheckCircle,
  FaCrown,
} from "react-icons/fa";
import Logo from "../assets/cloudnest-logo.svg";
import { formatFileSize } from "../utils/formatFile";
import { useAuth } from "../context/authContext.jsx";
import { SUBSCRIPTION_PLANS } from "@/constants/subscriptionPlans.js";

const navItems = [
  { key: "my-drive", label: "My Drive", icon: FaFolderOpen, to: "/" },
  { key: "recent", label: "Recent", icon: FaClock, to: "/recent" },
  { key: "starred", label: "Starred", icon: FaStar, to: "/starred" },
  { key: "trash", label: "Trash", icon: FaTrashAlt, to: "/trash" },
];

function Sidebar({
  active = "my-drive",
  isMobileOpen = false,
  onNavigateComplete = () => {},
}) {
  const allPlans = [
    ...SUBSCRIPTION_PLANS.monthly,
    ...SUBSCRIPTION_PLANS.yearly,
  ];
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const totalBytes = currentUser.maxStorageInBytes || 1 * 1024 ** 4;
  const usedBytes = currentUser.usedStorage;
  const usagePercent = Math.min(100, (usedBytes / totalBytes) * 100);
  const totalStorageTB = (totalBytes / 1024 ** 4).toFixed(2);
  console.log("percentage", usagePercent);
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
  let upgradePlans=null;
  if(currentUser.planId){
     const currentPlan = allPlans.find((plan) => plan.id === currentUser.planId);
     console.log("current plan",currentPlan);
      [upgradePlans] = allPlans.filter(
    (plan) =>
      plan.level > currentPlan.level &&
      plan.billingCycle === currentPlan.billingCycle,
  );
  }
  console.log("upgrade plans",upgradePlans);

  return (
    <aside
      className={`cloudnest-sidebar ${isMobileOpen ? "mobile-open" : ""}`}
      aria-label="CloudNest navigation"
    >
      <div className="sidebar-top">
        <button
          type="button"
          className="sidebar-brand"
          onClick={() => {
            navigateSmoothly("/");
          }}
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
      </div>

      <div className="sidebar-upgrade-card">
        <div className="sidebar-upgrade-head">
          <div className="sidebar-upgrade-icon" aria-hidden>
            <FaRocket />
          </div>
          <div>
            {upgradePlans ? (
              <>
                <p className="sidebar-upgrade-title">Buy {upgradePlans.name}</p>
                <p className="sidebar-upgrade-subtitle">
                  Get <span>{upgradePlans.storage}</span> storage
                </p>
              </>
            ) : (
              <>
                <p className="sidebar-upgrade-title">Buy Plus</p>
                <p className="sidebar-upgrade-subtitle">
                  Get <span>2 TB</span> storage
                </p>
              </>
            )}
          </div>
        </div>

        <div className="sidebar-upgrade-list">
          <p>
            <FaCheckCircle />
            <span>More storage</span>
          </p>
          <p>
            <FaCheckCircle />
            <span>Larger file uploads</span>
          </p>
          <p>
            <FaCheckCircle />
            <span>Priority support</span>
          </p>
        </div>

        <button
          type="button"
          className="sidebar-upgrade-button"
          onClick={() => {
            navigateSmoothly("/plan");
          }}
        >
          <FaCrown />
          <span>Upgrade Plan</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
