const config = {
  apiKey: "AIzaSyAStTmmewzO4u-q56OxQWPF6_KrmpWqJQQ",
  authDomain: "educationbudgetform.firebaseapp.com",
  databaseURL: "https://educationbudgetform.firebaseio.com",
  projectId: "educationbudgetform",
  storageBucket: "educationbudgetform.appspot.com",
  messagingSenderId: "455387477343"
};

firebase.initializeApp(config);

function getById(id) {
  return document.getElementById(id);
}

function getByClass(css) {
  return document.querySelector(css);
}

function createElement(tag) {
  return document.createElement(tag);
}

function showErrorMessage(text, parent) {
  let p = createElement('p');
  p.textContent = text;

  parent.classList.add('showItem');
  parent.textContent = '';
  parent.appendChild(p);

  setTimeout( () => {
    parent.classList.remove('showItem');
  }, 4000)
}

function deleteExpenseFunction(self, element, setValues) {
  let id = parseInt(element.dataset.id);
  let parent = element.parentElement.parentElement.parentElement;
    
  self.expenseList.removeChild(parent);

  if ( setValues ) setValues(id);

  let tempList = self.itemList.filter( (item) => {
    return item.id !== id;
  })
  self.itemList = tempList;
  self.showBalance();

  let tempItemList = self.itemOfObjectsList.filter( (item) => {
    return item.id !== id;
  })

  self.itemOfObjectsList = tempItemList;
  let db = firebase.database();
  let database = db.ref('All');
  database.set(self.itemOfObjectsList);
}

class UI {
  constructor() {
    this.budgetFeedback = getByClass(".budget-feedback");
    this.expenseFeedback = getByClass(".expense-feedback");
    this.budgetForm = getById("budget-form");
    this.budgetInput = getById("budget-input");
    this.budgetAmount = getById("budget-amount");
    this.expenseAmount = getById("expense-amount");
    this.balance = getById("balance");
    this.balanceAmount = getById("balance-amount");
    this.expenseForm = getById("expense-form");
    this.expenseInput = getById("expense-input");
    this.amountInput = getById("amount-input");
    this.expenseList = getById("expense-list");
    this.itemList = [];
    this.itemID = 0;
    this.itemOfObjectsList = [];
    this.totalBalance = 0;
  }

  // set Budget
  submitBudgetForm() {
    let value = this.budgetInput.value;
    if (value == '' || value < 0) {
      showErrorMessage('value cannot be empty or negative', this.budgetFeedback);
    } else {
      this.budgetAmount.textContent = value;
      this.budgetInput.value = '';
      this.showBalance();
      // firebase
      this.totalBalance = value;
      let db = firebase.database();
      let database = db.ref('budget');
      database.set(value);
    }
  }

  showBalance() {
    let expense = this.totalExpense();
    let total = parseInt(this.budgetAmount.textContent) - expense;
    this.balanceAmount.textContent = total;

    if (total < 0) {
      this.balance.classList.remove('showGreen', 'showBlack');
      this.balance.classList.add('showRed')
    } else if (total > 0) {
      this.balance.classList.remove('showRed', 'showBlack');
      this.balance.classList.add('showGreen')
    } else {
      this.balance.classList.remove('showRed', 'showGreen');
      this.balance.classList.add('showBlack')
    }
  }

  // Expense
  submitExpenseForm() {
    let expenseValue = this.expenseInput.value;
    let amountValue = this.amountInput.value;
    if (expenseValue == '' || amountValue == '' || amountValue < 0) {
      showErrorMessage('value cannot be empty or negative', this.expenseFeedback);
    } else {
      let amount = parseInt(amountValue);
      this.expenseInput.value = '';
      this.amountInput.value = '';

      let expense = {
        id: this.itemID,
        title: expenseValue,
        amount: amount
      }

      this.itemOfObjectsList.push(expense);
      let db = firebase.database();
      let database = db.ref('All');
      database.set(this.itemOfObjectsList);

      this.itemID++;
      this.itemList.push(expense);
      this.addExpense(expense);
      this.showBalance();
    }
  }

  // work with Firebase
  showAllExpense() {
    let count = 0;
    // get Expenses
    firebase.database().ref('All').once('value', (content) => {
      if (content.val()) {
        this.itemOfObjectsList = ( content.val() );
      }
      for (let expense of this.itemOfObjectsList) {
        this.itemID++;
        this.itemList.push(expense);
        this.addExpense(expense);
        this.showBalance();
      }
      
      if (count == 1) {
        getById('load').style.display = 'none';
      } else {
        count++;
      }
    })
    // get Budget
    firebase.database().ref('budget').once('value', (content) => {
      if (content.val()) {
        this.totalBalance = ( content.val() );
      }

      this.budgetAmount.textContent = this.totalBalance;
      this.showBalance();

      if (count == 1) {
        getById('load').style.display = 'none';
      } else {
        count++;
      }
    })
  }

  addExpense(expense) {
    let div = createElement('div');
    div.classList.add('expense');
    div.innerHTML = `
      <div class="expense-item d-flex justify-content-between align-items-baseline">
        
      <h6 class="expense-title mb-0 text-uppercase list-item">- ${expense.title}</h6>
        <h5 class="expense-amount mb-0 list-item">${expense.amount}</h5>
        <div class="expense-icons list-item">
          <a href="#" class="edit-icon mx-2" data-id="${expense.id}">
          <i class="fas fa-edit"></i>
          </a>
          <a href="#" class="delete-icon" data-id="${expense.id}">
          <i class="fas fa-trash"></i>
          </a>
        </div>
      </div>
    `;
    this.expenseList.appendChild(div);
  }

  totalExpense() {
    let total = 0;

    if (this.itemList.length > 0) {
      total = this.itemList.reduce(  (result, cur) => result + cur.amount, 0);
    }
    this.expenseAmount.textContent = total;

    return total;
  }

  editExpense(element) {
    deleteExpenseFunction(this, element, (id) => {
      let expense = this.itemList.filter( (item) => {
        return item.id == id;
      })
  
      this.expenseInput.value = expense[0].title;
      this.amountInput.value = expense[0].amount;
    }) 
  }
  deleteExpense(element) {
    deleteExpenseFunction(this, element );
  }
}

function createEventListenters() {
  let budgetForm = getById('budget-form');
  let expenseForm = getById('expense-form');
  let expenseList = getById('expense-list');

  let ui = new UI();

  ui.showAllExpense();

  budgetForm.addEventListener('submit', (event) => {
    event.preventDefault();
    ui.submitBudgetForm();
  })

  expenseForm.addEventListener('submit', (event) => {
    event.preventDefault();
    ui.submitExpenseForm();
  })

  expenseList.addEventListener('click', (event) => {
    if( event.target.parentElement.classList.contains('edit-icon') ) {
      ui.editExpense(event.target.parentElement);
    } else if (event.target.parentElement.classList.contains('delete-icon')) {
      ui.deleteExpense(event.target.parentElement);
    }
  })
}

document.addEventListener('DOMContentLoaded', () => {
  createEventListenters();
})