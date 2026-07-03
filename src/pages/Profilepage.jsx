import { useEffect, useMemo, useRef, useState } from "react";
import {Camera,User,Mail,Briefcase,Lock,Eye,EyeOff,LogOut,Save,Shield,Clock,Zap,CheckCircle,} from "lucide-react";
import { useNavigate } from "react-router-dom";
import imageCompression from "browser-image-compression";
import "../ProfilePage.css";
import { useAuth } from "../context/authContext";
import {
  logoutUserFromAllDevice,
  updatePassword,
  updateProfile,
} from "../api/userApi.js";

export default function ProfilePage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [successPassword, setSuccessPassword] = useState("");
  const [authProvider, setAuthProvider] = useState("google");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [isCompressingAvatar, setIsCompressingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const avatarCompressionRequestRef = useRef(0);

  const navigate = useNavigate();
  const [originalProfile, setOriginalProfile] = useState({ name: "" });
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    role: "",
    picture: "",
  });

  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const { currentUser, setCurrentUser } = useAuth();

  const handleInputPassword = (e) => {
    setPassword({ ...password, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    setProfile({
      name: currentUser.name || "",
      email: currentUser.email || "",
      role: currentUser.role || "",
      picture: currentUser.picture || "",
    });
    setOriginalProfile({ name: currentUser.name || "" });
    setAuthProvider(currentUser.authProvider || "local");
  }, [currentUser]);

  useEffect(() => {
    return () => {
      if (avatarPreview) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setSuccessPassword("");

    if (password.confirmPassword !== password.newPassword) {
      setPasswordError("New password and confirm password must be same");
      return;
    }

    const payload =
      authProvider === "google" || authProvider === "Github"
        ? { newPassword: password.newPassword }
        : {
            newPassword: password.newPassword,
            currentPassword: password.currentPassword,
          };

    try {
      const data = await updatePassword(payload);
      if (data.message) {
        setSuccessPassword(data.message);
        setTimeout(() => {
          setSuccessPassword("");
        }, 2000);
      }
    } catch (err) {
      if (err.status == 401) {
        navigate("/login");
      }
    } finally {
      setPassword({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];

    if (!file || !file.type.startsWith("image/")) {
      return;
    }

    const requestId = Date.now();
    const previewUrl = URL.createObjectURL(file);
    avatarCompressionRequestRef.current = requestId;

    if (avatarPreview) {
      URL.revokeObjectURL(avatarPreview);
    }

    setAvatarPreview(previewUrl);
    setIsCompressingAvatar(true);

    const options = {
      maxSizeMB: 0.5,
      maxWidthOrHeight: 512,
      useWebWorker: true,
    };

    try {
      const compressedFile = await imageCompression(file, options);

      if (avatarCompressionRequestRef.current !== requestId) {
        return;
      }

      setAvatarFile(compressedFile);
      setAvatarPreview(URL.createObjectURL(compressedFile));
    } catch (err) {
      console.error("Avatar compression failed", err);
      if (avatarCompressionRequestRef.current === requestId) {
        setAvatarFile(file);
      }
    } finally {
      if (avatarCompressionRequestRef.current === requestId) {
        setIsCompressingAvatar(false);
      }
    }
  };

  const handleSaveChanges = async () => {
    if (isCompressingAvatar) {
      return;
    }

    const data = new FormData();

    if (profile.name.trim() && profile.name.trim() != originalProfile.name) {
      data.append("name", profile.name.trim());
    }

    if (avatarFile) {
      data.append("avatar", avatarFile);
    }

    if (![...data.keys()].length) {
      return;
    }

    try {
      setSaving(true);
      const updated = await updateProfile(data);
      console.log("previous picture", profile.picture);
      console.log("updated picture", updated.picture);
      setProfile((prev) => ({
        ...prev,
        name: updated.name ?? prev.name,
        picture: updated.picture ?? prev.picture,
      }));
      setOriginalProfile((prev) => {
        return { ...prev, name: updated.name ?? prev.name };
      });
      setCurrentUser((prev) =>
        prev
          ? {
              ...prev,
              name: updated.name ?? prev.name,
              picture: updated.picture ?? prev.picture,
            }
          : prev,
      );
      console.log("profile page ka updated user", currentUser);
      setAvatarFile(null);
      setAvatarPreview("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      console.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutAll = async () => {
    try {
      const data = await logoutUserFromAllDevice();
      if (data.message) {
        navigate("/login");
      }
    } catch (err) {
      console.error("profile page ka error", err);
    }
  };

  const avatarSrc = avatarPreview || profile.picture;
  const userInitials = useMemo(() => {
    const name = (profile.name || originalProfile.name || "").trim();
    if (!name) return "U";
    const parts = name.split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase()).join("");
  }, [profile.name, originalProfile.name]);

  return (
    <div className="profile-page">
      <div className="profile-container">
        {/* Hero Section with Avatar */}
        <section className="profile-hero-section">
          <div className="hero-background"></div>
          <div className="hero-content">
            <div className="avatar-container">
              <div className="avatar-glow"></div>
              <div className="profile-avatar">
                {avatarSrc ? (
                  <img src={avatarSrc} alt={profile.name || "User avatar"} />
                ) : (
                  <span>{userInitials}</span>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="avatar-edit-btn"
                aria-label="Change profile photo"
              >
                <Camera size={16} />
              </button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                className="profile-hidden-input"
              />
            </div>

            <div className="user-info">
              <h1 className="user-name">{originalProfile.name || "Welcome"}</h1>
              <p className="user-email">
                <Mail size={14} />
                <span>{profile.email || "No email"}</span>
              </p>
              <div className="user-badges">
                <span className="badge badge-role">
                  <Briefcase size={13} />
                  {profile.role || "User"}
                </span>
                <span className="badge badge-status">
                  <CheckCircle size={13} />
                  Logged in
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Cards */}
        <section className="stats-section">
          <div className="stat-card">
            <div className="stat-icon stat-icon-blue">
              <Zap size={20} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Profile Status</p>
              <p className="stat-value">Complete</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-green">
              <Clock size={20} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Auth Provider</p>
              <p className="stat-value">
                {authProvider === "local" ? "Email" : authProvider}
              </p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon stat-icon-purple">
              <Shield size={20} />
            </div>
            <div className="stat-content">
              <p className="stat-label">Security</p>
              <p className="stat-value">Protected</p>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="profile-content-grid">
          {/* Profile Information Card */}
          <section className="profile-card">
            <div className="card-header">
              <div className="card-icon-wrapper">
                <User size={18} />
              </div>
              <h2 className="card-title">Profile Information</h2>
            </div>

            <div className="form-group-container">
              <div className="form-group">
                <label className="form-label">Username</label>
                <div className="input-wrapper">
                  <User size={15} />
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) =>
                      setProfile((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter username"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <div className="input-wrapper read-only">
                  <Mail size={15} />
                  <span>{profile.email}</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <div className="input-wrapper read-only">
                  <Briefcase size={15} />
                  <span>{profile.role || "User"}</span>
                </div>
              </div>
            </div>
          </section>

          {/* Password & Security Card */}
          <section className="profile-card">
            <div className="card-header">
              <div className="card-icon-wrapper">
                <Shield size={18} />
              </div>
              <h2 className="card-title">Password & Security</h2>
            </div>

            <form
              onSubmit={handleUpdatePassword}
              className="form-group-container"
            >
              {authProvider === "local" && (
                <div className="form-group">
                  <label className="form-label">Current Password</label>
                  <div className="input-wrapper password-wrapper">
                    <Lock size={15} />
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      name="currentPassword"
                      value={password.currentPassword}
                      onChange={handleInputPassword}
                      required
                      placeholder="Enter current password"
                      className="form-input"
                    />
                    <button
                      type="button"
                      className="toggle-password-btn"
                      onClick={() => setShowCurrentPassword((prev) => !prev)}
                      aria-label={
                        showCurrentPassword
                          ? "Hide current password"
                          : "Show current password"
                      }
                    >
                      {showCurrentPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>
              )}

              {(authProvider === "google" || authProvider === "Github") && (
                <div className="provider-info">
                  <Zap size={16} />
                  <p>
                    You signed in with <strong>{authProvider}</strong>. Set a
                    password to enable email login.
                  </p>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">New Password</label>
                <div className="input-wrapper password-wrapper">
                  <Lock size={15} />
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={password.newPassword}
                    onChange={handleInputPassword}
                    required
                    placeholder="Enter new password"
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    aria-label={
                      showNewPassword
                        ? "Hide new password"
                        : "Show new password"
                    }
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm New Password</label>
                <div className="input-wrapper password-wrapper">
                  <Lock size={15} />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={password.confirmPassword}
                    onChange={handleInputPassword}
                    required
                    placeholder="Confirm new password"
                    className="form-input"
                  />
                  <button
                    type="button"
                    className="toggle-password-btn"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={
                      showConfirmPassword
                        ? "Hide confirm password"
                        : "Show confirm password"
                    }
                  >
                    {showConfirmPassword ? (
                      <EyeOff size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
              </div>

              {passwordError && (
                <div className="alert alert-error">
                  <span>{passwordError}</span>
                </div>
              )}
              {successPassword && (
                <div className="alert alert-success">
                  <CheckCircle size={14} />
                  <span>{successPassword}</span>
                </div>
              )}

              <button className="btn btn-primary" type="submit">
                <Lock size={16} />
                {authProvider === "google" ? "Set Password" : "Update Password"}
              </button>
            </form>
          </section>
        </div>

        {/* Action Buttons */}
        <section className="action-buttons">
          <button
            onClick={handleSaveChanges}
            disabled={saving || isCompressingAvatar}
            className="btn btn-success"
          >
            <Save size={18} />
            <span>
              {saving
                ? "Saving..."
                : isCompressingAvatar
                  ? "Compressing..."
                  : "Save Changes"}
            </span>
          </button>
          <button onClick={handleLogoutAll} className="btn btn-danger">
            <LogOut size={18} />
            <span>Logout from All Devices</span>
          </button>
        </section>
      </div>
    </div>
  );
}
