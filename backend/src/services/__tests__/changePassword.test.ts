import bcrypt from 'bcryptjs';
import { prisma } from '../../lib/prisma';
import { changePassword, updateMe } from '../user.service';

/**
 * Integration test against the local dev Postgres. Covers the two
 * security-relevant paths: a wrong current password must be rejected (not
 * silently accepted), and a correct one must actually rotate the stored hash
 * so the old password stops working.
 */

const TEST_EMAIL = '__test_change_password__@trailquest.test';
const OLD_PASSWORD = 'correct-horse-battery';
const NEW_PASSWORD = 'new-correct-horse-battery';

async function cleanup(userId?: string) {
  const user = userId
    ? { id: userId }
    : await prisma.user.findUnique({ where: { email: TEST_EMAIL } });
  if (!user) return;
  await prisma.user.delete({ where: { id: user.id } }).catch(() => undefined);
}

describe('changePassword', () => {
  let userId: string;

  beforeAll(async () => {
    await cleanup();
    const passwordHash = await bcrypt.hash(OLD_PASSWORD, 12);
    const user = await prisma.user.create({
      data: { email: TEST_EMAIL, name: 'Password Test User', passwordHash },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await cleanup(userId);
    await prisma.$disconnect();
  });

  it('rejects a wrong current password', async () => {
    await expect(
      changePassword(userId, {
        currentPassword: 'not-the-right-password',
        newPassword: NEW_PASSWORD,
      }),
    ).rejects.toThrow('Current password is incorrect');
  });

  it('rotates the hash on a correct current password', async () => {
    await changePassword(userId, {
      currentPassword: OLD_PASSWORD,
      newPassword: NEW_PASSWORD,
    });
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    expect(await bcrypt.compare(NEW_PASSWORD, user.passwordHash)).toBe(true);
    expect(await bcrypt.compare(OLD_PASSWORD, user.passwordHash)).toBe(false);
  });
});

describe('updateMe', () => {
  let userId: string;

  beforeAll(async () => {
    await cleanup();
    const user = await prisma.user.create({
      data: {
        email: TEST_EMAIL,
        name: 'Original Name',
        passwordHash: 'not-a-real-hash',
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await cleanup(userId);
    await prisma.$disconnect();
  });

  it('updates only the name when avatar is omitted', async () => {
    const updated = await updateMe(userId, { name: 'New Name' });
    expect(updated.name).toBe('New Name');
    expect(updated).not.toHaveProperty('passwordHash');
  });

  it('leaves name unchanged when only avatar is provided', async () => {
    const updated = await updateMe(userId, { avatar: 'panda-0' });
    expect(updated.name).toBe('New Name');
    expect(updated.avatar).toBe('panda-0');
  });
});
