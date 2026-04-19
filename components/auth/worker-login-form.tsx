"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { loginSchema, type LoginFormData } from "@/lib/schemas/auth";
import { workerLoginAction } from "@/lib/actions/worker-auth";
import { AlertCircle, Eye, EyeOff, Loader2 } from "lucide-react";

export function WorkerLoginForm() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginFormData) {
    setIsPending(true);
    setError(null);

    try {
      const result = await workerLoginAction(data);

      if (!result.success) {
        setError(result.error || "Login failed");
        setIsPending(false);
        return;
      }

      // Redirect to workers dashboard
      router.push("/dashboard-workers");
    } catch (err) {
      setError("An unexpected error occurred");
      setIsPending(false);
    }
  }

  return (
    <Card className="w-full border-blue-200/70 bg-white/95 shadow-sm dark:border-blue-900/50 dark:bg-slate-950/95">
      <CardHeader className="space-y-1">
        <div className="mb-2 flex items-center justify-center">
          <Image
            src="/mabini-logo.png"
            alt="MabiniCare official logo"
            width={62}
            height={62}
            className="h-[62px] w-[62px] rounded-full border border-blue-200 bg-white object-cover"
            priority
          />
        </div>
        <div className="flex items-center justify-center gap-2">
          <CardTitle className="text-2xl">City Health Login</CardTitle>
        </div>
        <CardDescription className="text-center">
          Enter your worker credentials to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="flex items-center gap-3 rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <FormField
              control={form.control}
              name="username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City Health Staff Username</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="text"
                      placeholder="Enter your worker username"
                      disabled={isPending}
                      autoComplete="username"
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
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        disabled={isPending}
                        autoComplete="current-password"
                        className="pr-10"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
                        onClick={() => setShowPassword((prev) => !prev)}
                        disabled={isPending}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In as City Health Staff"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
