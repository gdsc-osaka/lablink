import type { SVGProps } from "react";

import { cn } from "@/lib/utils";

type IconProps = SVGProps<SVGSVGElement>;

export const Icon = ({ className, ...props }: IconProps) => (
    <svg
        className={cn("w-8 h-8 text-green-500", className)}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        {...props}
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
        />
    </svg>
);
