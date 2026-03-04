export interface NavItem {
  label: string;
  href: string;
  Icon: React.FC<{ className?: string }>;
}

const iconProps = { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

function HomeIcon({ className = "" }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" {...iconProps}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
}
function BookOpenIcon({ className = "" }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" {...iconProps}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
}
function TimerIcon({ className = "" }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" {...iconProps}><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5"/><path d="M9 3h6"/><path d="M12 3v2"/></svg>;
}
function LayersIcon({ className = "" }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" {...iconProps}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>;
}
function QuizIcon({ className = "" }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" {...iconProps}><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
}
function MessageIcon({ className = "" }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" {...iconProps}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
}
function SettingsIcon({ className = "" }: { className?: string }) {
  return <svg className={className} xmlns="http://www.w3.org/2000/svg" {...iconProps}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
}

export const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", Icon: HomeIcon },
  { label: "Courses",   href: "/courses",   Icon: BookOpenIcon },
  { label: "Study",     href: "/study",     Icon: TimerIcon },
  { label: "Review",    href: "/review",    Icon: LayersIcon },
  { label: "Quiz",      href: "/quiz",      Icon: QuizIcon },
  { label: "Chat",      href: "/chat",      Icon: MessageIcon },
];

export const bottomNavItems: NavItem[] = [
  { label: "Settings", href: "/settings", Icon: SettingsIcon },
];
