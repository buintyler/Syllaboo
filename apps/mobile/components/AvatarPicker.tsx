import { View, Text, TouchableOpacity, StyleSheet, FlatList } from 'react-native';
import { AVATAR_OPTIONS, AvatarOption } from '../lib/avatars';
import { colors, spacing } from '../constants/theme';

interface AvatarPickerProps {
  selectedId: string | null;
  onSelect: (avatarId: string) => void;
}

const AVATAR_SIZE = 72;
const NUM_COLUMNS = 4;

export default function AvatarPicker({ selectedId, onSelect }: AvatarPickerProps) {
  const renderItem = ({ item }: { item: AvatarOption }) => {
    const isSelected = item.id === selectedId;
    return (
      <TouchableOpacity
        style={[
          styles.avatar,
          { backgroundColor: item.backgroundColor },
          isSelected && styles.avatarSelected,
        ]}
        onPress={() => onSelect(item.id)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={item.label}
        accessibilityState={{ selected: isSelected }}
      >
        <Text style={styles.emoji}>{item.emoji}</Text>
        {isSelected ? (
          <View style={styles.checkBadge}>
            <Text style={styles.checkMark}>{'✓'}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={AVATAR_OPTIONS}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={NUM_COLUMNS}
      scrollEnabled={false}
      contentContainerStyle={styles.grid}
      columnWrapperStyle={styles.row}
    />
  );
}

const styles = StyleSheet.create({
  grid: {
    gap: spacing.md,
  },
  row: {
    gap: spacing.md,
    justifyContent: 'center',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarSelected: {
    borderColor: colors.brand.primary,
    borderWidth: 3,
  },
  emoji: {
    fontSize: 32,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.brand.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg.surface,
  },
  checkMark: {
    fontSize: 12,
    color: colors.text.onBrand,
    fontWeight: '700',
  },
});
