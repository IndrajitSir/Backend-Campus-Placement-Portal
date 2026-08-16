import { Router } from "express";
import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";
import mongoose from "mongoose";
import logger from "../utils/Logger/logger.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.models.js";
import { Placement } from "../models/placement.model.js";
import { Student } from "../models/student.model.js";
import { Application } from "../models/application.model.js";

const PLAIN_PASSWORD = "123456";

const LOCATIONS = ["Bengaluru", "Chennai", "Hyderabad", "Kolkata", "Chandigarh", "Jaipur", "Pune", "Mumbai", "Delhi", "US", "UK", "Ireland", "Goa"];
const ELIGIBILITY = [
  "B.Tech, MCA with 60%+ marks",
  "BCA, BSc IT, MSc IT",
  "MBA, BBA with relevant skills",
  "Any graduate with programming knowledge",
];
const SKILLS = ["JavaScript", "Python", "Java", "C++", "React.js", "Node.js", "Web Developer", "Software Engineer", "App Developer", "Data Scientist", "Data Analyst", "AI Enthusiast"];
const DEPARTMENTS = ["CSE", "IT", "ECE", "EEE", "Mechanical", "BCA", "B.Tech", "MCA", "M.Tech"];

const JOB_ROLES = [
  { title: "Software Engineer", description: "Designs, develops, and maintains software systems. Collaborates with cross-functional teams to deliver scalable and efficient applications." },
  { title: "Data Scientist", description: "Uses statistical analysis and machine learning to extract insights from complex datasets, aiding data-driven decision-making." },
  { title: "Web Developer", description: "Designs and builds functional websites using modern frameworks. Focuses on usability and performance optimization." },
  { title: "Machine Learning Engineer", description: "Builds and deploys machine learning models. Optimizes algorithms to solve real-world problems using data." },
  { title: "Mobile App Developer", description: "Designs, develops, and deploys mobile applications for iOS and Android while ensuring great user experience." },
  { title: "DevOps Engineer", description: "Streamlines development and deployment processes. Ensures smooth integration of code and infrastructure." },
  { title: "Cloud Architect", description: "Designs and implements cloud-based infrastructure. Ensures scalability, security, and cost-effectiveness." },
  { title: "Business Analyst", description: "Analyzes business processes and systems to identify solutions that improve efficiency and productivity." },
  { title: "Cybersecurity Analyst", description: "Monitors systems for vulnerabilities and prevents cyber threats. Implements measures to secure sensitive information." },
  { title: "UX/UI Designer", description: "Improves user experience through research-driven design. Creates interfaces that are aesthetically pleasing and user-friendly." },
  { title: "Quality Assurance Tester", description: "Tests software applications for bugs and performance issues to ensure quality standards are met." },
  { title: "Database Administrator", description: "Manages and maintains database systems. Ensures data integrity, accessibility, and security." },
  { title: "Product Manager", description: "Oversees the planning, development, and execution of products. Bridges the gap between technical teams and stakeholders." },
  { title: "Financial Analyst", description: "Evaluates financial data to forecast business performance, assisting in strategic planning and investment decisions." },
  { title: "Data Analyst", description: "Processes and interprets data to derive meaningful insights that support decision-making processes." },
];

const COMPANIES = ["Google", "Apple", "Microsoft", "Amazon", "Meta", "Tesla", "Samsung", "Intel", "IBM", "Oracle", "Adobe", "Cisco", "Netflix", "Spotify", "Salesforce", "Uber", "Airbnb", "Dell", "Nvidia", "Qualcomm", "Sony", "Toyota", "BMW", "Boeing", "PepsiCo", "Coca-Cola", "Unilever", "Siemens", "LG", "Hyundai", "Infosys", "TCS", "Wipro", "Flipkart", "Paytm", "Zomato", "Swiggy", "Razorpay", "Freshworks", "Zoho"];

// Hash once and reuse: bcrypt hashes embed their own salt, so a single hash of
// the shared password is valid for every generated account.
let cachedHash = null;
const passwordHash = async () => {
  if (!cachedHash) cachedHash = await bcrypt.hash(PLAIN_PASSWORD, 10);
  return cachedHash;
};

// The auth layer stores emails lowercase (Joi applies .lowercase() on login),
// so generated accounts must match or they can never log in.
const fakeEmail = () => faker.internet.email().toLowerCase();

const phoneNumber = () => {
  const digits = faker.phone.number().replace(/\D/g, "").slice(0, 10);
  return digits ? Number(digits) : null;
};

const makeStaff = (hash) => ({
  _id: new mongoose.Types.ObjectId(faker.database.mongodbObjectId()),
  name: faker.person.fullName(),
  email: fakeEmail(),
  password: hash,
  phoneNumber: phoneNumber(),
  role: faker.helpers.arrayElement(["placement_staff", "admin"]),
  refreshToken: null,
});

const makeStudentUser = (hash) => ({
  _id: new mongoose.Types.ObjectId(faker.database.mongodbObjectId()),
  name: faker.person.fullName(),
  email: fakeEmail(),
  password: hash,
  phoneNumber: phoneNumber(),
  role: "student",
  refreshToken: null,
});

const makeStudentDetails = (studentId) => ({
  student_id: studentId,
  resume: faker.internet.url(),
  approved: faker.datatype.boolean(),
  location: faker.location.city(),
  about: faker.person.bio(),
  professional_skill: faker.helpers.arrayElement(SKILLS),
  department: faker.helpers.arrayElement(DEPARTMENTS),
  cgpa: (faker.number.int({ min: 60, max: 95 }) / 10).toFixed(1),
  projects: Array.from({ length: 2 }, () => ({
    title: faker.commerce.productName(),
    description: faker.lorem.sentence(),
    link: faker.internet.url(),
  })),
});

const makePlacement = (createdBy) => {
  const role = faker.helpers.arrayElement(JOB_ROLES);
  return {
    _id: new mongoose.Types.ObjectId(faker.database.mongodbObjectId()),
    company_name: faker.helpers.arrayElement(COMPANIES),
    job_title: role.title,
    description: role.description,
    eligibility: faker.helpers.arrayElement(ELIGIBILITY),
    location: faker.helpers.arrayElement(LOCATIONS),
    last_date: faker.date.future(),
    salary: faker.number.int({ min: 3, max: 40 }) * 100000,
    created_by: createdBy,
  };
};

const clearCaches = async () => {
  try {
    const redis = (await import("../utils/redisClient.js")).default;
    if (redis.status === "ready") {
      await Promise.allSettled([redis.del("placement:all"), redis.del("students:all")]);
    }
  } catch (err) {
    logger.info("Could not clear redis caches:", err?.message);
  }
};

const safeInsert = async (model, docs) => {
  if (!docs.length) return 0;
  try {
    const result = await model.insertMany(docs, { ordered: false });
    return result.length;
  } catch (err) {
    // Duplicate keys (re-running the generator) are expected; report what landed.
    logger.info(`Partial insert for ${model.modelName}: ${err?.message}`);
    return err?.result?.insertedCount ?? err?.insertedDocs?.length ?? 0;
  }
};

async function generateFakePlacements(req, res) {
  const hash = await passwordHash();
  const staff = Array.from({ length: 10 }, () => makeStaff(hash));
  const placements = staff.flatMap((s) =>
    Array.from({ length: faker.number.int({ min: 4, max: 5 }) }, () => makePlacement(s._id))
  );

  const staffInserted = await safeInsert(User, staff);
  const placementsInserted = await safeInsert(Placement, placements);
  await clearCaches();

  logger.info(`Fake placements generated: ${staffInserted} staff, ${placementsInserted} placements`);
  return res.status(201).json(new ApiResponse(201, { staff: staffInserted, placements: placementsInserted }, `✅ Generated ${placementsInserted} placements by ${staffInserted} staff (login: any email, password ${PLAIN_PASSWORD})`));
}

async function generateFakeStudents(req, res) {
  const hash = await passwordHash();
  const users = Array.from({ length: 25 }, () => makeStudentUser(hash));
  const details = users.map((u) => makeStudentDetails(u._id));

  const usersInserted = await safeInsert(User, users);
  const studentsInserted = await safeInsert(Student, details);
  await clearCaches();

  logger.info(`Fake students generated: ${usersInserted} users, ${studentsInserted} students`);
  return res.status(201).json(new ApiResponse(201, { users: usersInserted, students: studentsInserted }, `✅ Generated ${studentsInserted} students (login: any email, password ${PLAIN_PASSWORD})`));
}

async function generateFakeData(req, res) {
  const hash = await passwordHash();

  // Staff + placements
  const staff = Array.from({ length: 10 }, () => makeStaff(hash));
  const placements = staff.flatMap((s) =>
    Array.from({ length: faker.number.int({ min: 4, max: 5 }) }, () => makePlacement(s._id))
  );

  // Students + student details
  const students = Array.from({ length: 100 }, () => makeStudentUser(hash));
  const studentDetails = students.map((u) => makeStudentDetails(u._id));

  // Applications: every student applies to 1-4 random placements
  const applications = students.flatMap((s) =>
    Array.from({ length: faker.number.int({ min: 1, max: 4 }) }, () => ({
      user_id: s._id,
      placement_id: faker.helpers.arrayElement(placements)._id,
      status: faker.helpers.arrayElement(["applied", "shortlisted", "selected", "rejected"]),
    }))
  );

  const staffInserted = await safeInsert(User, staff);
  const placementsInserted = await safeInsert(Placement, placements);
  const studentsInserted = await safeInsert(User, students);
  const detailsInserted = await safeInsert(Student, studentDetails);
  const applicationsInserted = await safeInsert(Application, applications);
  await clearCaches();

  logger.info(`Fake data generated: ${staffInserted} staff, ${placementsInserted} placements, ${studentsInserted} students, ${detailsInserted} details, ${applicationsInserted} applications`);
  return res.status(201).json(
    new ApiResponse(
      201,
      { staff: staffInserted, placements: placementsInserted, students: studentsInserted, applications: applicationsInserted },
      `✅ Generated ${placementsInserted} placements, ${studentsInserted} students, ${applicationsInserted} applications (login: any email, password ${PLAIN_PASSWORD})`
    )
  );
}

const router = Router();
router.route("/placements").post(generateFakePlacements);
router.route("/students").post(generateFakeStudents);
router.route("/all").post(generateFakeData);

export default router;
