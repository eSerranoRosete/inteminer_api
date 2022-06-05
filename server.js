const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const vCardsJS = require('vcards-js');
const fs = require('fs');
const cors = require('cors');

const Users = require('./models/User');

require('dotenv/config');

const app = express();

app.use(bodyParser.json());
app.use(cors());

app.get('/users', async (req, res) => {

    if (req.query.api_key == process.env.AUTH_KEY) {
        try {
            res.json(await Users.find());
        } catch (error) {
            res.json({ error: error });
        }
    } else {
        res.status(405).send("Unauthorized");
    }

})


app.get('/users/:id', async (req, res) => {

    if (req.query.api_key == process.env.AUTH_KEY) {
        try {
            res.json(await Users.findById(req.params.id));
        } catch {
            res.json({ error: 'User not found' });
        }
    } else {
        res.status(405).send("Unauthorized");
    }

})

app.post('/users/find', async (req, res) => {

    try {
        const user = await Users.findOne({ email: req.body.email });
        res.json({
            name: `${user.first_name} ${user.last_name}`,
            company_name: user.company_name,
            url: `https://cards.inteminer.com/${user._id}`
        });
    } catch {
        res.json({ error: 'User not found' });
    }
})

app.get('/users/:id/qr', (req, res) => {

    try {
        res.sendFile(__dirname + `/static/dbcards/qr/${req.params.id}.png`);
    } catch {
        res.json({ error: 'File not found' });
    }

})

app.get('/users/:id/vcf', (req, res) => {

    try {
        res.sendFile(__dirname + `/static/dbcards/vcf/${req.params.id}.vcf`);
    } catch {
        res.json({ error: 'File not found' });
    }
})

app.get('/users/:id/profile', (req, res) => {
    try {
        res.sendFile(__dirname + `/static/dbcards/profile-pictures/${req.params.id}.jpeg`);
    } catch {
        res.json({ error: 'File not found' });
    }
})


app.post('/users', async (req, res) => {

    if (req.query.api_key == process.env.AUTH_KEY) {
        try {
            const user = await Users.create(req.body);

            let card = vCardsJS();
            card.firstName = user.first_name;
            card.lastName = user.last_name;
            card.organization = user.company_name;
            card.workPhone = user.phone;
            card.workEmail = user.email;
            card.title = user.title;
            card.saveToFile(`./static/dbcards/vcf/${user._id}.vcf`);

            async function generateQR(url) {
                try {
                    await QRCode.toFile(`./static/dbcards/qr/${user._id}.png`, url);
                } catch (e) {
                    console.log(e);
                }
            }

            generateQR(`${process.env.DOMAIN}/${user._id}`);

            res.json({ message: 'User created', id: user._id });
        } catch (error) {
            res.json({ error: error });
        }
    } else {
        res.status(405).send("Unauthorized");
    }

})

app.patch('/users/:id', async (req, res) => {

    if (req.query.api_key == process.env.AUTH_KEY) {
        try {
            await Users.findByIdAndUpdate(req.params.id, req.body);
            res.json({ message: 'User updated' });
        } catch (error) {
            res.json({ error: error });
        }
    } else {
        res.status(405).send("Unauthorized");
    }

})

app.delete('/users/:id', async (req, res) => {

    if (req.query.api_key == process.env.AUTH_KEY) {
        try {
            await Users.findByIdAndDelete(req.params.id);

            fs.unlink(`./static/dbcards/vcf/${req.params.id}.vcf`, (e) => {
                if (e) {
                    console.log(e);
                }
            });
            fs.unlink(`./static/dbcards/qr/${req.params.id}.png`, (e) => {
                if (e) {
                    console.log(e);
                }
            });

            res.json({ message: 'User deleted' });
        } catch (error) {
            res.json({ error: error });
        }
    } else {
        res.status(405).send("Unauthorized");
    }

})

app.listen(process.env.PORT, () => {
    console.log(`Api running at ${process.env.DOMAIN}:${process.env.PORT}`);
})

mongoose.connect(process.env.DB_CONNECTION, () => {
    console.log('Connected to MongoDB');
})