import { Alert, Platform } from "react-native";

export function showAlert(title: string, message?: string, buttons?: Array<{ text: string; style?: string; onPress?: () => void }>) {
  if (Platform.OS === "web") {
    if (buttons && buttons.length > 1) {
      const confirmed = window.confirm(`${title}\n\n${message ?? ""}`);
      if (confirmed) {
        const action = buttons.find((b) => b.style !== "cancel");
        action?.onPress?.();
      }
    } else {
      window.alert(`${title}${message ? `\n\n${message}` : ""}`);
    }
  } else {
    Alert.alert(title, message, buttons as any);
  }
}
