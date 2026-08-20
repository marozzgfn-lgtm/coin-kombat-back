const express = require('express');
const app = express();
app.use(express.json());

const users = {
    "user_1": {
        id: "user_1",
        lvl: 1,
        stars: 100,
        isPremium: false,
        upgrades: {
            speed: 0,
            income: 0,
            clicker: 0
        },
        inventory: []
    }
};

const SHOP_ITEMS = {
    "speed_boost": { name: "Speed Upgrade", price: 15, type: "upgrade", key: "speed" },
    "income_boost": { name: "Income Upgrade", price: 25, type: "upgrade", key: "income" },
    "clicker_boost": { name: "Clicker Upgrade", price: 35, type: "upgrade", key: "clicker" },
    "premium_status": { name: "Premium Status", price: 50, type: "status", key: "isPremium" }
};

app.get('/profile/:userId', (req, res) => {
    const user = users[req.params.userId];
    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }
    return res.json(user);
});

app.post('/buy', (req, res) => {
    const { userId, itemId } = req.body;
    const user = users[userId];
    const item = SHOP_ITEMS[itemId];

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    if (!item) {
        return res.status(400).json({ error: "Item not found" });
    }

    if (user.stars < item.price) {
        return res.status(400).json({ error: "Not enough stars" });
    }

    user.stars -= item.price;

    if (item.type === "upgrade") {
        user.upgrades[item.key] += 1;
    } else if (item.type === "status") {
        user[item.key] = true;
    } else {
        user.inventory.push(itemId);
    }

    return res.json({
        message: "Purchase successful",
        user: user
    });
});

app.post('/level-up', (req, res) => {
    const { userId } = req.body;
    const user = users[userId];

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    user.lvl += 1;
    return res.json({
        message: "Level up successful",
        lvl: user.lvl,
        user: user
    });
});

app.post('/add-stars', (req, res) => {
    const { userId, amount } = req.body;
    const user = users[userId];

    if (!user) {
        return res.status(404).json({ error: "User not found" });
    }

    user.stars += amount;
    return res.json({
        message: "Stars added",
        stars: user.stars,
        user: user
    });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});
