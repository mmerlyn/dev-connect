import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const hashedPassword = await bcrypt.hash('password123', 10);

  const user1 = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      username: 'johndoe',
      password: hashedPassword,
      displayName: 'John Doe',
      bio: 'Full-stack developer passionate about TypeScript and React',
      skills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL'],
      githubUrl: 'https://github.com/johndoe',
      avatar: 'https://ui-avatars.com/api/?name=John+Doe&background=0D8ABC&color=fff',
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'jane@example.com' },
    update: {},
    create: {
      email: 'jane@example.com',
      username: 'janesmith',
      password: hashedPassword,
      displayName: 'Jane Smith',
      bio: 'Backend engineer specializing in scalable systems',
      skills: ['Go', 'Kubernetes', 'Docker', 'AWS'],
      avatar: 'https://ui-avatars.com/api/?name=Jane+Smith&background=6366F1&color=fff',
    },
  });

  const user3 = await prisma.user.upsert({
    where: { email: 'mike@example.com' },
    update: {},
    create: {
      email: 'mike@example.com',
      username: 'mikejohnson',
      password: hashedPassword,
      displayName: 'Mike Johnson',
      bio: 'Frontend wizard, creating beautiful user experiences',
      skills: ['JavaScript', 'Vue.js', 'CSS', 'Figma'],
      avatar: 'https://ui-avatars.com/api/?name=Mike+Johnson&background=10B981&color=fff',
    },
  });

  console.log('Users created');

  await prisma.follow.create({
    data: { followerId: user1.id, followingId: user2.id },
  });
  await prisma.follow.create({
    data: { followerId: user1.id, followingId: user3.id },
  });
  await prisma.follow.create({
    data: { followerId: user2.id, followingId: user1.id },
  });

  console.log('Follow relationships created');

  const post1 = await prisma.post.create({
    data: {
      content: 'Just launched my new project using Next.js and TypeScript! Check out the clean architecture and type-safe API. #nextjs #typescript #webdev',
      hashtags: ['#nextjs', '#typescript', '#webdev'],
      authorId: user1.id,
    },
  });

  const post2 = await prisma.post.create({
    data: {
      content: 'Learning Rust for system programming. The ownership model is a game-changer!',
      codeSnippet: `fn main() {
    let greeting = "Hello, Rust!";
    println!("{}", greeting);
}`,
      language: 'rust',
      hashtags: ['#rust', '#systems'],
      authorId: user3.id,
    },
  });

  const post3 = await prisma.post.create({
    data: {
      content: 'Quick tip: Always validate user input on the backend, never trust the client! #security #backend',
      hashtags: ['#security', '#backend'],
      authorId: user2.id,
    },
  });

  console.log('Posts created');

  await prisma.like.create({
    data: { userId: user2.id, postId: post1.id },
  });
  await prisma.like.create({
    data: { userId: user3.id, postId: post1.id },
  });
  await prisma.like.create({
    data: { userId: user1.id, postId: post2.id },
  });

  console.log('Likes created');

  const comment1 = await prisma.comment.create({
    data: {
      content: 'This looks amazing! Can you share the repo?',
      postId: post1.id,
      authorId: user2.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Thanks! Will make it public soon.',
      postId: post1.id,
      authorId: user1.id,
      parentId: comment1.id,
    },
  });

  console.log('Comments created');

  await prisma.hashtag.createMany({
    data: [
      { name: '#typescript', count: 1 },
      { name: '#nextjs', count: 1 },
      { name: '#webdev', count: 1 },
      { name: '#rust', count: 1 },
      { name: '#security', count: 1 },
      { name: '#backend', count: 1 },
    ],
    skipDuplicates: true,
  });

  console.log('Hashtags created');
  console.log('Database seeded successfully.');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
