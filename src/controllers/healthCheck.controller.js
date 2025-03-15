import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
    const healthcheck = {
        status: "OK",
        message: "Server is running fine!"
    }
    return res.status(200).json(
        new ApiResponse(200, healthcheck, "Everything is fine!")
    )
})

export {
    healthcheck
    }
    