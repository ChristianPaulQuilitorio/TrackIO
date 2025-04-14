const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 8080;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Route to serve student-index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'Student', 'student-index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running at http://127.0.0.1:${PORT}`);
});