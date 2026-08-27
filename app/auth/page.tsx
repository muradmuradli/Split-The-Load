"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState } from "react";
import {
  signinSchema,
  signupSchema,
  type SignupFormValues,
} from "@/lib/schemas/auth";
import { signin, signup, type AuthState } from "@/app/actions/auth";
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

const initialState: AuthState = { success: false };

export default function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const isSignup = mode === "signup";
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [signinState, signinAction, isSigninPending] = useActionState(
    signin,
    initialState,
  );
  const [signupState, signupAction, isSignupPending] = useActionState(
    signup,
    initialState,
  );
  const state = isSignup ? signupState : signinState;
  const formAction = isSignup ? signupAction : signinAction;
  const isPending = isSignup ? isSignupPending : isSigninPending;

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(isSignup ? signupSchema : signinSchema) as any,
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  // Field-keyed errors go through FormMessage; formError is a generic,
  // non-field error (e.g. invalid credentials) surfaced as a toast instead.
  useEffect(() => {
    if (!state.errors) return;
    const { formError, ...fieldErrors } = state.errors;
    for (const [field, messages] of Object.entries(fieldErrors)) {
      if (messages?.[0]) {
        form.setError(field as keyof SignupFormValues, {
          type: "server",
          message: messages[0],
        });
      }
    }
    if (formError?.[0]) {
      toast.error(formError[0]);
    }
  }, [state.errors, form]);

  const switchMode = (nextMode: "signin" | "signup") => {
    setMode(nextMode);
    form.reset();
  };

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
            <form action={formAction} className="flex flex-col gap-4">
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
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground"
                        aria-label={
                          showPassword ? "Hide password" : "Show password"
                        }
                      >
                        {showPassword ? (
                          <EyeOff className="size-4" />
                        ) : (
                          <Eye className="size-4" />
                        )}
                      </button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        <button
                          type="button"
                          tabIndex={-1}
                          onClick={() => setShowConfirmPassword((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/60 hover:text-foreground"
                          aria-label={
                            showConfirmPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showConfirmPassword ? (
                            <EyeOff className="size-4" />
                          ) : (
                            <Eye className="size-4" />
                          )}
                        </button>
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

              {state.success && state.message && (
                <p className="text-center text-xs font-heading uppercase text-emerald-600">
                  {state.message}
                </p>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
