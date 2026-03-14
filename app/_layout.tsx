import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { NicknameProvider } from "@/contexts/NicknameContext";
import { colors } from "@/lib/theme";

export default function RootLayout() {
  return (
    <NicknameProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
          animation: "slide_from_right",
        }}
      />
    </NicknameProvider>
  );
}
