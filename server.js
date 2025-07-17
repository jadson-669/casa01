require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const axios = require('axios');
const { Pool } = require('pg');
const query = 'SELECT * FROM usuarios WHERE email = $1';


// Inicializa o express antes de usar `app`
const app = express();
app.use(cors());
app.use(express.json());

// Configuração do banco
const isLocal = process.env.DATABASE_URL?.includes('localhost');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});





module.exports = pool;




const TELEGRAM_TOKEN = '7669412380:AAHu_ZQ73LjwCGSwI17gyr6VI5s8okPg7Z8';
const TELEGRAM_CHAT_ID = '6970987616';

function enviarNotificacao(mensagem) {
  const url = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`;
  const data = {
    chat_id: TELEGRAM_CHAT_ID,
    text: mensagem,
  };

  axios.post(url, data).catch(err => {
    console.error('Erro ao enviar mensagem para o Telegram:', err.message);
  });
}

pool.connect()
  .then(async client => {
    console.log('Banco conectado com sucesso!');
    await client.query('SET search_path TO public'); // <- ESSA LINHA AQUI
    client.release();
  })
  .catch(err => {
    console.error('Erro ao conectar no banco:', err);
  });

// Cadastro
// Cadastro com notificação Telegram
app.post('/register', async (req, res) => {
  const { username, password, telefone } = req.body;


  try {
    const userExists = await pool.query('SELECT * FROM public.usuarios WHERE username = $1', [username]);
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: 'Usuário já existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
  'INSERT INTO public.usuarios (username, password, saldo, telefone) VALUES ($1, $2, $3, $4)',
  [username, hashedPassword, 0, telefone]
);

    // Envia notificação para o Telegram
    enviarNotificacao(`🆕 Novo cadastro realizado!\n👤 Usuário: ${username}\n📞 Telefone: ${telefone}`);


    res.json({ message: 'Cadastro realizado com sucesso!' });

  } catch (err) {
    console.error('Erro ao registrar usuário:', err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});

console.log('Conectando ao banco com URL:', process.env.DATABASE_URL);

// Login
// Substitua no /login
// Login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const query = 'SELECT * FROM usuarios WHERE username = $1';
    const resultado = await pool.query(query, [username]);

    if (resultado.rows.length > 0) {
      const user = resultado.rows[0];
      const senhaCorreta = await bcrypt.compare(password, user.password);

      if (senhaCorreta) {
        res.json({
          success: true,
          username: user.username,
          saldo: parseFloat(user.saldo),
          isAdmin: user.username === 'admin' // 👈 Aqui define o admin
        });
      } else {
        res.status(401).json({ message: 'Senha incorreta' });
      }
    } else {
      res.status(404).json({ message: 'Usuário não encontrado' });
    }
  } catch (err) {
    console.error('Erro ao fazer login:', err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});



// Registrar depósito (pendente)
app.post('/depositar', async (req, res) => {
  const { username, valor } = req.body;

  if (!username || !valor || isNaN(valor)) {
    return res.status(400).json({ message: 'Dados inválidos.' });
  }

  try {
    await pool.query(
      'INSERT INTO extrato (username, tipo, valor, status) VALUES ($1, $2, $3, $4)',
      [username, 'depósito', valor, 'pendente']
    );

    // Aqui envia a notificação para o Telegram imediatamente após registrar o depósito
    enviarNotificacao(`💰 Novo depósito feito por ${username}: R$${valor}`);

    res.json({ message: 'Depósito registrado com sucesso!' });
  } catch (err) {
    console.error('Erro ao registrar depósito:', err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});


// Confirmar depósito (admin)
app.post('/confirmar-deposito', async (req, res) => {
  const { username, valor } = req.body;

  try {
await pool.query('UPDATE public.usuarios SET saldo = saldo + $1 WHERE username = $2', [valor, username]);

    await pool.query(
      'UPDATE extrato SET status = $1 WHERE username = $2 AND valor = $3 AND tipo = $4 AND status = $5',
      ['confirmado', username, valor, 'depósito', 'pendente']
    );

    console.log('Enviando notificação para o Telegram...'); // Log para debug
    enviarNotificacao(`💰 Depósito confirmado para ${username}: R$${valor}`);

    res.json({ message: 'Depósito confirmado.' });
  } catch (err) {
    console.error('Erro ao confirmar depósito:', err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});
// Rota para obter o placar
app.get('/placar', async (req, res) => {
  try {
    const resultado = await pool.query('SELECT gols_trairas, gols_marcela FROM partidas WHERE nome = $1', ['Trairas vs Marcela']);
    if (resultado.rows.length > 0) {
      res.json({
        golsTrairas: resultado.rows[0].gols_trairas,
        golsMarcela: resultado.rows[0].gols_marcela
      });
    } else {
      res.status(404).json({ error: 'Partida não encontrada' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao buscar placar' });
  }
});
app.post('/placar', async (req, res) => {
  const { golsTrairas, golsMarcela } = req.body;
  try {
    await pool.query(
      'UPDATE partidas SET gols_trairas = $1, gols_marcela = $2 WHERE nome = $3',
      [golsTrairas, golsMarcela, 'Trairas vs Marcela']
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Erro ao atualizar placar' });
  }
});


// Atualiza placar manualmente
app.post('/atualizar-placar', async (req, res) => {
  const { golsTrairas, golsMarcela } = req.body;

  try {
    await pool.query(
      'UPDATE partidas SET gols_trairas = $1, gols_marcela = $2 WHERE nome = $3',
      [golsTrairas, golsMarcela, 'Trairas vs Marcela']
    );
    res.json({ sucesso: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: 'Erro ao atualizar placar' });
  }
});

// Saldo
app.get('/saldo/:username', async (req, res) => {
  const { username } = req.params;

  try {
    const result = await pool.query(
      'SELECT saldo FROM usuarios WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    res.json({ saldo: parseFloat(result.rows[0].saldo) });
  } catch (err) {
    console.error('Erro ao buscar saldo:', err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});


// Saque
app.post('/sacar', async (req, res) => {
  const { username, valor, chavePix } = req.body;
  const valorNumerico = Number(valor);

  if (!username || isNaN(valorNumerico) || valorNumerico < 20) {
    return res.status(400).json({ message: 'O valor mínimo para saque é R$20,00.' });
  }

  if (!chavePix || chavePix.length < 5) {
    return res.status(400).json({ message: 'Chave PIX inválida' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      'SELECT saldo FROM public.usuarios WHERE username = $1 FOR UPDATE',
      [username]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const saldoAtual = parseFloat(result.rows[0].saldo);

    if (valorNumerico > saldoAtual) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Saldo insuficiente' });
    }

    const update = await client.query(
      'UPDATE public.usuarios SET saldo = saldo - $1 WHERE username = $2 RETURNING saldo',
      [valorNumerico, username]
    );

    if (update.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Erro ao atualizar saldo' });
    }

    const novoSaldo = parseFloat(update.rows[0].saldo).toFixed(2);

    await client.query(
      'INSERT INTO extrato (username, tipo, valor) VALUES ($1, $2, $3)',
      [username, 'saque', valorNumerico]
    );

    await client.query('COMMIT');

    enviarNotificacao(`🏧 Saque solicitado por ${username}:\n💰 Valor: R$${valorNumerico.toFixed(2)}\n🔑 Chave PIX: ${chavePix}`);

    res.json({ message: 'Saque realizado com sucesso', saldo: parseFloat(novoSaldo) });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro no saque:', err);
    res.status(500).json({ message: 'Erro no servidor' });
  } finally {
    client.release();
  }
});


app.post('/apostar', async (req, res) => {
  const { username, partida, valor, odd, timeEscolhido } = req.body;

  if (!username || isNaN(valor) || valor <= 0) {
    return res.status(400).json({ message: 'Valor inválido para aposta.' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const userResult = await client.query(
      'SELECT saldo FROM public.usuarios WHERE username = $1 FOR UPDATE',
      [username]
    );

    if (userResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const saldoAtual = parseFloat(userResult.rows[0].saldo);

    // Impede apostas com saldo 0 ou menor
    if (saldoAtual <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Saldo zerado. Deposite para apostar.' });
    }

    // Verifica limite diário
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const amanha = new Date(hoje);
    amanha.setDate(hoje.getDate() + 1);

    const totalApostasResult = await client.query(
      `SELECT COALESCE(SUM(valor), 0) AS total
       FROM extrato
       WHERE username = $1
         AND tipo = 'aposta'
         AND data >= $2 AND data < $3`,
      [username, hoje, amanha]
    );

    const totalApostadoHoje = parseFloat(totalApostasResult.rows[0].total);

    if (totalApostadoHoje + valor > 20) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Limite diário de apostas de R$20,00 atingido.' });
    }

    // Debita saldo somente se ainda houver saldo suficiente
    const updateResult = await client.query(
      `UPDATE public.usuarios
       SET saldo = saldo - $1
       WHERE username = $2 AND saldo >= $1
       RETURNING saldo`,
      [valor, username]
    );

    if (updateResult.rowCount === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ message: 'Saldo insuficiente' });
    }

    // Registra a aposta
    await client.query(
      'INSERT INTO extrato (username, tipo, valor, partida, odd) VALUES ($1, $2, $3, $4, $5)',
      [username, 'aposta', valor, partida, odd]
    );

    await client.query('COMMIT');

    enviarNotificacao(`🎲 Nova aposta de ${username}: R$${valor} no time "${timeEscolhido}" na partida "${partida}" com odd ${odd}`);

    return res.json({ message: 'Aposta registrada com sucesso!' });

  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao registrar aposta:', err);
    return res.status(500).json({ message: 'Erro no servidor' });
  } finally {
    client.release();
  }
});





// Extrato
app.get('/extrato/:username', async (req, res) => {
  const { username } = req.params;
  try {
    const result = await pool.query(
      'SELECT * FROM extrato WHERE username = $1 ORDER BY data DESC',
      [username]
    );
    res.json({ extrato: result.rows });
  } catch (err) {
    console.error('Erro ao buscar extrato:', err);
    res.status(500).json({ message: 'Erro no servidor' });
  }
});
// Todas as suas rotas aqui (login, register, saldo, etc)

// Middleware de log
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

// Servir arquivos estáticos da pasta "public"
app.use(express.static('public'));

// Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});

app.get('/debug/tabelas', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ erro: err.message });
  }
});

