"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import {
  signinSchema,
  signupSchema,
  type SignupFormValues,
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
import { Badge } from "@/components/ui/badge";

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

export default function AuthPage() {
  return (
    <Suspense>
      <AuthPageContent />
    </Suspense>
  );
}

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const isSignup = mode === "signup";
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(isSignup ? signupSchema : signinSchema) as any,
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const switchMode = (nextMode: "signin" | "signup") => {
    setMode(nextMode);
    form.reset();
  };

  const handleSigninSubmit = form.handleSubmit(async (values) => {
    setIsPending(true);
    const { error } = await authClient.signIn.email({
      email: values.email,
      password: values.password,
    });
    setIsPending(false);

    if (error) {
      // Deliberately vague — don't reveal whether the email exists.
      toast.error("Invalid email or password");
      return;
    }

    toast.success("Signed in!");
    router.push("/dashboard");
    // The navbar reads the session in a Server Component; a plain client
    // navigation reuses its cached render, so force it to re-fetch.
    router.refresh();
  });

  const handleSignupSubmit = form.handleSubmit(async (values) => {
    setIsPending(true);
    const { error } = await authClient.signUp.email({
      name: values.fullName,
      email: values.email,
      password: values.password,
    });
    setIsPending(false);

    if (error) {
      if (error.code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
        form.setError("email", { message: "Email is already taken" });
      } else {
        toast.error(error.message ?? "Something went wrong. Please try again.");
      }
      return;
    }

    router.push(`/verify-email?email=${encodeURIComponent(values.email)}`);
    // Signup auto-creates a session (autoSignIn), so the navbar's cached
    // Server Component render needs a refresh to reflect it too.
    router.refresh();
  });

  // Show a one-time toast when arriving here after a successful email
  // verification or password reset, then strip the query param so a
  // refresh doesn't repeat it.
  const hasShownAuthToast = useRef(false);
  useEffect(() => {
    if (hasShownAuthToast.current) return;

    if (searchParams.get("verified") === "true") {
      hasShownAuthToast.current = true;
      toast.success("Email verified! You can now sign in.");
      router.replace("/auth");
    } else if (searchParams.get("reset") === "true") {
      hasShownAuthToast.current = true;
      toast.success("Password reset! You can now sign in with your new password.");
      router.replace("/auth");
    }
  }, [searchParams, router]);

  return (
    <div className="mx-auto flex w-full flex-col items-center gap-6 px-4 xl:py-5 sm:w-[80%] sm:gap-8 md:w-[60%] lg:w-[40%] xl:w-[27%]">
      <Card className="w-full bg-amber-300">
        <CardHeader className="gap-2">
          <Badge className="w-fit bg-white text-xs font-bold uppercase">
            {isSignup ? "Join the Flat" : "Welcome Back"}
          </Badge>
          <CardTitle className="text-3xl sm:text-4xl">
            {isSignup ? "Sign Up" : "Sign In"}
          </CardTitle>
          <CardDescription className="text-foreground/80">
            {isSignup
              ? "One account, every chore counted by effort."
              : "Get back to splitting the load fairly."}
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="w-full">
        <CardContent className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="noShadow"
              className={`flex-1 text-md font-bold uppercase ${
                !isSignup ? "bg-blue-400" : "bg-white hover:bg-amber-300"
              }`}
              onClick={() => switchMode("signin")}
            >
              Log in
            </Button>
            <Button
              type="button"
              variant="noShadow"
              className={`flex-1 text-md font-bold uppercase ${
                isSignup ? "bg-red-400" : "bg-white hover:bg-amber-300"
              }`}
              onClick={() => switchMode("signup")}
            >
              Sign up
            </Button>
          </div>

          <Form {...form}>
            <form
              onSubmit={isSignup ? handleSignupSubmit : handleSigninSubmit}
              className="flex flex-col gap-4"
            >
              {isSignup && (
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NAME</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Jane Austin" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

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

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PASSWORD</FormLabel>
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

              {!isSignup && (
                <Link
                  href="/forgot-password"
                  className="-mt-2 self-end text-xs font-bold uppercase text-foreground/70 underline"
                >
                  Forgot password?
                </Link>
              )}

              {isSignup && (
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
              )}

              <Button
                type="submit"
                className={`mt-2 w-full transition text-md font-bold uppercase ${
                  isSignup ? "bg-red-400" : "bg-blue-400"
                }`}
                disabled={isPending}
              >
                {isPending
                  ? "Please wait..."
                  : isSignup
                    ? "Create Account"
                    : "Sign in"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
