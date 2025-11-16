import React, { useState } from "react";
import { api } from "../lib/api";
import { Form, Button, Spinner } from "react-bootstrap";
import { toast, ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
  await api.post("/auth/login", { email, password });
      toast.success("Logged in successfully");
      setTimeout(() => nav("/dashboard"), 500);
    } catch (err) {
      toast.error(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-welcome-panel">
        <div className="auth-welcome-content">
          <h1>Welcome, Doctor</h1>
          <p>Secure steganography-based patient data exchange</p>
          <ul className="feature-list">
            <li>Hide patient info in images and audio files</li>
            <li>Send encrypted data to colleague doctors</li>
            <li>Track all activities with complete audit logs</li>
          </ul>
        </div>
      </div>
      <div className="auth-form-panel">
        <div className="auth-form-content">
          <h3>Doctor Login</h3>
          <Form onSubmit={submit}>
            <Form.Group className="mb-3">
              <Form.Label>EMAIL</Form.Label>
              <Form.Control 
                type="email"
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                disabled={loading}
              />
            </Form.Group>
            <Form.Group className="mb-4">
              <Form.Label>PASSWORD</Form.Label>
              <div style={{ position: 'relative' }}>
                <Form.Control 
                  type={showPassword ? "text" : "password"} 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '10px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6c757d'
                  }}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </Form.Group>
            <Button type="submit" className="w-100" disabled={loading}>
              {loading ? <Spinner animation="border" size="sm" /> : "Login"}
            </Button>
            <div className="auth-mode-toggle">
              <p className="text-muted mb-0">
                Don't have an account? <Link to="/register">Sign Up</Link>
              </p>
            </div>
          </Form>
        </div>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Login;

