import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useNickname } from "@/contexts/NicknameContext";
import { Button } from "@/components/Button";
import { colors, spacing, fontSize, borderRadius } from "@/lib/theme";

export default function WelcomeScreen() {
  const { setNickname } = useNickname();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setLoading(true);
    await setNickname(trimmed);
    router.replace("/(tabs)");
  };

  return (
    <LinearGradient
      colors={[colors.background, colors.backgroundLight]}
      style={styles.flex}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.flex}
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.logo}>FAST</Text>
            <Text style={styles.subtitle}>Track. Connect. Thrive.</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>What should we call you?</Text>
            <Text style={styles.hint}>
              Pick a nickname to get started. No account needed.
            </Text>

            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Enter a nickname..."
              placeholderTextColor={colors.textMuted}
              autoFocus
              maxLength={24}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleContinue}
              returnKeyType="go"
            />

            <Button
              title="Let's Go"
              onPress={handleContinue}
              loading={loading}
              disabled={!name.trim()}
              fullWidth
              size="lg"
            />
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: spacing.lg,
  },
  header: {
    alignItems: "center",
    marginBottom: spacing.xxl,
  },
  logo: {
    fontSize: 64,
    fontWeight: "900",
    color: colors.primary,
    letterSpacing: 10,
  },
  subtitle: {
    fontSize: fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    letterSpacing: 1,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.lg,
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  hint: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: 20,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: fontSize.lg,
    marginBottom: spacing.lg,
    textAlign: "center",
    fontWeight: "600",
  },
});
