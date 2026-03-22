"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

import { Button } from "@/components/ui/button";

interface LogoutButtonProps {
  callbackUrl?: string;
  className?: string;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  label?: string;
}

export function LogoutButton({
  callbackUrl = "/dashboard",
  className,
  variant = "outline",
  size = "default",
  label = "Log Out",
}: LogoutButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      onClick={() => signOut({ callbackUrl })}
    >
      <LogOut size={16} />
      {size !== "icon" ? <span>{label}</span> : null}
    </Button>
  );
}
