"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const RESEND_COOLDOWN_SECONDS = 60;

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailPageContent />
    </Suspense>
  );
}

function VerifyEmailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [otp, setOtp] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (!email) {
      router.replace("/auth");
    }
  }, [email, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((seconds) => Math.max(0, seconds - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleVerify = async (code: string) => {
    if (code.length !== 6 || isVerifying) return;

    setIsVerifying(true);
    const { error } = await authClient.emailOtp.verifyEmail({
      email,
      otp: code,
    });
    setIsVerifying(false);

    if (error) {
      toast.error(
        error.code === "OTP_EXPIRED"
          ? "That code has expired. Request a new one."
          : "Invalid code. Please try again.",
      );
      setOtp("");
      return;
    }

    router.push("/auth?verified=true");
  };

  const handleResend = async () => {
    if (cooldown > 0 || isResending) return;

    setIsResending(true);
    const { error } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: "email-verification",
    });
    setIsResending(false);

    if (error) {
      toast.error("Couldn't resend the code. Please try again.");
      return;
    }

    toast.success("A new code is on its way.");
    setCooldown(RESEND_COOLDOWN_SECONDS);
  };

  return (
    <div className="mx-auto flex w-full flex-col items-center gap-6 px-4 py-10 sm:w-[80%] sm:gap-8 md:w-[60%] lg:w-[40%] xl:w-[27%]">
      <Card className="w-full bg-amber-300">
        <CardHeader className="gap-2">
          <CardTitle className="text-3xl sm:text-4xl">Verify Email</CardTitle>
          <CardDescription className="text-foreground/80">
            We sent a code to <span className="font-bold">{email}</span>
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="w-full">
        <CardContent className="flex flex-col items-center gap-6">
          <InputOTP
            maxLength={6}
            value={otp}
            onChange={setOtp}
            onComplete={handleVerify}
            disabled={isVerifying}
          >
            <InputOTPGroup>
              {Array.from({ length: 6 }).map((_, i) => (
                <InputOTPSlot key={i} index={i} />
              ))}
            </InputOTPGroup>
          </InputOTP>

          <Button
            type="button"
            className="w-full bg-blue-400 font-bold uppercase"
            disabled={otp.length !== 6 || isVerifying}
            onClick={() => handleVerify(otp)}
          >
            {isVerifying ? "Verifying..." : "Verify"}
          </Button>

          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || isResending}
            className="text-sm font-bold uppercase text-foreground/70 underline disabled:cursor-not-allowed disabled:no-underline disabled:opacity-50"
          >
            {isResending
              ? "Sending..."
              : cooldown > 0
                ? `Resend code (${cooldown}s)`
                : "Resend code"}
          </button>
        </CardContent>
      </Card>
    </div>
  );
}
