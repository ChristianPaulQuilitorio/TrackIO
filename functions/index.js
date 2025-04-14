const functions = require("firebase-functions");
const admin = require("firebase-admin");
const multer = require("multer");
const { Storage } = require("@google-cloud/storage");
const cors = require("cors");

admin.initializeApp();
const storage = new Storage();
const bucket = storage.bucket("trackio-f5b07.appspot.com");

const upload = multer({ storage: multer.memoryStorage() });

exports.uploadProfilePhoto = functions.https.onRequest((req, res) => {
    cors()(req, res, () => {
        upload.single("file")(req, res, async (err) => {
            if (err) {
                return res.status(400).send(err);
            }

            const file = req.file;
            const blob = bucket.file(`profilePhotos/${file.originalname}`);
            const blobStream = blob.createWriteStream({
                metadata: {
                    contentType: file.mimetype,
                },
            });

            blobStream.on("error", (error) => {
                res.status(500).send(error);
            });

            blobStream.on("finish", async () => {
                const photoURL = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(blob.name)}?alt=media`;
                res.status(200).send({ photoURL });
            });

            blobStream.end(file.buffer);
        });
    });
});