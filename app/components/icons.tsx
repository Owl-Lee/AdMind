import type { SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height="20"
      viewBox="0 0 24 24"
      width="20"
      {...props}
    >
      {children}
    </svg>
  );
}

const stroke = {
  stroke: "currentColor",
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  strokeWidth: 1.8,
};

export const GridIcon = (props: IconProps) => (
  <Icon {...props}><path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" {...stroke} /></Icon>
);
export const PlayIcon = (props: IconProps) => (
  <Icon {...props}><path d="M8 5.5v13l10-6.5-10-6.5Z" {...stroke} /></Icon>
);
export const RouteIcon = (props: IconProps) => (
  <Icon {...props}><circle cx="6" cy="6" r="2" {...stroke} /><circle cx="18" cy="18" r="2" {...stroke} /><path d="M8 6h4a3 3 0 0 1 3 3v6a3 3 0 0 0 3 3" {...stroke} /></Icon>
);
export const ShieldIcon = (props: IconProps) => (
  <Icon {...props}><path d="M12 3 5 6v5c0 4.8 2.7 8 7 10 4.3-2 7-5.2 7-10V6l-7-3Z" {...stroke} /><path d="m9 12 2 2 4-4" {...stroke} /></Icon>
);
export const ChartIcon = (props: IconProps) => (
  <Icon {...props}><path d="M5 20V9m7 11V4m7 16v-7" {...stroke} /></Icon>
);
export const LibraryIcon = (props: IconProps) => (
  <Icon {...props}><path d="M4 5h5v15H4zM9 4h6v16H9zM16 7h4v13h-4z" {...stroke} /></Icon>
);
export const SlidersIcon = (props: IconProps) => (
  <Icon {...props}><path d="M4 7h10m4 0h2M4 17h2m4 0h10" {...stroke} /><circle cx="16" cy="7" r="2" {...stroke} /><circle cx="8" cy="17" r="2" {...stroke} /></Icon>
);
export const SparkIcon = (props: IconProps) => (
  <Icon {...props}><path d="m12 3 1.4 4.1L18 9l-4.6 1.9L12 15l-1.4-4.1L6 9l4.6-1.9L12 3Z" {...stroke} /><path d="m18 15 .7 2.1L21 18l-2.3.9L18 21l-.7-2.1L15 18l2.3-.9L18 15Z" {...stroke} /></Icon>
);
export const CheckIcon = (props: IconProps) => (
  <Icon {...props}><path d="m5 12 4 4L19 6" {...stroke} /></Icon>
);
export const ClockIcon = (props: IconProps) => (
  <Icon {...props}><circle cx="12" cy="12" r="9" {...stroke} /><path d="M12 7v5l3 2" {...stroke} /></Icon>
);
export const ChevronIcon = (props: IconProps) => (
  <Icon {...props}><path d="m9 6 6 6-6 6" {...stroke} /></Icon>
);
export const SearchIcon = (props: IconProps) => (
  <Icon {...props}><circle cx="11" cy="11" r="7" {...stroke} /><path d="m16 16 4 4" {...stroke} /></Icon>
);
export const BellIcon = (props: IconProps) => (
  <Icon {...props}><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 8h18c0-1-3-1-3-8ZM10 21h4" {...stroke} /></Icon>
);
