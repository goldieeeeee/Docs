import { liveblocks } from "@/lib/liveblocks";
import { getUserColor } from "@/lib/utils";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export async function POST(request: Request) {
  const clerkUser = await currentUser();

  if (!clerkUser) redirect("/sign-in");

  const { id, firstName, lastName, emailAddresses, imageUrl } = clerkUser;
  const userName =
    lastName === null ? `${firstName}` : `${firstName} ${lastName}`;

  const user = {
    id,
    info: {
      id,
      name: userName,
      email: emailAddresses[0].emailAddress,
      avatar: imageUrl,
      color: getUserColor(id),
    },
  };

  console.log("user: ", user);

  // Create an ID token for the user
  const { body, status } = await liveblocks.identifyUser(
    {
      userId: user.info.email,
      groupIds: [],
    },
    {
      userInfo: user.info,
    }
  );

  return new Response(body, { status });
}
