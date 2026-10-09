import React from 'react';
import { View, Image, Text, StyleSheet, ViewStyle, ImageStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../../utils/theme';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
  style?: ViewStyle | ImageStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 48,
  style,
}) => {
  const getInitials = (name?: string) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const getAvatarColor = (name?: string) => {
    if (!name) return theme.colors.textSecondary;
    const colors = [
      theme.colors.primary,
      theme.colors.secondary,
      theme.colors.accent,
      theme.colors.warning,
      theme.colors.info,
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const iconSize = size * 0.5;
  const fontSize = size * 0.4;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, containerStyle, ...(Array.isArray(style) ? style : [style])]}
      />
    );
  }

  return (
    <View style={[styles.placeholder, containerStyle, { backgroundColor: getAvatarColor(name) }, ...(Array.isArray(style) ? style : [style])]}>
      {name ? (
        <Text style={[styles.initials, { fontSize }]}>{getInitials(name)}</Text>
      ) : (
        <Ionicons name="person" size={iconSize} color="#fff" />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  image: {
    backgroundColor: theme.colors.border,
  },
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    color: '#fff',
    fontWeight: '600',
  },
});
