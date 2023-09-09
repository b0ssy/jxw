import "@radix-ui/themes/styles.css";
import { Theme } from "@radix-ui/themes";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { ENV } from "./config";
import { ROUTES } from "./routes";
import CheckTokenExpiry from "./containers/CheckTokenExpiry";
import Home from "./containers/pages/Home";
import Login from "./containers/pages/Login";
import { Backend } from "./lib/backend";
import { useSelector } from "./redux/store";

function App() {
  const themeMode = useSelector((state) => state.app.themeMode);
  const accessToken = useSelector((state) => state.app.accessToken);
  const isLoggedIn = !!accessToken;
  return (
    <>
      {/* UI */}
      <Theme appearance={themeMode} style={{ height: "100vh" }}>
        {/* Bug: Cannot use ENV.BASE_URL */}
        <Backend baseUrl={ENV.VITE_PROXY_BACKEND} accessToken={accessToken}>
          <BrowserRouter>
            <Routes>
              {/* Routes when logged in */}
              {isLoggedIn && (
                <>
                  <Route path={ROUTES.home} element={<Home />} />
                  <Route path="*" element={<Navigate to={ROUTES.home} />} />
                </>
              )}
              
              {/* Routes when logged out */}
              {!isLoggedIn && (
                <>
                  <Route path={ROUTES.login} element={<Login />} />
                  <Route path="*" element={<Navigate to={ROUTES.login} />} />
                </>
              )}
            </Routes>
          </BrowserRouter>
        </Backend>
      </Theme>

      {/* Background operations */}
      <CheckTokenExpiry />
    </>
  );
}

export default App;
