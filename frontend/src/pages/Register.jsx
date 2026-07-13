import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { registerUser } from "../services/authService";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setErrorMsg("All fields are required.");
      return;
    }
    if (form.password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      await registerUser(form);
      navigate("/");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center py-5" style={{ position: "relative", overflow: "hidden" }}>
      {/* Decorative Blur Spheres */}
      <div style={{
        position: "absolute",
        top: "15%",
        right: "15%",
        width: "300px",
        height: "300px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
        filter: "blur(40px)",
        pointerEvents: "none"
      }} />
      <div style={{
        position: "absolute",
        bottom: "20%",
        left: "10%",
        width: "350px",
        height: "350px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
        filter: "blur(45px)",
        pointerEvents: "none"
      }} />

      <div className="row justify-content-center w-100 animate-fade-in-up">
        <div className="col-11 col-sm-8 col-md-6 col-lg-4">
          <div className="glass-panel p-4 p-md-5 text-center">
            
            <div className="mb-4">
              <h2 className="fw-bold mb-1" style={{
                background: "linear-gradient(135deg, #a78bfa 0%, #60a5fa 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontSize: "2.2rem",
                letterSpacing: "-0.5px"
              }}>
                Create Account
              </h2>
              <p className="text-secondary small">Join ChatNest messaging network</p>
            </div>

            {errorMsg && (
              <div className="alert alert-danger py-2 px-3 mb-4 text-start small border-0" style={{ backgroundColor: "rgba(220, 53, 69, 0.15)", color: "#f87171", borderRadius: "8px" }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="text-start">
              <div className="mb-3">
                <label className="form-label text-secondary small fw-semibold">Your Name</label>
                <input
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  className="form-control premium-input"
                  onChange={handleChange}
                  value={form.name}
                  required
                />
              </div>

              <div className="mb-3">
                <label className="form-label text-secondary small fw-semibold">Email Address</label>
                <input
                  type="email"
                  name="email"
                  placeholder="name@example.com"
                  className="form-control premium-input"
                  onChange={handleChange}
                  value={form.email}
                  required
                />
              </div>

              <div className="mb-4">
                <label className="form-label text-secondary small fw-semibold">Password (min. 6 chars)</label>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  className="form-control premium-input"
                  onChange={handleChange}
                  value={form.password}
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="premium-btn-primary w-100 py-3 d-flex align-items-center justify-content-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                    Registering...
                  </>
                ) : (
                  "Register"
                )}
              </button>
            </form>

            <p className="mt-4 text-secondary small">
              Already have an account?{" "}
              <Link to="/" style={{ color: "#a78bfa", textDecoration: "none", fontWeight: "600" }} className="hover-underline">
                Sign In
              </Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;