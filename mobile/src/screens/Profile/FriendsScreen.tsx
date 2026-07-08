import React, { useEffect } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, View } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AppText, Button, EmptyState, Loader } from '../../components/ui';
import { Avatar } from '../../components/forum/Avatar';
import { spacing, useThemeColors } from '../../theme';
import {
  useAcceptFriend,
  useFriends,
  useRemoveFriend,
} from '../../api/hooks/useFriends';
import { useT } from '../../i18n';
import { FriendUser } from '../../types/api';
import { ProfileScreenProps } from '../../types/navigation';

export function FriendsScreen({
  navigation,
}: ProfileScreenProps<'Friends'>): React.ReactElement {
  const t = useT();
  const theme = useThemeColors();
  const { data, isLoading, refetch, isRefetching } = useFriends();

  useEffect(() => {
    navigation.setOptions({ title: t('friends.title') });
  }, [navigation, t]);

  if (isLoading && !data) return <Loader message={t('friends.title')} />;

  const friends = data?.friends ?? [];
  const incoming = data?.incoming ?? [];

  const openProfile = (u: FriendUser) =>
    navigation.navigate('ForumTab', {
      screen: 'UserProfile',
      params: { userId: u.id, userName: u.name },
    });

  return (
    <FlatList
      style={[styles.fill, { backgroundColor: theme.background }]}
      data={friends}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      onRefresh={refetch}
      refreshing={isRefetching}
      ListHeaderComponent={
        incoming.length > 0 ? (
          <View style={styles.section}>
            <AppText variant="overline" color={theme.textMuted} style={styles.sectionTitle}>
              {t('friends.requests')}
            </AppText>
            {incoming.map((u) => (
              <IncomingRow key={u.id} user={u} onOpen={() => openProfile(u)} />
            ))}
            <AppText
              variant="overline"
              color={theme.textMuted}
              style={[styles.sectionTitle, styles.friendsHeading]}
            >
              {t('friends.myFriends')}
            </AppText>
          </View>
        ) : null
      }
      renderItem={({ item }) => (
        <FriendRow user={item} onPress={() => openProfile(item)} />
      )}
      ListEmptyComponent={
        !isLoading ? (
          <EmptyState
            icon="account-group-outline"
            title={t('friends.title')}
            message={t('friends.none')}
          />
        ) : null
      }
      showsVerticalScrollIndicator={false}
    />
  );
}

function FriendRow({
  user,
  onPress,
}: {
  user: FriendUser;
  onPress: () => void;
}): React.ReactElement {
  const theme = useThemeColors();
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Avatar name={user.name} avatar={user.avatar} size={44} />
      <AppText variant="bodyStrong" style={styles.rowName} numberOfLines={1}>
        {user.name}
      </AppText>
      <Icon name="chevron-right" size={22} color={theme.textMuted} />
    </Pressable>
  );
}

function IncomingRow({
  user,
  onOpen,
}: {
  user: FriendUser;
  onOpen: () => void;
}): React.ReactElement {
  const t = useT();
  const accept = useAcceptFriend(user.id);
  const remove = useRemoveFriend(user.id);
  const busy = accept.isPending || remove.isPending;
  const onError = () => Alert.alert(t('friends.actionFailed'));

  return (
    <View style={styles.incomingRow}>
      <Pressable style={styles.incomingUser} onPress={onOpen}>
        <Avatar name={user.name} avatar={user.avatar} size={44} />
        <AppText variant="bodyStrong" style={styles.rowName} numberOfLines={1}>
          {user.name}
        </AppText>
      </Pressable>
      <Button
        label={t('friends.accept')}
        size="sm"
        onPress={() => accept.mutate(undefined, { onError })}
        loading={busy}
        fullWidth={false}
        style={styles.acceptBtn}
      />
      <Button
        label={t('friends.decline')}
        size="sm"
        variant="secondary"
        onPress={() => remove.mutate(undefined, { onError })}
        fullWidth={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.huge, flexGrow: 1 },
  section: {},
  sectionTitle: { marginBottom: spacing.sm },
  friendsHeading: { marginTop: spacing.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  rowName: { flex: 1, marginLeft: spacing.md },
  incomingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  incomingUser: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  acceptBtn: { marginRight: spacing.sm },
});
