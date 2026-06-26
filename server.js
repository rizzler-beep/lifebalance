const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'lifebalance-secret-2024';

// Data file location
const DATA_FILE = path.join(__dirname, 'data.json');

// Initialize empty database
let db = {
  users: [],
  categories: [],
  expenses: [],
  foods: [],
  diet_logs: [],
  goals: []
};

// Load database from file
function loadDB() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8');
      if (content && content.trim()) {
        const parsed = JSON.parse(content);
        if (parsed && typeof parsed === 'object') {
          db = parsed;
        }
      }
    }
  } catch (e) {
    console.log('Error loading DB, starting fresh:', e.message);
    db = { users: [], categories: [], expenses: [], foods: [], diet_logs: [], goals: [] };
  }
}

// Save database to file
function saveDB() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
  } catch (e) {
    console.log('Error saving DB:', e.message);
  }
}

// Seed foods if empty
function seedFoods() {
  if (!db.foods || db.foods.length === 0) {
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
    return true;
  }
  return false;
}

// Initialize
loadDB();
if (seedFoods()) {
  saveDB();
}

app.use(cors());
app.use(express.json());

// Auth middleware
const auth = (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (e) {
    return null;
  }
};

// AUTH endpoints
app.post('/api/auth/register', (req, res) => {
  try {
    const { email, password, name } = req.body;
    
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields required' });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }
    
    const existingUser = db.users.find(u => u.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }
    
    const userId = Date.now();
    
    // Create user with simple hash
    const user = {
      id: userId,
      email: email,
      password: Buffer.from(password).toString('base64'),
      name: name,
      avatar: 'user'
    };
    db.users.push(user);
    
    // Create default categories
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
    
    cats.forEach(c => {
      db.categories.push({
        id: Date.now() + Math.random(),
        user_id: userId,
        ...c,
        is_default: 1
      });
    });
    
    // Create default goals
    db.goals.push({
      user_id: userId,
      monthly_budget: 2000,
      daily_calories: 2000,
      daily_protein: 150,
      daily_carbs: 250,
      daily_fat: 65
    });
    
    saveDB();
    
    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      message: 'Account created successfully',
      token: token,
      user: { id: userId, email: email, name: name, avatar: 'user' }
    });
  } catch (e) {
    console.log('Register error:', e.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    
    const hash = Buffer.from(password).toString('base64');
    const user = db.users.find(u => u.email === email && u.password === hash);
    
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      message: 'Login successful',
      token: token,
      user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar }
    });
  } catch (e) {
    console.log('Login error:', e.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/auth/me', (req, res) => {
  try {
    const user = auth(req, res);
    if (!user) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    const u = db.users.find(u => u.id === user.id);
    if (!u) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ user: { id: u.id, email: u.email, name: u.name, avatar: u.avatar } });
  } catch (e) {
    console.log('Me error:', e.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// EXPENSES
app.get('/api/expenses', (req, res) => {
  try {
    const user = auth(req, res);
    if (!user) return res.status(401).json({ error: 'Access token required' });
    
    const { month, year } = req.query;
    let expenses = db.expenses.filter(e => e.user_id === user.id);
    
    if (month && year) {
      const prefix = year + '-' + month.padStart(2, '0');
      expenses = expenses.filter(e => e.date && e.date.startsWith(prefix));
    }
    
    // Add category info
    expenses = expenses.map(e => {
      const cat = db.categories.find(c => c.id === e.category_id);
      return {
        ...e,
        category_name: cat?.name || 'Other',
        category_icon: cat?.icon || 'more-horizontal',
        category_color: cat?.color || '#9CA3AF'
      };
    });
    
    res.json({ expenses: expenses.reverse() });
  } catch (e) {
    console.log('Expenses error:', e.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/expenses', (req, res) => {
  try {
    const user = auth(req, res);
    if (!user) return res.status(401).json({ error: 'Access token required' });
    
    const { amount, category_id, description, date } = req.body;
    
    if (!amount || !date) {
      return res.status(400).json({ error: 'Amount and date required' });
    }
    
    const expense = {
      id: Date.now(),
      user_id: user.id,
      amount: parseFloat(amount),
      category_id: parseInt(category_id) || 1,
      description: description || '',
      date: date
    };
    
    db.expenses.push(expense);
    saveDB();
    
    res.status(201).json({ message: 'Expense added', expense });
  } catch (e) {
    console.log('Add expense error:', e.message);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/expenses/:id', (req, res) => {
  try {
    const user = auth(req, res);
    if (!user) return res.status(401).json({ error: 'Access token required' });
    
    db.expenses = db.expenses.filter(e => !(e.id == req.params.id && e.user_id === user.id));
    saveDB();
    
    res.json({ message: 'Expense deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/expenses/summary', (req, res) => {
  try {
    const user = auth(req, res);
    if (!user) return res.status(401).json({ error: 'Access token required' });
    
    const { month, year } = req.query;
    let myExpenses = db.expenses.filter(e => e.user_id === user.id);
    
    if (month && year) {
      const prefix = year + '-' + month.padStart(2, '0');
      myExpenses = myExpenses.filter(e => e.date && e.date.startsWith(prefix));
    }
    
    const total = myExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const userGoals = db.goals.find(g => g.user_id === user.id);
    
    res.json({
      total: total,
      budget: userGoals?.monthly_budget || 2000,
      byCategory: [],
      dailySpending: []
    });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// CATEGORIES
app.get('/api/categories', (req, res) => {
  try {
    const user = auth(req, res);
    if (!user) return res.status(401).json({ error: 'Access token required' });
    
    const cats = db.categories.filter(c => c.user_id === user.id || c.user_id === null);
    res.json({ categories: cats });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DIET
app.get('/api/diet/foods', (req, res) => {
  try {
    const user = auth(req, res);
    if (!user) return res.status(401).json({ error: 'Access token required' });
    
    const foods = db.foods.filter(f => f.is_system === 1);
    res.json({ foods: foods });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/diet/logs', (req, res) => {
  try {
    const user = auth(req, res);
    if (!user) return res.status(401).json({ error: 'Access token required' });
    
    const { date } = req.query;
    let myLogs = db.diet_logs.filter(l => l.user_id === user.id);
    
    if (date) {
      myLogs = myLogs.filter(l => l.date === date);
    }
    
    const logsWithFoods = myLogs.map(log => {
      const food = db.foods.find(f => f.id === log.food_id);
      return {
        ...log,
        food_name: food?.name || 'Unknown',
        food_calories: food?.calories || 0,
        food_protein: food?.protein || 0,
        food_carbs: food?.carbs || 0,
        food_fat: food?.fat || 0,
        serving_size: food?.serving_size || 1,
        serving_unit: food?.serving_unit || 'serving'
      };
    });
    
    const totals = logsWithFoods.reduce((a, l) => ({
      calories: a.calories + (l.food_calories || 0) * (l.portion || 1),
      protein: a.protein + (l.food_protein || 0) * (l.portion || 1),
      carbs: a.carbs + (l.food_carbs || 0) * (l.portion || 1),
      fat: a.fat + (l.food_fat || 0) * (l.portion || 1)
    }), { calories: 0, protein: 0, carbs: 0, fat: 0 });
    
    res.json({ logs: logsWithFoods, totals });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/diet/logs', (req, res) => {
  try {
    const user = auth(req, res);
    if (!user) return res.status(401).json({ error: 'Access token required' });
    
    const { food_id, portion, meal_type, date } = req.body;
    
    if (!food_id || !portion || !meal_type || !date) {
      return res.status(400).json({ error: 'All fields required' });
    }
    
    const log = {
      id: Date.now(),
      user_id: user.id,
      food_id: parseInt(food_id),
      portion: parseFloat(portion),
      meal_type: meal_type,
      date: date
    };
    
    db.diet_logs.push(log);
    saveDB();
    
    res.status(201).json({ message: 'Food logged', log });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/diet/logs/:id', (req, res) => {
  try {
    const user = auth(req, res);
    if (!user) return res.status(401).json({ error: 'Access token required' });
    
    db.diet_logs = db.diet_logs.filter(l => !(l.id == req.params.id && l.user_id === user.id));
    saveDB();
    
    res.json({ message: 'Log deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/diet/goals', (req, res) => {
  try {
    const user = auth(req, res);
    if (!user) return res.status(401).json({ error: 'Access token required' });
    
    let goals = db.goals.find(g => g.user_id === user.id);
    
    if (!goals) {
      goals = {
        user_id: user.id,
        monthly_budget: 2000,
        daily_calories: 2000,
        daily_protein: 150,
        daily_carbs: 250,
        daily_fat: 65
      };
      db.goals.push(goals);
      saveDB();
    }
    
    res.json({ goals });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/diet/weekly', (req, res) => {
  try {
    const user = auth(req, res);
    if (!user) return res.status(401).json({ error: 'Access token required' });
    
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 6);
    
    const startDate = weekAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];
    
    const myLogs = db.diet_logs.filter(l =>
      l.user_id === user.id &&
      l.date >= startDate &&
      l.date <= endDate
    );
    
    const byDate = {};
    myLogs.forEach(log => {
      const food = db.foods.find(f => f.id === log.food_id);
      const cal = (food?.calories || 0) * (log.portion || 1);
      byDate[log.date] = (byDate[log.date] || 0) + cal;
    });
    
    res.json({
      dailyData: Object.entries(byDate).map(([date, calories]) => ({ date, calories }))
    });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// SETTINGS
app.get('/api/settings', (req, res) => {
  try {
    const user = auth(req, res);
    if (!user) return res.status(401).json({ error: 'Access token required' });
    
    const u = db.users.find(u => u.id === user.id);
    const goals = db.goals.find(g => g.user_id === user.id) || {
      monthly_budget: 2000,
      daily_calories: 2000,
      daily_protein: 150,
      daily_carbs: 250,
      daily_fat: 65
    };
    
    res.json({
      user: { id: u.id, email: u.email, name: u.name, avatar: u.avatar },
      goals: goals,
      stats: {}
    });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/settings/expense-goals', (req, res) => {
  try {
    const user = auth(req, res);
    if (!user) return res.status(401).json({ error: 'Access token required' });
    
    const { monthly_budget } = req.body;
    
    let goals = db.goals.find(g => g.user_id === user.id);
    if (goals) {
      goals.monthly_budget = parseFloat(monthly_budget) || 2000;
    } else {
      db.goals.push({
        user_id: user.id,
        monthly_budget: parseFloat(monthly_budget) || 2000,
        daily_calories: 2000,
        daily_protein: 150,
        daily_carbs: 250,
        daily_fat: 65
      });
    }
    
    saveDB();
    res.json({ message: 'Goals updated' });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve frontend
const distPath = path.join(__dirname, 'client/dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log('LifeBalance running on port ' + PORT);
});
