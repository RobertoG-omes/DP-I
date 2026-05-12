/**
 * script.js — EcoPonto Interativo
 * Autor: Desenvolvedor Front-end Sênior
 * Disciplina: PD-I / Dispositivos Móveis
 *
 * Módulos:
 *   1. Navbar: scroll + active link + fechamento hambúrguer
 *   2. Cards de Resíduos: flip interativo (click + teclado)
 *   3. Busca por CEP: validação, máscara e feedback simulado
 *   4. Animações de entrada via IntersectionObserver
 *   5. Botão "Voltar ao Topo"
 *   6. Smooth Scroll (delegado ao CSS scroll-padding-top)
 *   7. Pinos do mapa
 *
 * Correções aplicadas (revisão v1.1):
 *   FIX 1 — Guard defensivo em bootstrap.Collapse.getInstance()
 *            evita ReferenceError se o Bootstrap JS não estiver carregado.
 *   FIX 2 — Removida compensação manual de navbarH no smooth scroll.
 *            O CSS scroll-padding-top já cobre isso; calcular duas vezes
 *            fazia a página parar 72 px acima do alvo.
 *   FIX 3 — Documentação explícita do escopo de simulação do CEP
 *            e da rota para integração real com a API ViaCEP.
 *   FIX 4 — card.focus() adicionado após fechar via Escape, mantendo
 *            o foco de teclado no card e atualizando o aria-expanded
 *            imediatamente para leitores de tela.
 */

/* =============================================================
   UTILITÁRIO: aguarda o DOM carregar completamente
============================================================= */
document.addEventListener('DOMContentLoaded', () => {

  /* -----------------------------------------------------------
     1. NAVBAR — Comportamento ao rolar a página
     IHC: Visibilidade do status do sistema
  ----------------------------------------------------------- */

  const mainNav = document.getElementById('mainNav');

  /**
   * Adiciona a classe "scrolled" na navbar quando
   * o usuário rolar mais de 60px — ativa visual de elevação.
   */
  function handleNavbarScroll() {
    if (window.scrollY > 60) {
      mainNav.classList.add('scrolled');
    } else {
      mainNav.classList.remove('scrolled');
    }
  }

  // Destaca o link ativo conforme a seção visível
  const navLinks = document.querySelectorAll('.navbar-nav .nav-link:not(.nav-cta)');
  const sections = document.querySelectorAll('section[id]');

  function highlightActiveNavLink() {
    const scrollMid = window.scrollY + window.innerHeight / 2;

    sections.forEach(section => {
      const top    = section.offsetTop;
      const bottom = top + section.offsetHeight;
      const id     = section.getAttribute('id');

      if (scrollMid >= top && scrollMid < bottom) {
        navLinks.forEach(link => {
          link.classList.remove('active');
          // Compara o href do link com o id da seção
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  /**
   * Fecha o menu hambúrguer ao clicar em qualquer link de navegação.
   *
   * FIX 1 — Guard defensivo: verifica se o objeto global `bootstrap`
   * foi carregado antes de chamar seus métodos. Sem isso, se o script
   * Bootstrap Bundle não estiver no HTML, ocorre ReferenceError e
   * todo o script para de executar.
   *
   * Causa raiz: bootstrap.Collapse.getInstance() só existe após o
   * Bootstrap JS Bundle ser carregado via <script> no HTML.
   */
  function fecharMenuMobile() {
    // Guard: aborta silenciosamente se o Bootstrap JS não estiver disponível
    if (typeof bootstrap === 'undefined') return;

    const collapseEl = document.getElementById('navMenu');
    if (collapseEl && collapseEl.classList.contains('show')) {
      // getInstance() retorna null se o Collapse não foi inicializado ainda
      const bsCollapse = bootstrap.Collapse.getInstance(collapseEl);
      if (bsCollapse) bsCollapse.hide();
    }
  }

  // Aplica o fechamento a todos os links de navegação
  navLinks.forEach(link => link.addEventListener('click', fecharMenuMobile));

  // Também fecha ao clicar no link CTA da navbar
  const navCta = document.querySelector('.nav-cta');
  if (navCta) navCta.addEventListener('click', fecharMenuMobile);

  // Registra os listeners de scroll
  window.addEventListener('scroll', () => {
    handleNavbarScroll();
    highlightActiveNavLink();
  }, { passive: true });

  // Executa uma vez no carregamento
  handleNavbarScroll();
  highlightActiveNavLink();


  /* -----------------------------------------------------------
     2. CARDS DE RESÍDUOS — Interatividade de flip
     IHC: Feedback Visual, Affordance, Controle do usuário
     Gestalt: Figura-Fundo (frente/verso)
  ----------------------------------------------------------- */

  const residuoCards = document.querySelectorAll('.residuo-card');

  /**
   * Alterna o estado de "virado" de um card.
   * @param {HTMLElement} card - O elemento do card a ser alternado
   */
  function toggleCard(card) {
    const isFlipped  = card.classList.contains('is-flipped');
    const cardBack   = card.querySelector('.card-back');

    // Fecha todos os outros cards abertos antes de abrir o atual
    // (Gestalt: Pregnância — foco em um elemento por vez)
    residuoCards.forEach(otherCard => {
      if (otherCard !== card) {
        otherCard.classList.remove('is-flipped');
        otherCard.setAttribute('aria-expanded', 'false');
        // Oculta o verso de outros cards para leitores de tela
        const otherBack = otherCard.querySelector('.card-back');
        if (otherBack) otherBack.setAttribute('aria-hidden', 'true');
      }
    });

    // Alterna o card atual
    card.classList.toggle('is-flipped');
    const nowFlipped = card.classList.contains('is-flipped');
    card.setAttribute('aria-expanded', nowFlipped ? 'true' : 'false');

    // Acessibilidade: torna o verso visível/oculto para leitores de tela
    if (cardBack) {
      cardBack.setAttribute('aria-hidden', nowFlipped ? 'false' : 'true');
    }
  }

  // Registra eventos de click e teclado para cada card
  residuoCards.forEach(card => {
    // Clique do mouse
    card.addEventListener('click', () => toggleCard(card));

    // Teclado: Enter ou Espaço ativam o card (acessibilidade)
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault(); // Evita scroll com Espaço
        toggleCard(card);
      }
      // Tecla Escape fecha o card atual e MANTÉM o foco nele
      // FIX 4: sem card.focus() o foco "saltava" para o body,
      // desorientando usuários que navegam exclusivamente por teclado.
      if (e.key === 'Escape' && card.classList.contains('is-flipped')) {
        card.classList.remove('is-flipped');
        card.setAttribute('aria-expanded', 'false');
        const back = card.querySelector('.card-back');
        if (back) back.setAttribute('aria-hidden', 'true');
        // Reposiciona o foco no próprio card para que o leitor de tela
        // anuncie o novo estado (aria-expanded="false") imediatamente.
        card.focus();
      }
    });
  });

  // Clique fora de qualquer card fecha todos (UX: Controle do usuário)
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.residuo-card')) {
      residuoCards.forEach(card => {
        card.classList.remove('is-flipped');
        card.setAttribute('aria-expanded', 'false');
        const back = card.querySelector('.card-back');
        if (back) back.setAttribute('aria-hidden', 'true');
      });
    }
  });


  /* -----------------------------------------------------------
     3. BUSCA POR CEP — Validação, máscara e simulação
     IHC: Prevenção de erros, Feedback imediato, Recuperação de erros
  ----------------------------------------------------------- */

  const cepInput      = document.getElementById('cepInput');
  const buscarBtn     = document.getElementById('buscarBtn');
  const cepResultado  = document.getElementById('cepResultado');
  const ecopontoCards = document.getElementById('ecopontoCards');
  const mapaMsg       = document.getElementById('mapaMsg');
  const pino1         = document.getElementById('pino1');
  const pino2         = document.getElementById('pino2');

  /**
   * Máscara de CEP: formata o input enquanto o usuário digita
   * Transforma "01310100" → "01310-100"
   */
  function mascaraCEP(valor) {
    // Remove tudo que não for dígito
    const apenas = valor.replace(/\D/g, '').slice(0, 8);
    // Aplica o hífen após o 5º dígito
    if (apenas.length > 5) {
      return apenas.slice(0, 5) + '-' + apenas.slice(5);
    }
    return apenas;
  }

  // Listener de digitação — aplica a máscara em tempo real
  cepInput.addEventListener('input', (e) => {
    const mascarado = mascaraCEP(e.target.value);
    e.target.value = mascarado;

    // Remove indicadores visuais de erro enquanto redigita
    cepInput.classList.remove('is-invalid', 'is-valid');
    cepResultado.innerHTML = '';
  });

  /**
   * Valida o formato do CEP antes de qualquer processamento.
   *
   * FIX 3 — Escopo da simulação documentado explicitamente.
   * Esta função valida APENAS o formato (estrutura), não a existência
   * real do CEP nos Correios. Para validação real, a chamada à API
   * ViaCEP (https://viacep.com.br/ws/{cep}/json/) no passo seguinte
   * retorna { "erro": true } se o CEP não existir na base dos Correios.
   *
   * Regex aceita dois formatos equivalentes:
   *   "01310-100" → com hífen (após aplicação da máscara)
   *   "01310100"  → sem hífen (entrada direta de 8 dígitos)
   *
   * @param {string} cep - CEP no formato "00000-000" ou "00000000"
   * @returns {boolean} true se o formato for válido
   */
  function validarCEP(cep) {
    return /^\d{5}-\d{3}$/.test(cep) || /^\d{8}$/.test(cep);
  }

  /* -----------------------------------------------------------
     DADOS: Array de Ecopontos — Fonte: DLU Diadema, jan/2026
     Campos: nome, endereco, bairro, cidade, uf, horario
  ----------------------------------------------------------- */
  const ECOPONTOS = [
    {
      nome: 'Ecoponto Arco-Íris',
      endereco: 'Rua Mozart, s/nº',
      bairro: 'Jardim Arco-Íris',
      bairroNorm: 'jardim arco-iris',
      cidade: 'Diadema',
      uf: 'SP',
      horario: 'Seg–Sex: 8h–16h | Sáb: 8h–13h',
    },
    {
      nome: 'Ecoponto Arraia',
      endereco: 'Rua Arraia, 50',
      bairro: 'Eldorado',
      bairroNorm: 'eldorado',
      cidade: 'Diadema',
      uf: 'SP',
      horario: 'Seg–Sex: 8h–16h | Sáb: 8h–13h',
    },
    {
      nome: 'Ecoponto Caracas / Bombeiro',
      endereco: 'Rua Caracas, 120',
      bairro: 'Vila Mulford',
      bairroNorm: 'vila mulford',
      cidade: 'Diadema',
      uf: 'SP',
      horario: 'Seg–Sex: 8h–16h | Sáb: 8h–13h',
    },
    {
      nome: 'Ecoponto Casa Grande – Okavango',
      endereco: 'Avenida Casa Grande, 1810',
      bairro: 'Jardim Casa Grande',
      bairroNorm: 'jardim casa grande',
      cidade: 'Diadema',
      uf: 'SP',
      horario: 'Seg–Sex: 8h–16h | Sáb: 8h–13h',
    },
    {
      nome: 'Ecoponto Curió',
      endereco: 'Av. Curió, 100',
      bairro: 'Campanário',
      bairroNorm: 'campanario',
      cidade: 'Diadema',
      uf: 'SP',
      horario: 'Seg–Sex: 8h–16h | Sáb: 8h–13h',
    },
    {
      nome: 'Ecoponto DLU',
      endereco: 'Avenida Pirâmide, 844',
      bairro: 'Jardim Inamar',
      bairroNorm: 'jardim inamar',
      cidade: 'Diadema',
      uf: 'SP',
      horario: 'Seg–Sex: 8h–16h | Sáb: 8h–13h',
    },
    {
      nome: 'Ecoponto João Batista / Vila Popular',
      endereco: 'Rua João Batista Alves do Nascimento, 540',
      bairro: 'Vila Nogueira',
      bairroNorm: 'vila nogueira',
      cidade: 'Diadema',
      uf: 'SP',
      horario: 'Seg–Sex: 8h–16h | Sáb: 8h–13h',
    },
    {
      nome: 'Ecoponto Júpiter',
      endereco: 'Rua Júpiter, 237',
      bairro: 'Serraria',
      bairroNorm: 'serraria',
      cidade: 'Diadema',
      uf: 'SP',
      horario: 'Seg–Sex: 8h–16h | Sáb: 8h–13h',
    },
    {
      nome: 'Ecoponto Marginal "Z"',
      endereco: 'Avenida Daniel José de Carvalho, 330',
      bairro: 'Parque Real',
      bairroNorm: 'parque real',
      cidade: 'Diadema',
      uf: 'SP',
      horario: 'Seg–Sex: 8h–16h | Sáb: 8h–13h',
    },
    {
      nome: 'Ecoponto Maria Leonor – Parque Reid',
      endereco: 'Avenida Maria Leonor (sob Viaduto Rod. Imigrantes)',
      bairro: 'Parque Reid',
      bairroNorm: 'parque reid',
      cidade: 'Diadema',
      uf: 'SP',
      horario: 'Seg–Sex: 8h–16h | Sáb: 8h–13h',
    },
    {
      nome: 'Ecoponto Nações',
      endereco: 'Rua Espanha, 414',
      bairro: 'Jardim das Nações',
      bairroNorm: 'jardim das nacoes',
      cidade: 'Diadema',
      uf: 'SP',
      horario: 'Seg–Sex: 8h–16h | Sáb: 8h–13h',
    },
    {
      nome: 'Ecoponto Naval',
      endereco: 'Corredor ABD c/ Av. Engº Otávio Manente',
      bairro: 'Vila São José',
      bairroNorm: 'vila sao jose',
      cidade: 'Diadema',
      uf: 'SP',
      horario: 'Seg–Sex: 8h–16h | Sáb: 8h–13h',
    },
    {
      nome: 'Ecoponto Paulina',
      endereco: 'Rua Dourado, 265',
      bairro: 'Eldorado',
      bairroNorm: 'eldorado',
      cidade: 'Diadema',
      uf: 'SP',
      horario: 'Seg–Sex: 8h–16h | Sáb: 8h–13h',
    },
    {
      nome: 'Ecoponto Rufino',
      endereco: 'Estrada do Rufino, 1.059',
      bairro: 'Serraria',
      bairroNorm: 'serraria',
      cidade: 'Diadema',
      uf: 'SP',
      horario: 'Seg–Sex: 8h–16h | Sáb: 8h–13h',
    },
    {
      nome: 'Ecoponto VNC – Vila Nova Conquista',
      endereco: 'Travessa ETCD, 210',
      bairro: 'Vila Nova Conquista',
      bairroNorm: 'vila nova conquista',
      cidade: 'Diadema',
      uf: 'SP',
      horario: 'Seg–Sex: 8h–16h | Sáb: 8h–13h',
    },
    {
      nome: 'Ecoponto Yamagata',
      endereco: 'Rua Yamagata, 51',
      bairro: 'Jardim Canhema',
      bairroNorm: 'jardim canhema',
      cidade: 'Diadema',
      uf: 'SP',
      horario: 'Seg–Sex: 8h–16h | Sáb: 8h–13h',
    },
  ];

  /**
   * Normaliza uma string para comparação: minúsculas, sem acentos, sem pontuação.
   * Exemplo: "Jardim Arco-Íris" → "jardim arco iris"
   * @param {string} str
   * @returns {string}
   */
  function normalizar(str) {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // remove acentos
      .replace(/[^a-z0-9\s]/g, '')    // remove pontuação
      .trim();
  }

  /**
   * Filtra Ecopontos cujo bairro normalizado contenha o termo buscado,
   * ou o termo buscado contenha o bairro normalizado (match parcial bidirecional).
   * @param {string} bairroAPI - bairro retornado pelo ViaCEP
   * @returns {Array} Ecopontos correspondentes
   */
  function filtrarPorBairro(bairroAPI) {
    const termoBusca = normalizar(bairroAPI);
    return ECOPONTOS.filter(ep => {
      const bairroEp = ep.bairroNorm;
      return bairroEp.includes(termoBusca) || termoBusca.includes(bairroEp);
    });
  }

  /**
   * Filtra Ecopontos pela cidade retornada pela API.
   * Usado como fallback quando não há match de bairro.
   * @param {string} cidadeAPI
   * @returns {Array}
   */
  function filtrarPorCidade(cidadeAPI) {
    const termoCidade = normalizar(cidadeAPI);
    return ECOPONTOS.filter(ep => normalizar(ep.cidade).includes(termoCidade));
  }

  /**
   * Constrói o HTML de um card de Ecoponto dinamicamente.
   * @param {object} ep - Objeto ecoponto do array ECOPONTOS
   * @returns {string} HTML do card
   */
  function criarCardEcoponto(ep) {
    return `
      <div class="col-12 col-md-4">
        <div class="ecoponto-card animate-on-scroll">
          <div class="ecoponto-icon" aria-hidden="true"><i class="bi bi-recycle"></i></div>
          <div class="ecoponto-info">
            <h5>${ep.nome}</h5>
            <p><i class="bi bi-geo-alt me-1" aria-hidden="true"></i>${ep.endereco} — ${ep.bairro}</p>
            <p><i class="bi bi-clock me-1" aria-hidden="true"></i>${ep.horario}</p>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Renderiza cards de Ecopontos no container #ecopontoCards.
   * @param {Array} lista - Array de objetos ecoponto a exibir
   */
  function renderizarCards(lista) {
    // Mantém o wrapper de linha existente ou cria um
    const rowWrapper = ecopontoCards.querySelector('.row') || ecopontoCards;
    rowWrapper.innerHTML = lista.map(criarCardEcoponto).join('');
    ecopontoCards.style.removeProperty('display');

    // Escalonamento de animação e re-observação
    const cards = ecopontoCards.querySelectorAll('.ecoponto-card');
    cards.forEach((card, i) => {
      card.style.animationDelay = `${i * 0.15}s`;
      scrollObserver.observe(card);
    });
  }

  /**
   * Chama a API ViaCEP e retorna os dados de endereço.
   * Substitui completamente a função simularBuscaCEP().
   *
   * @param {string} cep - CEP no formato "00000-000" ou "00000000"
   * @returns {Promise<object>} Objeto com { cep, logradouro, bairro, localidade, uf } ou { erro: true }
   * @throws {Error} Se a requisição de rede falhar
   */
  async function buscarCEP(cep) {
    const cepLimpo = cep.replace(/\D/g, '');
    const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    if (!resposta.ok) {
      throw new Error(`ViaCEP retornou status ${resposta.status}`);
    }
    return resposta.json(); // Retorna { erro: true } se CEP não existir
  }

  /**
   * Ativa os pinos do mapa simulado com contagem real.
   * @param {number} total - Quantidade de ecopontos encontrados
   */
  function ativarPinosMapa(total) {
    if (pino1) pino1.classList.add('ativo');
    if (pino2) pino2.classList.add('ativo');
    if (mapaMsg) {
      mapaMsg.innerHTML = `
        <i class="bi bi-check-circle-fill me-2" style="color:#52B788"></i>
        ${total} Ecoponto${total !== 1 ? 's' : ''} encontrado${total !== 1 ? 's' : ''} próximo${total !== 1 ? 's' : ''} a você
      `;
    }
  }

  /**
   * Lida com o clique no botão de busca.
   * Integrado com a API real ViaCEP + filtragem por bairro/cidade.
   */
  async function handleBusca() {
    const cep = cepInput.value.trim();

    // Limpa estados anteriores
    cepResultado.innerHTML = '';
    ecopontoCards.style.setProperty('display', 'none', 'important');
    cepInput.classList.remove('is-invalid', 'is-valid');
    if (pino1) pino1.classList.remove('ativo');
    if (pino2) pino2.classList.remove('ativo');
    if (mapaMsg) {
      mapaMsg.innerHTML = `
        <i class="bi bi-map me-2"></i>Insira um CEP para visualizar os Ecopontos
      `;
    }

    // Validação do formato do CEP
    if (!validarCEP(cep)) {
      cepInput.classList.add('is-invalid');
      cepResultado.innerHTML = `
        <div class="resultado-error" role="alert">
          <i class="bi bi-exclamation-circle-fill fs-5"></i>
          <div>
            <strong>CEP inválido.</strong><br>
            Por favor, informe um CEP no formato <em>00000-000</em>.
          </div>
        </div>
      `;
      cepInput.focus(); // Retorna o foco ao campo (IHC: Recuperação de erros)
      return;
    }

    // Estado de carregamento — feedback visual (IHC: Visibilidade do status)
    buscarBtn.disabled = true;
    buscarBtn.innerHTML = `
      <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
      Buscando...
    `;

    try {
      const dados = await buscarCEP(cep);

      if (dados.erro) {
        // ViaCEP retornou { erro: true } — CEP não existe nos Correios
        cepInput.classList.add('is-invalid');
        cepResultado.innerHTML = `
          <div class="resultado-error" role="alert">
            <i class="bi bi-x-circle-fill fs-5"></i>
            <div>
              <strong>CEP não encontrado.</strong><br>
              Verifique o número e tente novamente. Para CEPs reais, consulte
              <a href="https://buscacepinter.correios.com.br" target="_blank" rel="noopener">
                os Correios
              </a>.
            </div>
          </div>
        `;
        return;
      }

      // CEP encontrado — filtra Ecopontos pelo bairro
      cepInput.classList.add('is-valid');
      const { bairro, localidade, uf } = dados;
      let ecopontosFiltrados = filtrarPorBairro(bairro);
      let modoFallback = false;

      if (ecopontosFiltrados.length === 0) {
        // Fallback: sugere todos da mesma cidade
        ecopontosFiltrados = filtrarPorCidade(localidade);
        modoFallback = true;
      }

      // Monta a mensagem de resultado conforme o cenário
      let mensagemResultado;
      if (ecopontosFiltrados.length > 0 && !modoFallback) {
        mensagemResultado = `
          <strong>${ecopontosFiltrados.length} Ecoponto${ecopontosFiltrados.length !== 1 ? 's' : ''} encontrado${ecopontosFiltrados.length !== 1 ? 's' : ''}</strong>
          no bairro <em>${bairro}, ${localidade} – ${uf}</em>.
        `;
      } else if (ecopontosFiltrados.length > 0 && modoFallback) {
        mensagemResultado = `
          <strong>Nenhum Ecoponto encontrado em ${bairro}.</strong><br>
          Exibindo os <strong>${ecopontosFiltrados.length} Ecopontos</strong>
          disponíveis em <em>${localidade} – ${uf}</em>.
        `;
      } else {
        mensagemResultado = `
          <strong>Nenhum Ecoponto cadastrado</strong> para
          <em>${localidade} – ${uf}</em>.<br>
          Consulte a prefeitura local para mais informações.
        `;
      }

      cepResultado.innerHTML = `
        <div class="resultado-success" role="status">
          <i class="bi bi-check-circle-fill fs-5"></i>
          <div>${mensagemResultado}</div>
        </div>
      `;

      if (ecopontosFiltrados.length > 0) {
        renderizarCards(ecopontosFiltrados);
        ativarPinosMapa(ecopontosFiltrados.length);
        setTimeout(() => {
          ecopontoCards.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 300);
      }

    } catch (error) {
      // Erro inesperado (rede, etc.) — IHC: Mensagens de erro úteis
      cepResultado.innerHTML = `
        <div class="resultado-error" role="alert">
          <i class="bi bi-wifi-off fs-5"></i>
          <div>
            <strong>Erro de conexão.</strong><br>
            Não foi possível realizar a busca. Verifique sua conexão e tente novamente.
          </div>
        </div>
      `;
    } finally {
      // Restaura o botão em qualquer caso
      buscarBtn.disabled = false;
      buscarBtn.innerHTML = `<i class="bi bi-search me-2"></i>Buscar`;
    }
  }

  // Clique no botão
  if (buscarBtn) {
    buscarBtn.addEventListener('click', handleBusca);
  }

  // Enter no input também dispara a busca
  if (cepInput) {
    cepInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleBusca();
    });
  }


  /* -----------------------------------------------------------
     4. ANIMAÇÕES DE ENTRADA — IntersectionObserver
     IHC: Estética e design minimalista (Nielsen)
     Melhora a percepção de fluxo e hierarquia da página
  ----------------------------------------------------------- */

  /**
   * IntersectionObserver: observa elementos com a classe
   * .animate-on-scroll e adiciona .visible quando entram na tela.
   * Threshold: 0.15 = 15% do elemento visível para disparar
   */
  const observerOptions = {
    root: null,         // viewport
    rootMargin: '0px',
    threshold: 0.15,
  };

  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        // Após animar, desconecta o observer para evitar re-execução
        scrollObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  // Adiciona a classe base e observa os elementos
  const animatables = document.querySelectorAll(
    '.residuo-card, .step-card, .ecoponto-card, .lei-banner, .lixeiras-legend, .mapa-simulado'
  );

  animatables.forEach((el, index) => {
    el.classList.add('animate-on-scroll');
    // Delay escalonado para elementos em grupos (Gestalt: Continuidade)
    const delay = (index % 3) * 0.1; // 0, 0.1, 0.2, 0, 0.1...
    el.style.transitionDelay = `${delay}s`;
    scrollObserver.observe(el);
  });


  /* -----------------------------------------------------------
     5. BOTÃO "VOLTAR AO TOPO"
     IHC: Visibilidade do status + Controle do usuário
  ----------------------------------------------------------- */

  const voltarTopoBtn = document.getElementById('voltarTopo');

  /**
   * Exibe o botão "voltar ao topo" após rolar 400px.
   */
  function handleVoltarTopo() {
    if (window.scrollY > 400) {
      voltarTopoBtn.classList.add('visible');
    } else {
      voltarTopoBtn.classList.remove('visible');
    }
  }

  if (voltarTopoBtn) {
    window.addEventListener('scroll', handleVoltarTopo, { passive: true });

    voltarTopoBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }


  /* -----------------------------------------------------------
     6. SMOOTH SCROLL — Links âncora internos
     IHC: Consistência e padrões

     FIX 2 — Compensação dupla removida.
     O CSS já declara `scroll-padding-top: var(--navbar-h)` no :root,
     o que faz o browser descontar automaticamente a altura da navbar
     fixa em TODOS os scrolls (clique, teclado, JS nativo).
     Calcular `targetTop - navbarH` manualmente aqui causaria
     dupla compensação: o elemento ficaria 72px acima do esperado.

     Solução: usar apenas `element.scrollIntoView()` ou
     `window.scrollTo()` sem offset — o CSS cuida do resto.
     Compatibilidade do scroll-padding-top: Chrome 69+, Firefox 68+,
     Safari 14.1+ (cobre > 96% dos usuários em 2025).
  ----------------------------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return; // Link vazio — ignora

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();

      // scrollIntoView respeita scroll-padding-top do CSS nativamente.
      // Não aplicamos nenhum offset manual aqui.
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });


  /* -----------------------------------------------------------
     7. PINOS DO MAPA — Tooltip e interatividade
  ----------------------------------------------------------- */

  const mapaPinos = document.querySelectorAll('.mapa-pino:not(.mapa-pino--inativo)');

  mapaPinos.forEach(pino => {
    pino.setAttribute('tabindex', '0');
    pino.setAttribute('role', 'button');

    // Mostra tooltip ao focar ou hover
    pino.addEventListener('focus', () => pino.classList.add('ativo'));
    pino.addEventListener('blur',  () => {
      // Mantém ativo se a busca foi realizada
      if (!ecopontoCards.style.display || ecopontoCards.style.display === 'none') {
        pino.classList.remove('ativo');
      }
    });
  });


  /* -----------------------------------------------------------
     8. LOG DE INICIALIZAÇÃO (para documentação / debug)
  ----------------------------------------------------------- */
  console.log('%c🌿 EcoPonto Interativo — Inicializado (v2.0)', 'color:#52B788;font-weight:bold;font-size:13px;');
  console.log('%cFIXES: Bootstrap guard | Scroll sem dupla compensação | Foco no Escape', 'color:#95D5B2;font-size:11px;');
  console.log('%c🗺️ API ViaCEP integrada | 16 Ecopontos DLU/Diadema carregados | Filtro por bairro + fallback por cidade', 'color:#95D5B2;font-size:11px;');

}); // end DOMContentLoaded
