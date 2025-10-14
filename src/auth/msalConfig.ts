// src/auth/msalConfig.ts
// Minimal MSAL-konfiguration för din SPA.
// Läser värden från .env (Vite kräver prefixet VITE_).

import { PublicClientApplication, Configuration, LogLevel } from "@azure/msal-browser";

// 1) Läs in env-variabler (måste vara satta i .env)
const clientId  = import.meta.env.VITE_AZURE_CLIENT_ID as string;       // Frontend-appens Client ID
const tenantId  = import.meta.env.VITE_AZURE_TENANT_ID as string;       // Directory (tenant) ID
const redirect  = import.meta.env.VITE_AZURE_REDIRECT_URI as string;    // t.ex. http://localhost:8080/admin
const logoutUri = import.meta.env.VITE_AZURE_LOGOUT_URI as string;      // t.ex. http://localhost:8080/login

// 2) Bas-konfiguration (Auth code + PKCE – standard i msal-browser)
export const msalConfig: Configuration = {
  auth: {
    clientId: clientId,
    authority: `https://login.microsoftonline.com/${tenantId}`, // Single-tenant
    redirectUri: redirect,                // VIKTIGT: måste vara registrerad som SPA-redirect i portalen
    postLogoutRedirectUri: logoutUri,     // Vart vi landar efter utloggning
    navigateToLoginRequestUrl: false,     // Stanna på nuvarande sida efter redirect
  },
  cache: {
    cacheLocation: "localStorage",        // Låt token ligga kvar efter refresh (enklare dev)
    storeAuthStateInCookie: false,        // Sätt true om du måste stödja äldre IE/Edge
  },
  system: {
    loggerOptions: {
      // Tyst logg, men visa fel i konsolen under utveckling
      loggerCallback: (level, message) => {
        if (level === LogLevel.Error) console.error("[MSAL]", message);
      },
      logLevel: LogLevel.Warning,
    },
  },
};

// 3) Skapa klientinstansen som vi senare matar in i <MsalProvider>
export const pca = new PublicClientApplication(msalConfig);

// 4) OIDC-basscope (kräver ingen adminconsent). API-scopes lägger vi till senare.
export const baseLoginRequest = {
  scopes: ["openid", "profile", "email"],
};
