import { prisma } from '../lib/prisma';
import { AppError } from '../utils/AppError';

const friendUserSelect = {
  id: true,
  name: true,
  avatar: true,
  createdAt: true,
} as const;

/** Relationship of the signed-in user to another user. */
export type FriendStatusView =
  | 'none' // no link
  | 'friends' // accepted
  | 'requested' // I sent a pending request
  | 'incoming'; // they sent me a pending request

async function assertUserExists(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });
  if (!user) {
    throw AppError.notFound('User not found');
  }
}

/** The single friendship row between two users, in either direction. */
async function findBetween(a: string, b: string) {
  return prisma.friendship.findFirst({
    where: {
      OR: [
        { requesterId: a, addresseeId: b },
        { requesterId: b, addresseeId: a },
      ],
    },
  });
}

/**
 * Send a friend request. If the other user already sent *me* a pending
 * request, this accepts it instead (so tapping "Add" on someone who already
 * invited you just becomes friends). Idempotent for an already-sent/accepted
 * link.
 */
export async function sendRequest(meId: string, targetId: string) {
  if (meId === targetId) {
    throw AppError.badRequest('You cannot add yourself');
  }
  await assertUserExists(targetId);

  const existing = await findBetween(meId, targetId);
  if (existing) {
    if (existing.status === 'ACCEPTED') return existing;
    // A pending request they sent to me → accept it.
    if (existing.addresseeId === meId) {
      return prisma.friendship.update({
        where: { id: existing.id },
        data: { status: 'ACCEPTED' },
      });
    }
    // A pending request I already sent → no-op.
    return existing;
  }

  return prisma.friendship.create({
    data: { requesterId: meId, addresseeId: targetId, status: 'PENDING' },
  });
}

/** Accept a pending request that `requesterId` sent to me. */
export async function acceptRequest(meId: string, requesterId: string) {
  const friendship = await prisma.friendship.findFirst({
    where: { requesterId, addresseeId: meId, status: 'PENDING' },
  });
  if (!friendship) {
    throw AppError.notFound('No pending request from this user');
  }
  return prisma.friendship.update({
    where: { id: friendship.id },
    data: { status: 'ACCEPTED' },
  });
}

/** Remove any link with another user: cancel a sent request, decline an
 *  incoming one, or unfriend. No-op if there's nothing between them. */
export async function removeFriend(meId: string, otherId: string): Promise<void> {
  const existing = await findBetween(meId, otherId);
  if (existing) {
    await prisma.friendship.delete({ where: { id: existing.id } });
  }
}

/** My accepted friends (the other side of each accepted link), newest first. */
export async function listFriends(meId: string) {
  const links = await prisma.friendship.findMany({
    where: {
      status: 'ACCEPTED',
      OR: [{ requesterId: meId }, { addresseeId: meId }],
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      requester: { select: friendUserSelect },
      addressee: { select: friendUserSelect },
    },
  });
  return links.map((l) =>
    l.requesterId === meId ? l.addressee : l.requester,
  );
}

/** Pending requests other users sent to me (to accept/decline). */
export async function listIncomingRequests(meId: string) {
  const links = await prisma.friendship.findMany({
    where: { addresseeId: meId, status: 'PENDING' },
    orderBy: { createdAt: 'desc' },
    include: { requester: { select: friendUserSelect } },
  });
  return links.map((l) => l.requester);
}

/** My relationship to a specific user (drives the button on their profile). */
export async function getStatus(
  meId: string,
  otherId: string,
): Promise<FriendStatusView> {
  if (meId === otherId) return 'none';
  const existing = await findBetween(meId, otherId);
  if (!existing) return 'none';
  if (existing.status === 'ACCEPTED') return 'friends';
  return existing.requesterId === meId ? 'requested' : 'incoming';
}

/** Count of incoming pending requests — for a badge on the Friends entry. */
export async function incomingCount(meId: string): Promise<number> {
  return prisma.friendship.count({
    where: { addresseeId: meId, status: 'PENDING' },
  });
}
