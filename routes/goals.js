const express = require('express');
const Joi = require('joi');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const router = express.Router();
const goalsFile = path.join(__dirname, '..', process.env.GOALS_FILE);

const goalSchema = Joi.object({
  userId: Joi.string().required(),
  description: Joi.string().required()
});

async function readGoals() {
  try {
    const data = await fs.readFile(goalsFile, 'utf8');
    if (!data.trim()) return [];
    return JSON.parse(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.writeFile(goalsFile, JSON.stringify([], null, 2));
      return [];
    }
    throw error;
  }
}

async function saveGoals(goals) {
  try {
    await fs.writeFile(goalsFile, JSON.stringify(goals, null, 2));
  } catch (error) {
    throw new Error('Erreur lors de l’écriture du fichier goals.json');
  }
}

router.post('/add', async (req, res) => {
  try {
    const { error } = goalSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const { userId, description } = req.body;
    const goals = await readGoals();
    const newGoal = {
      id: Date.now().toString(),
      userId,
      description,
      days: { lun: false, mar: false, mer: false, jeu: false, ven: false, sam: false, dim: false }
    };
    goals.push(newGoal);
    await saveGoals(goals);
    res.status(201).json({ message: 'Objectif ajouté', goal: newGoal });
  } catch (error) {
    console.error('Erreur lors de l’ajout d’objectif :', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const goals = await readGoals();
    const userGoals = goals.filter(g => g.userId === req.params.userId);
    res.json(userGoals);
  } catch (error) {
    console.error('Erreur lors de la récupération des objectifs :', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

router.patch('/update', async (req, res) => {
  try {
    const { goalId, day, checked } = req.body;
    const goals = await readGoals();
    const goal = goals.find(g => g.id === goalId);
    if (!goal) return res.status(404).json({ error: 'Objectif non trouvé' });
    goal.days[day] = checked;
    await saveGoals(goals);
    res.json({ message: 'Objectif mis à jour' });
  } catch (error) {
    console.error('Erreur lors de la mise à jour :', error);
    res.status(500).json({ error: error.message || 'Erreur serveur' });
  }
});

module.exports = router;