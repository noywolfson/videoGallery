// const multer = require('multer');
// const path = require('path')
// const fs = require('fs');
//
// // Set up storage for uploaded files
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         const uploadDir = path.join(__dirname, '../public/uploads');
//         if (!fs.existsSync(uploadDir)) {
//             fs.mkdirSync(uploadDir);
//         }
//         return cb(null, uploadDir);
//     },
//     filename: (req, file, cb) => {
//         return cb(null, Date.now() + '-' + file.originalname);
//     },
//     // description: (req, file, cb) => {
//     //     return cb(null, );
//     // },
//     date: (req, file, cb) => {
//         return cb(null, new Date(Date.now()).toString());
//     }
// });
//
// // Create the multer instance
// const upload = multer({ storage: storage });
//
// module.exports = upload;
