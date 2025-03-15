import multer from 'multer';

const storage = multer.diskStorage({
    destination: function (file, cb) {
        cb(null, "./public/temp")
    },
    filename: function (file, cb) {
        cb(null, file.originalname)
    }
});

export const upload = multer({ storage });