const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const users = {};

const CARDS = {
  marketing: { id: 'marketing', name: 'Реклама Coin Kombat', baseCost: 100, profitPerHour: 50 },
  servers: { id: 'servers', name: 'Сервера Kombat', baseCost: 500, profitPerHour: 300 },
  team: { id: 'team', name: 'Команда разработчиков', baseCost: 2000, profitPerHour: 1200 },
  license: { id: 'license', name: 'Лицензия крипто-биржи', baseCost: 10000, profitPerHour: 5500 }
};

const TASKS = [
  { id: 'telegram', title: 'Подписка на Telegram', reward: 5000, isDone: false },
  { id: 'taps100', title: 'Сделать 100 кликов', reward: 1000, isDone: false }
];

// Синхронизация данных пользователя
app.post('/api/user/sync', (req, res) => {
  const { userId, referrerId } = req.body;
  if (!users[userId]) {
    users[userId] = {
      coins: 100,
      profitPerHour: 0,
      energy: 1000,
      maxEnergy: 1000,
      lastUpdate: Date.now(),
      cards: {},
      completedTasks: [],
      referralsCount: 0,
      isPremium: false
    };

    if (referrerId && users[referrerId] && referrerId !== userId) {
      users[referrerId].coins += 2500;
      users[referrerId].referralsCount += 1;
    }
  }

  const user = users[userId];
  const now = Date.now();
  const secondsPassed = (now - user.lastUpdate) / 1000;
  
  const passiveEarned = (user.profitPerHour / 3600) * secondsPassed;
  user.coins += passiveEarned;

  const energyRecovered = Math.floor(secondsPassed * 3);
  user.energy = Math.min(user.maxEnergy, user.energy + energyRecovered);

  user.lastUpdate = now;

  res.json({ user, cardsConfig: CARDS, tasksConfig: TASKS });
});

// Клики
app.post('/api/user/tap', (req, res) => {
  const { userId, count } = req.body;
  const user = users[userId];

  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

  const tapValue = user.isPremium ? count * 2 : count;

  if (user.energy >= count) {
    user.coins += tapValue;
    user.energy -= count;
    res.json({ success: true, coins: user.coins, energy: user.energy, added: tapValue });
  } else {
    res.status(400).json({ error: 'Недостаточно энергии' });
  }
});

// Покупка карточек за игровые монеты
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

// Начисление наград за Telegram Stars
app.post('/api/user/buy-stars-item', (req, res) => {
  const { userId, itemType } = req.body;
  const user = users[userId];

  if (!user) return res.status(404).json({ error: 'Пользователь не найден' });

  if (itemType === 'coins_pack') {
    user.coins += 100000;
    res.json({ success: true, user, message: '+100,000 монет зачислено!' });
  } else if (itemType === 'premium') {
    user.isPremium = true;
    user.profitPerHour += 10000;
    res.json({ success: true, user, message: 'Премиум зачислен (+10,000/ч и 2x за клик)!' });
  } else {
    res.status(400).json({ error: 'Неизвестный товар' });
  }
});

app.post('/api/user/complete-task', (req, res) => {
  const { userId, taskId } = req.body;
  const user = users[userId];
  const task = TASKS.find(t => t.id === taskId);

  if (!user || !task) return res.status(400).json({ error: 'Задание не найдено' });

  if (!user.completedTasks.includes(taskId)) {
    user.completedTasks.push(taskId);
    user.coins += task.reward;
    res.json({ success: true, user });
  } else {
    res.status(400).json({ error: 'Задание уже выполнено' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Coin Kombat Backend running on port ${PORT}`));
