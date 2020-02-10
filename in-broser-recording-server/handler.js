'use strict';

const aws = require('aws-sdk');
const utilities = require('./Modules/utilities.js')

aws.config.update({
	reigon: "ap-southeast-2",
	accessKeyId: process.env.ACCESS_KEY_ID,
	secretAccessKey: process.env.SECRET_ACCESS_KEY
});

module.exports.signedURL = async event => {
	let s3 = new aws.S3();

	let { fileName, fileType } = utilities.defaultFile
	let params = utilities.params(process.env.BUCKET, fileName, 5, fileType);
	let url = s3.getSignedUrl('putObject',params);

	return utilities.buildReturn(200, params, url)
}
