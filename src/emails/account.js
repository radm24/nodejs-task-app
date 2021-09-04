const SibApiV3Sdk = require('sib-api-v3-sdk');
const defaultClient = SibApiV3Sdk.ApiClient.instance;

// Instantiate the client
const apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = process.env.SIB_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendWelcomeEmail = (email, name) => {
    const welcomeEmail = new SibApiV3Sdk.SendSmtpEmail();
    SibApiV3Sdk.SendSmtpEmail.constructFromObject({
        subject: 'Thanks for joining in!',
        htmlContent: `<html><body><p>Welcome to the app, ${name}. Let me know how you get along with the app.</p></body></html>`,
        sender: { email: 'radik.developer@gmail.com' },
        to: [{ name, email }],
        replyTo: { email: 'radik.developer@gmail.com' }
    }, welcomeEmail);

    sendEmail(welcomeEmail);
}

const sendCancelationEmail = (email, name) => {
    const cancelationEmail = new SibApiV3Sdk.SendSmtpEmail();
    SibApiV3Sdk.SendSmtpEmail.constructFromObject({
        subject: 'Sorry to see you go!',
        htmlContent: `<html><body><p>Goodbye, ${name}. I hope to see you back sometime soon.</p></body></html>`,
        sender: { email: 'radik.developer@gmail.com' },
        to: [{ name, email }],
        replyTo: { email: 'radik.developer@gmail.com' }
    }, cancelationEmail);

    sendEmail(cancelationEmail);
}

const sendEmail = async (email) => {
    try {
        const data = await apiInstance.sendTransacEmail(email);
        console.log('API called successfully. Returned data: ' + JSON.stringify(data));
    } catch (err) {
        console.log(err);
    }
}

module.exports = {
    sendWelcomeEmail,
    sendCancelationEmail
}