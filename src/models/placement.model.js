import mongoose, { Schema } from "mongoose";
import redis from "../utils/redisClient.js";

const placementSchema = new Schema({
  company_name: { type: String, required: true },
  job_title: { type: String, required: true },
  description: { type: String },
  eligibility: { type: String },
  location: { type: String },
  last_date: { type: Date, required: true },
  created_by: { type: Schema.Types.ObjectId, ref: "User", required: true },
  salary: { type: Number, default: null}
}, { timestamps: true });

placementSchema.index({created_by: 1});

function removeCache(){
  redis.exists("placement:all", (err, reply) => {
    if (err) {
      logger.error("Error checking redis key(placement:all) existence in placement schema:", err);
    } else if (reply === 1) {
      redis.del("placement:all", (delErr, delReply) => {
        if (delErr) {
          logger.error("Error while deleting redis key(placement:all) in placement schema:", delErr);
        } else {
          logger.info("redis key(placement:all) deleted in placement schema", delReply);
        }
      });
    } else {
      console.log("redis key(placement:all) does not exists!");
    }
  });
}
placementSchema.pre("save", async function (next) {
  if (typeof this.created_by === "string") {
    this.created_by = new Schema.Types.ObjectId(this.created_by);
  }
  next()
});

placementSchema.post("updateOne", async function () {
  removeCache();
});
placementSchema.post("deleteOne", async function(){
  removeCache();
});
placementSchema.post("save", async function(){
  removeCache();
});

export const Placement = mongoose.model("Placement", placementSchema);