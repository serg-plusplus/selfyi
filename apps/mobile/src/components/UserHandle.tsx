import { useRouter } from "expo-router";
import { Text, type TextStyle } from "react-native";
import { theme } from "@/lib/theme";

interface UserHandleProps {
  handle: string;
  style?: TextStyle;
  tappable?: boolean;
}

export function UserHandle({ handle, style, tappable = true }: UserHandleProps) {
  const router = useRouter();
  return (
    <Text
      onPress={tappable ? () => router.push(`/user/${handle}`) : undefined}
      style={[{ color: theme.colors.text, fontWeight: "600", fontSize: theme.font.md }, style]}
    >
      @{handle}
    </Text>
  );
}
