import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import ProtectedRoute from "@/components/ProtectedRoute";
import AdminPanel from "./pages/AdminPanel";
import CustomerView from "./pages/CustomerView";
import Login from "./pages/Login";
import Logout from "./pages/Logout";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();
const AUTH_DISABLED = (import.meta as any).env?.VITE_AUTH_DISABLED === "true";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />

        {AUTH_DISABLED ? (
          // 🔧 DEV-LÄGE: bara admin, ingen ProtectedRoute
          <Routes>
            <Route path="/" element={<AdminPanel />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        ) : (
          // 🔒 NORMALT LÄGE: ordinarie rutter med Entra-skydd
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/logout" element={<Logout />} />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer"
              element={
                <ProtectedRoute>
                  <CustomerView />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        )}
      </TooltipProvider>
    </QueryClientProvider>
  );
}




// // src/App.tsx
// import { Routes, Route, Navigate } from "react-router-dom";
// import { Toaster } from "@/components/ui/toaster";
// import { TooltipProvider } from "@/components/ui/tooltip";
// import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// // Använd vår MSAL-baserade ProtectedRoute
// import ProtectedRoute from "@/components/ProtectedRoute";

// import AdminPanel from "./pages/AdminPanel";
// import CustomerView from "./pages/CustomerView";
// import Login from "./pages/Login";
// import Logout from "./pages/Logout";
// import NotFound from "./pages/NotFound";

// const queryClient = new QueryClient();

// export default function App() {
//   return (
//     <QueryClientProvider client={queryClient}>
//       <TooltipProvider>
//         <Toaster />
//         <Routes>
//           {/* Start → login */}
//           <Route path="/" element={<Navigate to="/login" replace />} />

//           {/* Publika rutter */}
//           <Route path="/login" element={<Login />} />
//           <Route path="/logout" element={<Logout />} />

//           {/* Skyddade rutter (MSAL) */}
//           <Route
//             path="/admin"
//             element={
//               <ProtectedRoute>
//                 <AdminPanel />
//               </ProtectedRoute>
//             }
//           />

//           <Route
//             path="/customer"
//             element={
//               <ProtectedRoute>
//                 <CustomerView />
//               </ProtectedRoute>
//             }
//           />

//           {/* 404 */}
//           <Route path="*" element={<NotFound />} />
//         </Routes>
//       </TooltipProvider>
//     </QueryClientProvider>
//   );
// }
