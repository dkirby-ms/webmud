"use server";
import { connectToDatabase } from "@/lib/db"; // adjust to your DB helper
import { auth } from "@/auth";  
import { logger } from "@/lib/utils";

export async function createCharacter(formData: FormData) {
  // Get the form fields
  const species = formData.get("species")?.toString();
  const name = formData.get("name")?.toString();
  const world = formData.get("world")?.toString();
  const session = await auth();
  const userId = session?.userId;
  // Server-side validation
  if (!session) {
    throw new Error("You must be logged in to create a character.");
  }

  if (!name || name.length < 3 || name.length > 20) {
    throw new Error("Name must be between 3 and 20 characters.");
  }
  if (!name?.match(/^[A-Za-z]+$/)) {
    throw new Error("Name must contain only letters and no spaces.");
  }
  if (!species || !world) {
    throw new Error("Species and world are required.");
  }

  // FUTURE FEATURE: server-side profanity checking using a dictionary of banned words

  // Connect and insert into MongoDB
  try {
    const { db } = await connectToDatabase();
    const newCharacter = await db.collection("playerCharacters").insertOne({
      species,
      name,
      world,
      userId,
      level: 1,
      createdAt: new Date(),
    });
    logger.info(`Created character: ${newCharacter}`);
    return true;
  } catch (error) { 
    return false;
  }
}