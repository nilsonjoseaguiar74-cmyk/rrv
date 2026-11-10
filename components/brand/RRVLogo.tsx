type RRVLogoVariant = "monochrome" | "contextual" | "symbol" | "white";

type RRVLogoProps = {
  variant?: RRVLogoVariant;
  className?: string;
  title?: string;
};

export function RRVLogo({
  variant = "monochrome",
  className = "",
  title = "RRV.digital",
}: RRVLogoProps) {
  if (variant === "white") {
    return (
      <span className={`rrv-logo rrv-logo-white ${className}`.trim()} role="img" aria-label={title}>
        <img
          src="/brand/logowhitehorizontal.png"
          alt=""
          aria-hidden="true"
        />
      </span>
    );
  }

  if (variant === "contextual") {
    return (
      <span className={`rrv-logo rrv-logo-contextual ${className}`.trim()} role="img" aria-label={title}>
        <img src="/brand/rrv-lockup-color.png" alt="" aria-hidden="true" />
      </span>
    );
  }

  if (variant === "symbol") {
    return (
      <span className={`rrv-logo rrv-logo-symbol ${className}`.trim()} role="img" aria-label={title}>
        <img src="/brand/rrv-lockup-color.png" alt="" aria-hidden="true" />
      </span>
    );
  }

  return (
    <span className={`rrv-logo rrv-logo-monochrome ${className}`.trim()} role="img" aria-label={title}>
      <img
        className="rrv-logo-monochrome-image"
        src="/brand/rrv-lockup-black-transparent.png"
        alt=""
        aria-hidden="true"
      />
    </span>
  );
}
