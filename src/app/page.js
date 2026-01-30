import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    redirect("/sign-in");
  }

  const dbUser = await prisma.user.upsert({
    where: { id: userId },
    update: {
      email: user.emailAddresses[0].emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      
    },
    create: {
      id: userId,
      email: user.emailAddresses[0].emailAddress,
      firstName: user.firstName,
      lastName: user.lastName,
      role: "member",
      position: "Member",
    },
  });

  if (dbUser.role === "admin" || dbUser.role === "organizer") {
    redirect("/admin");
  } else {
    redirect("/member");
  }
}