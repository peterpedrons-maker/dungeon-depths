import swordIcon from '@/assets/icon_sword.png';

interface ItemIconProps {
  icon: string;
  className?: string;
}

const ICON_IMAGES: Record<string, string> = {
  sword: swordIcon,
};

export function ItemIcon({ icon, className = '' }: ItemIconProps) {
  // Check if it's an image-based icon
  if (ICON_IMAGES[icon]) {
    return (
      <img 
        src={ICON_IMAGES[icon]} 
        alt={icon}
        className={`object-contain ${className}`}
        style={{ width: '1.5em', height: '1.5em' }}
      />
    );
  }
  
  // Otherwise render as emoji
  return <span className={className}>{icon}</span>;
}

