const { detectBurnout } = require('../utils/burnoutDetector');

// GET /api/burnout
const getBurnoutStatus = async (req, res) => {
  try {
    const result = await detectBurnout(req.user.id);
    res.json(result);
  } catch (error) {
    console.error('Burnout check error:', error);
    res.status(500).json({ message: 'Failed to analyze burnout status.' });
  }
};

module.exports = { getBurnoutStatus };
