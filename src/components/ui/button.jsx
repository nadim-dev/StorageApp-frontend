import * as React from "react";

import { cn } from "@/lib/utils";

function Button({ className, type = "button", ...props }) {
  return (
    <button
      data-slot="button"
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

export { Button };
