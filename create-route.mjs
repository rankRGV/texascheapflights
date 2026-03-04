import { Resend } from 'resend';

const resend = new Resend('re_XJzPTrfZ_2jmrPp8soVn6g5No95uRVoSH');

async function createRoute() {
    try {
        const data = await resend.emails.send({
            from: 'Texas Cheap Flights <waitlist@texascheapflights.com>',
            to: ['eddieurbano@gmail.com'],
            subject: 'Hello World',
            html: '<strong>It works!</strong>',
        });
        console.log(data);
    } catch (error) {
        console.error(error);
    }
}

createRoute();
