import { Resend } from 'resend';
const resend = new Resend('re_XJzPTrfZ_2jmrPp8soVn6g5No95uRVoSH');
async function check() {
    const domains = await resend.domains.list();
    console.log('Domains:', JSON.stringify(domains, null, 2));
    const hooks = await resend.webhooks.list();
    console.log('Webhooks:', JSON.stringify(hooks, null, 2));
}
check();
