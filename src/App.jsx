import {
  createBrowserRouter,
  Navigate,
  Outlet,
  RouterProvider,
} from "react-router-dom";
import DirectoryView from "./DirectoryView";
import DriveTrashPage from "./pages/DriveTrashPage";
import Register from "./pages/Register";
import UsersPage from "./pages/UsersPage";
import Login from "./pages/Login";
import OtpVerify from "./pages/OtpVerify";
import "./App.css";
import TrashPage from "./pages/TrashPage";
import ProfilePage from "./pages/Profilepage";
import UserResourcesPage from "./pages/UserResourcesPage";
import ForgotPassword from "./pages/forgot";
import ResetPassword from "./pages/resetPassword";
import RecentPage from "./pages/RecentPage";
import StarredPage from "./StarredPage";
import { useAuth } from "./context/authContext.jsx";
import { showConsoleWarning } from "./utils/consoleWarning.js";
import { useEffect } from "react";
import { SubcriptionPage } from "./pages/SubcriptionPage.jsx";
import ManagePlan from "./pages/ManagePlan";
import SharedResource from "./pages/SharedResource.jsx";
import { SharedWithMe } from "./pages/ShareWithMe.jsx";
import { ShareByMe} from "./pages/ShareByMe.jsx";
import { StorageIntelligence } from "./pages/StorageIntelligence";
import { StorageHealthPage } from "./pages/StorageHealthPage";
import { DuplicatePage } from "./pages/DuplicateResourcePage";
import { OldResourcePage } from "./pages/OldResourcePage";

function ProtectedLayout() {
  useEffect(() => {
    showConsoleWarning();
  }, []);

  const { currentUser, authLoading } = useAuth();

  if (authLoading) {
    return <p className="no-data-message">Checking your session...</p>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

const router = createBrowserRouter([
  {
    element: <ProtectedLayout />,
    children: [
      {
        path: "/",
        element: <DirectoryView />,
      },
      {
        path: "/directory/:dirId",
        element: <DirectoryView />,
      },
      {
        path: "/trash",
        element: <DriveTrashPage />,
      },
      {
        path: "/recent",
        element: <RecentPage />,
      },
      {
        path: "/starred",
        element: <StarredPage />,
      },
      {
        path: "/user",
        element: <UsersPage />,
      },
      {
        path: "/user/:userId/resources",
        element: <UserResourcesPage />,
      },
      {
        path: "/owner/trash",
        element: <TrashPage />,
      },
      {
        path: "/profile",
        element: <ProfilePage />,
      },
      {
        path:"/manage-plan",
        element:<ManagePlan/>
      },
      {
         path:"/shared-with-me",
        element:<SharedWithMe/>
      },
      {
        path:"/shared-by-me",
        element:<ShareByMe />
      },
      {
        path:"/storage-intelligence",
        element:<StorageIntelligence/>
      },
      {
        path:"/storage-health",
        element:<StorageHealthPage/>
      },
      {
        path:"/old-resource",
        element:<OldResourcePage/>
      },
      {
        path:"/duplicate-resource",
        element:<DuplicatePage />
      }
      
    ],
  },
      {
        path:"/plan",
        element:<SubcriptionPage/>,
      },

      {
        path:"/share/:resourceType/:token",
        element:<SharedResource />
      },

  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/otpverify",
    element: <OtpVerify />,
  },
  {
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
