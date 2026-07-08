import { prisma } from '../../lib/prisma';
import {
  acceptRequest,
  getStatus,
  listFriends,
  listIncomingRequests,
  removeFriend,
  sendRequest,
} from '../friend.service';

/**
 * Integration test against the local dev Postgres. Covers the full friendship
 * lifecycle (request → incoming → accept → friends → unfriend) plus the
 * auto-accept shortcut when both users request each other.
 */

const EMAIL_A = '__test_friend_a__@trailquest.test';
const EMAIL_B = '__test_friend_b__@trailquest.test';

async function makeUser(email: string, name: string) {
  return prisma.user.create({
    data: { email, name, passwordHash: 'not-a-real-hash' },
  });
}

async function cleanup() {
  const users = await prisma.user.findMany({
    where: { email: { in: [EMAIL_A, EMAIL_B] } },
    select: { id: true },
  });
  const ids = users.map((u) => u.id);
  if (ids.length) {
    await prisma.friendship.deleteMany({
      where: {
        OR: [{ requesterId: { in: ids } }, { addresseeId: { in: ids } }],
      },
    });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  }
}

describe('friend.service', () => {
  let a: string;
  let b: string;

  beforeEach(async () => {
    await cleanup();
    a = (await makeUser(EMAIL_A, 'User A')).id;
    b = (await makeUser(EMAIL_B, 'User B')).id;
  });

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  it('walks request → incoming → accept → friends → unfriend', async () => {
    expect(await getStatus(a, b)).toBe('none');

    await sendRequest(a, b);
    expect(await getStatus(a, b)).toBe('requested');
    expect(await getStatus(b, a)).toBe('incoming');
    expect(await listIncomingRequests(b)).toHaveLength(1);

    await acceptRequest(b, a);
    expect(await getStatus(a, b)).toBe('friends');
    expect(await getStatus(b, a)).toBe('friends');
    const friendsOfA = await listFriends(a);
    expect(friendsOfA.map((u) => u.id)).toEqual([b]);

    await removeFriend(a, b);
    expect(await getStatus(a, b)).toBe('none');
    expect(await listFriends(a)).toHaveLength(0);
  });

  it('auto-accepts when the addressee also sends a request', async () => {
    await sendRequest(a, b);
    // B "adds" A, who already invited B → becomes friends immediately.
    await sendRequest(b, a);
    expect(await getStatus(a, b)).toBe('friends');
  });

  it('rejects adding yourself', async () => {
    await expect(sendRequest(a, a)).rejects.toThrow();
  });

  it('only keeps one row per pair', async () => {
    await sendRequest(a, b);
    await sendRequest(a, b); // idempotent
    const rows = await prisma.friendship.count({
      where: {
        OR: [
          { requesterId: a, addresseeId: b },
          { requesterId: b, addresseeId: a },
        ],
      },
    });
    expect(rows).toBe(1);
  });
});
