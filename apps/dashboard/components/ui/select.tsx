"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectContextValue {
  value: string;
  onValueChange: (value: string) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SelectContext = React.createContext<SelectContextValue | undefined>(undefined);

const useSelectContext = () => {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error("Select components must be used within a Select");
  }
  return context;
};

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

const Select = ({ value = "", onValueChange, children }: SelectProps) => {
  const [open, setOpen] = React.useState(false);

  return (
    <SelectContext.Provider
      value={{
        value,
        onValueChange: onValueChange || (() => {}),
        open,
        onOpenChange: setOpen,
      }}
    >
      <div className='relative'>{children}</div>
    </SelectContext.Provider>
  );
};

interface SelectTriggerProps {
  className?: string;
  children: React.ReactNode;
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { open, onOpenChange } = useSelectContext();

    return (
      <button
        ref={ref}
        type='button'
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          "hover:bg-accent/10 transition-colors",
          className
        )}
        onClick={() => onOpenChange(!open)}
        {...props}
      >
        {children}
        <ChevronDown className={cn("h-4 w-4 opacity-50 transition-transform", open && "rotate-180")} />
      </button>
    );
  }
);
SelectTrigger.displayName = "SelectTrigger";

interface SelectValueProps {
  placeholder?: string;
}

const SelectValue = ({ placeholder }: SelectValueProps) => {
  const { value } = useSelectContext();
  return <span>{value || placeholder}</span>;
};

interface SelectContentProps {
  className?: string;
  children: React.ReactNode;
}

const SelectContent = ({ className, children }: SelectContentProps) => {
  const { open, onOpenChange } = useSelectContext();

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest("[data-select-content]")) {
        onOpenChange(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      data-select-content
      className={cn(
        "absolute top-full z-50 mt-1 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
        className
      )}
    >
      {children}
    </div>
  );
};

interface SelectItemProps {
  value: string;
  className?: string;
  children: React.ReactNode;
}

const SelectItem = ({ value, className, children }: SelectItemProps) => {
  const { value: selectedValue, onValueChange, onOpenChange } = useSelectContext();
  const isSelected = selectedValue === value;

  return (
    <div
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
        isSelected && "bg-accent text-accent-foreground",
        className
      )}
      onClick={() => {
        onValueChange(value);
        onOpenChange(false);
      }}
    >
      {children}
      {isSelected && (
        <span className='absolute right-2 flex h-3.5 w-3.5 items-center justify-center'>
          <Check className='h-4 w-4' />
        </span>
      )}
    </div>
  );
};

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
