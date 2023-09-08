import { useEffect } from "react";
import jwtDecode from "jwt-decode";

import { useSelector, useDispatch } from "../redux/store";

export default function CheckTokenExpiry() {
  const accessToken = useSelector((state) => state.app.accessToken);
  const dispatch = useDispatch();

  useEffect(() => {
    // Ensure valid access token
    if (!accessToken) {
      return;
    }

    // Decode JWT
    const decoded: any = jwtDecode(accessToken);
    if (!decoded || typeof decoded.exp !== "number") {
      console.error("Invalid access token");
      return;
    }

    // Compute expiry time
    const expiresIn = new Date(decoded.exp * 1000);

    // Set timer to clear token upon expiry
    const millisecondsToExpiry = Math.max(
      expiresIn.getTime() - new Date().getTime(),
      0
    );
    const clearTokenTimer = setTimeout(() => {
      console.log("Token expired!");
      dispatch({ type: "app/LOGOUT" });
    }, millisecondsToExpiry);
    return () => {
      clearTimeout(clearTokenTimer);
    };
  }, [accessToken, dispatch]);

  return null;
}
