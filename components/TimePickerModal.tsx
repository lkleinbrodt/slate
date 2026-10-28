import { Modal, Pressable, ScrollView, StyleSheet, View } from "react-native";
import { Radius, shadow } from "@/constants/theme";
import React, { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Grain } from "@/components/ui/Screen";
import { ThemedText } from "./themed-text";
import { formatTime } from "./TimePickerButton";
import { haptic } from "@/components/ui/PressableScale";
import { useTheme } from "@/hooks/use-theme";

interface TimePickerModalProps {
  visible: boolean;
  selectedTime: string; // HH:mm format
  onTimeSelect: (time: string) => void;
  onClose: () => void;
  title?: string;
}

const ROW = 44;

export const TimePickerModal: React.FC<TimePickerModalProps> = ({
  visible,
  selectedTime,
  onTimeSelect,
  onClose,
  title = "Pick a time",
}) => {
  const { colors, scheme } = useTheme();
  const [hour, setHour] = useState(() => Number(selectedTime.split(":")[0]));
  const [minute, setMinute] = useState(() => Number(selectedTime.split(":")[1]));

  const time = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  const hours = Array.from({ length: 24 }, (_, i) => i);
  // Five-minute steps, plus the current value if it's off the grid
  const minutes = Array.from({ length: 12 }, (_, i) => i * 5);
  if (!minutes.includes(minute)) {
    minutes.push(minute);
    minutes.sort((a, b) => a - b);
  }

  const column = (
    values: number[],
    selected: number,
    onSelect: (v: number) => void,
    label: (v: number) => string
  ) => (
    <ScrollView
      style={[styles.column, { backgroundColor: colors.surfaceSunken }]}
      contentContainerStyle={styles.columnContent}
      showsVerticalScrollIndicator={false}
      contentOffset={{ x: 0, y: Math.max(0, values.indexOf(selected) * ROW - ROW * 2) }}
    >
      {values.map((v) => {
        const isSelected = v === selected;
        return (
          <Pressable
            key={v}
            onPress={() => {
              haptic("selection");
              onSelect(v);
            }}
            style={[
              styles.cell,
              isSelected && { backgroundColor: colors.primary },
            ]}
          >
            <ThemedText
              type={isSelected ? "bodySemiBold" : "body"}
              style={[styles.cellText, { color: isSelected ? colors.onPrimary : colors.text }]}
            >
              {label(v)}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.overlay, { backgroundColor: colors.scrim }]} onPress={onClose}>
        <Pressable
          style={[styles.card, { backgroundColor: colors.surface }, shadow(scheme, 3)]}
          onPress={() => {}}
        >
          <Grain opacity={0.6} />
          <ThemedText type="eyebrow" tone="textTertiary">
            {title}
          </ThemedText>
          <ThemedText type="display" style={styles.preview}>
            {formatTime(time)}
          </ThemedText>

          <View style={styles.columns}>
            {column(hours, hour, setHour, (h) => {
              const hh = h % 12 === 0 ? 12 : h % 12;
              return `${hh} ${h < 12 ? "am" : "pm"}`;
            })}
            {column(minutes, minute, setMinute, (m) => `:${String(m).padStart(2, "0")}`)}
          </View>

          <View style={styles.buttons}>
            <Button title="Cancel" variant="secondary" size="md" onPress={onClose} style={styles.flex} />
            <Button
              title="Set time"
              size="md"
              haptics="medium"
              onPress={() => {
                onTimeSelect(time);
                onClose();
              }}
              style={styles.flex}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: Radius.xxl,
    padding: 22,
    overflow: "hidden",
  },
  preview: { marginTop: 4, marginBottom: 18, fontVariant: ["tabular-nums"] },
  columns: { flexDirection: "row", gap: 12, marginBottom: 20 },
  column: { flex: 1, height: ROW * 5, borderRadius: Radius.lg },
  columnContent: { padding: 6 },
  cell: {
    height: ROW,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cellText: { fontVariant: ["tabular-nums"] },
  buttons: { flexDirection: "row", gap: 12 },
  flex: { flex: 1 },
});
