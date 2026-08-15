interface LineIconProps {
  name: string;
  size?: number;
  className?: string;
}

const paths: Record<string, React.ReactNode> = {
  target: <><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="m14.5 9.5 6-6m0 0v4m0-4h-4"/></>,
  trend: <><path d="M3 18 9 12l4 4 8-10"/><path d="M16 6h5v5"/></>,
  signal: <><path d="M5 15a10 10 0 0 1 14 0M8 18a6 6 0 0 1 8 0"/><circle cx="12" cy="21" r=".5"/></>,
  campaign: <><path d="m4 13 13-5v10L4 13Z"/><path d="M17 11h3m-3 4h3M6 14l1 6h4l-2-5"/></>,
  conversion: <><path d="M4 5h16l-6 7v6l-4 2v-8L4 5Z"/></>,
  analytics: <><path d="M4 20V10m6 10V4m6 16v-7m5 7H2"/></>,
  funnel: <><path d="M3 5h18M6 10h12m-9 5h6m-4 5h2"/></>,
  frame: <><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5"/></>,
  cursor: <><path d="m6 3 12 9-6 1-3 6L6 3Z"/></>,
  layers: <><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5m-18 4 9 5 9-5"/></>,
  grid: <><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></>,
  interaction: <><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3"/></>,
  prototype: <><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h8M8 11h5m-5 4h8"/></>,
  terminal: <><rect x="3" y="4" width="18" height="16" rx="1"/><path d="m7 9 3 3-3 3m6 0h4"/></>,
  nodes: <><circle cx="5" cy="12" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="m7 11 10-5m-10 7 10 5"/></>,
  database: <><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/></>,
  network: <><circle cx="12" cy="5" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="m11 7-5 9m7-9 5 9M7 18h10"/></>,
  contract: <><path d="M6 3h9l4 4v14H6V3Z"/><path d="M15 3v5h4M9 12h6m-6 4h6"/></>,
  architecture: <><path d="M4 20V8l8-5 8 5v12M8 20v-8h8v8M2 20h20"/></>,
  branch: <><circle cx="6" cy="5" r="2"/><circle cx="18" cy="7" r="2"/><circle cx="18" cy="18" r="2"/><path d="M6 7v5c0 3 3 5 6 5h4M8 8c3 0 4-1 8-1"/></>,
  search: <><circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/></>,
  radar: <><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="m12 12 6-6"/></>,
  launch: <><path d="M8 16c-2 0-4 2-4 4 2 0 4-1 5-3M14 4c3-2 6-1 6-1s1 3-1 6l-6 6-4-4 5-7Z"/><path d="m14 15 1 5c2-1 3-4 2-7M9 10l-5-1c1-2 4-3 7-2"/></>,
  compass: <><circle cx="12" cy="12" r="9"/><path d="m15 9-2 5-5 2 2-5 5-2Z"/></>,
  route: <><circle cx="6" cy="6" r="2"/><circle cx="18" cy="18" r="2"/><path d="M8 6h4c5 0 5 6 0 6s-5 6 0 6h4"/></>,
  access: <><circle cx="12" cy="4" r="2"/><path d="M4 8h16M12 8v13m0-7-5 7m5-7 5 7"/></>,
  text: <><path d="M4 6h16M8 6v14m8-14v14M5 20h6m2 0h6"/></>,
  spark: <><path d="m12 2 2.3 7.7L22 12l-7.7 2.3L12 22l-2.3-7.7L2 12l7.7-2.3L12 2Z"/></>,
  cycle: <><path d="M20 7v5h-5M4 17v-5h5"/><path d="M6 8a8 8 0 0 1 13 4M5 12a8 8 0 0 0 13 4"/></>,
  plug: <><path d="m8 12 8-8m-5 1 4 4m-8 2 6 6-3 3a4 4 0 0 1-6-6l3-3Zm7 7 6 3"/></>,
  cloud: <><path d="M7 19h11a4 4 0 0 0 .5-8A7 7 0 0 0 5 9a5 5 0 0 0 2 10Z"/></>,
  hex: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/></>,
};

export function LineIcon({ name, size = 24, className }: LineIconProps) {
  return <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.nodes}</svg>;
}
