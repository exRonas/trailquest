import React from 'react';
import { Alert, View, StyleSheet } from 'react-native';
import { Button } from './ui';
import { spacing } from '../theme';
import { useAuthStore } from '../store/authStore';
import {
  useAcceptFriend,
  useAddFriend,
  useFriendStatus,
  useRemoveFriend,
} from '../api/hooks/useFriends';
import { getApiErrorMessage } from '../api/client';
import { useT } from '../i18n';

/**
 * Friend action button shown on another user's public profile. Renders the
 * right action for the current relationship (add / cancel / accept / unfriend)
 * and hides itself entirely on the signed-in user's own profile.
 */
export function FriendButton({
  userId,
  userName,
}: {
  userId: string;
  userName: string;
}): React.ReactElement | null {
  const t = useT();
  const myId = useAuthStore((s) => s.user?.id);
  const { data: status, isLoading } = useFriendStatus(userId);
  const add = useAddFriend(userId);
  const accept = useAcceptFriend(userId);
  const remove = useRemoveFriend(userId);

  if (!myId || myId === userId) return null;
  if (isLoading || !status) return null;

  const onError = (e: unknown) =>
    Alert.alert(t('friends.actionFailed'), getApiErrorMessage(e));

  const confirmRemove = () => {
    Alert.alert(t('friends.unfriendTitle'), t('friends.unfriendMsg', { name: userName }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('friends.remove'),
        style: 'destructive',
        onPress: () => remove.mutate(undefined, { onError }),
      },
    ]);
  };

  const busy = add.isPending || accept.isPending || remove.isPending;

  if (status === 'friends') {
    return (
      <Button
        label={t('friends.friends')}
        icon="account-check"
        variant="secondary"
        onPress={confirmRemove}
        loading={busy}
        style={styles.btn}
      />
    );
  }

  if (status === 'requested') {
    return (
      <Button
        label={t('friends.requested')}
        icon="clock-outline"
        variant="secondary"
        onPress={() => remove.mutate(undefined, { onError })}
        loading={busy}
        style={styles.btn}
      />
    );
  }

  if (status === 'incoming') {
    return (
      <View style={styles.row}>
        <Button
          label={t('friends.accept')}
          icon="account-check"
          onPress={() => accept.mutate(undefined, { onError })}
          loading={busy}
          fullWidth={false}
          style={styles.rowBtn}
        />
        <Button
          label={t('friends.decline')}
          variant="secondary"
          onPress={() => remove.mutate(undefined, { onError })}
          fullWidth={false}
          style={styles.rowBtn}
        />
      </View>
    );
  }

  return (
    <Button
      label={t('friends.add')}
      icon="account-plus"
      onPress={() => add.mutate(undefined, { onError })}
      loading={busy}
      style={styles.btn}
    />
  );
}

const styles = StyleSheet.create({
  btn: { marginTop: spacing.lg },
  row: { flexDirection: 'row', marginTop: spacing.lg },
  rowBtn: { flex: 1, marginRight: spacing.sm },
});
