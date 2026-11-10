"use client";

import { useEffect } from "react";

const ICONS = [
  "/brand/favicon01.png",
  "/brand/favicon2.png",
];

const INTERVAL = 3 * 60 * 1000;

export default function RotatingFavicon() {
  useEffect(() => {
    let index = 0;

    function setFavicon(src: string) {
      document
        .querySelectorAll<HTMLLinkElement>(
          'link[rel="icon"], link[rel="shortcut icon"]'
        )
        .forEach((link) => link.remove());

      const icon = document.createElement("link");
      icon.rel = "icon";
      icon.type = "image/png";
      icon.href = `${src}?v=${Date.now()}`;

      document.head.appendChild(icon);
    }

    setFavicon(ICONS[0]);

    const timer = window.setInterval(() => {
      index = (index + 1) % ICONS.length;
      setFavicon(ICONS[index]);
    }, INTERVAL);

    return () => window.clearInterval(timer);
  }, []);

  return null;
}
