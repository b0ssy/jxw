import crypto from "crypto";
import jwt from "jsonwebtoken";

import { ENV } from "../config";
import { db } from "../data";
import { Controller } from "../data/api";
import { JWTPayload } from "../data/session";
import {
  BadRequestError,
  InternalServerError,
  NotAuthorizedError,
} from "../errors";

export class AuthController extends Controller {
  // Create new user account
  createUser = async (email: string, password: string) => {
    // Validate email
    if (!AuthController.isValidEmail(email)) {
      throw new BadRequestError("Please provide valid email", "invalid_email");
    }

    // Validate password
    if (!password) {
      throw new BadRequestError(
        "Please provide valid password",
        "invalid_password"
      );
    }

    // TODO: Check duplicate email or check insert error unique violation

    // Create an empty user
    const now = new Date();
    const insertResult = await db.users.insertOne({
      createdAt: now,
      updatedAt: now,
      email,
    });

    // Create password hash based on user id + password
    const passwordHash = AuthController.createPasswordHash(
      password,
      insertResult.insertedId.toHexString()
    );

    // Update user's password hash
    const updateResult = await db.users.updateOne(
      { _id: insertResult.insertedId },
      { $set: { passwordHash } }
    );
    if (updateResult.modifiedCount !== 1) {
      throw new InternalServerError();
    }

    return { _id: insertResult.insertedId };
  };

  // Login to user account
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
    const passwordHash = AuthController.createPasswordHash(password, userId);
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

  // Create a hashed password with salt
  // If no salt is provided, a salt will be auto-generated
  // for hashing with the password
  // Returns hashed password and salt
  static createPasswordHash = (password: string, salt: string) => {
    const passwordHash = crypto
      .createHash("sha256")
      .update(password + salt)
      .digest("hex");
    return passwordHash;
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
