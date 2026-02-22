import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Read DATABASE_URL from .env.local for Neon seeding
import { readFileSync } from "fs";
const envLocal = readFileSync(".env.local", "utf8");
const dbUrl = envLocal.match(/DATABASE_URL="([^"]+)"/)?.[1];
if (!dbUrl) throw new Error("Could not find DATABASE_URL in .env.local");

const adapter = new PrismaPg({ connectionString: dbUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding Neon database with simulations...");

  // Ensure subjects exist (idempotent)
  const subjectData = [
    { name: "Physics", slug: "physics" },
    { name: "Mathematics", slug: "mathematics" },
    { name: "Chemistry", slug: "chemistry" },
    { name: "Computer Science", slug: "computer-science" },
  ];
  for (const s of subjectData) {
    await prisma.subject.upsert({ where: { slug: s.slug }, update: {}, create: s });
  }
  console.log("Subjects ensured");

  const physicsSubject = await prisma.subject.findUnique({
    where: { slug: "physics" },
  });

  if (!physicsSubject) {
    console.error("Physics subject not found after upsert — something went wrong");
    process.exit(1);
  }

  const simulationsData = [
    {
      slug: "projectile-motion-sim",
      title: "Projectile Motion Simulator",
      description:
        "Launch projectiles at different angles and velocities to explore parabolic trajectories. Adjust gravity to simulate different planetary environments.",
      componentKey: "projectile-motion",
      teacherGuide:
        "<h3>Learning Objectives</h3><ul><li>Understand the independence of horizontal and vertical motion</li><li>Explore the relationship between launch angle and range</li><li>Observe how gravity affects trajectory shape</li></ul><h3>Suggested Activities</h3><ol><li>Find the angle that maximizes range (should be 45 degrees)</li><li>Compare trajectories with the same speed but complementary angles (e.g., 30 and 60 degrees)</li><li>Set gravity to 1.6 m/s\u00b2 to simulate the Moon</li></ol>",
      parameterDocs:
        "<ul><li><strong>Angle</strong> (5\u201385 degrees): Launch angle from horizontal</li><li><strong>Velocity</strong> (10\u2013100 m/s): Initial launch speed</li><li><strong>Gravity</strong> (1.0\u201320.0 m/s\u00b2): Gravitational acceleration</li></ul>",
    },
    {
      slug: "wave-interference-sim",
      title: "Wave Interference Pattern",
      description:
        "Visualize constructive and destructive interference from two point sources. Adjust frequency, amplitude, and source separation.",
      componentKey: "wave-interference",
      teacherGuide:
        "<h3>Learning Objectives</h3><ul><li>Identify regions of constructive and destructive interference</li><li>Understand how wavelength and source separation affect fringe spacing</li><li>Connect the simulation to Young\u2019s double-slit experiment</li></ul><h3>Suggested Activities</h3><ol><li>Increase separation and observe how fringe spacing changes</li><li>Change frequency and note the effect on the pattern</li><li>Pause the simulation and trace nodal lines</li></ol>",
      parameterDocs:
        "<ul><li><strong>Frequency</strong> (0.5\u20135.0 Hz): Wave oscillation rate</li><li><strong>Amplitude</strong> (10\u201360): Wave strength</li><li><strong>Separation</strong> (20\u2013250 px): Distance between sources</li></ul>",
    },
    {
      slug: "spring-mass-sim",
      title: "Spring-Mass Oscillator",
      description:
        "Explore simple harmonic motion with a damped spring-mass system. Observe displacement trails and adjust mass, spring constant, and damping.",
      componentKey: "spring-mass",
      teacherGuide:
        "<h3>Learning Objectives</h3><ul><li>Understand the relationship between mass, spring constant, and oscillation frequency</li><li>Observe the effect of damping on oscillation amplitude over time</li><li>Connect the displacement trail to a sinusoidal waveform</li></ul><h3>Suggested Activities</h3><ol><li>Set damping to 0 and observe perpetual motion</li><li>Double the mass and predict the new period before running</li><li>Increase damping until the system is overdamped (no oscillation)</li></ol>",
      parameterDocs:
        "<ul><li><strong>Mass</strong> (0.5\u20135.0 kg): Mass of the block</li><li><strong>Spring k</strong> (1\u201350 N/m): Spring stiffness constant</li><li><strong>Damping</strong> (0.00\u20132.00): Damping coefficient</li></ul>",
    },
  ];

  for (const sim of simulationsData) {
    const resource = await prisma.resource.upsert({
      where: { slug: sim.slug },
      update: {},
      create: {
        title: sim.title,
        slug: sim.slug,
        description: sim.description,
        type: "SIMULATION",
        level: "AP",
        isFree: true,
        isPublished: true,
      },
    });

    await prisma.simulation.upsert({
      where: { resourceId: resource.id },
      update: {},
      create: {
        resourceId: resource.id,
        componentKey: sim.componentKey,
        teacherGuide: sim.teacherGuide,
        parameterDocs: sim.parameterDocs,
      },
    });

    await prisma.resourceSubject.upsert({
      where: {
        resourceId_subjectId: {
          resourceId: resource.id,
          subjectId: physicsSubject.id,
        },
      },
      update: {},
      create: {
        resourceId: resource.id,
        subjectId: physicsSubject.id,
      },
    });

    console.log(`Simulation upserted in Neon: ${sim.title}`);
  }

  console.log("Neon seeding complete.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
