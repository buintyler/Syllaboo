import { View, Text, StyleSheet } from 'react-native';

export default function ReadingSession() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reading Session</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold' },
});
