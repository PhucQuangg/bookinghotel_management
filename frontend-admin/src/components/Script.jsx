import { useEffect } from "react";

function Script() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const fullName = params.get("userName");
    const role = params.get("role");

    if (token) {
      sessionStorage.setItem("admin_token", token);
      sessionStorage.setItem("admin_username", fullName);
      sessionStorage.setItem("role", role);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const savedToken = sessionStorage.getItem("admin_token");
    if (!savedToken) {
      window.location.href = "http://localhost:3000/login";
      return;
    }
  }, []);
}

export default Script;
