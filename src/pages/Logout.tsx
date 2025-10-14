import { useEffect } from "react";
import { useMsal } from "@azure/msal-react";

export default function Logout() {
  const { instance } = useMsal();

  useEffect(() => {
    // Använder postLogoutRedirectUri från msalConfig (din .env pekar på /login)
    instance.logoutRedirect();
  }, [instance]);

  return <div style={{ padding: 24 }}>Loggar ut…</div>;
}
