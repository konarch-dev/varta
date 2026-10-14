import { Worker, Queue } from 'bullmq';
import { prisma } from '@varta/database';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);
const redisPassword = process.env.REDIS_PASSWORD || undefined;

const connection = {
  host: redisHost,
  port: redisPort,
  password: redisPassword,
};

console.log(`[VARTA Worker] Initializing background workers with Redis at ${redisHost}:${redisPort}...`);

// 1. Notifications Queue Worker
const notificationWorker = new Worker(
  'notifications',
  async (job) => {
    console.log(`[Worker:Notifications] Processing job ${job.id} of type ${job.name}:`, job.data);
    const { userId, actorId, type, entityId, message } = job.data;
    
    // Save or update notification
    const record = await prisma.notification.create({
      data: {
        userId,
        actorId,
        type,
        entityId,
        message,
      },
    });

    console.log(`[Worker:Notifications] Saved notification ${record.id}`);
    return { success: true, notificationId: record.id };
  },
  { connection },
);

notificationWorker.on('completed', (job) => {
  console.log(`[Worker:Notifications] Job ${job.id} completed.`);
});

notificationWorker.on('failed', (job, err) => {
  console.error(`[Worker:Notifications] Job ${job?.id} failed:`, err.message);
});

// 2. Timeline Fanout Worker
const fanoutWorker = new Worker(
  'timeline-fanout',
  async (job) => {
    console.log(`[Worker:Fanout] Processing timeline fanout for post ${job.data.postId}`);
    const { authorId, postId } = job.data;

    // Fetch followers
    const followers = await prisma.follow.findMany({
      where: { followingId: authorId },
      select: { followerId: true },
    });

    console.log(`[Worker:Fanout] Fanned out post ${postId} to ${followers.length} followers.`);
    return { followersCount: followers.length };
  },
  { connection },
);

fanoutWorker.on('completed', (job) => {
  console.log(`[Worker:Fanout] Fanout job ${job.id} completed.`);
});

console.log('🚀 VARTA BullMQ Asynchronous Worker started and listening for jobs.');

process.on('SIGINT', async () => {
  console.log('[Worker] Shutting down gracefully...');
  await notificationWorker.close();
  await fanoutWorker.close();
  await prisma.$disconnect();
  process.exit(0);
});
