"use client";

import React, { useEffect, useState } from "react";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { Role } from "@/lib/types";
import { roles, roleRoutes, roleDisplayNames } from "@/lib/types";
import { apiService } from "@/lib/api-service";

const formSchema = z.object({
  role: z.enum(roles),
  userId: z.string().min(10, { message: "Please enter a valid 10-digit mobile number." }),
  password: z.string().min(4, { message: "OTP must be 4 digits." }),
});

type LoginFormValues = z.infer<typeof formSchema>;

interface LoginModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: Role;
}

export function LoginModal({ open, onOpenChange, role }: LoginModalProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: role,
      userId: "",
      password: "",
    },
  });

  useEffect(() => {
    if (role) {
      form.setValue("role", role);
    }
  }, [role, form]);

  const sendOTP = async () => {
    const phone = form.getValues("userId");
    if (!phone || phone.length !== 10) {
      toast({
        variant: "destructive",
        title: "Invalid Phone Number",
        description: "Please enter a valid 10-digit mobile number.",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.sendOTP(phone);
      if (response.success) {
        setOtpSent(true);
        toast({
          title: "OTP Sent",
          description: "Please check your mobile for the OTP.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Failed to Send OTP",
          description: response.error || "Please try again.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Please check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: LoginFormValues) => {
    if (!otpSent) {
      await sendOTP();
      return;
    }

    setIsLoading(true);
    try {
      const response = await apiService.login({
        phone: values.userId,
        otp: values.password,
      });

      if (response.success && response.data) {
        // Store auth token
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', response.data.token);
          localStorage.setItem('userRole', values.role);
        }
        
        toast({
          title: "Login Successful",
          description: `Welcome to ${roleDisplayNames[values.role]}!`,
        });
        
        const path = roleRoutes[values.role];
        router.push(path);
        onOpenChange(false);
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: response.error || "Invalid OTP. Please try again.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Login Error",
        description: "Please check your connection and try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 rounded-[30px] grid md:grid-cols-2 overflow-hidden">
        <div className="hidden md:flex flex-col justify-center p-12 bg-gradient-to-br from-gray-900 to-primary/90 text-white">
          <h2 className="text-3xl font-bold">{roleDisplayNames[role]} Login</h2>
          <p className="mt-4 text-white/80">HealthBridge AI uses 256-bit encryption to ensure all healthcare data remains private and secure.</p>
          <div className="mt-8 text-xs font-bold tracking-widest text-accent uppercase">
            ● Secure Server Active
          </div>
        </div>
        <div className="p-12">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-3xl font-bold">
              Sign In
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-muted-foreground">Selected Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="py-6 rounded-xl border-2 focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_hsl(var(--primary)/0.1)]">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roles.map((r) => (
                          <SelectItem key={r} value={r}>
                            {roleDisplayNames[r]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="font-bold text-muted-foreground">Mobile Number</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter 10-digit mobile number" 
                        {...field} 
                        className="py-6 rounded-xl border-2 focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_hsl(var(--primary)/0.1)]"
                        maxLength={10}
                        disabled={isLoading}
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
                    <FormLabel className="font-bold text-muted-foreground">
                      {otpSent ? "Enter OTP" : "OTP (will be sent)"}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder={otpSent ? "Enter 4-digit OTP" : "••••"}
                        {...field}
                        className="py-6 rounded-xl border-2 focus:border-primary focus:bg-white focus:shadow-[0_0_0_4px_hsl(var(--primary)/0.1)]"
                        maxLength={4}
                        disabled={isLoading || !otpSent}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button 
                type="submit" 
                className="w-full py-6 mt-4 rounded-xl text-base font-bold bg-gray-900 hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : otpSent ? "Verify OTP & Login" : "Send OTP"}
              </Button>
              <div className="text-center pt-2">
                <Button variant="link" size="sm" className="text-primary font-bold">Forgot credentials?</Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}