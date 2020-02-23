const { promisify } = require('util')
const { S3 } = require('aws-sdk')

afterAll(async () => {
  global.isDone = true
  if (global.browser) await global.browser.close()
  if (global.session) await global.session.deleteSession()

  // const s3 = new S3({
  //   accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  //   secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  // })
  //
  // const params = {
  //   ACL: 'public-read',
  //   ContentType: 'application/json',
  //   Bucket: 'sauce-userdata-us-west-2',
  //   Key: `cb-onboarding/${global.sessionId}/log.json`,
  //   ServerSideEncryption: 'aws:kms',
  //   SSEKMSKeyId: process.env.AWS_SSEKMS_KEY_ID,
  //   Body: JSON.stringify(global.logs, null, 4)
  // };
  //
  // console.log(`Update log file: cb-onboarding/${global.sessionId}/log.json`);
  // await promisify(s3.upload.bind(s3))(params)
  console.log('Done!')
});
