import React, { useState } from "react";
import { SafeAreaView, Text, PanResponder, StyleSheet } from "react-native";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const TOTAL_HOURS = 12; // Example: Displaying 12 hours (e.g., 8 AM - 8 PM)

const WeeklyScheduler = () => {
  const [blocks, setBlocks] = useState([]); // Stores the selected time blocks

  // Handles touch and drag
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onPanResponderGrant: (evt, gestureState) => {
      const { locationX, locationY } = evt.nativeEvent;
      const dayIndex = Math.floor(locationX / 70); // Assuming each day width is ~70px
      const timeIndex = Math.floor(locationY / 40); // Assuming each hour height is ~40px

      if (dayIndex >= 0 && dayIndex < DAYS.length && timeIndex >= 0 && timeIndex < TOTAL_HOURS) {
        setBlocks((prevBlocks) => [
          ...prevBlocks,
          { day: dayIndex, start: timeIndex, end: timeIndex + 1 },
        ]);
      }
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header with days */}
      <SafeAreaView style={styles.header}>
        {DAYS.map((day, index) => (
          <Text key={index} style={styles.dayText}>{day}</Text>
        ))}
      </SafeAreaView>
      
      {/* Scheduler Grid */}
      <SafeAreaView style={styles.grid} {...panResponder.panHandlers}>
        {[...Array(TOTAL_HOURS)].map((_, hour) => (
          <SafeAreaView key={hour} style={styles.row}>
            {DAYS.map((_, day) => (
              <SafeAreaView key={day} style={styles.cell}>
                {blocks.some((b) => b.day === day && b.start <= hour && b.end > hour) && (
                  <SafeAreaView style={styles.selectedBlock} />
                )}
              </SafeAreaView>
            ))}
          </SafeAreaView>
        ))}
      </SafeAreaView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  header: { flexDirection: "row", justifyContent: "space-around", marginBottom: 10 },
  dayText: { fontWeight: "bold", fontSize: 16, width: 70, textAlign: "center" },
  grid: { flexDirection: "column" },
  row: { flexDirection: "row" },
  cell: { width: 70, height: 40, borderWidth: 1, borderColor: "#ddd" },
  selectedBlock: { flex: 1, backgroundColor: "blue" },
});

export default WeeklyScheduler;
