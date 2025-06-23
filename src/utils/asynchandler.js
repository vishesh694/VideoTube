/////////////// PROMISE CODE ///////////////

const asynchandler=(requestHandler)=>{
    return (req, res, next) => {
        Promise.resolve(requestHandler(req, res, next)).catch((error) => next(error))
    }
}

export { asynchandler };

// const asynchandler = ()=>{}
// const asynchandler = (fn) => ()=>{}
// const asynchandler = (fn) => async () => {}

// const asynchandler = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {                                                          //// TRY CATCH CODE////
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message || "Internal Server Error",
//         })
//     }
// }