// import React from "react";
// import Sidebar from "./Sidebar";
// import Topbar from "./Topbar";
// import {Outlet} from "react-router-dom";

// const Layout = ({ children }) => {
//   return (
//     <div className="flex bg-gray-100 min-h-screen">
//       <Sidebar />
//       <div className="flex-1">
//         <Topbar />
//         <main className="p-6">{children}</main>
//       </div>
//     </div>
//   );
// };

// export default Layout;

import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import  "./layout.css";
import { Outlet } from "react-router-dom";

function Layout() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <div style={{ flex: 1 }}>
        <Topbar />
        <div style={{ padding: 20 }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default Layout;

