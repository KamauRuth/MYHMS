import { useLocation, useNavigate } from "react-router-dom";

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

const titleFromPath = (pathname) => {
  const map = {
    "/dashboard": "Dashboard",
    "/reception": "Reception",
    "/triage": "Triage",
    "/opd": "OPD (Doctor)",
    "/lab": "Laboratory",
    "/theatre": "Theatre",
    "/maternity": "Maternity",
    "/bloodbank": "Blood Bank",
    "/billing": "Billing",
    "/ipd": "IPD (Wards)",
    "/pharmacy": "Pharmacy",
    "/users": "Users",
    "/reports": "Reports",
    "/settings": "Settings",
  };

  // Support nested routes like /opd/123
  const base = "/" + (pathname.split("/")[1] || "");
  return map[pathname] || map[base] || "Hospital System";
};

function Topbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = getUser();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
   
      <header
        style={{
          height: 64,
          padding: "0 16px",
          borderBottom: "1px solid #eee",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#fff",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{titleFromPath(pathname)}</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {new Date().toLocaleString()}
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.name || "User"}</div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>{user?.role || "USER"}</div>
          </div>

          <button
            onClick={logout}
            style={{
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #eee",
              background: "#111",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </header>
    
  );
}

export default Topbar;

// import { useAuth } from "../../context/AuthContext";

// function Topbar() {
//   const { user } = useAuth();

//   return (
//     <div style={{
//       padding: "12px 20px",
//       borderBottom: "1px solid #eee",
//       display: "flex",
//       justifyContent: "space-between"
//     }}>
//       <strong>Hospital Management System</strong>
//       <span>{user?.name} — {user?.role}</span>
//     </div>
//   );
// }

// export default Topbar;
