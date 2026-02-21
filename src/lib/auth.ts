import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { Resend } from "resend";
import prisma from "@/lib/prisma";
import { VerificationEmail } from "@/emails/verification";

const resend = new Resend(process.env.RESEND_API_KEY || "re_placeholder");

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      const { error } = await resend.emails.send({
        from: "ScienceOne <noreply@scienceone.com>",
        to: user.email,
        subject: "Reset your ScienceOne password",
        text: `Reset your password: ${url}`,
      });
      if (error) console.error("Failed to send reset email:", error);
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    sendVerificationEmail: async ({ user, url }) => {
      const { error } = await resend.emails.send({
        from: "ScienceOne <noreply@scienceone.com>",
        to: user.email,
        subject: "Verify your ScienceOne account",
        react: VerificationEmail({ url, name: user.name ?? "there" }),
      });
      if (error) console.error("Failed to send verification email:", error);
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        required: false,
        defaultValue: "user",
        input: false,
      },
    },
  },
});

export type Auth = typeof auth;
