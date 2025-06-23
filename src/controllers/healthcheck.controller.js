import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asynchandler} from "../utils/asynchandler.js"


const healthcheck = asynchandler(async (req, res) => {
    //healthcheck response that simply returns the OK status as json with a message
    return res
    .status(200)
    .json(
        new ApiResponse(200,"Server is healthy")
    )
})

export {
    healthcheck
}
    