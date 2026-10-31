import { useState, useEffect } from 'react'
import './App.css'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

function App() {
  const COLORS = [
  '#286044',
  '#82a889cd ',
  '#e6c989',
  '#d99575',
  '#8b9dc3',
  '#b7a5c8'
]
  const [budgetsByMonth, setBudgetsByMonth] = useState(() => {
  return JSON.parse(localStorage.getItem('pocketwise-budgets') || '{}')
})

  const [budgetInput, setBudgetInput] = useState('')
  const [expenses, setExpenses] = useState(() => {
  return JSON.parse(localStorage.getItem('pocketwise-expenses') || '[]')
})

const [filterCategory, setFilterCategory] = useState('All')
  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('Food')
  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10)
  )

useEffect(() => {
  localStorage.setItem(
    'pocketwise-budgets',
    JSON.stringify(budgetsByMonth)
  );

  localStorage.setItem(
    'pocketwise-expenses',
    JSON.stringify(expenses)
  );
}, [budgetsByMonth, expenses]);

  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0,7))
  useEffect(() => {
  async function loadBudget() {
    try {
      const response = await fetch(
        `https://pocketwise-1.onrender.com/api/budget/${selectedMonth}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error('Could not load budget');
      }

      setBudgetsByMonth(previous => ({
        ...previous,
        [selectedMonth]: data.budget
      }));
    } catch (error) {
      console.error('Budget loading error:', error);
    }
  }

  loadBudget();
}, [selectedMonth]);
  const budget = Number(budgetsByMonth[selectedMonth] || 0)
  const monthlyExpenses = expenses.filter(
  expense => expense.date.startsWith(selectedMonth)
)

const totalSpent = monthlyExpenses.reduce(
  (total, expense) => total + expense.amount,
  0
)
  const balance = budget - totalSpent
  const budgetWarning = budget > 0 && totalSpent >= budget * 0.8
  const overBudget = budget > 0 && totalSpent > budget
  const categoryData = Object.values(
    monthlyExpenses.reduce((groups, expense) => {
    if (!groups[expense.category]) {
      groups[expense.category] = {
        name: expense.category,
        value: 0
      }
    }

    groups[expense.category].value += expense.amount
    return groups
  }, {})
)
async function saveBudget(event) {
  event.preventDefault();

  const amountToSave = Number(budgetInput);

  if (budgetInput === '' || !Number.isFinite(amountToSave) || amountToSave < 0) {
    alert('Please enter a valid budget amount.');
    return;
  }

    setBudgetsByMonth(previous => ({
      ...previous,
      [selectedMonth]: amountToSave
    }));

    setBudgetInput('');

    try {
      const response = await fetch('https://pocketwise-1.onrender.com/api/budget', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          month: selectedMonth,
          amount: amountToSave
        })
      });

    if (!response.ok) {
      throw new Error('Backend could not save the budget.');
    }

    alert('Budget saved successfully!');
  } catch (error) {
    console.error('Budget error:', error);
    alert('Budget saved in your browser, but backend connection failed.');
  }
}
  
async function addExpense(event) {
  event.preventDefault();

  if (!name.trim() || amount === '' || Number(amount) <= 0 || !date) {
    return;
  }

  try {
    const response = await fetch('https://pocketwise-1.onrender.com/api/expenses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: name.trim(),
        amount: Number(amount),
        category,
        date
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Could not add expense.');
    }

    setExpenses(previous => [
      ...previous,
      {
        id: data.expense.id,
        name: data.expense.title,
        amount: data.expense.amount,
        category: data.expense.category,
        date: data.expense.date
      }
    ]);

    setName('');
    setAmount('');

    alert('Expense added successfully!');
  } catch (error) {
    console.error('Expense error:', error);
    alert('Could not add expense. Please check your backend connection.');
  }
}

  
async function deleteExpense(id) {
  try {
    const response = await fetch(`https://pocketwise-1.onrender.com/api/expenses/${id}`, {
      method: 'DELETE'
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Could not delete expense.');
    }

    setExpenses(previous => previous.filter(expense => expense.id !== id));

    alert('Expense deleted successfully!');
  } catch (error) {
    console.error('Delete error:', error);
    alert('Could not delete expense. Please try again.');
  }
}


  
function editExpense(id) {
  const expense = expenses.find(item => item.id === id);

  if (!expense) return;

  const newName = prompt('Enter expense name:', expense.name);
  if (newName === null || !newName.trim()) return;

  const newAmount = prompt('Enter expense amount:', expense.amount);
  if (newAmount === null || newAmount.trim() === '') return;

  const parsedAmount = Number(newAmount);

  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    alert('Please enter a valid amount.');
    return;
  }

  setExpenses(previous =>
    previous.map(item =>
      item.id === id
        ? { ...item, name: newName.trim(), amount: parsedAmount }
        : item
    )
  );
}

  function money(value) {
    return '₹' + value.toLocaleString('en-IN', {
      maximumFractionDigits: 2
    })
  }
const filteredExpenses =
  filterCategory === 'All'
    ? expenses
    : expenses.filter(
        expense => expense.category === filterCategory
      )
  return (
    
    <main className="app">
      <header className="header">
        <h1>PocketWise</h1>
        <p>Your money, your goals.</p>
      </header>

      <h2>Student Expense Tracker</h2>

      <section className="cards">
        <article className="card">
          <h3>Monthly Budget</h3>
          <p>{money(budget)}</p>
        </article>

        <article className="card">
          <h3>Total Spent</h3>
          <p>{money(totalSpent)}</p>
        </article>

        <article className="card">
          <h3>Remaining Balance</h3>
          <p>{money(balance)}</p>
        </article>
      </section>

      <section className="panel">
        <h2>Set Your Monthly Budget</h2>
        
        <form onSubmit={saveBudget}>
          <input
            type="number"
            min="0"
            step="0.01"
            placeholder="Enter your budget (₹)"
            value={budgetInput}
            onChange={event => setBudgetInput(event.target.value)}
            required
          />
          <button type="submit">Save Budget</button>
        </form>
      </section>

      <section className="panel">
        <h2>Add New Expense</h2>
        <form onSubmit={addExpense}>
          <input
            type="text"
            placeholder="Expense name"
            value={name}
            onChange={event => setName(event.target.value)}
            required
          />

          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder="Amount (₹)"
            value={amount}
            onChange={event => setAmount(event.target.value)}
            required
          />

          <select
            value={category}
            onChange={event => setCategory(event.target.value)}
          >
            <option>Food</option>
            <option>Transport</option>
            <option>Education</option>
            <option>Shopping</option>
            <option>Bills</option>
            <option>Other</option>
          </select>

          <label htmlFor="expense-date">Expense date</label>
          <input
            id="expense-date"
            type="date"
            value={date}
            onChange={event => setDate(event.target.value)}
            required
          />

          <button type="submit">Add Expense</button>
        </form>
      </section>

      <section className="panel">
        <div className="section-heading">

          <h2>Recent Expenses</h2>

          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          />
        </div>
        <select
  value={filterCategory}
  onChange={event => setFilterCategory(event.target.value)}
>
  <option>All</option>
  <option>Food</option>
  <option>Transport</option>
  <option>Education</option>
  <option>Shopping</option>
  <option>Bills</option>
  <option>Other</option>
</select>
<section className="panel">
  <h2>Spending by Category</h2>

  {categoryData.length === 0 ? (
    <p>Add expenses to see your spending chart.</p>
  ) : (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={categoryData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, value }) =>
              `${name}: ₹${value.toLocaleString('en-IN')}`
            }
          >
            {categoryData.map((entry, index) => (
              <Cell
                key={entry.name}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )}
</section>

        {monthlyExpenses.length === 0 ? (
          <p>No expenses yet. Add your first expense above!</p>
        ) : (
          <div className="expense-list">
            {monthlyExpenses.filter(
            expense =>
            filterCategory === 'All' ||
            expense.category === filterCategory
            ).slice().reverse().map(expense => (
              <article className="expense" key={expense.id}>
                <div>
                  <strong>{expense.name}</strong>
                  <p>{expense.category} · {expense.date}</p>
                </div>

                <strong>{money(expense.amount)}</strong>


                <button
                  type="button"
                  className="delete-button"
                  onClick={() => deleteExpense(expense.id)}
                >
                  Delete
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}

export default App