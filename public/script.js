const BASE_URL = window.location.hostname.includes('localhost')
  ?'http://localhost:3000'
  : 'https://casa01.onrender.com';

    
    let saldo = 0;
    const saldoSpan = document.getElementById('saldo');
    const extratoLista = document.getElementById('extrato-lista');

   function atualizarSaldo() {
  const saldoFloat = parseFloat(saldo) || 0;
  saldoSpan.textContent = `Saldo: R$${saldoFloat.toFixed(2)}`;
}


    function adicionarExtrato(texto) {
      const li = document.createElement('li');
      li.textContent = texto;
      extratoLista.prepend(li);
    }



function depositar() {
  document.getElementById('modal-deposito').style.display = 'flex';
  document.getElementById('termo-checkbox').checked = false;
  document.getElementById('valor-pix').value = '';
  document.getElementById('pix-info').style.display = 'none';
  document.getElementById('confirmar-deposito').disabled = true;
}

function fecharModal() {
  document.getElementById('modal-deposito').style.display = 'none';
}

document.getElementById('termo-checkbox').addEventListener('change', validarDeposito);
document.getElementById('valor-pix').addEventListener('input', validarDeposito);

function validarDeposito() {
  const termoAceito = document.getElementById('termo-checkbox').checked;
  const valor = parseFloat(document.getElementById('valor-pix').value);
  const valido = !isNaN(valor) && valor > 0 && valor <= 20;

  // Ativa ou desativa botão
  document.getElementById('confirmar-deposito').disabled = !(valido && termoAceito);

  // Exibe ou oculta a chave Pix automaticamente
  const pixInfo = document.getElementById('pix-info');
  if (valido) {
    pixInfo.style.display = 'block';
  } else {
    pixInfo.style.display = 'none';
  }
}
function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;

  fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
  .then(res => res.json())
  .then(data => {
    if (data.success) {
      // Login OK: exibir o painel principal
      document.getElementById('auth').style.display = 'none';
      document.getElementById('main').style.display = 'block';
      document.getElementById('logo-betime').style.display = 'block';
      document.getElementById('acoes').style.display = 'flex';
      document.getElementById('header-user').style.display = 'flex';
      
      // Salva o usuário no localStorage
      const username = localStorage.getItem('user');



      // 👉 Verifica se é admin
      if (data.usuario.username === 'admin') {
  document.getElementById('painel-admin').style.display = 'block';
} else {
  document.getElementById('painel-admin').style.display = 'none';
}

    } else {
      alert(data.message || 'Erro no login');
    }
  });
}

function atualizarPlacar() {
  const golsCelp = parseInt(document.getElementById('inputCelp').value);
  const golsTrairas = parseInt(document.getElementById('inputTrairas').value);
  const golsUnaluz = parseInt(document.getElementById('inputUnaluz').value);
  const golsTrovoes = parseInt(document.getElementById('inputTrovoes').value);
  const golsCampinho = parseInt(document.getElementById('inputCampinho').value);
  const golsMarcela = parseInt(document.getElementById('inputMarcela').value);

  fetch(`${BASE_URL}/atualizar-placar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ golsCelp, golsTrairas, golsUnaluz, golsTrovoes, golsCampinho, golsMarcela })
  })
  .then(res => res.json())
  .then(data => {
    if (data.sucesso) {
      alert('Placar atualizado com sucesso!');
      atualizarPlacarDoBanco(); // Atualiza visual na hora
    } else {
      alert('Erro ao atualizar o placar');
    }
  })
  .catch(err => {
    console.error(err);
    alert('Erro ao enviar atualização');
  });
}




function mostrarAreaPrincipal(usuario) {
  document.getElementById('auth').style.display = 'none';
  document.getElementById('main').style.display = 'block';
  document.getElementById('acoes').style.display = 'flex';
  document.getElementById('logo-betime').style.display = 'block';
  document.getElementById('header-user').style.display = 'flex';

  // Exibe painel adm2in apenas para o usuário admin
  if (usuario.username === 'admin') {
    document.getElementById('painel-admin').style.display = 'block';
  } else {
    document.getElementById('painel-admin').style.display = 'none';
  }
}


function copiarPix() {
  const chave = document.getElementById('pix-chave').textContent;
  navigator.clipboard.writeText(chave).then(() => {
    mostrarPopup("Chave Pix copiada!");
  });
}

document.getElementById('confirmar-deposito').addEventListener('click', async function () {
  const valor = parseFloat(document.getElementById('valor-pix').value);
  const pixInfo = document.getElementById('pix-info');

  if (!isNaN(valor) && valor > 0 && valor <= 20) {
    const username = sessionStorage.getItem('user');

    try {
      pixInfo.style.display = 'block';
      mostrarPopup("Chave Pix gerada! Copie e faça o pagamento.");

      // ✅ Corrigido: usar a rota /depositar e enviar apenas username e valor
      const res = await fetch(`${BASE_URL}/depositar`, {

        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, valor }) // ⬅️ somente esses campos
      });

      const data = await res.json();

      if (!res.ok) {
        mostrarPopup(data.message || 'Erro ao depositar.');
        return;
      }

      mostrarPopup(data.message || 'Depósito registrado! Aguarde aprovação.');
      document.getElementById('modal-pos-pix').style.display = 'flex';
      fecharModal();

      this.onclick = null;

    } catch (err) {
      console.error('Erro ao enviar depósito:', err);
      mostrarPopup('Erro ao comunicar com o servidor.');
    }
  } else {
    mostrarPopup('Valor inválido. Insira até R$20.');
  }
});


    function toggleForm() {
  const titulo = document.getElementById("form-title");
  const toggle = document.querySelector(".toggle");
  const usernameInput = document.getElementById("username");
  const passwordInput = document.getElementById("password");
  const telefoneInput = document.getElementById("telefone");

  const isLogin = titulo.textContent.includes("Entrar");

  if (isLogin) {
    titulo.textContent = "📝 Criar nova conta";
    toggle.textContent = "Já tem conta? Entrar";
    if (telefoneInput) telefoneInput.style.display = "block"; // Mostra telefone no registro
  } else {
    titulo.textContent = "🎯 Entrar na sua conta";
    toggle.textContent = "Não tem conta? Cadastre-se";
    if (telefoneInput) telefoneInput.style.display = "none"; // Esconde telefone no login
  }

  // Limpa os campos sempre que alternar
  usernameInput.value = "";
  passwordInput.value = "";
  if (telefoneInput) telefoneInput.value = "";
}

let apostaTemp = null; // pra guardar dados da aposta temporariamente

async function apostar(partida, valorId, timeId, event) {
  if (event) event.preventDefault();

  const valorEl = document.getElementById(valorId);
  const timeEl = document.getElementById(timeId);

  if (!valorEl || !timeEl) {
    alert("Campos de aposta não encontrados.");
    return;
  }

  const valor = parseFloat(valorEl.value);
  const odd = parseFloat(timeEl.value);
  const username = sessionStorage.getItem('user');

  if (!username) {
    alert("Você precisa estar logado para apostar.");
    return;
  }

  if (isNaN(valor) || valor <= 0) {
      mostrarPopup("⚠️ Insira um valor válido.");
    return;
  }

  // Pega o nome do time escolhido - texto da opção selecionada
  const timeEscolhido = timeEl.options[timeEl.selectedIndex].text;

  const lucro = valor * odd;

  // Guarda dados da aposta temporariamente para confirmação
  apostaTemp = { partida, valor, odd, username, lucro, timeEscolhido };

  // Atualiza texto no modal de confirmação da aposta
  const textoModal = document.getElementById('texto-confirm-aposta');
  textoModal.textContent = `Você vai apostar R$${valor.toFixed(2)} no time "${timeEscolhido}" na partida "${partida}".\nPossível retorno: R$${lucro.toFixed(2)}.\nConfirma?`;

  // Exibe modal
  document.getElementById('modal-confirm-aposta').style.display = 'flex';
}



// Botões do modal
document.getElementById('btn-confirmar-aposta').addEventListener('click', async () => {
  const { partida, valor, odd, username, timeEscolhido } = apostaTemp;

  try {
    const response = await fetch(`${BASE_URL}/apostar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ partida, valor, odd, username, timeEscolhido })
    });

    const data = await response.json();

    if (!response.ok) {
      if (data.message.includes('Limite diário')) {
        mostrarMensagem('⚠️ ' + data.message);
      } else {
        mostrarMensagem('❌ ' + data.message);
      }
      return;
    }

    fecharModalConfirmAposta();
    mostrarMensagem(data.message);

    // ✅ ATUALIZA saldo e extrato após aposta
    await carregarSaldo(username);
    await carregarExtrato(username);

  } catch (err) {
    console.error('Erro ao apostar:', err);
    mostrarMensagem('Erro ao registrar aposta. Tente novamente.');
  }
});




document.getElementById('btn-cancelar-aposta').addEventListener('click', () => {
  document.getElementById('modal-confirm-aposta').style.display = 'none';
  apostaTemp = null;
});







async function register() {
  const user = document.getElementById('username').value;
  const pass = document.getElementById('password').value;
  const telefone = document.getElementById('telefone').value;

  if (!user || !pass || !telefone) {
    return alert('Preencha todos os campos');
  }

  const res = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: user, password: pass, telefone: telefone })
  });

  const data = await res.json();
  mostrarPopup(data.message);
  if (res.ok) toggleForm();
}



async function login() {
  const user = document.getElementById('username').value;
  const pass = document.getElementById('password').value;

  const res = await fetch(`${BASE_URL}/login`, {  // <<== corrigido aqui
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: user, password: pass })
  });

  const data = await res.json();
  if (!res.ok) {
    mostrarPopup(data.message || "Erro no login");
    return;
  }
if (data.isAdmin) {
  document.getElementById('painel-admin').style.display = 'block';
}

  sessionStorage.setItem('user', data.username);
  await carregarSaldo(data.username);
  await carregarExtrato(data.username);

  document.getElementById('auth').style.display = 'none';
  document.getElementById('main').style.display = 'block';

  document.getElementById("header-user").style.display = "flex";
  document.getElementById("acoes").style.display = "flex";
  document.getElementById('logo-betime').style.display = 'block';

  mostrarModalBoasVindas();
}




    function logout() {
      sessionStorage.removeItem('user');
      location.reload();
    }

 async function carregarSaldo(username) {
  try {
    const res = await fetch(`${BASE_URL}/saldo/${username}`);

    const data = await res.json();

    saldo = data.saldo || 0;  // se saldo for null ou undefined, considera 0
    saldoSpan.textContent = `Saldo: R$${saldo.toFixed(2)}`;
  } catch (err) {
    saldoSpan.textContent = 'Saldo: erro ao carregar';
  }
}
// Mostrar modal de boas-vindas após login
function mostrarModalBoasVindas() {
  document.getElementById('modal-boas-vindas').style.display = 'flex';

}

document.getElementById('btn-fechar-boas-vindas').addEventListener('click', () => {
  document.getElementById('modal-boas-vindas').style.display = 'none';
});



window.onload = async () => {
  const usuarioSalvo = sessionStorage.getItem('user');
  if (usuarioSalvo) {
    const username = usuarioSalvo; // já é só o nome do usuário

    document.getElementById('auth').style.display = 'none';
    document.getElementById('main').style.display = 'block';
    document.getElementById('saldo').style.display = 'inline';
    document.getElementById('header-user').style.display = 'flex';
    document.getElementById('acoes').style.display = 'flex';
    document.getElementById('logo-betime').style.display = 'block';

    await carregarSaldo(username);
    await carregarExtrato(username);
    setInterval(() => carregarSaldo(username), 15000);

    if (username === 'admin') {
      document.getElementById('painel-admin').style.display = 'block';
    } else {
      document.getElementById('painel-admin').style.display = 'none';
    }
  }
};




    function mostrarPopup(mensagem) {
  const popup = document.getElementById('popup-msg');
  const texto = document.getElementById('popup-text');

  texto.textContent = mensagem;
  popup.classList.remove('hidden');
  popup.classList.add('show');

  setTimeout(() => {
    popup.classList.remove('show');
    popup.classList.add('hidden');
  }, 3000);
}
function abrirSaque() {
  document.getElementById('modal-saque').style.display = 'flex';
  document.getElementById('valor-saque').value = '';
  document.getElementById('pix-chave-saque').value = '';
}

function fecharModalSaque() {
  document.getElementById('modal-saque').style.display = 'none';
}

async function carregarExtrato(username) {
  try {
    const res = await fetch(`${BASE_URL}/extrato/${username}`);

    const data = await res.json();

    if (data.extrato) {
      extratoLista.innerHTML = '';
      data.extrato.forEach(item => {
        const li = document.createElement('li');
        const dataFormatada = new Date(item.data).toLocaleString('pt-BR');
        
        let icone = '💰';
        if (item.tipo === 'saque') icone = '📤';
        if (item.tipo === 'aposta') icone = '🎲';

        li.textContent = `${icone} ${item.tipo} de R$${parseFloat(item.valor).toFixed(2)} em ${dataFormatada}`;
        extratoLista.appendChild(li);
      });
    }

  } catch (err) {
    console.error('Erro ao carregar extrato:', err);
  }
}



async function confirmarEnvioSaque() {
  const valor = parseFloat(document.getElementById('valor-saque').value);
  const chavePix = document.getElementById('pix-chave-saque').value.trim();
  const username = sessionStorage.getItem('user');

  if (isNaN(valor) || valor < 20) {
    mostrarPopup("⚠️ O valor mínimo para saque é R$20,00.");
    return;
  }

  if (!chavePix) {
    mostrarPopup("⚠️ Insira sua chave Pix.");
    return;
  }

  try {
    const res = await fetch(`${BASE_URL}/sacar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, valor, chavePix }) // <-- chavePix enviada aqui!
    });

    const data = await res.json();

    if (!res.ok) {
      alert(data.message || 'Erro ao realizar saque');
      return;
    }

    mostrarPopup(`Saque de R$${valor.toFixed(2)} solicitado com sucesso!`);
    fecharModalSaque();

    await carregarSaldo(username);
    await carregarExtrato(username);

  } catch (err) {
    console.error('Erro ao realizar saque:', err);
    mostrarPopup('Erro ao comunicar com o servidor.');
  }
}

function calcularRetorno(valorId, selectId, retornoId) {
  const valor = parseFloat(document.getElementById(valorId).value);
  const odd = parseFloat(document.getElementById(selectId).value);
  const retornoDiv = document.getElementById(retornoId);

  if (!isNaN(valor) && !isNaN(odd)) {
    const retorno = valor * odd;
    retornoDiv.textContent = `💸 Possível retorno: R$${retorno.toFixed(2)}`;
  } else {
    retornoDiv.textContent = '';
  }
}
function fecharModalPosPix() {
  document.getElementById('modal-pos-pix').style.display = 'none';
}
function fecharModalLimiteAposta() {
  document.getElementById('modal-limite-aposta').style.display = 'none';
}
function abrirModalSaqueMinimo() {
  document.getElementById("modalSaqueMinimo").style.display = "block";
}

function fecharModalSaqueMinimo() {
  document.getElementById("modalSaqueMinimo").style.display = "none";
}
function toggleForm() {
  const title = document.getElementById('form-title');
  const username = document.getElementById('username');
 const telefone = document.getElementById('telefone');

  const password = document.getElementById('password');
  const button = document.querySelector('#auth button:first-of-type');
  const toggleBtn = document.querySelector('.toggle');

  if (button.textContent === 'Entrar') {
    // Alternar para cadastro
    title.textContent = 'Cadastro';
   telefone.style.display = 'block';

    button.textContent = 'Cadastrar';
    button.onclick = register;
    toggleBtn.textContent = 'Já tem conta? Fazer login';

  } else {
    // Alternar para login
    title.textContent = 'Login';
    telefone.style.display = 'none';
    button.textContent = 'Entrar';
    button.onclick = login;
    toggleBtn.textContent = 'Não tem conta? Cadastre-se';
  }
}
function abrirModalLimiteAposta() {
  document.getElementById('modal-limite-aposta').style.display = 'flex';
}

function fecharModalLimiteAposta() {
  document.getElementById('modal-limite-aposta').style.display = 'none';
}
function mostrarMensagem(msg) {
  const popup = document.getElementById('popup-msg');
  const texto = document.getElementById('popup-text');
  texto.textContent = msg;

  popup.classList.add('show');
  popup.classList.remove('hidden');

  setTimeout(() => {
    popup.classList.remove('show');
    popup.classList.add('hidden');
  }, 4000);
}
function mostrarPopup(mensagem, duracao = 3000) {
  const popup = document.getElementById('popup-msg');
  const texto = document.getElementById('popup-text');
  
  texto.textContent = mensagem;
  popup.classList.remove('hidden');
  popup.classList.add('show');
  
  setTimeout(() => {
    popup.classList.remove('show');
    popup.classList.add('hidden');
  }, duracao);
}
function fecharModalConfirmAposta() {
  document.getElementById('modal-confirm-aposta').style.display = 'none';
}
function abrirModalAvisoSaque() {
  document.getElementById("modal-aviso-saque").style.display = "flex";
}
const carousel = document.getElementById('carousel-matches');
const scrollBar = document.querySelector('.scroll-bar');
const scrollIndicator = document.querySelector('.carousel-scroll-indicator');

function atualizarScrollBar() {
  // Proporção do scroll atual no carrossel
  const scrollLeft = carousel.scrollLeft;
  const scrollWidth = carousel.scrollWidth - carousel.clientWidth;
  const scrollPercent = scrollLeft / scrollWidth;

  // Largura da barra indicadora
  const indicatorWidth = scrollIndicator.clientWidth;

  // Ajustar largura da barra proporcional ao tamanho visível
  const barraWidth = (carousel.clientWidth / carousel.scrollWidth) * indicatorWidth;

  // Ajusta a largura e a posição da scroll-bar
  scrollBar.style.width = barraWidth + 'px';
  scrollBar.style.transform = `translateX(${scrollPercent * (indicatorWidth - barraWidth)}px)`;
}

// Atualizar ao rolar o carrossel
carousel.addEventListener('scroll', atualizarScrollBar);

// Opcional: Atualizar no load
window.addEventListener('load', atualizarScrollBar);

// Se quiser que a barra de rolagem seja clicável e mova o carrossel:
scrollIndicator.addEventListener('click', (e) => {
  const rect = scrollIndicator.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const indicatorWidth = scrollIndicator.clientWidth;
  const targetScrollLeft = (clickX / indicatorWidth) * (carousel.scrollWidth - carousel.clientWidth);
  carousel.scrollLeft = targetScrollLeft;
});


