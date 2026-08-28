"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/lib/schemas/auth";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function ForgotPasswordPage() {
  const [isPending, setIsPending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsPending(true);
    const { error } = await authClient.requestPasswordReset({
      email: values.email,
      redirectTo: "/reset-password",
    });
    setIsPending(false);

    if (error) {
      toast.error("Something went wrong. Please try again.");
      return;
    }

    // Better Auth returns success regardless of whether the email exists,
    // so this message is accurate either way — don't reveal account existence.
    setIsSent(true);
  });

  return (
    <div className="mx-auto flex w-full flex-col items-center gap-6 px-4 xl:py-5 sm:w-[80%] sm:gap-8 md:w-[60%] lg:w-[40%] xl:w-[27%]">
      <Card className="w-full bg-amber-300">
        <CardHeader className="gap-2">
          <CardTitle className="text-3xl sm:text-4xl">
            Forgot Password
          </CardTitle>
          <CardDescription className="text-foreground/80">
            Enter your email and we&apos;ll send you a reset link.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="w-full">
        <CardContent className="flex flex-col gap-6">
          {isSent ? (
            <p className="text-center text-sm text-foreground/80">
              If an account exists for that email, a reset link has been sent.
            </p>
          ) : (
            <Form {...form}>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>EMAIL</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="you@example.com"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="mt-2 w-full font-bold uppercase bg-blue-400"
                  disabled={isPending}
                >
                  {isPending ? "Sending..." : "Send reset link"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      <Link
        href="/auth"
        className="inline-flex flex-col items-center gap-1 text-sm font-bold uppercase hover:text-foreground/80"
      >
        <span>Back to Signin</span>
        <div className="h-1 w-full bg-current" />
      </Link>
    </div>
  );
}
