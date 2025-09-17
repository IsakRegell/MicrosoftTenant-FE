import React from "react";
import { createBrowserRouter, type RouteObject } from "react-router-dom";
import App from "./App";

const routes: RouteObject[] = [
  { path: "/*", element: <App /> }, // App innehåller <Routes> med dina sidor
];

export const router = createBrowserRouter(routes, {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
});

export default router;
