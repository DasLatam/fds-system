import * as React from "react";

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>;

export function Label({ className = "", ...props }: LabelProps) {
  return <label className={["text-sm font-medium text-zinc-900", className].join(" ")} {...props} />;
}
