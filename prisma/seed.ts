import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding database...");

  // ---- Categories ----
  const physics = await prisma.category.upsert({
    where: { slug: "physics" },
    update: {},
    create: { name: "Physics", slug: "physics" },
  });

  const math = await prisma.category.upsert({
    where: { slug: "mathematics" },
    update: {},
    create: { name: "Mathematics", slug: "mathematics" },
  });

  const chemistry = await prisma.category.upsert({
    where: { slug: "chemistry" },
    update: {},
    create: { name: "Chemistry", slug: "chemistry" },
  });

  const cs = await prisma.category.upsert({
    where: { slug: "computer-science" },
    update: {},
    create: { name: "Computer Science", slug: "computer-science" },
  });

  console.log("Categories created:", { physics, math, chemistry, cs });

  // ---- Users ----
  // Note: Seed users do not have passwords — they are display/test data.
  // For login testing, use Better Auth's API to create accounts with passwords.
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@scienceone.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@scienceone.com",
      emailVerified: true,
      role: "admin",
    },
  });

  const janeUser = await prisma.user.upsert({
    where: { email: "jane@example.com" },
    update: {},
    create: {
      name: "Jane Reader",
      email: "jane@example.com",
      emailVerified: true,
      role: "user",
    },
  });

  console.log("Users created:", { adminUser, janeUser });

  // ---- Book 1: Introduction to Quantum Mechanics (published, pay-per-book) ----
  const book1 = await prisma.book.upsert({
    where: { slug: "introduction-to-quantum-mechanics" },
    update: {},
    create: {
      title: "Introduction to Quantum Mechanics",
      slug: "introduction-to-quantum-mechanics",
      authorName: "Prof. David Griffiths",
      authorBio:
        "David Griffiths is a theoretical physicist and educator known for his clear, accessible textbooks in electrodynamics and quantum mechanics. He taught at Reed College for over 30 years.",
      synopsis:
        "A comprehensive introduction to the mathematical and conceptual foundations of quantum mechanics. Covering wave functions, the Schrödinger equation, operators, and angular momentum — with an emphasis on problem-solving and physical intuition.",
      isbn: "978-0-13-191091-2",
      pageCount: 468,
      dimensions: "7 x 9.5 in",
      isPublished: true,
      isOpenAccess: false,
    },
  });

  await prisma.bookCategory.upsert({
    where: { bookId_categoryId: { bookId: book1.id, categoryId: physics.id } },
    update: {},
    create: { bookId: book1.id, categoryId: physics.id },
  });

  await prisma.bookPrice.upsert({
    where: { bookId: book1.id },
    update: {},
    create: { bookId: book1.id, amount: 29.99, currency: "USD" },
  });

  // Chapters for book 1
  const book1Chapters = [
    {
      title: "The Wave Function",
      slug: "the-wave-function",
      position: 1,
      isFreePreview: true,
      content: `<h2>The Wave Function</h2>
<p>In classical mechanics, the state of a particle is fully determined by its position <em>x</em> and momentum <em>p</em>. In quantum mechanics, the state of a particle is described by its <strong>wave function</strong> Ψ(<em>x</em>, <em>t</em>).</p>
<p>The wave function satisfies the <strong>Schrödinger equation</strong>:</p>
<p>The statistical interpretation of the wave function, due to Born, says that |Ψ(x, t)|² gives the probability of finding the particle at position x at time t. This leads to the normalization condition that the integral of |Ψ|² over all space must equal 1.</p>`,
    },
    {
      title: "Time-Independent Schrödinger Equation",
      slug: "time-independent-schrodinger-equation",
      position: 2,
      isFreePreview: false,
      content: `<h2>Time-Independent Schrödinger Equation</h2>
<p>When the potential V is independent of time, we can separate variables and solve the Schrödinger equation as a product of spatial and temporal functions.</p>
<p>The <strong>time-independent Schrödinger equation</strong> takes the form of an eigenvalue equation for the Hamiltonian operator H. The solutions — stationary states — have definite energy E and form a complete orthonormal basis for the Hilbert space of states.</p>`,
    },
    {
      title: "Formalism",
      slug: "formalism",
      position: 3,
      isFreePreview: false,
      content: `<h2>Formalism</h2>
<p>This chapter develops the mathematical structure of quantum mechanics — Hilbert spaces, Dirac notation, Hermitian operators, and the generalized statistical interpretation. We derive the generalized uncertainty principle and discuss the energy-time uncertainty relation.</p>`,
    },
  ];

  for (const ch of book1Chapters) {
    await prisma.chapter.upsert({
      where: { bookId_slug: { bookId: book1.id, slug: ch.slug } },
      update: {},
      create: { bookId: book1.id, ...ch },
    });
  }

  // ---- Book 2: Linear Algebra (published, open access) ----
  const book2 = await prisma.book.upsert({
    where: { slug: "linear-algebra-theory-and-applications" },
    update: {},
    create: {
      title: "Linear Algebra: Theory and Applications",
      slug: "linear-algebra-theory-and-applications",
      authorName: "Prof. Axler",
      authorBio:
        "A leading mathematician whose work focuses on operator theory and functional analysis. Author of the widely used text 'Linear Algebra Done Right'.",
      synopsis:
        "A modern approach to linear algebra that emphasizes linear maps over matrices. Covers vector spaces, eigenvalues and eigenvectors, inner product spaces, and operators on complex vector spaces — with rigorous proofs throughout.",
      isbn: "978-3-319-11079-0",
      pageCount: 340,
      dimensions: "6 x 9 in",
      isPublished: true,
      isOpenAccess: true,
    },
  });

  await prisma.bookCategory.upsert({
    where: { bookId_categoryId: { bookId: book2.id, categoryId: math.id } },
    update: {},
    create: { bookId: book2.id, categoryId: math.id },
  });

  // Open access — no price record needed
  const book2Chapters = [
    {
      title: "Vector Spaces",
      slug: "vector-spaces",
      position: 1,
      isFreePreview: true,
      content: `<h2>Vector Spaces</h2>
<p>A vector space is a set V equipped with two operations — addition and scalar multiplication — satisfying eight axioms. These axioms abstract the essential properties of arrows in the plane and lists of real numbers.</p>
<p>Important examples include: R^n, the set of polynomials of degree at most n, and the set of continuous functions on a closed interval.</p>`,
    },
    {
      title: "Finite-Dimensional Subspaces",
      slug: "finite-dimensional-subspaces",
      position: 2,
      isFreePreview: false,
      content: `<h2>Finite-Dimensional Subspaces</h2>
<p>This chapter develops the theory of span, linear independence, and bases. We prove that any two bases of a finite-dimensional vector space have the same length — the dimension of the space.</p>`,
    },
    {
      title: "Linear Maps",
      slug: "linear-maps",
      position: 3,
      isFreePreview: false,
      content: `<h2>Linear Maps</h2>
<p>A linear map from V to W is a function that preserves the vector space structure. The fundamental theorem of linear maps relates the dimensions of the null space and range of a linear map to the dimension of its domain.</p>`,
    },
  ];

  for (const ch of book2Chapters) {
    await prisma.chapter.upsert({
      where: { bookId_slug: { bookId: book2.id, slug: ch.slug } },
      update: {},
      create: { bookId: book2.id, ...ch },
    });
  }

  // ---- Book 3: Statistical Thermodynamics (unpublished draft) ----
  const book3 = await prisma.book.upsert({
    where: { slug: "statistical-thermodynamics" },
    update: {},
    create: {
      title: "Statistical Thermodynamics",
      slug: "statistical-thermodynamics",
      authorName: "Dr. Elena Vasquez",
      authorBio:
        "A physical chemist specializing in non-equilibrium statistical mechanics and entropy production. Currently at the Institute for Theoretical Chemistry.",
      synopsis:
        "Bridges classical thermodynamics and statistical mechanics. From Boltzmann's entropy formula to partition functions, quantum statistics, and phase transitions — all grounded in physical reasoning and mathematical rigor.",
      isPublished: false,
      isOpenAccess: false,
    },
  });

  await prisma.bookCategory.upsert({
    where: { bookId_categoryId: { bookId: book3.id, categoryId: physics.id } },
    update: {},
    create: { bookId: book3.id, categoryId: physics.id },
  });

  const book3Chapters = [
    {
      title: "Entropy and the Second Law",
      slug: "entropy-and-the-second-law",
      position: 1,
      isFreePreview: true,
      content: `<h2>Entropy and the Second Law</h2>
<p>Entropy — from the Greek "transformation" — is the central concept of thermodynamics. Boltzmann's insight was that entropy is a measure of the number of microscopic configurations compatible with a given macroscopic state: S = k_B ln Ω.</p>`,
    },
    {
      title: "The Canonical Ensemble",
      slug: "the-canonical-ensemble",
      position: 2,
      isFreePreview: false,
      content: `<h2>The Canonical Ensemble</h2>
<p>The canonical ensemble describes a system in thermal contact with a heat bath at temperature T. The partition function Z = Σ exp(-βE_i) encodes all thermodynamic information about the system.</p>`,
    },
  ];

  for (const ch of book3Chapters) {
    await prisma.chapter.upsert({
      where: { bookId_slug: { bookId: book3.id, slug: ch.slug } },
      update: {},
      create: { bookId: book3.id, ...ch },
    });
  }

  console.log("Books and chapters created:", {
    book1: book1.title,
    book2: book2.title,
    book3: book3.title,
  });

  console.log("Seeding complete.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
