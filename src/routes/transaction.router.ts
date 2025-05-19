import express from 'express';
import multer from 'multer';
import TransactionController from '../controllers/transactions.controller';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });
const controller = new TransactionController()

router.post('/process-transactions', upload.single('file'), controller.processTransactions.bind(controller));

export default router;
