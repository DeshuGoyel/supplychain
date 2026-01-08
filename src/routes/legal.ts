import { Router } from 'express';
import {
  getTermsOfService,
  getPrivacyPolicy,
  getDataProcessingAgreement,
  getServiceLevelAgreement,
  getAcceptableUsePolicy,
} from '../controllers/legalController';

const router = Router();

router.get('/terms', getTermsOfService);
router.get('/privacy', getPrivacyPolicy);
router.get('/dpa', getDataProcessingAgreement);
router.get('/sla', getServiceLevelAgreement);
router.get('/aup', getAcceptableUsePolicy);

export default router;
