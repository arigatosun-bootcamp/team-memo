// Bug 12（部分）: avatar_url に sanitizeUrl() を適用していない
// javascript: プロトコルのURLが設定された場合、XSS脆弱性になる
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

  // Bug 12: sanitizeUrl() を使わずに直接 img タグの src に設定
  // javascript: スキームのURLが入ると XSS になる
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
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
