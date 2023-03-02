const ImageKit = require('imagekit');
const {IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, IMAGEKIT_URL_ENDPOINT} = require('../../../constant')

const imagekitAuth = (req, res, next)=>{
    const imagekit = new ImageKit({
        urlEndpoint: IMAGEKIT_URL_ENDPOINT,
        publicKey: IMAGEKIT_PUBLIC_KEY,
        privateKey: IMAGEKIT_PRIVATE_KEY
    });

    var result = imagekit.getAuthenticationParameters();
    res.status(200).json({
      success: true,
      result,
    });
}

module.exports = { imagekitAuth }