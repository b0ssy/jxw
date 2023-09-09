import { useEffect } from "react";
import jwtDecode from "jwt-decode";
import { z } from "zod";

import { useSelector, useDispatch } from "../redux/store";

export const zJwtPayload = z.object({
  // We are only interested in the expiration time
  exp: z.number(),
});

// Check if access token is expired
// Automatically logout user once expired
export default function CheckTokenExpiry() {
  const accessToken = useSelector((state) => state.app.accessToken);
  const dispatch = useDispatch();

  useEffect(() => {
    // Ensure valid access token
    if (!accessToken) {
      return;
    }

    // Decode JWT
    const decoded = jwtDecode(accessToken);
    const payload = zJwtPayload.safeParse(decoded);
    if (!payload.success) {
      console.error("Invalid access token");
      return;
    }

    // Compute expiry time
    const expiresIn = new Date(payload.data.exp * 1000);

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
