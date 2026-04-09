const express = require('express');
const router = express.Router();
const kestraApi = require('../services/kestraApi');

// GET /api/kestra/health - Validate Kestra connectivity and auth
router.get('/health', async (req, res, next) => {
  try {
    const data = await kestraApi.testConnection();
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/kestra/executions/:namespace/:flowId - Start a Kestra flow
router.post('/executions/:namespace/:flowId', async (req, res, next) => {
  try {
    const { namespace, flowId } = req.params;
    const { wait = false, inputs, labels } = req.body || {};

    const data = await kestraApi.executeFlow(namespace, flowId, {
      wait: wait === true || wait === 'true',
      inputs,
      labels
    });

    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

// GET /api/kestra/executions/:executionId - Fetch execution details
router.get('/executions/:executionId', async (req, res, next) => {
  try {
    const data = await kestraApi.getExecution(req.params.executionId);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

// POST /api/kestra/flows - Create or update a flow from YAML source
router.post('/flows', async (req, res, next) => {
  try {
    const { source } = req.body || {};

    if (!source || typeof source !== 'string') {
      return res.status(400).json({ error: true, message: 'source is required' });
    }

    const data = await kestraApi.upsertFlow(source);
    res.status(201).json(data);
  } catch (err) {
    next(err);
  }
});

module.exports = router;
