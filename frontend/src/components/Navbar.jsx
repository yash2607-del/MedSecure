import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { User } from "lucide-react";
import { api } from "../lib/api";
import "bootstrap/dist/css/bootstrap.min.css";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [session, setSession] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/auth/me");
        setSession(res.data.user);
      } catch (e) {
        setSession(null);
      }
    })();
  }, [location.pathname]);

  const handleLogout = async () => {
    try { await api.post("/auth/logout", {}); } catch {}
    setSession(null);
    navigate("/");
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold" to={session ? "/dashboard" : "/"}>
          MedSecure
        </Link>

        {session && (
          <div className="ms-auto">
            <div className="dropdown">
              <button
                className="btn btn-link text-white text-decoration-none dropdown-toggle d-flex align-items-center"
                type="button"
                id="userDropdown"
                data-bs-toggle="dropdown"
                aria-expanded="false"
              >
                <User size={20} className="me-2" />
                <span>{session.username}</span>
              </button>
              <ul className="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
                <li>
                  <button className="dropdown-item" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
