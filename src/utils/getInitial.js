export function getInitial(value = "") {
  const [name = ""] = String(value).split("@");

  return (
    name
      .split(/[.\s_-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "U"
  );
}
