import crypto from "crypto";
import jwt from "jsonwebtoken";
import { z } from "zod";

import { ENV } from "../config";
import { db } from "../data";
import { Controller } from "../data/api";
import { JWTPayload } from "../data/session";
import { BadRequestError, NotAuthorizedError } from "../errors";

export const zTokens = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});
export type Tokens = z.infer<typeof zTokens>;

export class AuthController extends Controller {
  // Login
  login = async (email: string, password: string) => {
    // Validate email
    if (!AuthController.isValidEmail(email)) {
      throw new BadRequestError(
        "Please provide valid credentials",
        "invalid_credentials"
      );
    }

    // Ensure user with email exists
    const user = await db.users.findOne({ email });
    if (!user) {
      throw new NotAuthorizedError(
        "Please provide valid credentials",
        "invalid_credentials"
      );
    }
    const userId = user._id.toHexString();

    // Check if password hash matches
    const { passwordHash } = AuthController.createPasswordHash(
      password,
      userId
    );
    if (passwordHash !== user.passwordHash) {
      throw new NotAuthorizedError(
        "Please provide valid credentials",
        "invalid_credentials"
      );
    }

    // Create access token
    const accessToken = await this.createAccessToken(userId);

    return { userId, accessToken };
  };

  // Create access token
  createAccessToken = async (userId: string, expiresInSecs?: number) => {
    const payload: JWTPayload = {
      userId,
    };
    const signOptions: jwt.SignOptions = {
      issuer: ENV.JWT_ISSUER,
      expiresIn: expiresInSecs ?? ENV.JWT_EXPIRY_SECONDS,
    };
    return jwt.sign(payload, ENV.JWT_SECRET, signOptions);
  };

  // Create a hashed password with uuid salt
  // If no salt is provided, a salt will be auto-generated
  // for hashing with the password
  // Returns hashed password and salt
  static createPasswordHash = (password: string, uuid: string) => {
    const passwordHash = crypto
      .createHash("sha256")
      .update(password + uuid)
      .digest("hex");
    return { passwordHash, uuid };
  };

  // Check if email address format is valid
  // RFC2822
  // https://regexr.com/2rhq7
  static isValidEmail = (email: string) => {
    return !!email.match(
      // eslint-disable-next-line
      /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g
    );
  };
}
