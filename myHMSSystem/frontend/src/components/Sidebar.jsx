// import React from "react";
// import { Link } from "react-router-dom";

// const Sidebar = () => {
//   const role = localStorage.getItem("role"); // "admin", "doctor", etc.

//   const menus = {
//     admin: [
//       { label: "Dashboard", path: "/admin" },
//       { label: "Register User", path: "/admin/register-user" },
//     ],
//     doctor: [
//       { label: "Consultation Queue", path: "/doctor" },
//       { label: "Patient Records", path: "/doctor/records" },
//     ],
//     nurse: [{ label: "Triage", path: "/nurse/triage" }],
//     reception: [{ label: "Register Patient", path: "/reception" }],
//     lab: [{ label: "Lab Tests", path: "/lab" }],
//   };

//   return (
//     <aside className="w-56 bg-slate-800 text-white p-4">
//       <h2 className="font-bold text-xl mb-4">HMIS</h2>
//       <nav>
//         {menus[role]?.map((item, idx) => (
//           <Link
//             key={idx}
//             to={item.path}
//             className="block py-2 px-2 rounded hover:bg-slate-700"
//           >
//             {item.label}
//           </Link>
//         ))}
//       </nav>
//     </aside>
//   );
// };

// export default Sidebar;

import { NavLink } from "react-router-dom";


const linkStyle = ({ isActive }) => ({
  display: "block",
  padding: "10px 12px",
  borderRadius: 10,
  textDecoration: "none",
  color: isActive ? "#fff" : "#111",
  background: isActive ? "#111" : "transparent",
});

const sectionTitle = {
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: 1,
  opacity: 0.7,
  margin: "16px 0 8px",
};

const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

function Sidebar() {
  const user = getUser();
  const role = user?.role || "USER";

  // Adjust these routes to match your app
  const coreLinks = [
    { label: "Dashboard", path: "/dashboard" },
    { label: "Reception", path: "/reception" },
    { label: "Triage", path: "/triage" },
    { label: "OPD (Doctor)", path: "/opd" },
  ];

  const clinicalLinks = [
    { label: "Laboratory", path: "/lab" },
    { label: "Theatre", path: "/theatre" },
    { label: "Maternity", path: "/maternity" },
    { label: "Blood Bank", path: "/bloodbank" },
    { label: "IPD (Wards)", path: "/ipd" },
  ];

  const adminLinks = [
    { label: "Billing", path: "/billing" },
    { label: "Pharmacy", path: "/pharmacy" },
    { label: "Users", path: "/users" }, // admin
    { label: "Reports", path: "/reports" },
    { label: "Settings", path: "/settings" },
  ];

  // Simple role gating (edit as needed)
  const canSeeAdmin = role === "ADMIN";

  return (

      <aside
        style={{
          width: 260,
          padding: 16,
          borderRight: "1px solid #eee",
          height: "100vh",
          position: "sticky",
          top: 0,
          background: "#f9f9f9",
        }}
      >
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontWeight: 800, fontSize: 18 }}>LifePoint HMS</div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {user?.name || "User"} • {role}
          </div>
        </div>

        <div style={sectionTitle}>Core</div>
        <div style={{ display: "grid", gap: 6 }}>
          {coreLinks.map((l) => (
            <NavLink key={l.path} to={l.path} style={linkStyle}>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div style={sectionTitle}>Clinical</div>
        <div style={{ display: "grid", gap: 6 }}>
          {clinicalLinks.map((l) => (
            <NavLink key={l.path} to={l.path} style={linkStyle}>
              {l.label}
            </NavLink>
          ))}
        </div>

        <div style={sectionTitle}>Operations</div>
        <div style={{ display: "grid", gap: 6 }}>
          {adminLinks
            .filter((l) => (l.path === "/users" ? canSeeAdmin : true))
            .map((l) => (
              <NavLink key={l.path} to={l.path} style={linkStyle}>
                {l.label}
              </NavLink>
            ))}
        </div>
      </aside>
    
  );
}

export default Sidebar;