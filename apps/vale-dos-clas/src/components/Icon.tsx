import { ICONS, type IconId } from "@/lib/icons";

export default function Icon({ id, size = 18, className = "" }: { id: IconId; size?: number; className?: string }) {
  return (
    <span
      className={`icon ${className}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: ICONS[id] }}
      aria-hidden="true"
    />
  );
}
