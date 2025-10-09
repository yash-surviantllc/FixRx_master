/**
 * React Native Form Components
 * Replacement for Radix UI form components
 */

import React, { createContext, useContext, ReactNode } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TextInputProps,
  TouchableOpacity,
} from 'react-native';
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  ControllerProps,
  FieldPath,
  FieldValues,
  UseFormReturn,
} from 'react-hook-form';
import { colors, spacing, fontSize, fontWeight } from '../../utils/styleConverter';

// Form Context
type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> = {
  name: TName;
};

const FormFieldContext = createContext<FormFieldContextValue>(
  {} as FormFieldContextValue
);

type FormItemContextValue = {
  id: string;
};

const FormItemContext = createContext<FormItemContextValue>(
  {} as FormItemContextValue
);

// Form Provider Component
export const Form = <TFieldValues extends FieldValues = FieldValues>({
  children,
  ...props
}: UseFormReturn<TFieldValues> & { children: ReactNode }) => {
  return <FormProvider {...props}>{children}</FormProvider>;
};

// Form Field Component
export const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

// Custom hook for form field
export const useFormField = () => {
  const fieldContext = useContext(FormFieldContext);
  const itemContext = useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext.name });
  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error('useFormField should be used within <FormField>');
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

// Form Item Component
interface FormItemProps {
  children: ReactNode;
  style?: ViewStyle;
}

export const FormItem: React.FC<FormItemProps> = ({ children, style }) => {
  const id = React.useId ? React.useId() : Math.random().toString();

  return (
    <FormItemContext.Provider value={{ id }}>
      <View style={[styles.formItem, style]}>{children}</View>
    </FormItemContext.Provider>
  );
};

// Form Label Component
interface FormLabelProps {
  children: ReactNode;
  style?: TextStyle;
}

export const FormLabel: React.FC<FormLabelProps> = ({ children, style }) => {
  const { error } = useFormField();

  return (
    <Text
      style={[
        styles.formLabel,
        error && styles.formLabelError,
        style,
      ]}
    >
      {children}
    </Text>
  );
};

// Form Control Component (Input wrapper)
interface FormControlProps extends TextInputProps {
  style?: ViewStyle;
}

export const FormControl: React.FC<FormControlProps> = ({ style, ...props }) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  return (
    <TextInput
      style={[
        styles.formControl,
        error && styles.formControlError,
        style,
      ]}
      placeholderTextColor={colors.gray400}
      accessibilityLabel={formItemId}
      accessibilityHint={
        error ? formMessageId : formDescriptionId
      }
      {...props}
    />
  );
};

// Form Description Component
interface FormDescriptionProps {
  children: ReactNode;
  style?: TextStyle;
}

export const FormDescription: React.FC<FormDescriptionProps> = ({
  children,
  style,
}) => {
  const { formDescriptionId } = useFormField();

  return (
    <Text
      id={formDescriptionId}
      style={[styles.formDescription, style]}
    >
      {children}
    </Text>
  );
};

// Form Message Component (Error message)
interface FormMessageProps {
  children?: ReactNode;
  style?: TextStyle;
}

export const FormMessage: React.FC<FormMessageProps> = ({ children, style }) => {
  const { error, formMessageId } = useFormField();
  const message = error ? String(error?.message) : children;

  if (!message) {
    return null;
  }

  return (
    <Text
      id={formMessageId}
      style={[
        styles.formMessage,
        error && styles.formMessageError,
        style,
      ]}
    >
      {message}
    </Text>
  );
};

// Form Button Component
interface FormButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'outline';
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const FormButton: React.FC<FormButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  disabled = false,
  style,
  textStyle,
}) => {
  const buttonStyles = [
    styles.button,
    variant === 'primary' && styles.buttonPrimary,
    variant === 'secondary' && styles.buttonSecondary,
    variant === 'outline' && styles.buttonOutline,
    disabled && styles.buttonDisabled,
    style,
  ];

  const textStyles = [
    styles.buttonText,
    variant === 'primary' && styles.buttonTextPrimary,
    variant === 'secondary' && styles.buttonTextSecondary,
    variant === 'outline' && styles.buttonTextOutline,
    disabled && styles.buttonTextDisabled,
    textStyle,
  ];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={buttonStyles}
      activeOpacity={0.8}
    >
      <Text style={textStyles}>{title}</Text>
    </TouchableOpacity>
  );
};

// Styles
const styles = StyleSheet.create({
  formItem: {
    marginBottom: spacing[4],
  },
  formLabel: {
    fontSize: fontSize.sm,
    fontWeight: fontWeight.medium,
    color: colors.foreground,
    marginBottom: spacing[2],
  },
  formLabelError: {
    color: colors.destructive,
  },
  formControl: {
    borderWidth: 1,
    borderColor: colors.input,
    borderRadius: 6,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[2],
    fontSize: fontSize.base,
    color: colors.foreground,
    backgroundColor: colors.background,
  },
  formControlError: {
    borderColor: colors.destructive,
  },
  formDescription: {
    fontSize: fontSize.sm,
    color: colors.mutedForeground,
    marginTop: spacing[2],
  },
  formMessage: {
    fontSize: fontSize.sm,
    marginTop: spacing[2],
  },
  formMessageError: {
    color: colors.destructive,
  },
  button: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonPrimary: {
    backgroundColor: colors.primary,
  },
  buttonSecondary: {
    backgroundColor: colors.secondary,
  },
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: fontSize.base,
    fontWeight: fontWeight.medium,
  },
  buttonTextPrimary: {
    color: '#ffffff',
  },
  buttonTextSecondary: {
    color: '#ffffff',
  },
  buttonTextOutline: {
    color: colors.foreground,
  },
  buttonTextDisabled: {
    color: colors.mutedForeground,
  },
});

export default {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormButton,
  useFormField,
};
