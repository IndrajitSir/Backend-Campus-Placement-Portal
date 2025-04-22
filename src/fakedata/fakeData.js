import { faker } from '@faker-js/faker';
import logger from '../utils/Logger/logger.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/user.models.js';
import { Placement } from '../models/placement.model.js'
import { Student } from '../models/student.model.js';
import { Application } from '../models/application.model.js';

async function generateFakePlacements(req, res) {
  const placement_staff = [];
  const placements = [];

  // Create 10 Placement Staff users
  for (let i = 0; i < 10; i++) {
    const placement_staff_Id = faker.database.mongodbObjectId();
    placement_staff.push({
      _id: placement_staff_Id,
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: 1234,
      phoneNumber: faker.phone.number().replace(/\D/g, '').slice(0, 10),
      role: faker.helpers.arrayElement(["placement_staff", "admin"]),
      refreshToken: null,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent()
    });

    // Each placement staff creates 4-5 job postings
    const numPlacements = faker.number.int({ min: 4, max: 5 });

    for (let j = 0; j < numPlacements; j++) {
      placements.push({
        _id: faker.database.mongodbObjectId(),
        company_name: faker.company.name(),
        job_title: faker.person.jobTitle(),
        description: faker.lorem.sentence(),
        eligibility: faker.helpers.arrayElement([
          "B.Tech, MCA with 60%+ marks",
          "BCA, BSc IT, MSc IT",
          "MBA, BBA with relevant skills",
          "Any graduate with programming knowledge"
        ]),
        location: faker.helpers.arrayElement([
          "Bengaluru", "chennai", "Hydrabad", "Kolkata", "Chandigarh", "Jaipur", "US", "UK", "Ireland", "Maxico", "Goa", "Pune"
        ]),
        last_date: faker.date.future(),
        created_by: placement_staff_Id, // Link to the placement staff
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent()
      });
    }
  }
  await User.insertMany(placement_staff);
  await Placement.insertMany(placements);
  // Save to a JSON file
  // fs.writeFileSync("C:/Users/indra/OneDrive/Desktop/mern lab/CPRS/Backend/src/fakedata/fakeData.json", JSON.stringify({ users, placements }, null, 2));
  return res.status(200).json(new ApiResponse(200, {}, "✅ Fake Placements generated and saved to Database!"))
}

async function generateFakeStudents(req, res) {
  const students = [];
  const studentDetails = [];
  for (let i = 0; i < 10; i++) {
    const student_Id = faker.database.mongodbObjectId();
    students.push({
      _id: student_Id,
      name: faker.person.fullName(),
      email: faker.internet.email(),
      password: 1234,
      phoneNumber: faker.phone.number().replace(/\D/g, '').slice(0, 10),
      role: "student",
      refreshToken: null,
      createdAt: faker.date.past(),
      updatedAt: faker.date.recent()
    });

    for (let i = 0; i < 10; i++) {
      studentDetails.push({
        student_id: student_Id,
        resume: faker.internet.url(),
        approved: faker.datatype.boolean(),
        location: faker.location.city(),
        about: faker.person.bio(),
        professional_skill: faker.helpers.arrayElement([
          "JavaScript",
          "Python",
          "Java",
          "C++",
          "React.js",
          "Node.js",
          "Web Developer",
          "Software Engineer",
          "App Developer",
          "Ml Model trainer",
          "Data Scientist",
          "Data Analyst",
          "AI Enthusiast"
        ]),
        department: faker.helpers.arrayElement(["CSE", "IT", "ECE", "EEE", "Mechanical", "BCA", "B.Tech", "MCA", "M.Tech"]),
        projects: [
          {
            title: faker.commerce.productName(),
            description: faker.lorem.sentence(),
            link: faker.internet.url(),
          },
          {
            title: faker.commerce.productName(),
            description: faker.lorem.sentence(),
            link: faker.internet.url(),
          },
        ],
      });
    }
  }
  await User.insertMany(students);
  await Student.insertMany(studentDetails);
  return res.status(200).json(new ApiResponse(200, {}, "✅ Fake Students generated and saved to Database!"))
}

async function generateFakeData(req, res) {
  const placement_staff = [];
  const placements = [];
  const students = [];
  const studentDetails = [];
  const applications = [];

  try {
    // Create 10 Placement Staff users
    for (let i = 0; i < 10; i++) {
      const placement_staff_Id = faker.database.mongodbObjectId();
      placement_staff.push({
        _id: placement_staff_Id,
        name: faker.person.fullName(),
        email: faker.internet.email(),
        password: 1234,
        phoneNumber: faker.phone.number().replace(/\D/g, '').slice(0, 10),
        role: faker.helpers.arrayElement(["placement_staff", "admin"]),
        refreshToken: null,
        createdAt: faker.date.past(),
        updatedAt: faker.date.recent()
      });

      // Each placement staff creates 4-5 job postings
      const numPlacements = faker.number.int({ min: 4, max: 5 });

      for (let j = 0; j < numPlacements; j++) {
        const jobRolesDescription = faker.helpers.arrayElement([
          {
            title: "Software Engineer",
            description: "Designs, develops, and maintains software systems. Collaborates with cross-functional teams to deliver scalable and efficient applications."
          },
          {
            title: "Data Scientist",
            description: "Uses statistical analysis and machine learning techniques to extract insights from complex datasets, aiding data-driven decision-making."
          },
          {
            title: "Product Manager",
            description: "Oversees the planning, development, and execution of products. Bridges the gap between technical teams and stakeholders."
          },
          {
            title: "Graphic Designer",
            description: "Creates visual content using design tools for print and digital media, ensuring alignment with branding and user requirements."
          },
          {
            title: "Marketing Manager",
            description: "Develops and implements strategies to promote products and services. Analyzes market trends and oversees marketing campaigns."
          },
          {
            title: "Human Resources Specialist",
            description: "Handles recruitment, onboarding, and employee relations. Ensures organizational policies are followed effectively."
          },
          {
            title: "Sales Representative",
            description: "Identifies potential clients, pitches products or services, and closes deals to meet or exceed sales targets."
          },
          {
            title: "Business Analyst",
            description: "Analyzes business processes and systems to identify solutions that improve efficiency and productivity."
          },
          {
            title: "Customer Service Manager",
            description: "Leads teams to deliver excellent customer support. Monitors feedback and resolves escalated customer issues."
          },
          {
            title: "Financial Analyst",
            description: "Evaluates financial data to forecast business performance, assisting in strategic planning and investment decisions."
          },
          {
            title: "Operations Manager",
            description: "Ensures smooth day-to-day operations by coordinating resources, managing staff, and optimizing processes."
          },
          {
            title: "Web Developer",
            description: "Designs and builds functional websites using programming languages. Focuses on usability and performance optimization."
          },
          {
            title: "UX/UI Designer",
            description: "Improves user experience through research-driven design. Creates interfaces that are aesthetically pleasing and user-friendly."
          },
          {
            title: "Machine Learning Engineer",
            description: "Builds and deploys machine learning models. Optimizes algorithms to solve real-world problems using data."
          },
          {
            title: "IT Support Specialist",
            description: "Provides technical assistance to employees or customers. Resolves hardware and software-related issues efficiently."
          },
          {
            title: "Network Administrator",
            description: "Manages and maintains network systems. Ensures connectivity, security, and optimal performance."
          },
          {
            title: "Cloud Architect",
            description: "Designs and implements cloud-based infrastructure. Ensures scalability, security, and cost-effectiveness of solutions."
          },
          {
            title: "Project Manager",
            description: "Plans, executes, and oversees projects to ensure they are completed on time, within scope, and under budget."
          },
          {
            title: "Content Strategist",
            description: "Develops and curates content plans to enhance brand presence and engage target audiences effectively."
          },
          {
            title: "Cybersecurity Analyst",
            description: "Monitors systems for vulnerabilities and prevents cyber threats. Implements measures to secure sensitive information."
          },
          {
            title: "Mobile App Developer",
            description: "Designs, develops, and deploys mobile applications for various platforms while ensuring user experience."
          },
          {
            title: "Database Administrator",
            description: "Manages and maintains database systems. Ensures data integrity, accessibility, and security."
          },
          {
            title: "Quality Assurance Tester",
            description: "Tests software applications for bugs and performance issues to ensure quality standards are met."
          },
          {
            title: "DevOps Engineer",
            description: "Streamlines development and deployment processes. Ensures smooth integration of code and infrastructure."
          },
          {
            title: "Digital Marketing Specialist",
            description: "Creates and executes digital marketing campaigns. Uses analytics to optimize online performance and outreach."
          },
          {
            title: "Account Manager",
            description: "Builds and maintains client relationships. Ensures customer satisfaction and identifies upselling opportunities."
          },
          {
            title: "Creative Director",
            description: "Leads creative teams in conceptualizing and executing campaigns that align with branding goals."
          },
          {
            title: "Civil Engineer",
            description: "Designs, constructs, and maintains infrastructure projects like bridges, roads, and buildings."
          },
          {
            title: "Electrical Engineer",
            description: "Develops, tests, and supervises the creation of electrical systems and devices for various applications."
          },
          {
            title: "Mechanical Engineer",
            description: "Designs and develops mechanical systems and components. Oversees production and ensures functionality."
          },
          {
            title: "Public Relations Manager",
            description: "Develops strategies to maintain a positive public image for organizations and manages media relations."
          },
          {
            title: "Legal Counsel",
            description: "Provides legal advice and support. Ensures compliance with regulations and represents the organization in legal matters."
          },
          {
            title: "Compliance Officer",
            description: "Monitors and enforces company policies and legal requirements to ensure ethical and lawful operations."
          },
          {
            title: "Data Analyst",
            description: "Processes and interprets data to derive meaningful insights that support decision-making processes."
          },
          {
            title: "SEO Specialist",
            description: "Optimizes website content and structure to improve search engine rankings and online visibility."
          },
          {
            title: "Social Media Manager",
            description: "Manages social media strategies and content to enhance engagement and brand awareness."
          },
          {
            title: "Environmental Scientist",
            description: "Studies environmental factors and provides solutions to minimize environmental impact and promote sustainability."
          },
          {
            title: "Medical Researcher",
            description: "Conducts scientific studies to advance medical knowledge and develop new treatments or technologies."
          },
          {
            title: "Risk Manager",
            description: "Assesses and mitigates risks to ensure the organization's operational and financial stability."
          },
          {
            title: "Training and Development Specialist",
            description: "Designs and conducts training programs to enhance employee skills and organizational productivity."
          }
        ]);
        const placement_post_id = faker.database.mongodbObjectId();
        placements.push({
          _id: placement_post_id,
          company_name: faker.helpers.arrayElement([
            "Google",
            "Apple",
            "Microsoft",
            "Amazon",
            "Facebook (Meta)",
            "Tesla",
            "Samsung",
            "Intel",
            "IBM",
            "Oracle",
            "Twitter",
            "Adobe",
            "Cisco",
            "Netflix",
            "Spotify",
            "Zoom",
            "Salesforce",
            "Uber",
            "Airbnb",
            "Xiaomi",
            "Alibaba",
            "Huawei",
            "Dell",
            "Nvidia",
            "Qualcomm",
            "Philips",
            "Sony",
            "Toyota",
            "BMW",
            "Boeing",
            "PepsiCo",
            "Coca-Cola",
            "Procter & Gamble",
            "Unilever",
            "Johnson & Johnson",
            "General Motors",
            "Ford",
            "LG",
            "Hyundai",
            "Siemens"

          ]),
          job_title: jobRolesDescription.title,
          description: jobRolesDescription.description,
          eligibility: faker.helpers.arrayElement([
            "B.Tech, MCA with 60%+ marks",
            "BCA, BSc IT, MSc IT",
            "MBA, BBA with relevant skills",
            "Any graduate with programming knowledge"
          ]),
          location: faker.helpers.arrayElement([
            "Bengaluru", "chennai", "Hydrabad", "Kolkata", "Chandigarh", "Jaipur", "US", "UK", "Ireland", "Maxico", "Goa", "Pune"
          ]),
          last_date: faker.date.future(),
          created_by: placement_staff_Id, // Link to the placement staff
          createdAt: faker.date.past(),
          updatedAt: faker.date.recent()
        });

        for (let i = 0; i < 50; i++) {
          const student_Id = faker.database.mongodbObjectId();
          students.push({
            _id: student_Id,
            name: faker.person.fullName(),
            email: faker.internet.email(),
            password: 1234,
            phoneNumber: faker.phone.number().replace(/\D/g, '').slice(0, 10),
            role: "student",
            refreshToken: null,
            createdAt: faker.date.past(),
            updatedAt: faker.date.recent()
          });

          studentDetails.push({
            student_id: student_Id,
            resume: faker.internet.url(),
            approved: faker.datatype.boolean(),
            location: faker.location.city(),
            about: faker.person.bio(),
            professional_skill: faker.helpers.arrayElement([
              "JavaScript",
              "Python",
              "Java",
              "C++",
              "React.js",
              "Node.js",
              "Web Developer",
              "Software Engineer",
              "App Developer",
              "Ml Model trainer",
              "Data Scientist",
              "Data Analyst",
              "AI Enthusiast"
            ]),
            department: faker.helpers.arrayElement(["CSE", "IT", "ECE", "EEE", "Mechanical", "BCA", "B.Tech", "MCA", "M.Tech"]),
            projects: [
              {
                title: faker.commerce.productName(),
                description: faker.lorem.sentence(),
                link: faker.internet.url(),
              },
              {
                title: faker.commerce.productName(),
                description: faker.lorem.sentence(),
                link: faker.internet.url(),
              },
            ],
          });

          applications.push({
            user_id: student_Id,
            placement_id: placement_post_id,
            status: faker.helpers.arrayElement(["applied", "shortlisted", "selected", "rejected"])
          });
        }
      }
    }
  } catch (err) {
    logger.error("Error while generating fake data: ", err);
    console.error("Error while generating fake data: ", err);
  }
  try {
    await User.insertMany([...placement_staff, ...students]);
    // await User.insertMany(students);
    // await User.insertMany(placement_staff);
    await Student.insertMany(studentDetails);
    await Placement.insertMany(placements);
    await Application.insertMany(applications);
  } catch (err) {
    logger.error("Error while saving fake data into database: ", err);
    console.error("Error while saving fake data into database: ", err);
  }
  try {
    console.log({
      placement_staff: placement_staff.length,
      placements: placements.length,
      students: students.length,
      studentDetails: studentDetails.length,
      applications: applications.length
    });
  } catch (err) {
    logger.error("Error while logging the length of fake data: ", err);
    console.error("Error while logging the length of fake data: ", err);
  }
  return res.status(201).json(new ApiResponse(201, {}, "✅ Fake Data generated and saved to Database!"))
}

import { Router } from "express"
const router = Router();
router.route("/placements").post(generateFakePlacements);
router.route("/students").post(generateFakeStudents);
router.route("/all").post(generateFakeData);
export default router;

