const API_BASE_URL = window.location.hostname === 'localhost' ? 'http://localhost:3000/api' : '/api';
let userId = localStorage.getItem('userId');

document.addEventListener('DOMContentLoaded', () => {
  const registerForm = document.getElementById('register-form');
  const loginForm = document.getElementById('login-form');
  const goalForm = document.getElementById('goal-form');

  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const name = document.getElementById('name').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      if (!email.includes('@') || password.length < 8) {
        alert('Email ou mot de passe invalide');
        return;
      }

      try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password })
        });
        const data = await response.json();
        if (response.ok) {
          localStorage.setItem('userId', data.userId);
          window.location.href = 'dashboard.html';
        } else {
          alert(data.error);
        }
      } catch (error) {
        console.error('Erreur inscription :', error);
        alert('Erreur réseau ou serveur indisponible');
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;

      try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok) {
          localStorage.setItem('userId', data.userId);
          window.location.href = 'dashboard.html';
        } else {
          alert(data.error);
        }
      } catch (error) {
        console.error('Erreur connexion :', error);
        alert('Erreur réseau ou serveur indisponible');
      }
    });
  }

  if (goalForm) {
    if (!userId) {
      window.location.href = 'login.html';
      return;
    }

    goalForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const description = document.getElementById('goal-description').value;
      console.log('Ajout d’un objectif :', { userId, description });

      try {
        const response = await fetch(`${API_BASE_URL}/goals/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, description })
        });
        const data = await response.json();
        console.log('Réponse serveur :', data);

        if (response.ok) {
          document.getElementById('goal-description').value = '';
          renderGoals();
        } else {
          alert('Erreur lors de l’ajout : ' + (data.error || 'Erreur inconnue'));
        }
      } catch (error) {
        console.error('Erreur fetch :', error);
        alert('Erreur réseau ou serveur indisponible');
      }
    });

    renderGoals();
  }
});

async function renderGoals() {
  try {
    const response = await fetch(`${API_BASE_URL}/goals/${userId}`);
    const goals = await response.json();
    const tbody = document.querySelector('#goals-table tbody');
    tbody.innerHTML = '';

    let totalChecked = 0;
    const totalPossible = goals.length * 7;

    goals.forEach(goal => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${goal.description}</td>
        ${['lun', 'mar', 'mer', 'jeu', 'ven', 'sam', 'dim'].map(day => {
          totalChecked += goal.days[day] ? 1 : 0;
          return `
            <td><input type="checkbox" ${goal.days[day] ? 'checked' : ''} data-goal-id="${goal.id}" data-day="${day}"></td>
          `;
        }).join('')}
      `;
      tbody.appendChild(row);
    });

    document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', async (e) => {
        const goalId = e.target.dataset.goalId;
        const day = e.target.dataset.day;
        const checked = e.target.checked;
        await fetch(`${API_BASE_URL}/goals/update`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ goalId, day, checked })
        });
        renderGoals();
      });
    });

    const progress = (totalChecked / totalPossible) * 100 || 0;
    document.getElementById('progress').style.width = `${progress}%`;

    const badges = document.getElementById('badges');
    const message = document.getElementById('message');
    badges.innerHTML = '';
    message.innerHTML = '';

    if (totalChecked > 0) badges.innerHTML += '<span class="badge">Débutant</span>';
    if (totalChecked >= 7) badges.innerHTML += '<span class="badge">Productif</span>';
    if (progress === 100) {
      badges.innerHTML += '<span class="badge">Champion</span>';
      message.innerHTML = 'Félicitations ! Semaine parfaite ! 🎉';
    }
  } catch (error) {
    console.error('Erreur renderGoals :', error);
  }
}