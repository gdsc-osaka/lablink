import admin from "firebase-admin";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(
    process.env.NEXT_SERVICE_ACCOUNT_JSON || "{}",
);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function seedData() {
    console.log("🌱 Starting Firestore seeding...");

    // Load seed data
    const seedDataPath = path.join(__dirname, "seed-firestore.json");
    const seedData = JSON.parse(fs.readFileSync(seedDataPath, "utf-8"));

    try {
        // Seed Users
        console.log("📝 Seeding users...");
        for (const [userId, userData] of Object.entries(seedData.users)) {
            const { groups, ...userProfile } = userData as any;

            // Create user profile
            await db
                .collection("users")
                .doc(userId)
                .set({
                    email: userProfile.email,
                    created_at: admin.firestore.Timestamp.fromDate(
                        new Date(userProfile.created_at),
                    ),
                    updated_at: admin.firestore.Timestamp.fromDate(
                        new Date(userProfile.updated_at),
                    ),
                });

            // Create user's groups subcollection
            if (groups) {
                for (const [groupId, groupData] of Object.entries(groups)) {
                    const gData = groupData as any;
                    await db
                        .collection("users")
                        .doc(userId)
                        .collection("groups")
                        .doc(groupId)
                        .set({
                            name: gData.name,
                            createdAt: admin.firestore.Timestamp.fromDate(
                                new Date(gData.createdAt),
                            ),
                            updatedAt: admin.firestore.Timestamp.fromDate(
                                new Date(gData.updatedAt),
                            ),
                            joinedAt: admin.firestore.Timestamp.fromDate(
                                new Date(gData.joinedAt),
                            ),
                        });
                }
            }

            console.log(`  ✅ Created user: ${userId}`);
        }

        // Seed Groups
        console.log("📝 Seeding groups...");
        for (const [groupId, groupData] of Object.entries(seedData.groups)) {
            const { users, events, ...groupProfile } = groupData as any;

            // Create group
            await db
                .collection("groups")
                .doc(groupId)
                .set({
                    name: groupProfile.name,
                    createdAt: admin.firestore.Timestamp.fromDate(
                        new Date(groupProfile.createdAt),
                    ),
                    updatedAt: admin.firestore.Timestamp.fromDate(
                        new Date(groupProfile.updatedAt),
                    ),
                });

            // Create group's users subcollection
            if (users) {
                for (const [userId, userData] of Object.entries(users)) {
                    const uData = userData as any;
                    await db
                        .collection("groups")
                        .doc(groupId)
                        .collection("users")
                        .doc(userId)
                        .set({
                            role: uData.role,
                            joinedAt: admin.firestore.Timestamp.fromDate(
                                new Date(uData.joinedAt),
                            ),
                        });
                }
            }

            // Create group's events subcollection
            if (events) {
                for (const [eventId, eventData] of Object.entries(events)) {
                    const eData = eventData as any;
                    await db
                        .collection("groups")
                        .doc(groupId)
                        .collection("events")
                        .doc(eventId)
                        .set({
                            title: eData.title,
                            description: eData.description,
                            begin_at: admin.firestore.Timestamp.fromDate(
                                new Date(eData.begin_at),
                            ),
                            end_at: admin.firestore.Timestamp.fromDate(
                                new Date(eData.end_at),
                            ),
                            created_at: admin.firestore.Timestamp.fromDate(
                                new Date(eData.created_at),
                            ),
                            updated_at: admin.firestore.Timestamp.fromDate(
                                new Date(eData.updated_at),
                            ),
                        });
                }
            }

            console.log(`  ✅ Created group: ${groupId}`);
        }

        console.log("✨ Seeding completed successfully!");
    } catch (error) {
        console.error("❌ Error seeding data:", error);
        process.exit(1);
    }
}

seedData();
