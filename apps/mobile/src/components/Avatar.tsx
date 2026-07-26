import { Image } from "expo-image";
import { Text, View } from "react-native";
import { theme } from "@/lib/theme";

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
}

export function Avatar({ uri, name, size = 40 }: AvatarProps) {
  const initial = (name ?? "?").trim().charAt(0).toUpperCase() || "?";
  const radius = size / 2;
  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: radius, backgroundColor: theme.colors.surfaceAlt }}
        contentFit="cover"
        transition={150}
      />
    );
  }
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        backgroundColor: theme.colors.surfaceAlt,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: theme.colors.text, fontSize: size * 0.42, fontWeight: "600" }}>{initial}</Text>
    </View>
  );
}
