# Productivite

Node.js/Express goal-tracking API with authentication and a JSON file store.

## Features

- User registration/login (`bcrypt` password hashing, input validated with `joi`)
- Create and list personal goals
- Rate-limited API, `helmet` + `cors` hardening

## Setup

```bash
npm install
npm start   # reads config from .env (PORT, USERS_FILE, GOALS_FILE)
```
