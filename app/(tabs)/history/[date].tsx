import * as repo from "@/lib/logic/repo";

import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";

import { HabitItem } from "@/components/HabitItem";
import { SafeAreaThemedView } from "@/components/safe-area-themed-view";
import { TaskItem } from "@/components/TaskItem";
import { ThemedText } from "@/components/themed-text";
import { useLocalSearchParams } from "expo-router";

export default function DayDetailsScreen() {
  const { date } = useLocalSearchParams<{ date: string }>();
  const [loading, setLoading] = useState(true);
  const [dayData, setDayData] = useState<{
    tasks: any[];
    habits: any[];
    isPerfectDay: boolean;
  } | null>(null);

  useEffect(() => {
    if (date) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [tasks, habits] = await Promise.all([
            repo.getDayTasksHistory(date),
            repo.getDayHabitsHistory(date),
          ]);

          // Check if it's a perfect day
          const perfectDay =
            habits.length > 0 && habits.every((h) => h.habit_history.completed);

          setDayData({ tasks, habits, isPerfectDay: perfectDay });
        } catch (error) {
          console.error("Failed to fetch day data:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [date]);

  if (loading) {
    return (
      <SafeAreaThemedView style={styles.container}>
        <ActivityIndicator style={styles.center} />
      </SafeAreaThemedView>
    );
  }

  if (!dayData) {
    return (
      <SafeAreaThemedView style={styles.container}>
        <ThemedText style={styles.center}>No data for this day.</ThemedText>
      </SafeAreaThemedView>
    );
  }

  return (
    <SafeAreaThemedView style={styles.container}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <ThemedText style={styles.title}>Details for {date}</ThemedText>
          {dayData.isPerfectDay && (
            <ThemedText style={styles.perfectDay}>🎉 Perfect Day!</ThemedText>
          )}
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Habits</ThemedText>
          {dayData.habits.map((h) => (
            <HabitItem
              key={h.habit_history.id}
              habit={h.habits}
              isCompleted={h.habit_history.completed}
              onEdit={() => {}}
              onToggle={() => {}}
              streak={0}
              isReadOnly
            />
          ))}
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>Tasks</ThemedText>
          {dayData.tasks.map((t) => (
            <TaskItem
              key={t.task_history.id}
              task={t.tasks}
              isCompleted={t.task_history.completed}
              onEdit={() => {}}
              onToggle={() => {}}
              isReadOnly
            />
          ))}
        </View>
      </ScrollView>
    </SafeAreaThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  scrollView: { flex: 1, padding: 16 },
  header: { marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
  perfectDay: { fontSize: 18, color: "#10B981", fontWeight: "600" },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
});
