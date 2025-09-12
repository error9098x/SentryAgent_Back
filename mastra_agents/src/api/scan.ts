import express from 'express';
import { mastra } from '../mastra';
const router = express.Router();

const scans = new Map<string, { status: string; progress: number; result?: any; error?: string }>();

router.post('/start', async (req, res) => {
  const { repoUrl, token, model } = req.body;
  const scanId = String(Date.now());
  scans.set(scanId, { status: 'in_progress', progress: 5 });

  try {
    if (model) process.env.AI_MODEL_ID = model;
    const workflow = mastra.getWorkflow('web3AuditWorkflow');
    if (!workflow) throw new Error('web3-audit-workflow not registered');
    const result = await workflow.execute({ inputData: { scanId, repoUrl, token, includeSecurityAnalysis: true } } as any);
    scans.set(scanId, { status: 'completed', progress: 100, result });
    res.json({ scanId, status: 'started' });
  } catch (e: any) {
    scans.set(scanId, { status: 'failed', progress: 0, error: e?.message || 'failed' });
    res.status(500).json({ error: e?.message || 'failed' });
  }
});

router.get('/status/:scanId', (req, res) => {
  const s = scans.get(req.params.scanId) || { status: 'unknown', progress: 0 };
  res.json(s);
});

router.get('/report/:scanId', (req, res) => {
  const s = scans.get(req.params.scanId);
  if (!s) return res.status(404).json({ error: 'not found' });
  if (s.status !== 'completed') return res.status(400).json({ error: 'not completed' });
  res.json(s.result);
});

export default router;