const Notification = require("../../models/notification")

const getChequeNotifications = async (req, res, next) =>{
    try{
        const allNotifications = await Notification.find().sort({date: -1});

        res.status(200).json({
            success: true,
            allNotifications
        });
    } catch (error) {
        next(error);
    }
}

const markAsDeposit = async (req, res, next) =>{
    try{
        const notification_id = req.params.notification_id
        await Notification.findByIdAndUpdate(
            notification_id,
            {is_deposited: 1},
            {new: true}
        ).sort({date: -1});

        res.status(200).json({
            success: true,
            message: "Cheque marked as deposited"
        });
    } catch (error) {
        next(error);
    }
}

module.exports = {
    getChequeNotifications,
    markAsDeposit
}