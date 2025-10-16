// src/main.tsx
import React from "react";
import { createRoot } from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import router from "./router";
import "./index.css";
//Import MSAL provider och våran instans
import { MsalProvider } from "@azure/msal-react";
import { pca } from "./auth/msalConfig";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <MsalProvider instance={pca}>
    <RouterProvider router={router} />
    </MsalProvider>
  </React.StrictMode>
);
