import express from 'express';
import { getTerms, getPrivacy, getDpa, getSla, getAup } from '../controllers/legalController';

const router = express.Router();

router.get('/terms', getTerms);
router.get('/privacy', getPrivacy);
router.get('/dpa', getDpa);
router.get('/sla', getSla);
router.get('/aup', getAup);

export default router;
