const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'lifebalance-secret-2024';
const DATA_FILE = path.join(__dirname, 'data.json');

// Initialize data
let db = { users: [], categories: [], expenses: [], foods: [], diet_logs: [], goals: [] };

function loadDB() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      db = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    }
  } catch (e) { console.log('Creating new DB'); }
}

function saveDB() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

loadDB();

// Seed foods if empty
if (db.foods.length === 0) {
  db.foods = [
    { id: 1, name: 'White Rice (cooked)', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, serving_size: 100, serving_unit: 'g', is_system: 1 },
    { id: 2, name: 'Chicken Breast (grilled)', calories: 165, protein: 31, carbs: 0, fat: 3.6, serving_size: 100, serving_unit: 'g', is_system: 1 },
    { id: 3, name: 'Egg (whole, boiled)', calories: 155, protein: 13, carbs: 1.1, fat: 11, serving_size: 100, serving_unit: 'g', is_system: 1 },
    { id: 4, name: 'Banana', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, serving_size: 100, serving_unit: 'g', is_system: 1 },
    { id: 5, name: 'Apple', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, serving_size: 100, serving_unit: 'g', is_system: 1 },
    { id: 6, name: 'Milk (whole)', calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, serving_size: 100, serving_unit: 'ml', is_system: 1 },
    { id: 7, name: 'Bread (white)', calories: 265, protein: 9, carbs: 49, fat: 3.2, serving_size: 100, serving_unit: 'g', is_system: 1 },
    { id: 8, name: 'Pasta (cooked)', calories: 131, protein: 5, carbs: 25, fat: 1.1, serving_size: 100, serving_unit: 'g', is_system: 1 },
    { id: 9, name: 'Beef (lean, cooked)', calories: 250, protein: 26, carbs: 0, fat: 15, serving_size: 100, serving_unit: 'g', is_system: 1 },
    { id: 10, name: 'Salmon (baked)', calories: 208, protein: 20, carbs: 0, fat: 13, serving_size: 100, serving_unit: 'g', is_system: 1 },
    { id: 11, name: 'Broccoli', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, serving_size: 100, serving_unit: 'g', is_system: 1 },
    { id: 12, name: 'Sweet Potato (baked)', calories: 90, protein: 2, carbs: 21, fat: 0.1, serving_size: 100, serving_unit: 'g', is_system: 1 },
    { id: 13, name: 'Almonds', calories: 579, protein: 21, carbs: 22, fat: 50, serving_size: 30, serving_unit: 'g', is_system: 1 },
    { id: 14, name: 'Greek Yogurt', calories: 59, protein: 10, carbs: 3.6, fat: 0.7, serving_size: 100, serving_unit: 'g', is_system: 1 },
    { id: 15, name: 'Oatmeal (cooked)', calories: 68, protein: 2.4, carbs: 12, fat: 1.4, serving_size: 100, serving_unit: 'g', is_system: 1 },
    { id: 16, name: 'Chicken Thigh (grilled)', calories: 209, protein: 26, carbs: 0, fat: 10.9, serving_size: 100, serving_unit: 'g', is_system: 1 },
    { id: 17, name: 'Rice Bowl (typical)', calories: 450, protein: 15, carbs: 65, fat: 12, serving_size: 1, serving_unit: 'serving', is_system: 1 },
    { id: 18, name: 'Pizza (slice)', calories: 285, protein: 12, carbs: 36, fat: 10, serving_size: 1, serving_unit: 'slice', is_system: 1 },
    { id: 19, name: 'Burger (beef)', calories: 540, protein: 25, carbs: 40, fat: 30, serving_size: 1, serving_unit: 'piece', is_system: 1 },
    { id: 20, name: 'Protein Shake (whey)', calories: 120, protein: 24, carbs: 3, fat: 1, serving_size: 1, serving_unit: 'scoop', is_system: 1 }
  ];
  saveDB();
}

app.use(cors());
app.use(express.json());

const auth = (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return null;
  try { return jwt.verify(token, JWT_SECRET); } catch { return null; }
};

// AUTH
app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  if (db.users.find(u => u.email === email)) return res.status(400).json({ error: 'Email taken' });
  const id = Date.now();
  const hash = Buffer.from(password).toString('base64'); // Simple hash for demo
  const user = { id, email, password: hash, name, avatar: 'user' };
  db.users.push(user);
  
  // Default categories
  const cats = [
    { name: 'Food & Dining', icon: 'utensils', color: '#F59E0B' },
    { name: 'Transport', icon: 'car', color: '#3B82F6' },
    { name: 'Housing', icon: 'home', color: '#8B5CF6' },
    { name: 'Health', icon: 'heart', color: '#EF4444' },
    { name: 'Entertainment', icon: 'film', color: '#EC4899' },
    { name: 'Education', icon: 'book', color: '#06B6D4' },
    { name: 'Shopping', icon: 'shopping-bag', color: '#10B981' },
    { name: 'Other', icon: 'more-horizontal', color: '#9CA3AF' }
  ];
  cats.forEach(c => db.categories.push({ id: Date.now() + Math.random(), user_id: id, ...c, is_default: 1 }));
  db.goals.push({ user_id: id, monthly_budget: 2000, daily_calories: 2000, daily_protein: 150, daily_carbs: 250, daily_fat: 65 });
  
  saveDB();
  res.json({ token: jwt.sign({ id, email }, JWT_SECRET), user: { id, email, name, avatar: 'user' } });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const hash = Buffer.from(password).toString('base64');
  const user = db.users.find(u => u.email === email && u.password === hash);
  if (!user) return res.status(401).json({ error: 'Invalid' });
  res.json({ token: jwt.sign({ id: user.id, email }, JWT_SECRET), user: { id: user.id, email, name: user.name, avatar: user.avatar } });
});

app.get('/api/auth/me', (req, res) => {
  const user = auth(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const u = db.users.find(u => u.id === user.id);
  if (!u) return res.status(401).json({ error: 'Not found' });
  res.json({ user: { id: u.id, email: u.email, name: u.name, avatar: u.avatar } });
});

// EXPENSES
app.get('/api/expenses', (req, res) => {
  const user = auth(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const { month, year } = req.query;
  const expenses = db.expenses.filter(e => e.user_id === user.id && e.date?.startsWith(year + '-' + month.padStart(2, '0')));
  res.json({ expenses });
});

app.post('/api/expenses', (req, res) => {
  const user = auth(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const { amount, category_id, description, date } = req.body;
  const expense = { id: Date.now(), user_id: user.id, amount, category_id, description, date };
  db.expenses.push(expense);
  saveDB();
  res.json({ expense });
});

app.delete('/api/expenses/:id', (req, res) => {
  const user = auth(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  db.expenses = db.expenses.filter(e => !(e.id == req.params.id && e.user_id === user.id));
  saveDB();
  res.json({ message: 'Deleted' });
});

app.get('/api/expenses/summary', (req, res) => {
  const user = auth(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const { month, year } = req.query;
  const myExpenses = db.expenses.filter(e => e.user_id === user.id && e.date?.startsWith(year + '-' + month.padStart(2, '0')));
  const total = myExpenses.reduce((sum, e) => sum + e.amount, 0);
  const goals = db.goals.find(g => g.user_id === user.id);
  res.json({ total, budget: goals?.monthly_budget || 2000, byCategory: [], dailySpending: [] });
});

// CATEGORIES
app.get('/api/categories', (req, res) => {
  const user = auth(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const cats = db.categories.filter(c => c.user_id === user.id || c.user_id === null);
  res.json({ categories: cats });
});

// DIET FOODS
app.get('/api/diet/foods', (req, res) => {
  const user = auth(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  res.json({ foods: db.foods.filter(f => f.is_system === 1) });
});

// DIET LOGS
app.get('/api/diet/logs', (req, res) => {
  const user = auth(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const { date } = req.query;
  const myLogs = db.diet_logs.filter(l => l.user_id === user.id && l.date === date);
  const logsWithFoods = myLogs.map(log => {
    const food = db.foods.find(f => f.id === log.food_id);
    return { ...log, food_name: food?.name, food_calories: food?.calories, food_protein: food?.protein, food_carbs: food?.carbs, food_fat: food?.fat, serving_size: food?.serving_size, serving_unit: food?.serving_unit };
  });
  const totals = logsWithFoods.reduce((a, l) => ({
    calories: a.calories + (l.food_calories || 0) * l.portion,
    protein: a.protein + (l.food_protein || 0) * l.portion,
    carbs: a.carbs + (l.food_carbs || 0) * l.portion,
    fat: a.fat + (l.food_fat || 0) * l.portion
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
  res.json({ logs: logsWithFoods, totals });
});

app.post('/api/diet/logs', (req, res) => {
  const user = auth(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const { food_id, portion, meal_type, date } = req.body;
  const log = { id: Date.now(), user_id: user.id, food_id, portion, meal_type, date };
  db.diet_logs.push(log);
  saveDB();
  res.json({ log });
});

app.delete('/api/diet/logs/:id', (req, res) => {
  const user = auth(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  db.diet_logs = db.diet_logs.filter(l => !(l.id == req.params.id && l.user_id === user.id));
  saveDB();
  res.json({ message: 'Deleted' });
});

app.get('/api/diet/goals', (req, res) => {
  const user = auth(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  let goals = db.goals.find(g => g.user_id === user.id);
  if (!goals) { goals = { user_id: user.id, monthly_budget: 2000, daily_calories: 2000, daily_protein: 150, daily_carbs: 250, daily_fat: 65 }; db.goals.push(goals); saveDB(); }
  res.json({ goals });
});

app.get('/api/diet/weekly', (req, res) => {
  const user = auth(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const today = new Date();
  const weekAgo = new Date(today); weekAgo.setDate(weekAgo.getDate() - 6);
  const myLogs = db.diet_logs.filter(l => l.user_id === user.id && l.date >= weekAgo.toISOString().split('T')[0] && l.date <= today.toISOString().split('T')[0]);
  const byDate = {};
  myLogs.forEach(log => {
    const food = db.foods.find(f => f.id === log.food_id);
    byDate[log.date] = (byDate[log.date] || 0) + (food?.calories || 0) * log.portion;
  });
  res.json({ dailyData: Object.entries(byDate).map(([date, calories]) => ({ date, calories })) });
});

app.get('/api/settings', (req, res) => {
  const user = auth(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const u = db.users.find(u => u.id === user.id);
  const goals = db.goals.find(g => g.user_id === user.id) || { monthly_budget: 2000, daily_calories: 2000, daily_protein: 150, daily_carbs: 250, daily_fat: 65 };
  res.json({ user: { id: u.id, email: u.email, name: u.name, avatar: u.avatar }, goals, stats: {} });
});

app.put('/api/settings/expense-goals', (req, res) => {
  const user = auth(req, res);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });
  const { monthly_budget } = req.body;
  let goals = db.goals.find(g => g.user_id === user.id);
  if (goals) goals.monthly_budget = monthly_budget;
  else db.goals.push({ user_id: user.id, monthly_budget, daily_calories: 2000, daily_protein: 150, daily_carbs: 250, daily_fat: 65 });
  saveDB();
  res.json({ message: 'Updated' });
});

// Serve frontend
app.use(express.static(path.join(__dirname, 'client/dist')));
app.get('*', (req, res) => res.sendFile(path.join(__dirname, 'client/dist/index.html')));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
