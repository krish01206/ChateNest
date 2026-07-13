import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { loginUser } from "../services/authService";
import { AuthContext } from "../context/AuthContext";

function Login() {
  const navigate = useNavigate();
  const { setUser } = useContext(AuthContext);

  const [form, setForm] = useState({
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
    if (!form.email || !form.password) {
      setErrorMsg("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      const data = await loginUser(form);
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setUser(data.user);
      navigate("/home");
    } catch (err) {
      setErrorMsg(err.response?.data?.message || "Login failed. Please check credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid min-vh-100 d-flex align-items-center justify-content-center py-5" style={{ position: "relative", overflow: "hidden" }}>
      {/* Decorative Blur Spheres */}
      <div style={{
        position: "absolute",
        top: "20%",
        left: "15%",
        width: "300px",
        height: "300px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
        filter: "blur(40px)",
        pointerEvents: "none"
      }} />
      <div style={{
        position: "absolute",
        bottom: "15%",
        right: "10%",
        width: "350px",
        height: "350px",
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, transparent 70%)",
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
                ChatNest
              </h2>
              <p className="text-secondary small">Your modern premium communication space</p>
            </div>

            {errorMsg && (
              <div className="alert alert-danger py-2 px-3 mb-4 text-start small border-0" style={{ backgroundColor: "rgba(220, 53, 69, 0.15)", color: "#f87171", borderRadius: "8px" }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="text-start">
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
                <label className="form-label text-secondary small fw-semibold">Password</label>
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
                    Signing in...
                  </>
                ) : (
                  "Login"
                )}
              </button>
            </form>

            <p className="mt-4 text-secondary small">
              New to ChatNest?{" "}
              <Link to="/register" style={{ color: "#a78bfa", textDecoration: "none", fontWeight: "600" }} className="hover-underline">
                Create Account
              </Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;