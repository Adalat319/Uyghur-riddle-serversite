const express = require("express");
require("dotenv").config();
const router = express.Router();
const Riddle = require("../Schema/riddleSchema");
const Category = require("../Schema/categorySchema");
const multer = require("multer");
const jwt = require('jsonwebtoken');
const UPLOAD_FOLDER = "./public/image";
const fs = require("fs");
const path = require("path");
const { log } = require("console");
const SaveRiddle = require("../Schema/savedRiddle");
const bcrypt = require('bcrypt');
const transporter = require('../Utils/mail_transporter');
const User = require("../Schema/userSchema");
const { request } = require("http");

//! -----------multer for image upload------------
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_FOLDER);
    },
    filename: (req, file, cb) => {
        if (file) {
            const fileExt = path.extname(file.originalname);
            const fileName =
                file.originalname
                    .replace(fileExt, "")
                    .toLowerCase()
                    .split(" ")
                    .join("-") +
                "-" +
                Date.now();
            console.log("🚀 ~ fileName:", fileName);
            cb(null, fileName + fileExt);
        }
    },
});

var upload = multer({
    storage: storage,
});

//! ------------full auth------------

//!----------- registration route-------------
router.post('/resgistration', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        console.log(name, email, password);
        const useremail = await User.findOne({ email });
        if (useremail) {
            return res.status(400).json({ message: 'Eamil alreay uses. Try again with new email' });
        }
        const userName = await User.findOne({ name });
        if (userName) {
            return res.status(400).json({ message: 'Name alreay uses. Try again with new email' });
        }
        const otp = Math.floor(100000 + Math.random() * 900000);
        console.log(otp);
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await new User({
            email,
            password: hashedPassword,
            name,
            role: 'user',
            otp
        }).save();
        const info = await transporter.sendMail({
            from: '"ئۇيغۇر بالىلار تېپىشماقلىرى" <testmail@gmail.com>',
            to: `${email}`,
            subject: "ۋاقىتلىق پارول",
            text: "Confirmation email",
            html: `
                <b dir="rtl" style="direction: rtl";>ئەسسالامۇئەلەيكۇم، سىزنىڭ ۋاقىتلىق پارولىڭىز:  </b>
                <h1>${otp}</h1>
            `,
        });
        res.status(200).json({ message: 'successfully created', newUser });
    } catch (error) {
        console.log(error?.message);
    }
});

// !------------OTP Verification----------
router.post('/otp-verification', async (req, res) => {
    try {
        const { otp } = req.body;
        const user = await User.findOne({ otp });
        if (!user) {
            return res.status(401).json({ message: 'otp didn"t match' });
        }
        console.log(user);
        const result = await User.updateOne({ _id: user._id }, { verifyEmail: true });
        return res.status(200).json({ message: 'successfully verify email. have a good day', success: true })
    } catch (error) {
        console.log(error);
    }
})

//! -----------login route----------
router.post('/login', async (req, res) => {
    try {
        const { name, password } = req.body;
        const user = await User.findOne({ name });
        if (!user) {
            return res.json({ message: 'username didn"t match' });
        }
        if (user) {
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (!passwordMatch) {
                return res.json({ message: 'password didn"t match' });
            }
        }
        const token = jwt.sign(user.email, 'dngfnjnxjmcxnxcn');
        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            // secure: process.env.NODE_ENV === 'production',
            // sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        }).json({
            email: user.email,
            token,
            role: user.role,
            login: true,
        })
    } catch (error) {
        console.log(error);
    }
})


//!-----------reset password----------
router.post('/reset-password', async (req, res) => {
    try {
        const { email } = req.body;
        console.log(email);
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Email not exist.' });
        }
        const otp = Math.floor(100000 + Math.random() * 900000);
        const info = await transporter.sendMail({
            from: '"Fred Foo 👻" <testmail@gmail.com>',
            to: `${email}`,
            subject: "Hello ✔",
            text: "Password reset.",
            html: `
                <b>Hello ${user.name}. Please confirm your otp.</b>
                <b>Please cheek mail and verify otp and reset password.</b>
                <h1>${otp}</h1>
            `,
        });
        const result = await User.updateOne({ _id: user._id }, { otp });
        console.log(result);
        res.status(200).json({ message: 'Please cheek mail and verify otp and reset password.' });
    } catch (error) {
        console.log(error?.message);
    }
});

router.post('/confirm-reset-password', async (req, res) => {
    try {
        const { otp, password } = req.body
        const valid = await User.findOne({ otp });
        if (!valid) {
            return res.status(400).json({ message: 'otp does not exist.' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const result = await User.updateOne({ _id: valid._id }, { password: hashedPassword });
        console.log(result);
        return res.status(200).json({ message: 'Password reset successfully' });
    } catch (error) {
        console.log(error);
    }
})

//!...........get data.................
router.get("/category", async (req, res) => {
    try {
        const email = req.query.email;
        const products = await Category.find({ email });
        res.status(200).json({ data: products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});
//!-----------get riddle---------------
router.get("/riddle", async (req, res) => {

    const email = req.query.email;
    if (email) {
        console.log(email);
        const products = await Riddle.find({ email });
        res.status(200).json({ data: products });
    }

});

//!-----------get riddle---------------
router.get("/allRiddle", async (req, res) => {
    try {
        const products = await Riddle.find();
        res.status(200).json({ data: products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

router.get("/allcategories", async (req, res) => {
    try {
        const products = await Category.find();
        res.status(200).json({ data: products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

//! .............add riddle................
router.post("/add/riddles", async (req, res) => {
    try {
        const { title1, title2, title3, title4, category, answer, explanation, email } = req.body;

        const riddles = new Riddle({
            title1, title2, title3, title4,
            category,
            answer,
            explanation,
            email
        });
        console.log(riddles)
        const result = await riddles.save();
        console.log(result)
        res.status(200).json({ message: "successful" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});
//! -----------add categories--------------
router.post("/add/category", upload.single("image"), async (req, res) => {
    try {
        const { categoryTitle, image, email } = req.body;

        const categories = new Category({
            categoryTitle,
            image: req.file.filename,
            email
        });
        console.log(categories);
        const result = await categories.save();
        res.status(200).json({ message: "Category added successfully", result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

//! ----------update riddle------------
router.patch("/update/riddles/:riddleId", async (req, res) => {
    try {
        const riddleId = req.params.riddleId;
        console.log(riddleId);
        const { title1, title2, title3, title4, category, answer, explanation } = req.body;

        // Check if the required field 'title' is present
        // if (!title) {
        //     return res.status(400).json({ error: "Title is required" });
        // }

        // Find the riddle by ID
        const existingRiddle = await Riddle.findById(riddleId);

        if (!existingRiddle) {
            return res.status(404).json({ error: "Riddle not found" });
        }
        // Update the fields if provided
        existingRiddle.title1 = title1;
        existingRiddle.title2 = title2;
        existingRiddle.title3 = title3;
        existingRiddle.title4 = title4;
        existingRiddle.category = category;
        existingRiddle.answer = answer;
        existingRiddle.explanation = explanation;
        // Save the updated riddle
        const updatedRiddle = await existingRiddle.save();

        res.status(200).json({ message: "Riddle updated successfully", updatedRiddle });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

//! ----------update category------------
router.patch('/update/category/:categoryId', upload.single('image'), async (req, res) => {
    try {
        const { categoryTitle } = req.body;
        // Prepare update data
        const updateData = {};
        if (categoryTitle) updateData.categoryTitle = categoryTitle;
        if (req.file) updateData.image = req.file.filename;

        // Update category by ID
        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.categoryId,
            updateData,
            { new: true }
        );

        if (!updatedCategory) {
            return res.status(404).json({ error: 'Category not found' });
        }

        res.status(200).json({ message: 'Category updated successfully', updatedCategory });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

//!-------------riddle delete---------------
router.delete("/riddle/delete/:id", async (req, res) => {
    try {
        const riddleId = req.params.id;
        console.log(riddleId);
        const riddles = await Riddle.findById(riddleId);
        if (!riddles) {
            return res.status(404).json({ message: "riddle not found" });
        }
        // Delete the product from the database
        await Riddle.findByIdAndDelete(riddleId);
        res.status(200).json({ message: "riddle deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

//!--------------category delete-------------
router.delete("/category/delete/:id", async (req, res) => {
    try {
        const categoryId = req.params.id;
        console.log(categoryId);
        const category = await Category.findById(categoryId);
        if (!category) {
            return res.status(404).json({ message: "Category not found" });
        }
        // Delete the product from the database
        await Category.findByIdAndDelete(categoryId);
        res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

//! ---------------save riddle--------
router.post('/save-riddle', async (req, res) => {
    try {
        const riddle = req.body;
        console.log(riddle);
        // const available = await SaveRiddle.findOne({ title: riddle.title });
        // console.log(available);
        // if (available) {
        //     return res.json({ message: 'riddle already exist.' })
        // }
        const result = await SaveRiddle.create(riddle);
        res.json({ message: 'successfully added', result });
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
})

//! ------------get user riddle-----------
router.get('/save-riddle', async (req, res) => {
    try {
        const email = req.query.email;
        const result = await SaveRiddle.find({ email });
        res.json(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
})

//! ---------get all users-----------
router.get("/users", async (req, res) => {
    try {
        const result = await User.find({}, { "password": 0 })
        res.json(result);
    } catch (error) {
        console.log(error);
        throw new error;
    }
})

//!--------------user delete-------------
router.delete("/user/delete", async (req, res) => {
    try {
        const userId = req.query.id;
        console.log(userId);
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "user not found" });
        }
        await User.findByIdAndDelete(userId);
        res.status(200).json({ message: "Category deleted successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

//all data get 

router.get("/allData", async (req, res) => {
    try {

        const riddle = await Riddle.countDocuments();
        const category = await Category.countDocuments();
        const user = await User.countDocuments();

        res.status(200).json({ data: riddle, category, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;