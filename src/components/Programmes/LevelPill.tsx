export function LevelPill({ level, label }: { level: number; label: string }) {
  return (
    <span className={`fm-level fm-level--${level}`}>
      <span className="fm-level__bars">
        <i />
        <i />
        <i />
      </span>
      {label}
    </span>
  );
}
