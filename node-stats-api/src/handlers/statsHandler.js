const { validateMatrix } = require('../stats/matrixValidator');
const { computeStats } = require('../stats/statsCalculator');

function statsHandler(req, res, next) {
  try {
    const { q, r } = req.body ?? {};
    validateMatrix(q, 'q');
    validateMatrix(r, 'r');

    const stats = computeStats(q, r);
    res.status(200).json(stats);
  } catch (err) {
    next(err);
  }
}

module.exports = statsHandler;
