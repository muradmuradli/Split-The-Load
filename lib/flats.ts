import crypto from "crypto";
import { and, eq, inArray } from "drizzle-orm";

import { auth } from "./auth";
import { SKIP_VERIFICATION_EMAIL_HEADER } from "./auth-constants";
import { db } from "./db";
import { flat, membership, user } from "./db/schema";
import { sendEmail } from "./email";

const INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function generateInviteToken() {
  return crypto.randomBytes(32).toString("hex");
}

function inviteUrl(token: string, origin?: string) {
  const base = origin ?? process.env.BETTER_AUTH_URL ?? "http://localhost:3000";
  return `${base}/invite/${token}`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendFlatInviteEmail({
  email,
  flatName,
  token,
  origin,
}: {
  email: string;
  flatName: string;
  token: string;
  origin?: string;
}) {
  const safeFlatName = escapeHtml(flatName);
  await sendEmail({
    to: email,
    subject: `You're invited to join ${flatName} — Split the Load`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="font-size: 20px;">Join ${safeFlatName} on Split the Load</h1>
        <p>You've been invited to split chores fairly with your housemates.</p>
        <p style="margin: 24px 0;">
          <a href="${inviteUrl(token, origin)}" style="display: inline-block; background: #2563eb; color: #fff; padding: 12px 24px; text-decoration: none; font-weight: bold;">Accept invite</a>
        </p>
        <p style="color: #666; font-size: 14px;">This invite link expires in 7 days. If you weren't expecting this, you can ignore this email.</p>
      </div>
    `,
  });
}

/**
 * Creates a flat, auto-adds the creator as a verified admin member, and
 * creates a pending invite (with a single-use token) for every invited
 * email. Invite emails are sent after the DB transaction commits so a
 * delivery failure can't roll back the flat/membership rows.
 */
export async function createFlat({
  name,
  city,
  creatorUserId,
  invitedEmails,
  origin,
}: {
  name: string;
  city: string;
  creatorUserId: string;
  invitedEmails: string[];
  /** Request origin (e.g. "https://splittheload.vercel.app") used to build
   * invite links so they match the host that actually served the request,
   * instead of a possibly-stale BETTER_AUTH_URL fallback. */
  origin?: string;
}) {
  const creator = await db.query.user.findFirst({
    where: eq(user.id, creatorUserId),
  });
  if (!creator) throw new Error("Creator not found");

  // De-dupe and drop the creator's own email — they're added as admin below,
  // and the (flatId, email) unique constraint would otherwise reject it.
  const uniqueInviteEmails = [
    ...new Set(invitedEmails.map((email) => email.trim().toLowerCase())),
  ].filter((email) => email.length > 0 && email !== creator.email.toLowerCase());

  const { newFlat, invites } = await db.transaction(async (tx) => {
    const [newFlat] = await tx
      .insert(flat)
      .values({ name, city, createdBy: creatorUserId })
      .returning();

    await tx.insert(membership).values({
      flatId: newFlat.id,
      userId: creatorUserId,
      email: creator.email,
      role: "admin",
      status: "verified",
    });

    const invites = uniqueInviteEmails.length
      ? await tx
          .insert(membership)
          .values(
            uniqueInviteEmails.map((email) => ({
              flatId: newFlat.id,
              email,
              role: "member" as const,
              status: "pending" as const,
              inviteToken: generateInviteToken(),
              inviteTokenExpiresAt: new Date(Date.now() + INVITE_TOKEN_TTL_MS),
            })),
          )
          .returning()
      : [];

    return { newFlat, invites };
  });

  await Promise.all(
    invites.map((invite) =>
      sendFlatInviteEmail({
        email: invite.email,
        flatName: newFlat.name,
        token: invite.inviteToken!,
        origin,
      }),
    ),
  );

  return { flat: newFlat, invites };
}

type InviteLookupResult =
  | { status: "not_found" }
  | { status: "already_used" }
  | { status: "expired" }
  | {
      status: "valid";
      invite: typeof membership.$inferSelect & {
        flat: typeof flat.$inferSelect;
      };
    };

/** Looks up a pending invite by token and checks it hasn't expired. */
export async function getInviteByToken(token: string): Promise<InviteLookupResult> {
  const invite = await db.query.membership.findFirst({
    where: eq(membership.inviteToken, token),
    with: { flat: true },
  });

  if (!invite) return { status: "not_found" };
  // A verified/no-token row means the invite was already consumed.
  if (invite.status === "verified" || !invite.inviteToken) return { status: "already_used" };
  if (!invite.inviteTokenExpiresAt || invite.inviteTokenExpiresAt < new Date()) {
    return { status: "expired" };
  }

  return { status: "valid", invite };
}

type ResolveInviteResult =
  | InviteLookupResult
  | { status: "linked_existing_user"; flat: typeof flat.$inferSelect }
  | { status: "needs_signup"; invite: typeof membership.$inferSelect & { flat: typeof flat.$inferSelect } };

/**
 * Called when the invitee opens the invite link. If a user already exists
 * for the invited email, links it and verifies the membership immediately.
 * Otherwise signals that the caller should render the signup form.
 */
export async function resolveInvite(token: string): Promise<ResolveInviteResult> {
  const lookup = await getInviteByToken(token);
  if (lookup.status !== "valid") return lookup;

  const existingUser = await db.query.user.findFirst({
    where: eq(user.email, lookup.invite.email),
  });

  if (!existingUser) {
    return { status: "needs_signup", invite: lookup.invite };
  }

  await db
    .update(membership)
    .set({
      userId: existingUser.id,
      status: "verified",
      inviteToken: null,
      inviteTokenExpiresAt: null,
    })
    .where(eq(membership.id, lookup.invite.id));

  return { status: "linked_existing_user", flat: lookup.invite.flat };
}

type CompleteInviteSignupResult =
  | InviteLookupResult
  | { status: "success"; flat: typeof flat.$inferSelect; userId: string };

/**
 * Called when an invitee with no existing account submits the invite
 * signup form. Creates the user via better-auth (so password hashing goes
 * through its normal path), then links and verifies the membership.
 */
export async function completeInviteSignup({
  token,
  name,
  password,
}: {
  token: string;
  name: string;
  password: string;
}): Promise<CompleteInviteSignupResult> {
  const lookup = await getInviteByToken(token);
  if (lookup.status !== "valid") return lookup;

  const { user: newUser } = await auth.api.signUpEmail({
    body: { name, email: lookup.invite.email, password },
    // Skip the emailOTP plugin's post-signup verification email — see
    // auth.ts's sendVerificationOTP callback. Clicking the invite link
    // already proved ownership of this email.
    headers: new Headers({ [SKIP_VERIFICATION_EMAIL_HEADER]: "1" }),
  });

  // better-auth always creates new users as emailVerified: false; mark this
  // one verified directly since the invite link already proved ownership.
  await db.update(user).set({ emailVerified: true }).where(eq(user.id, newUser.id));

  await db
    .update(membership)
    .set({
      userId: newUser.id,
      status: "verified",
      inviteToken: null,
      inviteTokenExpiresAt: null,
    })
    .where(eq(membership.id, lookup.invite.id));

  return { status: "success", flat: lookup.invite.flat, userId: newUser.id };
}

export type FlatMember = {
  id: string;
  userId: string | null;
  name: string | null;
  email: string;
  image: string | null;
  role: "admin" | "member";
  status: "pending" | "verified";
};

export type FlatWithMembers = typeof flat.$inferSelect & {
  members: FlatMember[];
};

/**
 * Every flat the user is a verified member of, each with its full member
 * list (so the dashboard can switch between flats without re-fetching).
 */
export async function getUserFlatsWithMembers(userId: string): Promise<FlatWithMembers[]> {
  const ownMemberships = await db.query.membership.findMany({
    where: and(eq(membership.userId, userId), eq(membership.status, "verified")),
    with: { flat: true },
  });

  const flatIds = ownMemberships.map((m) => m.flatId);
  if (flatIds.length === 0) return [];

  const allMemberships = await db.query.membership.findMany({
    where: inArray(membership.flatId, flatIds),
    with: { user: true },
  });

  return ownMemberships.map(({ flat: theFlat }) => ({
    ...theFlat,
    members: allMemberships
      .filter((m) => m.flatId === theFlat.id)
      .map((m) => ({
        id: m.id,
        userId: m.userId,
        name: m.user?.name ?? null,
        email: m.email,
        image: m.user?.image ?? null,
        role: m.role,
        status: m.status,
      })),
  }));
}

/**
 * Invites a new person to an existing flat. Any verified member of the
 * flat can send an invite; the (flatId, email) unique constraint prevents
 * inviting the same person twice.
 */
export async function inviteMemberToFlat({
  flatId,
  email,
  inviterUserId,
  origin,
}: {
  flatId: string;
  email: string;
  inviterUserId: string;
  origin?: string;
}) {
  const inviterMembership = await db.query.membership.findFirst({
    where: and(
      eq(membership.flatId, flatId),
      eq(membership.userId, inviterUserId),
      eq(membership.status, "verified"),
    ),
  });
  if (!inviterMembership) throw new Error("You're not a member of this flat.");

  const targetFlat = await db.query.flat.findFirst({ where: eq(flat.id, flatId) });
  if (!targetFlat) throw new Error("Flat not found.");

  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) throw new Error("Email is required.");

  const existing = await db.query.membership.findFirst({
    where: and(eq(membership.flatId, flatId), eq(membership.email, normalizedEmail)),
  });
  if (existing) throw new Error("This person has already been invited to this flat.");

  const [invite] = await db
    .insert(membership)
    .values({
      flatId,
      email: normalizedEmail,
      role: "member",
      status: "pending",
      inviteToken: generateInviteToken(),
      inviteTokenExpiresAt: new Date(Date.now() + INVITE_TOKEN_TTL_MS),
    })
    .returning();

  await sendFlatInviteEmail({
    email: normalizedEmail,
    flatName: targetFlat.name,
    token: invite.inviteToken!,
    origin,
  });

  return invite;
}

/**
 * Removes a membership row from a flat — the person's User account is
 * untouched, they're just no longer part of this flat. Only a verified
 * admin of the flat may do this, and an admin can't remove themselves
 * this way (that would leave the flat without one).
 */
export async function removeMembershipFromFlat({
  membershipId,
  actorUserId,
}: {
  membershipId: string;
  actorUserId: string;
}) {
  const target = await db.query.membership.findFirst({
    where: eq(membership.id, membershipId),
  });
  if (!target) throw new Error("Membership not found.");

  const actorMembership = await db.query.membership.findFirst({
    where: and(
      eq(membership.flatId, target.flatId),
      eq(membership.userId, actorUserId),
      eq(membership.status, "verified"),
    ),
  });
  if (!actorMembership || actorMembership.role !== "admin") {
    throw new Error("Only a flat admin can remove members.");
  }
  if (target.userId === actorUserId) {
    throw new Error("You can't remove yourself as the flat admin.");
  }

  await db.delete(membership).where(eq(membership.id, membershipId));
}
