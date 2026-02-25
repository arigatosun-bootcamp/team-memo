type TagBadgeProps = {
  name: string;
  color?: string;
  onClick?: () => void;
  removable?: boolean;
  onRemove?: () => void;
};

export default function TagBadge({
  name,
  color = "#666666",
  onClick,
  removable,
  onRemove,
}: TagBadgeProps) {
  return (
    <span
      onClick={onClick}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "4px",
        padding: "2px 8px",
        borderRadius: "12px",
        fontSize: "12px",
        backgroundColor: color + "20",
        color: color,
        border: `1px solid ${color}40`,
        cursor: onClick ? "pointer" : "default",
      }}
    >
      #{name}
      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={{
            background: "none",
            border: "none",
            color: color,
            cursor: "pointer",
            padding: "0 2px",
            fontSize: "14px",
            lineHeight: 1,
          }}
        >
          ×
        </button>
      )}
    </span>
  );
}
