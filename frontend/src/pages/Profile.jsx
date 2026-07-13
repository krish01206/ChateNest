import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { updateProfile, changePassword, uploadProfilePic } from "../services/userService";
import { FiArrowLeft, FiCamera, FiCheck, FiLock, FiUser, FiInfo } from "react-icons/fi";

function Profile() {
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);

  // States
  const [profileForm, setProfileForm] = useState({
    name: user?.name || "",
    email: user?.email || ""
  });
  
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingAvatar, setLoadingAvatar] = useState(false);

  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const handleProfileChange = (e) => {
    setProfileForm({
      ...profileForm,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordForm({
      ...passwordForm,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoadingProfile(true);
    setProfileSuccess("");
    setProfileError("");

    try {
      const data = await updateProfile(profileForm);
      // Merge changes into current local user state
      const updatedUser = { ...user, name: data.user.name, email: data.user.email };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setProfileSuccess("Profile details updated successfully!");
    } catch (err) {
      setProfileError(err.response?.data?.message || "Could not update profile details.");
    } finally {
      setLoadingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      return;
    }

    setLoadingPassword(true);
    setPasswordSuccess("");
    setPasswordError("");

    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordSuccess("Password updated successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (err) {
      setPasswordError(err.response?.data?.message || "Failed to update password. Verify current password.");
    } finally {
      setLoadingPassword(false);
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Check size limit: 5MB
    if (file.size > 5 * 1024 * 1024) {
      setProfileError("File size is too large (maximum 5MB).");
      return;
    }

    setLoadingAvatar(true);
    setProfileSuccess("");
    setProfileError("");

    const formData = new FormData();
    formData.append("profilePic", file);

    try {
      const data = await uploadProfilePic(formData);
      const updatedUser = { ...user, profilePic: data.profilePic };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setProfileSuccess("Avatar uploaded successfully!");
    } catch (err) {
      setProfileError(err.response?.data?.message || "Avatar upload failed. Please try again.");
    } finally {
      setLoadingAvatar(false);
    }
  };

  return (
    <div className="container py-5 min-vh-100 d-flex flex-column justify-content-center" style={{ position: "relative" }}>
      
      {/* Back Button */}
      <div className="mb-4 animate-fade-in-up">
        <button
          onClick={() => navigate("/home")}
          className="btn p-0 nav-link-premium d-inline-flex align-items-center gap-2 border-0 bg-transparent text-secondary"
          style={{ cursor: "pointer", fontSize: "0.95rem" }}
        >
          <FiArrowLeft size={18} />
          Back to chats
        </button>
      </div>

      <div className="row g-4 animate-fade-in-up">
        
        {/* Left Side: Avatar Upload & Info */}
        <div className="col-12 col-md-4">
          <div className="glass-panel p-4 text-center h-100 d-flex flex-column justify-content-center align-items-center">
            
            <h5 className="fw-bold mb-4 text-light">Profile Picture</h5>

            <div className="profile-pic-container mb-3">
              <img
                src={user?.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png"}
                alt={user?.name}
                className="w-100 h-100"
                style={{ objectFit: "cover" }}
              />
              <label htmlFor="avatar-file-input" className="profile-pic-overlay m-0 cursor-pointer">
                <FiCamera size={24} className="mb-1" />
                <span>Upload Photo</span>
              </label>
            </div>

            <input
              type="file"
              id="avatar-file-input"
              accept="image/*"
              className="d-none"
              onChange={handleAvatarChange}
              disabled={loadingAvatar}
            />

            {loadingAvatar ? (
              <div className="text-secondary small mt-2">
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Uploading image...
              </div>
            ) : (
              <p className="text-secondary small mt-2">Click avatar to select a custom file (JPEG, PNG, max 5MB)</p>
            )}

            <div className="mt-4 border-top pt-4 w-100 text-start">
              <div className="d-flex align-items-center gap-2 text-secondary mb-2 small">
                <FiUser />
                <span>Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "unknown"}</span>
              </div>
              <div className="d-flex align-items-center gap-2 text-secondary small">
                <FiInfo />
                <span>Secure account status verified</span>
              </div>
            </div>

          </div>
        </div>

        {/* Right Side: Account Forms */}
        <div className="col-12 col-md-8">
          <div className="d-flex flex-column gap-4">
            
            {/* Form 1: Edit profile details */}
            <div className="glass-panel p-4 p-md-5">
              <div className="d-flex align-items-center gap-2 mb-4">
                <FiUser className="text-primary" size={20} />
                <h5 className="fw-bold mb-0 text-light">Personal Details</h5>
              </div>

              {profileSuccess && (
                <div className="alert alert-success py-2 px-3 mb-4 text-start small border-0 d-flex align-items-center gap-2" style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#34d399", borderRadius: "8px" }}>
                  <FiCheck />
                  {profileSuccess}
                </div>
              )}

              {profileError && (
                <div className="alert alert-danger py-2 px-3 mb-4 text-start small border-0" style={{ backgroundColor: "rgba(220, 53, 69, 0.15)", color: "#f87171", borderRadius: "8px" }}>
                  {profileError}
                </div>
              )}

              <form onSubmit={handleProfileSubmit}>
                <div className="row g-3">
                  <div className="col-12 col-sm-6">
                    <label className="form-label text-secondary small fw-semibold">Name</label>
                    <input
                      type="text"
                      name="name"
                      className="form-control premium-input"
                      value={profileForm.name}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label text-secondary small fw-semibold">Email Address</label>
                    <input
                      type="email"
                      name="email"
                      className="form-control premium-input"
                      value={profileForm.email}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                </div>

                <div className="mt-4 text-end">
                  <button
                    type="submit"
                    className="premium-btn-primary px-4 py-2"
                    disabled={loadingProfile}
                  >
                    {loadingProfile ? "Saving changes..." : "Save Details"}
                  </button>
                </div>
              </form>
            </div>

            {/* Form 2: Change Password */}
            <div className="glass-panel p-4 p-md-5">
              <div className="d-flex align-items-center gap-2 mb-4">
                <FiLock className="text-primary" size={20} />
                <h5 className="fw-bold mb-0 text-light">Change Password</h5>
              </div>

              {passwordSuccess && (
                <div className="alert alert-success py-2 px-3 mb-4 text-start small border-0 d-flex align-items-center gap-2" style={{ backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#34d399", borderRadius: "8px" }}>
                  <FiCheck />
                  {passwordSuccess}
                </div>
              )}

              {passwordError && (
                <div className="alert alert-danger py-2 px-3 mb-4 text-start small border-0" style={{ backgroundColor: "rgba(220, 53, 69, 0.15)", color: "#f87171", borderRadius: "8px" }}>
                  {passwordError}
                </div>
              )}

              <form onSubmit={handlePasswordSubmit}>
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label text-secondary small fw-semibold">Current Password</label>
                    <input
                      type="password"
                      name="currentPassword"
                      className="form-control premium-input"
                      placeholder="••••••••"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label text-secondary small fw-semibold">New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      className="form-control premium-input"
                      placeholder="••••••••"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  <div className="col-12 col-sm-6">
                    <label className="form-label text-secondary small fw-semibold">Confirm New Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      className="form-control premium-input"
                      placeholder="••••••••"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                </div>

                <div className="mt-4 text-end">
                  <button
                    type="submit"
                    className="premium-btn-primary px-4 py-2"
                    disabled={loadingPassword}
                  >
                    {loadingPassword ? "Updating password..." : "Update Password"}
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default Profile;