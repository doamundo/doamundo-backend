import { Router } from 'express';
import { addPlan, getPlan, updatePlan, deletePlan, getAllPlans, subscribePlan, cancelPlan, buyCredits } from '../controllers/planController';

const plan = Router();

plan.post('/', addPlan);
plan.get('/:id', getPlan);
plan.put('/', updatePlan);
plan.delete('/:id/:rev', deletePlan);
plan.get('/', getAllPlans);
plan.put('/purchase/:id/:userId/:partnerId', subscribePlan);
plan.put('/purchase/:id/:userId', subscribePlan);
plan.put('/cancel/:userId/', cancelPlan);
plan.post('/credits', buyCredits);

export default plan;
