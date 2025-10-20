
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { forwardRef } from 'react';
import { StyleSheet, Text, TextProps, TouchableOpacity, TouchableOpacityProps } from 'react-native';

type ThemedButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';

export interface ThemedButtonProps extends TouchableOpacityProps {
  variant?: ThemedButtonVariant;
  title?: string;
  titleProps?: TextProps;
}

export const ThemedButton = forwardRef<TouchableOpacity, ThemedButtonProps>(
  ({ style, variant = 'primary', title, titleProps, children, ...rest }, ref) => {
    const theme = useColorScheme() ?? 'light';

    const variantStyles = {
      container: {
        primary: {
          backgroundColor: Colors[theme].tint,
        },
        secondary: {
          backgroundColor: Colors[theme].secondary,
          borderWidth: 1,
          borderColor: Colors[theme].border,
        },
        destructive: {
          backgroundColor: Colors[theme].destructive,
        },
        ghost: {
          backgroundColor: 'transparent',
        },
      },
      text: {
        primary: {
          color: Colors[theme].primaryButtonText,
        },
        secondary: {
          color: Colors[theme].text,
        },
        destructive: {
          color: Colors[theme].destructiveButtonText,
        },
        ghost: {
          color: Colors[theme].tint,
        },
      },
    };

    const disabledStyle = {
      container: {
        backgroundColor: Colors[theme].disabled,
      },
      text: {
        color: Colors[theme].disabledText,
      },
    };

    const containerStyle = [
      styles.container,
      variantStyles.container[variant],
      rest.disabled && disabledStyle.container,
      style,
    ];

    const textStyle = [
      styles.text,
      variantStyles.text[variant],
      rest.disabled && disabledStyle.text,
      titleProps?.style,
    ];

    return (
      <TouchableOpacity style={containerStyle} ref={ref} {...rest}>
        {title ? <Text style={textStyle} {...titleProps}>{title}</Text> : children}
      </TouchableOpacity>
    );
  }
);

ThemedButton.displayName = 'ThemedButton';

const styles = StyleSheet.create({
  container: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
