// src/components/ui/LoadingSpinner.jsx
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

const LoadingSpinner = ({ className, size = "md" }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex items-center justify-center w-full p-4">
      <Loader2 
        className={cn(
          "animate-spin text-primary",
          sizeClasses[size],
          className
        )}
      />
    </div>
  );
};

export default LoadingSpinner;