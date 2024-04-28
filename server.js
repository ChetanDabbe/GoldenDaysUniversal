const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const xlsx = require('xlsx');
require('dotenv').config(); // Load environment variables from .env file

const app = express();
const port = process.env.PORT || 3000; // Use PORT environment variable or default to 3000

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public2')));
app.use(express.static(path.join(__dirname, 'public/staff_login')));

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
})
.then(() => {
    console.log(`Connected to MongoDB`);
})
.catch((error) => {
    console.error('MongoDB connection error:', error);
});

// Define Mongoose schemas and models
const studDataSchema = new mongoose.Schema({
    studname: String,
    parentname: String,
    email: String,
    phone: String,
    grade: String,
    year_of_passing: String,
    pschool: String,
    referral: String
});

const StudData = mongoose.model('StudData', studDataSchema);

const loginSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

const LoginData = mongoose.model('LoginData', loginSchema);

const adminLoginSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
});

const AdminLoginData = mongoose.model('AdminLoginData', adminLoginSchema);

// Routes
app.post('/submit', async (req, res) => {
    try {
        const newData = new StudData(req.body);
        await newData.save();
        res.redirect('/');
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/staff_login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await LoginData.findOne({ username });
        if (user) {
            const passwordMatch = await bcrypt.compare(password, user.password);
            if (passwordMatch) {
                res.redirect('/admission_data');
            } else {
                res.status(401).send('Login unsuccessful: Incorrect password');
            }
        } else {
            res.status(404).send('Login unsuccessful: Login Details not found');
        }
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).send('Internal Server Error');
    }
});

app.post('/admin', async (req, res) => {
    const { username, password } = req.body;
    try {
        const admin = await AdminLoginData.findOne({ username });
        if (admin && admin.password === password) {
            res.redirect('/addUser');
        } else {
            res.status(401).send('Login unsuccessful: Incorrect username or password');
        }
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/display', async (req, res) => {
    try {
        const data = await StudData.find({});
        res.json(data);
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).send("Internal Server Error");
    }
});

app.post('/add', async (req, res) => {
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const newUser = new LoginData({
            username: req.body.username,
            password: hashedPassword
        });
        await newUser.save();
        res.redirect('/addUser');
    } catch (error) {
        console.error("Error adding user:", error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/export', async (req, res) => {
    try {
        const data = await StudData.find();
        const jsonData = data.map(item => ({
            studname: item.studname,
            parentname: item.parentname,
            email: item.email,
            phone: item.phone,
            grade: item.grade,
            year_of_passing: item.year_of_passing,
            pschool: item.pschool,
            referral: item.referral
        }));
        const worksheet = xlsx.utils.json_to_sheet(jsonData);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
        const excelBuffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        res.setHeader('Content-Type', 'application/vnd.openxmlformats');
        res.setHeader('Content-Disposition', 'attachment; filename=custom_filename.xlsx');
        res.send(excelBuffer);
    } catch (error) {
        console.error("Error exporting data:", error);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/admission_data', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/Table_data/admission_history.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/staff_login/login.html'));
});

app.get('/adduser', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/Add_user/add.html'));
});

app.get('/admin_login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/admin_login/admin_login.html'));
});

app.get('/admissions', (req, res) => {
    res.sendFile(path.join(__dirname, 'public2', 'admission.html'));
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

//
