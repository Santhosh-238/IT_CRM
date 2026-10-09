const { Client } = require('pg');

async function test(pw, user='postgres', db='postgres') {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: user,
    password: pw,
    database: db,
    connectionTimeoutMillis: 3000,
  });
  try {
    await client.connect();
    console.log(`SUCCESS with user=${user}, db=${db}, pw=${pw}`);
    const res = await client.query('SELECT current_database(), current_user;');
    console.log('Query result:', res.rows[0]);
    await client.end();
    return true;
  } catch (err) {
    console.log(`Failed user=${user}, pw=${pw}:`, err.message);
    try { await client.end(); } catch(e) {}
    return false;
  }
}

async function run() {
  const passwords = ['postgres', 'admin', 'root', '123456', 'password', 'crm_secret_password', ''];
  const users = ['postgres', 'crm_admin'];
  for (const u of users) {
    for (const p of passwords) {
      const ok = await test(p, u);
      if (ok) return;
    }
  }
}

run();
