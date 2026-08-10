import axios from 'axios';
const BASE_URL = 'https://sandbox.safaricom.co.ke';
const getToken = async () => {
  const consumerKey = process.env.NEXT_PUBLIC_MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.NEXT_PUBLIC_MPESA_CONSUMER_SECRET;
  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  try {
    const response = await axios.get(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });
    return response.data.access_token;
  } catch (error) {
    console.error('Error fetching token:', error);
    throw error;
  }
};
const initiateSTKPush = async (amount: number, phoneNumber: string, accountReference: string, transactionDesc: string) => {
  const token = await getToken();
  const shortcode = process.env.NEXT_PUBLIC_MPESA_SHORTCODE;
  const passkey = process.env.NEXT_PUBLIC_MPESA_PASSKEY;
  const timestamp = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: amount,
    PartyA: phoneNumber,
    PartyB: shortcode,
    PhoneNumber: phoneNumber,
    CallBackURL: 'https://your-callback-url.com/callback',
    AccountReference: accountReference,
    TransactionDesc: transactionDesc,
  };
  try {
    const response = await axios.post(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error initiating STK Push:', error);
    throw error;
  }
};
export { initiateSTKPush };