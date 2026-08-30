import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  boolean,
  date,
  index,
  uniqueIndex,
  uuid,
  pgEnum,
} from "drizzle-orm/pg-core";

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    issuer: text("issuer").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const membershipRoleEnum = pgEnum("membership_role", [
  "admin",
  "member",
]);
export const membershipStatusEnum = pgEnum("membership_status", [
  "pending",
  "verified",
]);

export const flat = pgTable("flat", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  city: text("city").notNull(),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "restrict" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const membership = pgTable(
  "membership",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    flatId: uuid("flat_id")
      .notNull()
      .references(() => flat.id, { onDelete: "cascade" }),
    // Null until the invite is accepted and linked to a real account.
    userId: text("user_id").references(() => user.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: membershipRoleEnum("role").notNull().default("member"),
    status: membershipStatusEnum("status").notNull().default("pending"),
    // Null once the invite has been consumed (single-use) or for the
    // creator's own admin row, which is never invited via token.
    inviteToken: text("invite_token").unique(),
    inviteTokenExpiresAt: timestamp("invite_token_expires_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex("membership_flat_email_idx").on(table.flatId, table.email),
    index("membership_invite_token_idx").on(table.inviteToken),
    index("membership_flatId_idx").on(table.flatId),
    index("membership_userId_idx").on(table.userId),
  ],
);

export const taskEffortEnum = pgEnum("task_effort", [
  "quick",
  "medium",
  "heavy",
]);
export const taskStatusEnum = pgEnum("task_status", ["todo", "done"]);

export const task = pgTable(
  "task",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    flatId: uuid("flat_id")
      .notNull()
      .references(() => flat.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    effort: taskEffortEnum("effort").notNull(),
    status: taskStatusEnum("status").notNull().default("todo"),
    // Null means unassigned (shouldn't normally happen — "auto" resolves to
    // a member at creation time — but a member's removal from the flat also
    // nulls this out rather than deleting the task).
    assigneeMembershipId: uuid("assignee_membership_id").references(
      () => membership.id,
      {
        onDelete: "set null",
      },
    ),
    createdBy: text("created_by")
      .notNull()
      .references(() => user.id, { onDelete: "restrict" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index("task_flatId_idx").on(table.flatId),
    index("task_assigneeMembershipId_idx").on(table.assigneeMembershipId),
  ],
);

export const userRelations = relations(user, ({ many }) => ({
  sessions: many(session),
  accounts: many(account),
  flatsCreated: many(flat),
  memberships: many(membership),
  tasksCreated: many(task),
}));

export const flatRelations = relations(flat, ({ one, many }) => ({
  creator: one(user, {
    fields: [flat.createdBy],
    references: [user.id],
  }),
  memberships: many(membership),
  tasks: many(task),
}));

export const membershipRelations = relations(membership, ({ one, many }) => ({
  flat: one(flat, {
    fields: [membership.flatId],
    references: [flat.id],
  }),
  user: one(user, {
    fields: [membership.userId],
    references: [user.id],
  }),
  assignedTasks: many(task),
}));

export const taskRelations = relations(task, ({ one }) => ({
  flat: one(flat, {
    fields: [task.flatId],
    references: [flat.id],
  }),
  assignee: one(membership, {
    fields: [task.assigneeMembershipId],
    references: [membership.id],
  }),
  creator: one(user, {
    fields: [task.createdBy],
    references: [user.id],
  }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));
