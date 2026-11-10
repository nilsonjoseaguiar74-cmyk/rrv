"use client";

import { usePathname } from "next/navigation";

const WHATSAPP_URL =
  "https://wa.me/554899880536?text=Olá%2C%20vim%20pelo%20site%20da%20RRV.digital.";

export default function WhatsAppButton() {
  const pathname = usePathname();

  if (
    pathname.startsWith("/admin") ||
    pathname.startsWith("/gestao")
  ) {
    return null;
  }

  return (
    <a
      className="rrv-whatsapp"
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Falar com a RRV pelo WhatsApp"
      title="WhatsApp"
    >
      <svg
        viewBox="0 0 32 32"
        aria-hidden="true"
        width="23"
        height="23"
      >
        <path
          fill="currentColor"
          d="M16.04 3C9.41 3 4.02 8.34 4.02 14.91c0 2.1.55 4.15 1.6 5.96L3.5 28.6l7.96-2.08a12.1 12.1 0 0 0 4.58.9h.01c6.62 0 12.02-5.35 12.02-11.92C28.07 8.94 22.67 3 16.04 3Zm0 22.4h-.01a10.1 10.1 0 0 1-4.33-.97l-.31-.15-4.72 1.23 1.26-4.58-.2-.32a9.82 9.82 0 0 1-1.52-5.24c0-5.43 4.44-9.85 9.9-9.85s9.9 4.42 9.9 9.85-4.45 10.03-9.97 10.03Zm5.43-7.39c-.3-.15-1.76-.86-2.03-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.65.07-.3-.15-1.25-.46-2.38-1.46a8.86 8.86 0 0 1-1.65-2.04c-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.19-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1-1.04 2.45 0 1.44 1.07 2.84 1.22 3.04.15.2 2.1 3.19 5.08 4.47.71.3 1.27.49 1.7.63.71.22 1.36.19 1.87.12.57-.08 1.76-.71 2.01-1.4.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35Z"
        />
      </svg>
      <span>WhatsApp</span>
    </a>
  );
}
