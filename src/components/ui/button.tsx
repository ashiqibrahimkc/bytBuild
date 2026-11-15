import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:pointer-events-none disabled:opacity-50 cursor-pointer shadow-sm active:scale-[0.98]",
  {
    variants: {
      variant: {
        default: "bg-amber-600 text-white hover:bg-amber-700 shadow-amber-600/20",
        primary: "bg-amber-600 text-white hover:bg-amber-700 shadow-amber-600/20",
        destructive: "bg-rose-600 text-white hover:bg-rose-700 shadow-rose-600/20",
        outline: "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900",
        secondary: "bg-slate-100 text-slate-800 hover:bg-slate-200",
        ghost: "hover:bg-slate-100 text-slate-600 hover:text-slate-900 shadow-none",
        link: "text-amber-600 underline-offset-4 hover:underline shadow-none",
        success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/20",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-11 rounded-lg px-6 text-base",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

