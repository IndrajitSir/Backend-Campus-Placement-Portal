import mongoose, { Schema } from "mongoose";
import redis from "../utils/redisClient";

const studentSchema = new Schema(
    {
        student_id: { type: Schema.Types.ObjectId, ref: "User", required: true },
        resume: { type: String, default: "" },
        avatar: { type: String, default: "" },
        approved: { type: Boolean, default: false },
        location: { type: String, default: "" },
        about: { type: String, default: "" },
        professional_skill: { type: String, default: "" },
        department: { type: String, default: "" },
        projects: [{
            _id: {
                type: Schema.Types.ObjectId,
                auto: true
            },
            title: {
                type: String, required: true
            },
            description: {
                type: String, required: true
            },
            link: {
                type: String, required: true
            },
        }]
    }, { timestamps: true }
);

function removeCache(){
  redis.exists("students:all", (err, reply) => {
    if (err) {
      logger.error("Error checking redis key(students:all) existence in students schema:", err);
    } else if (reply === 1) {
      redis.del("students:all", (delErr, delReply) => {
        if (delErr) {
          logger.error("Error while deleting redis key(students:all) in students schema:", delErr);
        } else {
          logger.info("redis key(students:all) deleted in students schema", delReply);
        }
      });
    } else {
      console.log("redis key(students:all) does not exists!");
    }
    next()
  });
}
studentSchema.pre("save", async function (next) {
    if (typeof this.student_id === "string") {
        this.student_id = new Schema.Types.ObjectId(this.student_id);
    }
    next()
});

studentSchema.post("updateOne", async function (next) {
  removeCache();
  next()
});
studentSchema.post("deleteOne", async function(next){
  removeCache();
  next()
});
studentSchema.post("save", async function(next){
  removeCache();
  next()
});

export const Student = mongoose.model("Student", studentSchema);