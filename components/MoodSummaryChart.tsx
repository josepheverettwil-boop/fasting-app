import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Svg, { Path, Circle, Line, Text as SvgText } from "react-native-svg";
import { MoodEntry } from "@/lib/types";
import { colors, moodColors, moodLabels, spacing, fontSize, borderRadius } from "@/lib/theme";

interface MoodSummaryChartProps {
  entries: MoodEntry[];
  totalHours: number;
}

export function MoodSummaryChart({ entries, totalHours }: MoodSummaryChartProps) {
  if (entries.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.emptyText}>No mood data recorded for this fast</Text>
      </View>
    );
  }

  const width = 320;
  const height = 180;
  const padX = 40;
  const padY = 20;
  const chartW = width - padX * 2;
  const chartH = height - padY * 2;

  const sorted = [...entries].sort((a, b) => a.hours_into_fast - b.hours_into_fast);

  const scaleX = (h: number) => padX + (h / totalHours) * chartW;
  const scaleY = (score: number) => padY + chartH - ((score - 1) / 4) * chartH;

  const points = sorted.map((e) => ({
    x: scaleX(e.hours_into_fast),
    y: scaleY(e.mood_score),
    score: e.mood_score,
    hours: e.hours_into_fast,
    note: e.note,
  }));

  let pathD = "";
  if (points.length === 1) {
    pathD = "";
  } else {
    pathD = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");
  }

  const avgMood =
    entries.reduce((sum, e) => sum + e.mood_score, 0) / entries.length;
  const lowestEntry = sorted.reduce((min, e) =>
    e.mood_score < min.mood_score ? e : min
  );
  const highestEntry = sorted.reduce((max, e) =>
    e.mood_score > max.mood_score ? e : max
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mood Journey</Text>

      <View style={styles.chartContainer}>
        <Svg width={width} height={height}>
          {[1, 2, 3, 4, 5].map((score) => (
            <React.Fragment key={score}>
              <Line
                x1={padX}
                y1={scaleY(score)}
                x2={width - padX}
                y2={scaleY(score)}
                stroke={colors.cardBorder}
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              <SvgText
                x={padX - 8}
                y={scaleY(score) + 4}
                fill={colors.textMuted}
                fontSize={10}
                textAnchor="end"
              >
                {score}
              </SvgText>
            </React.Fragment>
          ))}

          {pathD ? (
            <Path
              d={pathD}
              fill="none"
              stroke={colors.primary}
              strokeWidth={2.5}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null}

          {points.map((p, i) => (
            <Circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={5}
              fill={moodColors[p.score - 1]}
              stroke={colors.card}
              strokeWidth={2}
            />
          ))}
        </Svg>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statValue}>{avgMood.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Avg Mood</Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: moodColors[highestEntry.mood_score - 1] }]}>
            {moodLabels[highestEntry.mood_score - 1]}
          </Text>
          <Text style={styles.statLabel}>
            Peak @ {highestEntry.hours_into_fast.toFixed(1)}h
          </Text>
        </View>
        <View style={styles.stat}>
          <Text style={[styles.statValue, { color: moodColors[lowestEntry.mood_score - 1] }]}>
            {moodLabels[lowestEntry.mood_score - 1]}
          </Text>
          <Text style={styles.statLabel}>
            Low @ {lowestEntry.hours_into_fast.toFixed(1)}h
          </Text>
        </View>
      </View>

      {entries.filter((e) => e.note).length > 0 && (
        <View style={styles.notesSection}>
          <Text style={styles.notesTitle}>Notes</Text>
          {entries
            .filter((e) => e.note)
            .map((e, i) => (
              <View key={i} style={styles.noteRow}>
                <View
                  style={[
                    styles.noteDot,
                    { backgroundColor: moodColors[e.mood_score - 1] },
                  ]}
                />
                <View style={styles.noteContent}>
                  <Text style={styles.noteTime}>
                    {e.hours_into_fast.toFixed(1)}h in
                  </Text>
                  <Text style={styles.noteText}>{e.note}</Text>
                </View>
              </View>
            ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    padding: spacing.md,
  },
  title: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: spacing.md,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: "center",
    padding: spacing.lg,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    fontSize: fontSize.lg,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  statLabel: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  notesSection: {
    borderTopWidth: 1,
    borderTopColor: colors.cardBorder,
    paddingTop: spacing.md,
  },
  notesTitle: {
    fontSize: fontSize.md,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  noteRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: spacing.sm,
  },
  noteDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
    marginRight: spacing.sm,
  },
  noteContent: {
    flex: 1,
  },
  noteTime: {
    fontSize: fontSize.xs,
    color: colors.textMuted,
    marginBottom: 2,
  },
  noteText: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
});
