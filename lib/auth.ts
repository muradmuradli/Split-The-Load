import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { emailOTP } from "better-auth/plugins";

import { db } from "./db";
import * as schema from "./db/schema";
import { sendEmail } from "./email";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  // A static baseURL/BETTER_AUTH_URL breaks on Vercel: the origin-check
  // middleware rejects any request whose Origin doesn't match it, and
  // BETTER_AUTH_URL only ever points at one deployment. Resolving baseURL
  // per-request against an allowlist fixes this for the production domain
  // and every preview deployment alike.
  baseURL: {
    allowedHosts: ["localhost:3000", "splittheload.vercel.app", "*.vercel.app"],
    fallback: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  },
  advanced: {
    // Vercel's edge network terminates TLS and forwards the original
    // host/protocol via these headers; trust them so baseURL resolves to
    // https://splittheload.vercel.app instead of an internal http URL.
    trustedProxyHeaders: true,
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    async sendResetPassword({ user, url }) {
      await sendEmail({
        to: user.email,
        subject: "Reset your password — Split the Load",
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h1 style="font-size: 20px;">Reset your password</h1>
            <p>Click the button below to choose a new password. This link expires in 1 hour.</p>
            <p style="margin: 24px 0;">
              <a href="${url}" style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; font-weight: bold;">Reset your password</a>
            </p>
            <p style="color: #666; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
          </div>
        `,
      });
    },
  },
  plugins: [
    emailOTP({
      // Already the default — set explicitly since a 6-character code is required.
      otpLength: 6,
      sendVerificationOnSignUp: true,
      async sendVerificationOTP({ email, otp }) {
        await sendEmail({
          to: email,
          subject: "Verify your email — Split the Load",
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h1 style="font-size: 20px;">Verify your email</h1>
              <p>Enter this code to verify your email address:</p>
              <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px;">${otp}</p>
              <p style="color: #666; font-size: 14px;">This code expires in 5 minutes. If you didn't request this, you can ignore this email.</p>
            </div>
          `,
        });
      },
    }),
    // Must stay last — see better-auth's next-cookies plugin ordering warning.
    nextCookies(),
  ],
});
