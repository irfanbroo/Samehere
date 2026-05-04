"use client";

import * as React from "react";
import { useState, useId, useEffect } from "react";
import { Slot } from "@radix-ui/react-slot";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { Eye, EyeOff } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface TypewriterProps {
  text: string | string[];
  speed?: number;
  cursor?: string;
  loop?: boolean;
  deleteSpeed?: number;
  delay?: number;
  className?: string;
}

export function Typewriter({ text, speed = 100, cursor = "|", loop = false, deleteSpeed = 50, delay = 1500, className }: TypewriterProps) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const [textArrayIndex, setTextArrayIndex] = useState(0);
  const textArray = Array.isArray(text) ? text : [text];
  const currentText = textArray[textArrayIndex] || "";

  useEffect(() => {
    if (!currentText) return;
    const timeout = setTimeout(() => {
      if (!isDeleting) {
        if (currentIndex < currentText.length) {
          setDisplayText((prev) => prev + currentText[currentIndex]);
          setCurrentIndex((prev) => prev + 1);
        } else if (loop) {
          setTimeout(() => setIsDeleting(true), delay);
        }
      } else {
        if (displayText.length > 0) {
          setDisplayText((prev) => prev.slice(0, -1));
        } else {
          setIsDeleting(false);
          setCurrentIndex(0);
          setTextArrayIndex((prev) => (prev + 1) % textArray.length);
        }
      }
    }, isDeleting ? deleteSpeed : speed);
    return () => clearTimeout(timeout);
  }, [currentIndex, isDeleting, currentText, loop, speed, deleteSpeed, delay, displayText, text]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">{cursor}</span>
    </span>
  );
}

const labelVariants = cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />
));
Label.displayName = LabelPrimitive.Root.displayName;

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-black text-white border border-white/10 hover:border-white/40 hover:bg-[#1a1a1a] active:scale-95 transition-all duration-200",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-white/10 bg-black text-white hover:border-white/40 hover:bg-[#1a1a1a] active:scale-95 transition-all duration-200",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary-foreground/60 underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-12 rounded-md px-6",
        icon: "h-8 w-8",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  }
);
Button.displayName = "Button";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        "flex h-11 w-full rounded-full border border-white/20 bg-transparent px-4 py-3 text-sm text-foreground transition-all placeholder:text-muted-foreground/50 focus-visible:outline-none focus-visible:border-white/50 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = "Input";

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(({ className, label, ...props }, ref) => {
  const id = useId();
  const [showPassword, setShowPassword] = useState(false);
  return (
    <div className="grid w-full items-center gap-2">
      {label && <Label htmlFor={id}>{label}</Label>}
      <div className="relative">
        <Input id={id} type={showPassword ? "text" : "password"} className={cn("pe-10", className)} ref={ref} {...props} />
        <button type="button" onClick={() => setShowPassword(p => !p)}
          className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center text-muted-foreground/80 transition-colors hover:text-foreground focus-visible:outline-none"
          aria-label={showPassword ? "Hide password" : "Show password"}>
          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
    </div>
  );
});
PasswordInput.displayName = "PasswordInput";

interface SignInFormProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  error?: string;
  loading?: boolean;
}

function SignInForm({ onSignIn, error, loading }: SignInFormProps) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    await onSignIn(data.get("email") as string, data.get("password") as string);
  };
  return (
    <form onSubmit={handleSubmit} autoComplete="on" className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-black tracking-tight text-white" style={{ textShadow: '0 0 20px rgba(255,255,255,0.8), 0 0 40px rgba(255,255,255,0.4), 0 0 80px rgba(255,255,255,0.2)' }}>Same Here</h1>
        <p className="text-sm text-muted-foreground italic">"We all share the same 24-hour clock. How do you choose to fill yours?"</p>
        <p className="text-sm text-muted-foreground mt-2">Sign in to your account</p>
      </div>
      {error && <p className="text-sm text-red-400 text-center -mt-4">{error}</p>}
      <div className="grid gap-4">
        <div className="grid gap-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" placeholder="you@example.com" required autoComplete="email" /></div>
        <PasswordInput name="password" label="Password" required autoComplete="current-password" placeholder="Password" />
        <Button type="submit" variant="outline" className="mt-2" disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Signing in...
            </span>
          ) : "Sign In"}
        </Button>
      </div>
    </form>
  );
}

interface SignUpFormProps {
  onSignUp: (username: string, email: string, password: string) => Promise<void>;
  error?: string;
  loading?: boolean;
}

function SignUpForm({ onSignUp, error, loading }: SignUpFormProps) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    await onSignUp(data.get("username") as string, data.get("email") as string, data.get("password") as string);
  };
  return (
    <form onSubmit={handleSubmit} autoComplete="on" className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-3xl font-black tracking-tight text-white" style={{ textShadow: '0 0 20px rgba(255,255,255,0.8), 0 0 40px rgba(255,255,255,0.4), 0 0 80px rgba(255,255,255,0.2)' }}>Same Here</h1>
        <p className="text-sm text-muted-foreground italic">"We all share the same 24-hour clock. How do you choose to fill yours?"</p>
        <p className="text-sm text-muted-foreground mt-2">Create your account</p>
      </div>
      {error && <p className="text-sm text-red-400 text-center -mt-4">{error}</p>}
      <div className="grid gap-4">
        <div className="grid gap-2"><Label htmlFor="username">Username</Label><Input id="username" name="username" type="text" placeholder="yourname" required autoComplete="username" /></div>
        <div className="grid gap-2"><Label htmlFor="email">Email</Label><Input id="email" name="email" type="email" placeholder="you@example.com" required autoComplete="email" /></div>
        <PasswordInput name="password" label="Password" required autoComplete="new-password" placeholder="Password" />
        <Button type="submit" variant="outline" className="mt-2" disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
              </svg>
              Creating account...
            </span>
          ) : "Create Account"}
        </Button>
      </div>
    </form>
  );
}

interface AuthFormContainerProps {
  isSignIn: boolean;
  onToggle: () => void;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (username: string, email: string, password: string) => Promise<void>;
  error?: string;
  loading?: boolean;
}

function AuthFormContainer({ isSignIn, onToggle, onSignIn, onSignUp, error, loading }: AuthFormContainerProps) {
  return (
    <div className="mx-auto grid w-[350px] gap-2">
      {isSignIn
        ? <SignInForm onSignIn={onSignIn} error={error} loading={loading} />
        : <SignUpForm onSignUp={onSignUp} error={error} loading={loading} />}
      <div className="text-center text-sm">
        {isSignIn ? "Don't have an account?" : "Already have an account?"}{" "}
        <Button variant="link" className="pl-1 text-foreground" onClick={onToggle}>
          {isSignIn ? "Sign up" : "Sign in"}
        </Button>
      </div>
      <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-white/10">
        <span className="relative z-10 bg-[#0a0a0a] px-2 text-muted-foreground">Or continue with</span>
      </div>
      <Button variant="outline" type="button">
        <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="mr-2 h-4 w-4" />
        Continue with Google
      </Button>
    </div>
  );
}

export interface AuthUIProps {
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (username: string, email: string, password: string) => Promise<void>;
  error?: string;
  loading?: boolean;
  defaultSignIn?: boolean;
}

export function AuthUI({ onSignIn, onSignUp, error, loading, defaultSignIn = true }: AuthUIProps) {
  const [isSignIn, setIsSignIn] = useState(defaultSignIn);

  const signInContent = {
    image: "/original-ccdd6d6195fff2386a31b684b7abdd2e.webp",
    quote: { text: "Welcome back. The journey continues.", author: "Same Here" },
  };
  const signUpContent = {
    image: "/original-ccdd6d6195fff2386a31b684b7abdd2e.webp",
    quote: { text: "Find people living your kind of day.", author: "Same Here" },
  };

  const current = isSignIn ? signInContent : signUpContent;

  return (
    <div className="w-full min-h-screen md:grid md:grid-cols-2">
      <style>{`input[type="password"]::-ms-reveal, input[type="password"]::-ms-clear { display: none; }`}</style>
      <div className="flex h-screen items-center justify-center p-6 md:h-auto md:p-0 md:py-12">
        <AuthFormContainer
          isSignIn={isSignIn}
          onToggle={() => setIsSignIn(p => !p)}
          onSignIn={onSignIn}
          onSignUp={onSignUp}
          error={error}
          loading={loading}
        />
      </div>
      <div className="hidden md:block relative bg-cover bg-center transition-all duration-500 ease-in-out"
        style={{ backgroundImage: `url(${current.image})` }}>
        <div className="absolute inset-0 bg-black/20" />
        <div className="absolute inset-x-0 bottom-0 h-[100px] bg-gradient-to-t from-background to-transparent" />
        <div className="relative z-10 flex h-full flex-col items-center justify-end p-2 pb-6">
          <blockquote className="space-y-2 text-center text-foreground">
            <p className="text-lg font-medium">
              "<Typewriter key={current.quote.text} text={current.quote.text} speed={60} />"
            </p>
            <cite className="block text-sm font-light text-muted-foreground not-italic">
              — {current.quote.author}
            </cite>
          </blockquote>
        </div>
      </div>
    </div>
  );
}
