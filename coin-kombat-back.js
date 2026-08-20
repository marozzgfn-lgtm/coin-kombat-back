const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const users = {};

const CARDS = {
  marketing: { id: 'marketing', name: 'Реклама Coin Kombat', baseCost: 100, profitPerHour: 50 },
  servers: { id: 'servers', name: 'Сервера Kombat', baseCost: 500, profitPerHour: 300 }
};

app.post('/api/user/sync', (req, res) => {
  const { userId } = req.body;
  if (!users[userId]) {
    users[userId] = {
      coins: 0,
      profitPerHour: 0,
      energy: 1000,
      maxEnergy: 1000,
      lastUpdate: Date.now(),
      cards: {}
    };
  }

  const user = users[userId];
  const now = Date.now();
  const secondsPassed = (now - user.lastUpdate) / 1000;
  const passiveEarned = (user.profitPerHour / 3600) * secondsPassed;
  
  user.coins += passiveEarned;
  user.lastUpdate = now;

  res.json({ user, cardsConfig: CARDS });
});

app.post('/api/user/tap', (req, res) => {
  const { userId, count } = req.body;
  const user = users[userId];

  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

  if (user.energy >= count) {
    user.coins += count;
    user.energy -= count;
    res.json({ success: true, coins: user.coins, energy: user.energy });
  } else {
    res.status(400).json({ error: 'Недостаточно энергии' });
  }
});

app.post('/api/user/buy-card', (req, res) => {
  const { userId, cardId } = req.body;
  const user = users[userId];
  const card = CARDS[cardId];

  if (!user || !card) return res.status(400).json({ error: 'Неверный запрос' });

  const currentLevel = user.cards[cardId] || 0;
  const cost = Math.floor(card.baseCost * Math.pow(1.5, currentLevel));

  if (user.coins >= cost) {
    user.coins -= cost;
    user.cards[cardId] = currentLevel + 1;
    user.profitPerHour += card.profitPerHour;
    
    res.json({ success: true, user });
  } else {
    res.status(400).json({ error: 'Недостаточно монет' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Coin Kombat Backend running on port ${PORT}`));
