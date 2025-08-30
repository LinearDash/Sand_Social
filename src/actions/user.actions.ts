"use server";

import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

export async function syncUser() {
  try {
    const { userId } = await auth()
    const user = await currentUser()

    if (!userId || !user) return;

    //Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: {
        clerkId: userId
      }
    })

    if (existingUser) return existingUser;


    const dbUser = await prisma.user.create({
      data: {
        clerkId: userId,
        name: `${user.firstName || ""}${user.lastName || ""}`,
        username: user.username ?? user.emailAddresses[0].emailAddress.split('@')[0],
        email: user.emailAddresses[0].emailAddress,
        image: user.imageUrl,
      }
    })

    return dbUser;
  } catch (error) {
    console.error("Failed to sync user:", error);
    throw new Error("User synchronization failed");
  }
}

export async function getUserByClerkId(clerkId: string) {
  return prisma.user.findUnique({
    where: {
      clerkId: clerkId,
    },
    include: {
      _count: {
        select: {
          followers: true,
          following: true,
          posts: true

        }
      }
    }
  })
}

export async function getDbUserId() {
  const { userId: clerkId } = await auth();

  if (!clerkId) throw new Error("Unauthorized");

  const user = await getUserByClerkId(clerkId);
  if (!user) throw new Error("User not found");

  return user.id;
}

export async function getRandomUsers() {
  try {
    const userId = await getDbUserId();

    //get 3 random user exclude ourselves and users that we already follow
    const randomUsers = await prisma.user.findMany({
      where: {
        AND: [
          { NOT: { id: userId } },
          { NOT: { followers: { some: { followerId: userId } } } }
        ]
      },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        _count: {
          select: {
            followers: true,
            following: true
          }
        }
      }
    })
    return randomUsers;
  } catch (error) {
    console.error("Failed to fetch random users:", error);
    return [];

  }
}

export async function toggleFollow(targetUserId: string) {
  try {
    const userId = await getDbUserId();

    if (targetUserId === userId) throw new Error("You cannot follow yourself")

    const existingFollow = await prisma.follows.findUnique({
      where: {
        followerId_followingId: {
          followerId: userId,
          followingId: targetUserId
        }
      }
    })

    if (existingFollow) {
      await prisma.follows.delete({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: targetUserId
          }
        }
      })
    } else {
      await prisma.$transaction([
        prisma.follows.create({
          data: {
            followerId: userId,
            followingId: targetUserId
          }
        }),

        prisma.notification.create({
          data: {
            type: "FOLLOW",
            userId: targetUserId,    //user being followed
            creatorId: userId    //user that is following 
          }
        })
      ])

    }

    return { success: true }
  } catch (error) {
    console.error("Failed to toggle follow:", error);
    return { success: false, message: "Failed to toggle follow" };
  }
}