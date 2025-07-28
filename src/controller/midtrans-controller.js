import midtransService from "../service/midtrans-service.js";

const webhookNotif = async (req, res, next) => {
  try {
    await midtransService.webhookPayment(req.body);
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
};

export default {
  webhookNotif,
};
