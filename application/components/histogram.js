// Histogram.js
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';

const screenWidth = Dimensions.get("window").width;

const generateTimeSlots = (startTime, endTime) => {
  const timeSlots = [];
  const start = new Date();
  start.setHours(startTime.split(":")[0], startTime.split(":")[1]);
  const end = new Date();
  end.setHours(endTime.split(":")[0], endTime.split(":")[1]);

  while (start <= end) {
    const hours = start.getHours();
    const minutes = start.getMinutes();
    const timeLabel = `${hours % 12 || 12}:${minutes === 0 ? "00" : minutes} ${hours >= 12 ? "PM" : "AM"}`;
    timeSlots.push(timeLabel);
    start.setMinutes(start.getMinutes() + 30);
  }

  return timeSlots;
};

const Histogram = ({ data, startTime = "06:00", endTime = "22:00" }) => {
  const timeSlots = generateTimeSlots(startTime, endTime);

  return (
    <View style={styles.container}>
      <View style={styles.chartBox}>
        <Text style={styles.title}>
         Expected for {data.day.charAt(0).toUpperCase() + data.day.slice(1)}:
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <BarChart
            data={{
              labels: timeSlots,
              datasets: [
                {
                  data: data.values.map(value => value * 100),
                },
              ],
            }}
            width={timeSlots.length * 30}
            height={240}
            yAxisSuffix="%"
            yAxisInterval={1}
            fromZero={true}
            chartConfig={{
              backgroundColor: "#f8f8f8",
              backgroundGradientFrom: "#f8f8f8",
              backgroundGradientTo: "#f8f8f8",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 0, 255, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForDots: {
                r: "3",
                strokeWidth: "1",
                stroke: "#ffa726",
              },
              barPercentage: 0.8,
              propsForVerticalLabels: {
                fontSize: 8,
                rotation: 90,
              },
            }}
            style={{
              marginVertical: 8,
              borderRadius: 16,
            }}
          />
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center", 
  },
  chartBox: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 10,
    alignSelf: "left",
    maxWidth: screenWidth - 8,
    height: 300,
  },
  title: {
    fontSize: 16,
    marginBottom: 12,
    textAlign: "center",
  },
});

export default Histogram;