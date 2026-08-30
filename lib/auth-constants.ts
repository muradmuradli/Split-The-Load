/**
 * Header used internally to tell auth.ts's sendVerificationOTP callback to
 * skip sending the "verify your email" OTP for a signup. Used by the invite
 * signup flow (lib/flats.ts), where clicking the invite link already proved
 * ownership of the email — a second verification step would be redundant.
 */
export const SKIP_VERIFICATION_EMAIL_HEADER = "x-skip-verification-email";
