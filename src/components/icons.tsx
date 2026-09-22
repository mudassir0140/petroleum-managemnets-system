import type { SVGProps } from "react";

export type IconProps = SVGProps<SVGSVGElement> & { size?: number | string };

const base = {
  xmlns: "http://www.w3.org/2000/svg",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function DropletIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M12 3s6.5 7.1 6.5 11.5a6.5 6.5 0 1 1-13 0C5.5 10.1 12 3 12 3Z" />
    </svg>
  );
}

export function GaugeIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M4.6 17a8 8 0 1 1 14.8 0" />
      <path d="M12 13.5 15 9" />
      <circle cx="12" cy="13.5" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function ShieldCheckIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M12 3.5 5 6v5.5c0 4.5 3 7.3 7 9 4-1.7 7-4.5 7-9V6l-7-2.5Z" />
      <path d="m9.25 12 1.9 1.9 3.6-3.9" />
    </svg>
  );
}

export function TruckIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M3 7h10v9H3z" />
      <path d="M13 10h4l3.5 3.2V16H13z" />
      <circle cx="7" cy="17.5" r="1.6" />
      <circle cx="17" cy="17.5" r="1.6" />
    </svg>
  );
}

export function ChartBarIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M4 19V10" />
      <path d="M10 19V5" />
      <path d="M16 19v-7" />
      <path d="M4 19h16" />
    </svg>
  );
}

export function FactoryIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M3 20V11l5 3v-3l5 3V8l6 4v8Z" />
      <path d="M3 20h18" />
      <path d="M8 20v-3" />
      <path d="M14 20v-3" />
    </svg>
  );
}

export function ChevronDownIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function MenuIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  );
}

export function XIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

export function CheckCircleIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8.5 12.3 2.4 2.4 4.6-5" />
    </svg>
  );
}

export function BoltIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M12.5 3 5 13.5h5.5L11 21l7.5-10.5H13L12.5 3Z" />
    </svg>
  );
}

export function ClockIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 2" />
    </svg>
  );
}

export function UsersIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M3.5 19c.7-3.2 3-5 5.5-5s4.8 1.8 5.5 5" />
      <path d="M15.5 6.2a3 3 0 0 1 0 5.8" />
      <path d="M17.5 14.3c2.2.5 3.8 2.2 4.3 4.7" />
    </svg>
  );
}

export function MapPinIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M12 21s7-6.3 7-11.5A7 7 0 0 0 5 9.5C5 14.7 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.2" />
    </svg>
  );
}

export function HomeIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="m4 11 8-7 8 7" />
      <path d="M6 9.5V20h12V9.5" />
      <path d="M10 20v-6h4v6" />
    </svg>
  );
}

export function TankIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M4 8.5c0-1.9 3.6-3 8-3s8 1.1 8 3v7c0 1.9-3.6 3-8 3s-8-1.1-8-3Z" />
      <path d="M4 8.5c0 1.9 3.6 3 8 3s8-1.1 8-3" />
      <path d="M9.5 14.2c.6.4 1.5.6 2.5.6" />
    </svg>
  );
}

export function ClipboardIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M9 4.5h6a1 1 0 0 1 1 1V6h1.5A1.5 1.5 0 0 1 19 7.5v11a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 5 18.5v-11A1.5 1.5 0 0 1 6.5 6H8v-.5a1 1 0 0 1 1-1Z" />
      <path d="M9 11h6" />
      <path d="M9 14.5h6" />
      <path d="M9 17.5h3.5" />
    </svg>
  );
}

export function CreditCardIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <rect x="3.5" y="6" width="17" height="12" rx="1.8" />
      <path d="M3.5 10h17" />
      <path d="M7 14.5h4" />
    </svg>
  );
}

export function LockIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <rect x="5.5" y="11" width="13" height="9" rx="1.8" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
      <path d="M12 14.8v2.4" />
    </svg>
  );
}

export function WalletIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M4 7.5A1.5 1.5 0 0 1 5.5 6h12A1.5 1.5 0 0 1 19 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-12A1.5 1.5 0 0 1 4 16.5Z" />
      <path d="M4 10.5h15.5a1.5 1.5 0 0 1 1.5 1.5v2a1.5 1.5 0 0 1-1.5 1.5H16a2 2 0 1 1 0-4h3.5" />
    </svg>
  );
}

export function TrendingUpIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="m4 16 5.5-6 4 3.5L20 6" />
      <path d="M14.5 6H20v5.5" />
    </svg>
  );
}

export function DocumentIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M7 3.5h7l4 4v13H7Z" />
      <path d="M14 3.5V8h4" />
      <path d="M9.5 12.5h5" />
      <path d="M9.5 15.5h5" />
      <path d="M9.5 18h3" />
    </svg>
  );
}

export function DownloadIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M12 4v11" />
      <path d="m7.5 11 4.5 4.5L16.5 11" />
      <path d="M5 18.5h14" />
    </svg>
  );
}

export function SearchIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m19 19-4-4" />
    </svg>
  );
}

export function AlertTriangleIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M12 4 3 19.5h18Z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="17" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function PlusIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export function BellIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M6 10.5a6 6 0 0 1 12 0c0 3.4 1 5 1.7 5.8H4.3C5 15.5 6 13.9 6 10.5Z" />
      <path d="M10.3 19.5a1.8 1.8 0 0 0 3.4 0" />
    </svg>
  );
}

export function MessageIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h13A1.5 1.5 0 0 1 20 6.5v9a1.5 1.5 0 0 1-1.5 1.5H9l-4.2 3.3a.5.5 0 0 1-.8-.4Z" />
    </svg>
  );
}

export function PhoneIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M5.5 4h2.8l1.4 4.2-2 1.6a12.5 12.5 0 0 0 6.5 6.5l1.6-2 4.2 1.4v2.8a1.5 1.5 0 0 1-1.6 1.5A16 16 0 0 1 4 6.6 1.5 1.5 0 0 1 5.5 4Z" />
    </svg>
  );
}

export function SettingsIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.2M12 18.3v2.2M4.6 6.6l1.6 1.6M17.8 15.8l1.6 1.6M3.5 12h2.2M18.3 12h2.2M4.6 17.4l1.6-1.6M17.8 8.2l1.6-1.6" />
    </svg>
  );
}

export function LogOutIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M9 20H5.5A1.5 1.5 0 0 1 4 18.5v-13A1.5 1.5 0 0 1 5.5 4H9" />
      <path d="M15 16.5 20 12l-5-4.5" />
      <path d="M20 12H9" />
    </svg>
  );
}

export function FilterIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M4 5.5h16L14 13v6l-4 2v-8Z" />
    </svg>
  );
}

export function CalendarIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <rect x="4" y="5.5" width="16" height="14.5" rx="1.8" />
      <path d="M4 10h16" />
      <path d="M8 3.5v3M16 3.5v3" />
    </svg>
  );
}

export function EditIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M15.2 4.8 19.2 8.8 8.4 19.6H4.4v-4Z" />
      <path d="m13.4 6.6 4 4" />
    </svg>
  );
}

export function SendIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="m4.5 4.5 15 7.5-15 7.5 3-7.5Z" />
      <path d="M7.5 12h7" />
    </svg>
  );
}

export function XCircleIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m9.2 9.2 5.6 5.6M14.8 9.2l-5.6 5.6" />
    </svg>
  );
}

export function ChevronRightIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

export function FlaskIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M10 2v6.2L4.6 18a2 2 0 0 0 1.7 3h11.4a2 2 0 0 0 1.7-3L14 8.2V2" />
      <path d="M9 2h6" />
      <path d="M7.5 14h9" />
    </svg>
  );
}

export function ArrowLeftIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M19 12H5" />
      <path d="m11 6-6 6 6 6" />
    </svg>
  );
}

export function BuildingIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M6 21V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v17" />
      <path d="M14 21v-9h5a1 1 0 0 1 1 1v8" />
      <path d="M9 7h.01M9 11h.01M9 15h.01" />
      <path d="M3 21h18" />
    </svg>
  );
}

export function PrinterIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M6 9V3h12v6" />
      <rect x="4" y="9" width="16" height="8" rx="1.5" />
      <path d="M6 17v4h12v-4" />
    </svg>
  );
}

export function TagIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M12.6 3H5a2 2 0 0 0-2 2v7.6a2 2 0 0 0 .6 1.4l8 8a2 2 0 0 0 2.8 0l6.4-6.4a2 2 0 0 0 0-2.8l-8-8a2 2 0 0 0-1.2-.8Z" />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function EyeIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.6" />
    </svg>
  );
}

export function EyeOffIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M3 3l18 18" />
      <path d="M10.6 5.6A10.7 10.7 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a13.9 13.9 0 0 1-3.15 3.9M6.5 6.6C4 8.3 2.5 12 2.5 12s3.5 6.5 9.5 6.5c1.3 0 2.5-.3 3.55-.8" />
      <path d="M9.9 9.9a2.6 2.6 0 0 0 3.6 3.6" />
    </svg>
  );
}

export function CarIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M4 16v-3.5L6 8h12l2 4.5V16" />
      <path d="M4 16h16" />
      <path d="M6 8l1.4-3.2A1.5 1.5 0 0 1 8.8 4h6.4a1.5 1.5 0 0 1 1.4.8L18 8" />
      <circle cx="7.5" cy="16.5" r="1.6" />
      <circle cx="16.5" cy="16.5" r="1.6" />
    </svg>
  );
}

export function FlagIcon({ size = 20, ...props }: IconProps) {
  return (
    <svg {...base} width={size} height={size} {...props}>
      <path d="M5 21V4" />
      <path d="M5 4h13l-3 4.5L18 13H5" />
    </svg>
  );
}

// Alias exports — Attendant, Cashier, Pump Owner, Admin and Security Guard
// dashboards import icons under an "Icon<Name>" naming convention rather
// than this file's "<Name>Icon" convention. Kept as aliases (not a rename)
// so both conventions keep resolving.
export {
  DropletIcon as IconDroplet,
  ShieldCheckIcon as IconShield,
  TruckIcon as IconTruck,
  ChevronDownIcon as IconChevronDown,
  ChevronRightIcon as IconChevronRight,
  MenuIcon as IconMenu,
  XIcon as IconX,
  CheckCircleIcon as IconCheck,
  ClockIcon as IconClock,
  UsersIcon as IconUsers,
  HomeIcon as IconHome,
  ClipboardIcon as IconClipboard,
  WalletIcon as IconWallet,
  TrendingUpIcon as IconTrendingUp,
  DocumentIcon as IconFileText,
  DownloadIcon as IconDownload,
  SearchIcon as IconSearch,
  AlertTriangleIcon as IconAlertTriangle,
  BellIcon as IconBell,
  MessageIcon as IconChat,
  PhoneIcon as IconPhone,
  LogOutIcon as IconLogOut,
  FilterIcon as IconFilter,
  CalendarIcon as IconCalendar,
  SendIcon as IconSend,
  ArrowLeftIcon as IconArrowLeft,
  BuildingIcon as IconBuilding,
  PrinterIcon as IconPrinter,
  TagIcon as IconTag,
  EyeIcon as IconEye,
  EyeOffIcon as IconEyeOff,
  CarIcon as IconCar,
  FlagIcon as IconFlag,
};
