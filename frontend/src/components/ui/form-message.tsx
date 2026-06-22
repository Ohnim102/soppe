import { cn } from "@/lib/utils";

interface FormMessageProps {
  children?: string;
  className?: string;
}

export function FormMessage({ children, className }: FormMessageProps) {
  if (!children) {
    return null;
  }

  return <p className={cn("text-sm text-destructive", className)}>{children}</p>;
}
