import prisma from "../config/db.js";
import { FakePaymentProvider } from "./fake-payment-provider.js";
import type { PaymentProvider } from "./payment-provider.js";

export const paymentProvider: PaymentProvider = new FakePaymentProvider(prisma);
