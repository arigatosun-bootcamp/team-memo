import { sanitizeUrl } from "@/lib/utils";

type UserAvatarProps = {
  displayName: string;
  avatarUrl?: string | null;
  size?: number;
};

export default function UserAvatar({
  displayName,
  avatarUrl,
  size = 40,
}: UserAvatarProps) {
  const initial = displayName?.charAt(0)?.toUpperCase() || "?";

  const safeUrl = avatarUrl ? sanitizeUrl(avatarUrl) : "";
  if (safeUrl) {
    return (
      <img
        src={safeUrl}
        alt={displayName}
        width={size}
        height={size}
        style={{
          borderRadius: "50%",
          objectFit: "cover",
        }}
      />
    );
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: "#2563eb",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: "bold",
        fontSize: size * 0.4,
      }}
    >
      {initial}
    </div>
  );
}
