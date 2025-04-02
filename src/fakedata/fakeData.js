import { faker } from '@faker-js/faker';
import * as fs from 'node:fs';
import { ApiResponse } from '../utils/ApiResponse.js';
import { User } from '../models/user.models.js';
import { Placement } from '../models/placement.model.js'

async function generateFakeData(req, res) {
    const users = [];
    const placements = [];

    // Create 10 Placement Staff users
    for (let i = 0; i < 10; i++) {
        const userId = faker.database.mongodbObjectId();
        users.push({
            _id: userId,
            name: faker.person.fullName(),
            email: faker.internet.email(),
            password: faker.internet.password(), // In real-world, hash this
            phoneNumber: faker.phone.number().replace(/\D/g, '').slice(0, 10),
            role: "placement_staff",
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
                last_date: faker.date.future(),
                created_by: userId, // Link to the placement staff
                createdAt: faker.date.past(),
                updatedAt: faker.date.recent()
            });
        }
    }
    await User.insertMany(users);
    await Placement.insertMany(placements);
    // Save to a JSON file
    // fs.writeFileSync("C:/Users/indra/OneDrive/Desktop/mern lab/CPRS/Backend/src/fakedata/fakeData.json", JSON.stringify({ users, placements }, null, 2));
    return res.status(200).json(new ApiResponse(200, {}, "✅ Fake data generated and saved to fakeData.json!"))
}



import { Router } from "express"
const router = Router();
router.route("/").get(generateFakeData);

export default router;

