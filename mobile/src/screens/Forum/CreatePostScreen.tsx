import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppText, Banner, Button, TextField } from '../../components/ui';
import { colors, radius, spacing, typography, useThemeColors } from '../../theme';
import { useCreatePost } from '../../api/hooks/useForum';
import { getApiErrorMessage } from '../../api/client';
import { validateRequired } from '../../utils/validation';
import { useT } from '../../i18n';
import { ForumScreenProps } from '../../types/navigation';

export function CreatePostScreen({
  route,
  navigation,
}: ForumScreenProps<'CreatePost'>): React.ReactElement {
  const t = useT();
  const theme = useThemeColors();
  const { routeId } = route.params;
  const insets = useSafeAreaInsets();
  const createPost = useCreatePost(routeId);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [errors, setErrors] = useState<{ title?: string; body?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = async () => {
    const titleErr = validateRequired(title, t('forum.title'), t);
    const bodyErr = validateRequired(body, t('forum.body'), t);
    setErrors({ title: titleErr ?? undefined, body: bodyErr ?? undefined });
    if (titleErr || bodyErr) return;

    setFormError(null);
    try {
      await createPost.mutateAsync({ title: title.trim(), body: body.trim() });
      navigation.goBack();
    } catch (err) {
      setFormError(getApiErrorMessage(err, t('forum.postFailed')));
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.fill, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {formError ? (
          <Banner tone="error" message={formError} style={styles.banner} />
        ) : null}

        <TextField
          label={t('forum.title')}
          placeholder={t('forum.titlePlaceholder')}
          value={title}
          onChangeText={setTitle}
          error={errors.title}
          maxLength={160}
          autoCapitalize="sentences"
        />

        <AppText variant="label" color={colors.textSecondary} style={styles.label}>
          {t('forum.yourPostLabel')}
        </AppText>
        <TextInput
          style={[
            styles.bodyInput,
            { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text },
            errors.body ? { borderColor: theme.danger } : null,
          ]}
          placeholder={t('forum.bodyPlaceholder')}
          placeholderTextColor={theme.textMuted}
          value={body}
          onChangeText={setBody}
          multiline
          textAlignVertical="top"
          maxLength={5000}
        />
        {errors.body ? (
          <AppText variant="caption" color={colors.danger}>
            {errors.body}
          </AppText>
        ) : null}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md, backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <Button
          label={t('forum.publish')}
          icon="send"
          onPress={onSubmit}
          loading={createPost.isPending}
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.xl },
  banner: { marginBottom: spacing.lg },
  label: { marginBottom: spacing.xs },
  bodyInput: {
    minHeight: 160,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.lg,
    ...typography.body,
    color: colors.text,
  },
  bodyError: { borderColor: colors.danger },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
});
