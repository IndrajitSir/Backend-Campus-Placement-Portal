import { faker } from '@faker-js/faker';
import * as fs from 'node:fs';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/user.models.js';
import { Placement } from '../models/placement.model.js'
import { Student } from '../models/student.model.js';

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
            role: faker.helpers.arrayElement(["placement_staff","admin"]),
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

async function generateFakeStudents(req,res) {
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


import { Router } from "express"
const router = Router();
router.route("/placements").post(generateFakePlacements);
router.route("/students").post(generateFakeStudents);
export default router;

