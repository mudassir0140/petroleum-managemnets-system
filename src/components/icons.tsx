import type { ReactNode, SVGProps } from "react";

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

function base(paths: ReactNode) {
  return function Icon({ size = 18, ...rest }: IconProps) {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...rest}
      >
        {paths}
      </svg>
    );
  };
}

export const IconHome = base(
  <>
    <path d="M3 11.5 12 4l9 7.5" />
    <path d="M5 10v9a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1v-9" />
  </>,
);

export const IconDroplet = base(<path d="M12 2.5s6.5 7.2 6.5 12a6.5 6.5 0 1 1-13 0c0-4.8 6.5-12 6.5-12Z" />);

export const IconTrendingUp = base(
  <>
    <path d="M3 17 9.5 10.5 14 15l7-8" />
    <path d="M16 7h5v5" />
  </>,
);

export const IconTruck = base(
  <>
    <path d="M2 8h11v8H2z" />
    <path d="M13 11h4l3 3v2h-7z" />
    <circle cx="6.5" cy="18" r="1.6" />
    <circle cx="16.5" cy="18" r="1.6" />
  </>,
);

export const IconUsers = base(
  <>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M2.8 19c.6-3 3-5 6.2-5s5.6 2 6.2 5" />
    <path d="M16 4.3a3.2 3.2 0 0 1 0 6.2" />
    <path d="M18 14.2c2.3.6 3.9 2.3 4.4 4.8" />
  </>,
);

export const IconWallet = base(
  <>
    <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h13A1.5 1.5 0 0 1 19 7.5v10a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 3 17.5Z" />
    <path d="M3 10h16.5a1.5 1.5 0 0 1 1.5 1.5v3a1.5 1.5 0 0 1-1.5 1.5H17" />
    <circle cx="16.2" cy="13" r="1" fill="currentColor" stroke="none" />
  </>,
);

export const IconChat = base(<path d="M21 11.5a7.5 7.5 0 0 1-11 6.6L4 19l1.1-3.7A7.5 7.5 0 1 1 21 11.5Z" />);

export const IconTag = base(
  <>
    <path d="M12.6 3H5a2 2 0 0 0-2 2v7.6a2 2 0 0 0 .6 1.4l8.4 8.4a2 2 0 0 0 2.8 0l6.6-6.6a2 2 0 0 0 0-2.8L13 3.6a2 2 0 0 0-.4 0Z" />
    <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" stroke="none" />
  </>,
);

export const IconFileText = base(
  <>
    <path d="M6 2.5h8l4.5 4.5V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z" />
    <path d="M14 2.5V7h4.5" />
    <path d="M8 12.5h8M8 16h8M8 9h4" />
  </>,
);

export const IconBell = base(
  <>
    <path d="M6 9a6 6 0 0 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9Z" />
    <path d="M10 19a2 2 0 0 0 4 0" />
  </>,
);

export const IconSearch = base(
  <>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </>,
);

export const IconChevronDown = base(<path d="m6 9 6 6 6-6" />);
export const IconChevronRight = base(<path d="m9 6 6 6-6 6" />);

export const IconMenu = base(<path d="M3 6h18M3 12h18M3 18h18" />);
export const IconX = base(<path d="M18 6 6 18M6 6l12 12" />);

export const IconSend = base(<path d="M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z" />);

export const IconCheck = base(<path d="M20 6 9 17l-5-5" />);
export const IconPlus = base(<path d="M12 5v14M5 12h14" />);

export const IconCalendar = base(
  <>
    <rect x="3" y="4.5" width="18" height="16" rx="2" />
    <path d="M3 9.5h18M8 2.5v4M16 2.5v4" />
  </>,
);

export const IconClock = base(
  <>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3.5 2" />
  </>,
);

export const IconPhone = base(
  <path d="M5 4h3.2l1.3 4.3-2 1.6a12.5 12.5 0 0 0 6.6 6.6l1.6-2 4.3 1.3V19a2 2 0 0 1-2.2 2A16 16 0 0 1 3 5.2 2 2 0 0 1 5 4Z" />,
);

export const IconMapPin = base(
  <>
    <path d="M12 21.5s7-6.3 7-11.5a7 7 0 1 0-14 0c0 5.2 7 11.5 7 11.5Z" />
    <circle cx="12" cy="10" r="2.4" />
  </>,
);

export const IconDownload = base(
  <>
    <path d="M12 3v12m0 0-4-4m4 4 4-4" />
    <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </>,
);

export const IconPrinter = base(
  <>
    <path d="M6 9V3h12v6" />
    <rect x="4" y="9" width="16" height="8" rx="1.5" />
    <path d="M6 14.5h12V21H6z" />
  </>,
);

export const IconFilter = base(<path d="M4 5h16l-6 8v6l-4-2v-4Z" />);

export const IconArrowLeft = base(<path d="M19 12H5m0 0 6 6m-6-6 6-6" />);

export const IconLogOut = base(
  <>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </>,
);

export const IconAlertTriangle = base(
  <>
    <path d="M12 3.5 22 20H2Z" />
    <path d="M12 9.5v4.2M12 17h.01" />
  </>,
);

export const IconMoreHorizontal = base(
  <>
    <circle cx="5" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <circle cx="19" cy="12" r="1.3" fill="currentColor" stroke="none" />
  </>,
);

export const IconShield = base(<path d="M12 2.5 4.5 5.5V11c0 5.2 3.2 8.9 7.5 10.5 4.3-1.6 7.5-5.3 7.5-10.5V5.5Z" />);

export const IconBuilding = base(
  <>
    <rect x="4" y="3" width="10" height="18" />
    <rect x="14" y="8" width="6" height="13" />
    <path d="M7 7h1M7 11h1M7 15h1M10.5 7h1M10.5 11h1M10.5 15h1M16.5 11h1M16.5 15h1" />
  </>,
);
