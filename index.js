const express = require('express');

const app = express();
app.use(express.json());

const API_KEY = process.env.BONUSPLUS_API_KEY;
const BONUS_AMOUNT = process.env.BONUS_AMOUNT || 1000;

const given = new Set();

app.post('/app-bonus', async (req, res) => {
  try {
    let { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ status: 'error', message: 'no phone' });
    }

    phone = String(phone).replace(/\D/g, '');

    if (given.has(phone)) {
      return res.json({ status: 'already_given' });
    }

    const auth = 'ApiKey ' + Buffer.from(API_KEY).toString('base64');

    const findResponse = await fetch(`https://bonusplus.pro/api/customer?phone=${phone}`, {
      headers: { Authorization: auth }
    });

    let customer = null;

    try {
      customer = await findResponse.json();
    } catch (e) {
      customer = null;
    }

 if (!customer || !customer.phoneNumber) {
  const createResponse = await fetch('https://bonusplus.pro/api/customer', {
    method: 'POST',
    headers: {
      Authorization: auth,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      phoneNumber: phone
    })
  });

  const createData = await createResponse.text();
  console.log('CREATE CUSTOMER:', createData);

  // 🔥 ВАЖНО — подождать создание
  await new Promise(resolve => setTimeout(resolve, 1000));
}
        method: 'POST',
        headers: {
          Authorization: auth,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          phoneNumber: phone
        })
      });
    }

    const bonusResponse = await fetch(`https://bonusplus.pro/api/customer/${phone}/balance`, {
      method: 'PATCH',
      headers: {
        Authorization: auth,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: Number(BONUS_AMOUNT),
        activatedInDays: 0,
        burnsInDays: 7
      })
    });

    if (!bonusResponse.ok) {
      const text = await bonusResponse.text();
      return res.status(500).json({
        status: 'bonusplus_error',
        message: text
      });
    }

    given.add(phone);

    return res.json({ status: 'success' });

  } catch (error) {
    console.error(error);
    return res.status(500).json({
      status: 'server_error',
      message: error.message
    });
  }
});

app.get('/', (req, res) => {
  res.send('app-bonus server is working');
});

app.listen(process.env.PORT || 3000, () => {
  console.log('server started');
});
