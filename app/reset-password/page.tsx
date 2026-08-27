"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
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

function PasswordToggle({
  show,
  onToggle,
}: {
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      tabIndex={-1}
      onClick={onToggle}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground"
      aria-label={show ? "Hide password" : "Show password"}
    >
      {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
    </button>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordPageContent />
    </Suspense>
  );
}

function ResetPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  // Better Auth's email link hits its own callback route first, which
  // redirects here with ?error=INVALID_TOKEN if the token is already dead.
  const isTokenInvalid = !token || searchParams.get("error") === "INVALID_TOKEN";

  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    if (!token) return;

    setIsPending(true);
    const { error } = await authClient.resetPassword({
      newPassword: values.password,
      token,
    });
    setIsPending(false);

    if (error) {
      toast.error(
        error.code === "INVALID_TOKEN"
          ? "This reset link is invalid or has expired."
          : "Something went wrong. Please try again.",
      );
      return;
    }

    router.push("/auth?reset=true");
  });

  return (
    <div className="mx-auto flex w-full flex-col items-center gap-6 px-4 xl:py-5 sm:w-[80%] sm:gap-8 md:w-[60%] lg:w-[40%] xl:w-[27%]">
      <Card className="w-full bg-amber-300">
        <CardHeader className="gap-2">
          <CardTitle className="text-3xl sm:text-4xl">
            Reset Password
          </CardTitle>
          <CardDescription className="text-foreground/80">
            Choose a new password for your account.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="w-full">
        <CardContent className="flex flex-col gap-6">
          {isTokenInvalid ? (
            <>
              <p className="text-center text-sm text-foreground/80">
                This reset link is invalid or has expired.
              </p>
              <Link
                href="/forgot-password"
                className="text-center text-xs font-bold uppercase text-foreground/70 underline"
              >
                Request a new link
              </Link>
            </>
          ) : (
            <Form {...form}>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NEW PASSWORD</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            className="pr-10"
                          />
                        </FormControl>
                        <PasswordToggle
                          show={showPassword}
                          onToggle={() => setShowPassword((v) => !v)}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CONFIRM PASSWORD</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            {...field}
                            type={showConfirmPassword ? "text" : "password"}
                            className="pr-10"
                          />
                        </FormControl>
                        <PasswordToggle
                          show={showConfirmPassword}
                          onToggle={() => setShowConfirmPassword((v) => !v)}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="mt-2 w-full font-bold uppercase bg-blue-400"
                  disabled={isPending}
                >
                  {isPending ? "Resetting..." : "Reset password"}
                </Button>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
