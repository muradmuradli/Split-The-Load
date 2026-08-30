"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { inviteSignupSchema, type InviteSignupFormValues } from "@/lib/schemas/auth";
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
import { completeInviteSignupAction } from "./actions";

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

export function InviteSignupForm({ token, email }: { token: string; email: string }) {
  const [isPending, setIsPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<InviteSignupFormValues>({
    resolver: zodResolver(inviteSignupSchema),
    defaultValues: { fullName: "", password: "", confirmPassword: "" },
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsPending(true);
    const result = await completeInviteSignupAction(token, values);
    setIsPending(false);

    if (result?.error) {
      toast.error(result.error);
    }
  });

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs font-bold uppercase text-foreground/60">{email}</p>

      <Form {...form}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
            {isPending ? "Joining..." : "Join flat"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
