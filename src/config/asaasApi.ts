import axios, { Axios, AxiosResponse } from "axios";
import { addDays, format } from "date-fns";

const asaasApi = axios.create({
    baseURL: process.env.ASAAS_API ?? 'https://sandbox.asaas.com/api/v3/',
});
asaasApi.defaults.headers.common['access_token'] = process.env.ASAAS_API_KEY ?? '';
asaasApi.defaults.headers.common['Content-Type'] = 'application/json';
asaasApi.defaults.headers.common['accept'] = 'application/json';

export interface AsaasClient {
    name: string;
    phone: string;
    cpfCnpj: string;
    email: string;
    postalCode: string;
    address: string;
    addressNumber: string;
    province: string;
    state: string;
    city: string;
}

export interface AsaasPaymentCard {
    cardNumber: string;
    validity: string;
    cvv: string;
    name: string;
    email: string;
    birthday: string;
    cellphone: string;
    cpf: string;
    cep: string;
    address: string;
    addressNumber: string;
    province: string;
    state: string;
    city: string;
    clientToken: string;
    ip: string;
}

export interface AsaasCreditCardPurchase {
    email: string;
    cardToken: string;
    clientToken: string;
    value: number;
    description: string;
    dueDate?: string;
    installmentCount?: number;
    period?: string;
    ip: string;
    split?:
    {
        "walletId": string;
        "fixedValue"?: number;
        "percentualValue"?: number;
        "externalReference": string;
        "description": string;
    }
}

export interface AsaasPixPurchase {
    email: string;
    clientToken: string;
    value: number;
    description: string;
    ip: string;
    cpf: string;
}

export interface AsaasSubaccount {
    "name": string;
    "email": string;
    "loginEmail": string;
    "cpfCnpj": string;
    "birthDate": string;
    "companyType"?: string;
    "phone": string;
    "mobilePhone": string;
    "incomeValue": number;
    "address": string;
    "addressNumber": string;
    "province": string;
    "postalCode": string;
}

class Asaas {
    async registerClient(paymentData: AsaasClient): Promise<AxiosResponse<any>> {
        return asaasApi.post('customers', {
            "name": paymentData.name,
            "email": paymentData.email,
            "phone": paymentData.phone,
            "mobilePhone": paymentData.phone,
            "cpfCnpj": paymentData.cpfCnpj,
            "postalCode": paymentData.postalCode,
            "address": paymentData.address,
            "addressNumber": paymentData.addressNumber,
            "complement": " ",
            "province": paymentData.province,
            "externalReference": paymentData.email,
            "notificationDisabled": false,
            "observations": "app"
        });
    }

    async deleteClient(customerId: String): Promise<any> {
        return asaasApi.delete('customers/' + customerId);
    }

    async tokenizeCard(paymentData: AsaasPaymentCard): Promise<any> {
        return asaasApi.post('creditCard/tokenize', {
            "creditCard": {
                "holderName": paymentData.name,
                "number": paymentData.cardNumber,
                "expiryMonth": paymentData.validity.split('/')[0],
                "expiryYear": `20${paymentData.validity.split('/')[1]}`,
                "ccv": paymentData.cvv
            },
            "creditCardHolderInfo": {
                "name": paymentData.name,
                "email": paymentData.email,
                "cpfCnpj": paymentData.cpf,
                "postalCode": paymentData.cep,
                "addressNumber": paymentData.addressNumber,
                "addressComplement": " ",
                "phone": paymentData.cellphone,
                "mobilePhone": paymentData.cellphone
            },
            "customer": paymentData.clientToken,
            "remoteIp": paymentData.ip
        });
    }

    async purchaseCreditCard(purchaseData: AsaasCreditCardPurchase): Promise<any> {
        if (purchaseData?.installmentCount ?? 1 > 1) {
            return asaasApi.post('payments', {
                "billingType": "CREDIT_CARD",
                "customer": purchaseData.clientToken,
                "dueDate": addDays(new Date(), 1).toISOString().split('T')[0],
                "installmentValue": purchaseData.value,
                "installmentCount": purchaseData.installmentCount,
                "description": purchaseData.description,
                "externalReference": purchaseData.email,
                "postalService": false,
                "creditCardToken": purchaseData.cardToken,
                "remoteIp": purchaseData.ip
            });
        } else {
            return asaasApi.post('payments', {
                "billingType": "CREDIT_CARD",
                "customer": purchaseData.clientToken,
                "dueDate": addDays(new Date(), 1).toISOString().split('T')[0],
                "value": purchaseData.value,
                "description": purchaseData.description,
                "externalReference": purchaseData.email,
                "postalService": false,
                "creditCardToken": purchaseData.cardToken,
                "remoteIp": purchaseData.ip
            });
        }

    }

    async purchasePix(purchaseData: AsaasPixPurchase): Promise<any> {
        return asaasApi.post('payments', {
            "billingType": "PIX",
            "customer": purchaseData.clientToken,
            "dueDate": addDays(new Date(), 1).toISOString().split('T')[0],
            "value": purchaseData.value,
            "description": purchaseData.description,
            "daysAfterDueDateToCancellationRegistration": 1,
            "externalReference": purchaseData.email,
            "postalService": false,
            "cpfCnpj": purchaseData.cpf,
        })
    }

    async generatePixQRCode(paymentId: string): Promise<any> {
        return asaasApi.get(`payments/${paymentId}/pixQrCode`);
    }

    async checkPaymentStatus(paymentId: string): Promise<any> {
        return asaasApi.get(`payments/${paymentId}/status`);
    }

    async makeSubscription(purchaseData: AsaasCreditCardPurchase): Promise<any> {
        if (purchaseData.split) {
            return asaasApi.post('subscriptions', {
                "billingType": "CREDIT_CARD",
                "cycle": purchaseData.period,
                "customer": purchaseData.clientToken,
                "value": purchaseData.value,
                "nextDueDate": purchaseData.dueDate,
                "description": purchaseData.description,
                "creditCardToken": purchaseData.cardToken,
                "split": [purchaseData.split ?? null],
                "remoteIp": '192.168.0.1',
            });
        } else {
            return asaasApi.post('subscriptions', {
                "billingType": "CREDIT_CARD",
                "cycle": purchaseData.period,
                "customer": purchaseData.clientToken,
                "value": purchaseData.value,
                "nextDueDate": purchaseData.dueDate,
                "description": purchaseData.description,
                "creditCardToken": purchaseData.cardToken,
                "remoteIp": '192.168.0.1',
            });
        }
    }

    async cancelSubscription(subscriptionId: string): Promise<any> {
        return asaasApi.delete(`subscriptions/${subscriptionId}`);
    }

    async registerSubaccount(subAccountData: AsaasSubaccount): Promise<any> {
        return asaasApi.post('accounts', subAccountData);
    }

    async recoverSubaccount(email: String): Promise<any> {
        return asaasApi.get(`accounts?email=${email}`);
    }
}



export { asaasApi, Asaas };