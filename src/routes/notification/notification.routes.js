const express = require('express');
const notificationRouter = express.Router();

const {getChequeNotifications, markAsDeposit} = require('./notification.controller')

notificationRouter.get('/cheque', getChequeNotifications)
notificationRouter.get('/cheque/mark-as-deposited/:notification_id', markAsDeposit)

module.exports = notificationRouter