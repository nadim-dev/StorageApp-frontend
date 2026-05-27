import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, User, Mail, Briefcase, Lock, Eye, EyeOff, LogOut, Save, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import imageCompression from "browser-image-compression";
import "../ProfilePage.css";
import { useAuth } from '../context/authContext';
import { logoutUserFromAllDevice, updatePassword, updateProfile } from '../api/userApi.js';

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
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
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

    const payload = (authProvider === "google" || authProvider === "Github")
      ? { newPassword: password.newPassword }
      : { newPassword: password.newPassword, currentPassword: password.currentPassword };

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
      setPassword({ currentPassword: '', newPassword: '', confirmPassword: '' });
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
      const updated=await updateProfile(data);
      console.log("previous picture",profile.picture);
      console.log("updated picture",updated.picture);      
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
          : prev
      );
      console.log("profile page ka updated user",currentUser);
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
      <div className="profile-shell">
        <section className="profile-hero">
          <div className="profile-hero-cover" />
          <div className="profile-hero-content">
            <div className="profile-avatar-wrap">
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
                <Camera size={14} />
              </button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                className="profile-hidden-input"
              />
            </div>

            <div className="profile-user-meta">
              <h1>{originalProfile.name || "Your profile"}</h1>
              <div className="profile-meta-row">
                <span className="profile-meta-pill">
                  <Mail size={14} />
                  {profile.email || "No email"}
                </span>
                <span className="profile-role-pill">
                  <Briefcase size={14} />
                  {profile.role || "User"}
                </span>
              </div>
            </div>
          </div>
        </section>

        <div className="profile-grid">
          <section className="profile-card">
            <h2 className="profile-card-title">
              <User size={18} />
              Profile Information
            </h2>

            <div className="profile-form-stack">
              <label className="profile-field">
                <span>Username</span>
                <input
                  type="text"
                  value={profile.name}
                  onChange={(e) => setProfile((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter username"
                />
              </label>

              <label className="profile-field">
                <span>Email Address</span>
                <div className="profile-readonly">
                  <Mail size={15} />
                  <span>{profile.email}</span>
                </div>
              </label>

              <label className="profile-field">
                <span>Role</span>
                <div className="profile-readonly">
                  <Briefcase size={15} />
                  <span>{profile.role}</span>
                </div>
              </label>
            </div>
          </section>

          <section className="profile-card">
            <h2 className="profile-card-title">
              <Shield size={18} />
              Password & Security
            </h2>

            <form onSubmit={handleUpdatePassword} className="profile-form-stack">
              {authProvider === "local" && (
                <label className="profile-field">
                  <span>Current Password</span>
                  <div className="profile-password-input">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      name="currentPassword"
                      value={password.currentPassword}
                      onChange={handleInputPassword}
                      required
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword((prev) => !prev)}
                      aria-label={showCurrentPassword ? "Hide current password" : "Show current password"}
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>
              )}

              {(authProvider === "google" || authProvider === "Github") && (
                <p className="profile-provider-note">
                  You signed in with {authProvider}. Set a password to enable email login.
                </p>
              )}

              <label className="profile-field">
                <span>New Password</span>
                <div className="profile-password-input">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    value={password.newPassword}
                    onChange={handleInputPassword}
                    required
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    aria-label={showNewPassword ? "Hide new password" : "Show new password"}
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              <label className="profile-field">
                <span>Confirm New Password</span>
                <div className="profile-password-input">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={password.confirmPassword}
                    onChange={handleInputPassword}
                    required
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </label>

              {passwordError && <p className="profile-alert profile-alert-error">{passwordError}</p>}
              {successPassword && <p className="profile-alert profile-alert-success">{successPassword}</p>}

              <button className="profile-primary-btn" type="submit">
                <Lock size={16} />
                {authProvider === "google" ? "Set Password" : "Update Password"}
              </button>
            </form>
          </section>
        </div>

        <section className="profile-actions">
          <button onClick={handleSaveChanges} disabled={saving || isCompressingAvatar} className="profile-save-btn">
            <Save size={18} />
            {saving ? "Saving..." : isCompressingAvatar ? "Compressing image..." : "Save Changes"}
          </button>
          <button onClick={handleLogoutAll} className="profile-logout-btn">
            <LogOut size={18} />
            Logout from All Devices
          </button>
        </section>
      </div>
    </div>
  );
}
