function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const first = words[0]?.[0] ?? '?';
  const second = words.length > 1 ? words[words.length - 1][0] : '';
  return (first + second).toUpperCase();
}

export default function GuildIcon({ name, iconUrl, size = 56 }: { name: string; iconUrl: string | null; size?: number }) {
  if (iconUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={iconUrl} alt={`Icono de ${name}`} width={size} height={size} className="guild-icon" loading="lazy" />;
  }
  return (
    <div className="guild-icon" style={{ width: size, height: size }} aria-hidden="true">
      {initials(name)}
    </div>
  );
}
