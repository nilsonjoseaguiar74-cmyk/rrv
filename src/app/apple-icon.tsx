import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#11120F",
          display: "flex",
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        <svg
          aria-label="RRV.digital"
          height="180"
          viewBox="0 0 64 64"
          width="180"
        >
          <path
            d="M9 12 24 29"
            fill="none"
            stroke="#BDF600"
            strokeLinecap="square"
            strokeWidth="7"
          />
          <path
            d="M55 12 45 24"
            fill="none"
            stroke="#FF5D3A"
            strokeLinecap="square"
            strokeWidth="7"
          />
          <path
            d="M9 50h11l12-10"
            fill="none"
            stroke="#9EEAFF"
            strokeLinecap="square"
            strokeLinejoin="miter"
            strokeWidth="7"
          />
          <path
            d="m24 29 8 11 13-16"
            fill="none"
            stroke="#F1F0E9"
            strokeLinecap="square"
            strokeLinejoin="miter"
            strokeWidth="7"
          />
        </svg>
      </div>
    ),
    size,
  );
}
