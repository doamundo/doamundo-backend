import { Request, Response } from 'express';
import { UserDB } from '../models/userModel';
import { Asaas, asaasApi } from '../config/asaasApi';
var SibApiV3Sdk = require('sib-api-v3-sdk');
import multer from 'multer';

const userDb = new UserDB();
const asaas = new Asaas();

export const createUser = async (req: Request, res: Response) => {
    try {
        const response = await userDb.addUser(req.body);
        res.status(201).json(response);
    } catch (error) {
        res.status(500).json({ error: (error as any).message });
    }
};

export const getUser = async (req: Request, res: Response) => {
    try {
        const user = await userDb.getUser(req.params.id);
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: (error as any).message });
    }
};

export const updateUser = async (req: Request, res: Response) => {
    try {
        const response = await userDb.updateUser(req.body);
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: (error as any).message });
    }
};

export const deleteUser = async (req: Request, res: Response) => {
    try {
        const deleteAsaasResponse = await asaas.deleteClient(req.params.customerId);
        const response = await userDb.deleteUser(req.params.id, req.params.rev);
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: (error as any).message });
    }
};

export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const users = await userDb.getAllUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: (error as any).message });
    }
};

export const createUserAsaas = async (req: Request, res: Response) => {
    let errorMessage = {};
    try {
        const userId = req.params.id;
        const user = await userDb.getUser(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        let response, cardResponse;
        try {
            response = await asaas.registerClient({
                name: user.name,
                email: user.email,
                cpfCnpj: user.document,
                phone: user.phone ?? '',
                postalCode: user.address_data?.zipcode ?? '',
                address: user.address_data?.neighborhood ?? '',
                addressNumber: user.address_data?.number ?? '',
                province: user.address_data?.street ?? '',
                state: user.address_data?.state ?? '',
                city: user.address_data?.city ?? '',
            });
        } catch (err: any) {
            errorMessage = { error: 'Erro ao registrar cliente', details: err?.response?.data || err?.message || err };
            return res.status(400).json({ error: 'Erro ao registrar cliente', details: err?.response?.data || err?.message || err });
        }

        try {
            cardResponse = await asaas.tokenizeCard({
                cardNumber: user.payment_data?.card_number ?? '',
                validity: user.payment_data?.expiration_date ?? '',
                cvv: user.payment_data?.cvv ?? '',
                name: user.payment_data?.card_holder_name ?? '',
                email: user.email,
                birthday: user.payment_data?.gateway_user_data?.birthday ?? '',
                cellphone: user.phone ?? '',
                cpf: user.document,
                cep: user.address_data?.zipcode ?? '',
                address: user.address_data?.neighborhood ?? '',
                addressNumber: user.address_data?.number ?? '',
                province: user.address_data?.street ?? '',
                state: user.address_data?.state ?? '',
                city: user.address_data?.city ?? '',
                clientToken: response.data.id ?? '',
                ip: '',
            });
        } catch (err: any) {
            errorMessage = { error: 'Erro ao tokenizar cartão', details: err?.response?.data || err?.message || err }
            return res.status(400).json({ error: 'Erro ao tokenizar cartão', details: err?.response?.data || err?.message || err });
        }

        // se for conta de parceiro, cria subconta na asaas
        let subaccountResponse;
        try {
            subaccountResponse = user.role === 'partner' ? await asaas.registerSubaccount({
                "name": user.name,
                "email": user.email,
                "loginEmail": user.email,
                "cpfCnpj": user.document,
                "birthDate": user.birthDate ?? '',
                "companyType": user.documentType === 'CNPJ' ? user.companyType ?? 'INDIVIDUAL' : undefined,
                "phone": user.phone ?? '',
                "mobilePhone": user.phone ?? '',
                "incomeValue": 1000,
                "address": user.address_data?.neighborhood ?? '',
                "addressNumber": user.address_data?.number ?? '',
                "province": user.address_data?.street ?? '',
                "postalCode": user.address_data?.zipcode ?? ''
            }) : null;
        } catch (err: any) {
            try {
                const recoveredSubaccount = await asaas.recoverSubaccount(user.email);
                subaccountResponse = recoveredSubaccount.data.data[0];
            } catch (err: any) {
                errorMessage = { error: 'Erro ao criar ou recuperar conta bancária Asaas', details: err?.response?.data || err?.message || err }
                return res.status(400).json({ error: 'Erro ao criar ou recuperar conta bancária Asaas', details: err?.response?.data || err?.message || err });
            }
        }


        await userDb.updateUser({
            ...user,
            payment_data: {
                ...user.payment_data, cvv: '',
                gateway_user_data: response.data,
                gateway_card_data: cardResponse.data,
                gateway_subaccount_data: subaccountResponse ? subaccountResponse.data : null
            }
        });

        res.status(200).json('Criado com sucesso.');
    } catch (error) {
        console.log("erro", error);
        res.status(400).json({ ...errorMessage, serverError: error });
    }
};

export const deleteAllNonAdminUsers = async (req: Request, res: Response) => {
    try {
        await userDb.deleteAllNonAdminUsers();
        res.status(200).send({ message: 'All non-admin users deleted successfully' });
    } catch (error) {
        res.status(500).send({ error });
    }
};

// Configure a autenticação da API do Brevo
const defaultClient = SibApiV3Sdk.ApiClient.instance;
defaultClient.authentications['api-key'].apiKey = '';

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

export const sendEmail = async (req: Request, res: Response) => {
    const { toEmail, toName, subject, htmlContent } = req.body;

    if (!toEmail || !subject || !htmlContent) {
        return res.status(400).json({ error: 'Campos obrigatórios ausentes' });
    }

    const sendSmtpEmail = {
        sender: {
            name: 'Nome do contato',
            email: 'contato@provedor.com',
        },
        to: [
            {
                email: toEmail,
                name: toName || '',
            },
        ],
        subject,
        htmlContent,
    };

    try {
        const response = await apiInstance.sendTransacEmail(sendSmtpEmail);
        return res.status(200).json({ message: 'Email enviado com sucesso', response });
    } catch (error: any) {
        console.error('Erro ao enviar e-mail:', error.response?.body || error.message);
        return res.status(500).json({ error: 'Erro ao enviar e-mail' });
    }
};

// Configuração do multer para salvar arquivos na pasta 'uploads'
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
export const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 } // 20 MB
});

// Endpoint de upload de arquivo
export const uploadFile = (req: Request, res: Response) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
    }
    res.status(200).json({ message: 'Arquivo enviado com sucesso.', file: req.file });
};