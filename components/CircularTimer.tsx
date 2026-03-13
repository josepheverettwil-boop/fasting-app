import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from "react-native-svg";
import { colors, fontSize, spacing } from "@/lib/theme";
import { getCurrentPhase } from "@/lib/fasting-phases";

interface CircularTimerProps {
  startedAt: string;
  targetHours: number;
}

export function CircularTimer({ startedAt, targetHours }: CircularTimerProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const update = () => {
      const start = new Date(startedAt).getTime();
      setElapsed(Date.now() - start);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  const totalSeconds = Math.floor(elapsed / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const elapsedHours = elapsed / (1000 * 60 * 60);
  const progress = Math.min(elapsedHours / targetHours, 1);
  const phase = getCurrentPhase(elapsedHours);

  const size = 280;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <View style={styles.container}>
      <View style={styles.timerWrapper}>
        <Svg width={size} height={size} style={styles.svg}>
          <Defs>
            <SvgGradient id="timerGrad" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0" stopColor={colors.primary} />
              <Stop offset="1" stopColor="#FF8F5E" />
            </SvgGradient>
          </Defs>
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors.cardBorder}
            strokeWidth={strokeWidth}
            fill="none"
          />
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#timerGrad)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2}, ${size / 2}`}
          />
        </Svg>
        <View style={styles.innerContent}>
          <Text style={styles.timeText}>
            {pad(hours)}:{pad(minutes)}:{pad(seconds)}
          </Text>
          <Text style={styles.targetText}>
            of {targetHours}h goal
          </Text>
          {progress >= 1 && (
            <Text style={styles.completedText}>GOAL REACHED</Text>
          )}
        </View>
      </View>
      <View style={[styles.phaseBadge, { backgroundColor: phase.color + "22" }]}>
        <View style={[styles.phaseDot, { backgroundColor: phase.color }]} />
        <Text style={[styles.phaseText, { color: phase.color }]}>
          {phase.name}
        </Text>
      </View>
      <Text style={styles.phaseDescription}>{phase.description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingVertical: spacing.lg,
  },
  timerWrapper: {
    width: 280,
    height: 280,
    alignItems: "center",
    justifyContent: "center",
  },
  svg: {
    position: "absolute",
  },
  innerContent: {
    alignItems: "center",
  },
  timeText: {
    fontSize: fontSize.display,
    fontWeight: "200",
    color: colors.textPrimary,
    fontVariant: ["tabular-nums"],
    letterSpacing: 2,
  },
  targetText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  completedText: {
    fontSize: fontSize.xs,
    fontWeight: "800",
    color: colors.secondary,
    marginTop: spacing.sm,
    letterSpacing: 2,
  },
  phaseBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    marginTop: spacing.lg,
  },
  phaseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  phaseText: {
    fontSize: fontSize.md,
    fontWeight: "600",
  },
  phaseDescription: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
    paddingHorizontal: spacing.xl,
    lineHeight: 20,
  },
});
