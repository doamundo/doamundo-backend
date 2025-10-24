import { Request, Response } from 'express';
import { PlanDB } from '../models/planModel';
import { UserDB } from '../models/userModel';
import { Asaas } from '../config/asaasApi';
import { addDays, format } from 'date-fns';

const planDB = new PlanDB();
const userDB = new UserDB();
const asaas = new Asaas();

export const addPlan = async (req: Request, res: Response) => {
    try {
        const response = await planDB.addPlan(req.body);
        res.status(201).json(response);
    } catch (error) {
        res.status(500).json({ error });
    }
};

export const getPlan = async (req: Request, res: Response) => {
    try {
        const plan = await planDB.getPlan(req.params.id);
        res.status(200).json(plan);
    } catch (error) {
        res.status(500).json({ error });
    }
};

export const updatePlan = async (req: Request, res: Response) => {
    try {
        const response = await planDB.updatePlan(req.body);
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error });
    }
};

export const deletePlan = async (req: Request, res: Response) => {
    try {
        const response = await planDB.deletePlan(req.params.id, req.params.rev);
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error });
    }
};

export const getAllPlans = async (req: Request, res: Response) => {
    try {
        const plans = await planDB.getAllPlans();
        res.status(200).json(plans);
    } catch (error) {
        res.status(500).json({ error });
    }
};

export const buyCredits = async (req: Request, res: Response) => {
    try {
        let user;
        try {
            user = await userDB.getUser(req.body.userId);
        } catch (err: any) {
            return res.status(400).json({ error: 'Erro ao consultar usuário', details: err?.response?.data || err?.message || err });
        }
        const buyAmount = req.body.amount;
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        let buyResponse;
        try {
            buyResponse = await asaas.purchaseCreditCard({
                email: user.email,
                cardToken: user.payment_data?.gateway_card_data.creditCardToken,
                clientToken: user.payment_data?.gateway_user_data.id,
                value: buyAmount,
                description: 'Compra de créditos',
                ip: '',
            });
        } catch (err: any) {
            return res.status(400).json({ error: 'Erro ao comprar créditos', details: err?.response?.data || err?.message || err });
        }

        try {
            await userDB.updateUser({ ...user, credits: user.credits + buyAmount });
        } catch (err: any) {
            return res.status(400).json({ error: 'Erro ao atualizar créditos do usuário', details: err?.response?.data || err?.message || err });
        }

        res.status(200).json(buyResponse.data);
    } catch (error) {
        console.log("erro buying credits", error);
        res.status(500).json({ error });
    }
};

export const subscribePlan = async (req: Request, res: Response) => {
    console.log('userId', req.params.userId);
    console.log('partnerId', req.params.partnerId);
    console.log('planId', req.params.id);
    try {
        const user = await userDB.getUser(req.params.userId);
        console.log('user', user);
        const plan = await planDB.getPlan(req.params.id);
        console.log('plan', plan);
        let partner = null;

        if (user.role === 'client') {
            if (plan.partnerId === 'admin-created-client-plan') {
                partner = await userDB.getUser(req.params.partnerId);
            } else {
                partner = await userDB.getUser(plan.partnerId || '');
            }
        }
        console.log('partner', partner);

        const dayToAdd = plan.promotionDays ? plan.promotionDays : 0;
        const dateAdded = addDays(new Date(), Number(dayToAdd));

        const todayPlusPromotionDays = format(dateAdded, 'yyyy-MM-dd');
        let subscription;
        if (partner) {
            subscription = await asaas.makeSubscription({
                email: user.email,
                cardToken: user.payment_data?.gateway_card_data.creditCardToken,
                clientToken: user.payment_data?.gateway_user_data.id,
                value: plan.price,
                period: "MONTHLY",
                description: plan.subtitle,
                dueDate: `${todayPlusPromotionDays}`,
                ip: '',
                split: partner ? {
                    "walletId": partner.payment_data?.gateway_subaccount_data?.walletId ?? '',
                    "percentualValue": 75,
                    "externalReference": 'Subscription',
                    "description": 'Taxa de administração',
                } : undefined,
            });
            const roundedCredits = Math.ceil(plan.price);
            await userDB.updateUser({ ...user, credits: roundedCredits, payment_data: { ...user.payment_data, planId: plan._id, gateway_plan_data: subscription.data } });
        } else {
            subscription = await asaas.makeSubscription({
                email: user.email,
                cardToken: user.payment_data?.gateway_card_data.creditCardToken,
                clientToken: user.payment_data?.gateway_user_data.id,
                value: plan.price,
                period: "MONTHLY",
                description: plan.subtitle,
                dueDate: `${todayPlusPromotionDays}`,
                ip: '',
            });

            await userDB.updateUser({ ...user, payment_data: { ...user.payment_data, planId: plan._id, gateway_plan_data: subscription.data } });
        }

        res.status(200).json(subscription?.data ?? {});
    } catch (error) {
        console.log("erro subscribe plan", error);
        res.status(500).json({ error });
    }
};

export const cancelPlan = async (req: Request, res: Response) => {
    try {
        const user = await userDB.getUser(req.params.userId);

        console.log(user);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.payment_data?.gateway_plan_data.id) {
            return res.status(404).json({ message: 'Subscription not found' });
        }

        const cancelation = await asaas.cancelSubscription(user.payment_data?.gateway_plan_data.id);

        await userDB.updateUser({ ...user, payment_data: { ...user.payment_data, gateway_plan_data: cancelation.data } });

        res.status(200).json(cancelation.data);
    } catch (error) {
        console.log("erro subscribe plan", error);
        res.status(500).json({ error });
    }
};