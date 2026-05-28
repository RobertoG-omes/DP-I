document.addEventListener('DOMContentLoaded', () => {

  // 1. NAVBAR

  const mainNav = document.getElementById('mainNav');

  function handleNavbarScroll() {
    if (window.scrollY > 60) {
      mainNav.classList.add('scrolled');
    } else {
      mainNav.classList.remove('scrolled');
    }
  }

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
          if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  // Guard defensivo: Bootstrap JS pode não estar carregado em todos os ambientes
  function fecharMenuMobile() {
    if (typeof bootstrap === 'undefined') return;

    const collapseEl = document.getElementById('navMenu');
    if (collapseEl && collapseEl.classList.contains('show')) {
      const bsCollapse = bootstrap.Collapse.getInstance(collapseEl);
      if (bsCollapse) bsCollapse.hide();
    }
  }

  navLinks.forEach(link => link.addEventListener('click', fecharMenuMobile));

  const navCta = document.querySelector('.nav-cta');
  if (navCta) navCta.addEventListener('click', fecharMenuMobile);

  window.addEventListener('scroll', () => {
    handleNavbarScroll();
    highlightActiveNavLink();
  }, { passive: true });

  handleNavbarScroll();
  highlightActiveNavLink();


  // 2. CARDS DE RESÍDUOS

  const residuoCards = document.querySelectorAll('.residuo-card');

  function toggleCard(card) {
    const isFlipped  = card.classList.contains('is-flipped');
    const cardBack   = card.querySelector('.card-back');

    residuoCards.forEach(otherCard => {
      if (otherCard !== card) {
        otherCard.classList.remove('is-flipped');
        otherCard.setAttribute('aria-expanded', 'false');
        const otherBack = otherCard.querySelector('.card-back');
        if (otherBack) otherBack.setAttribute('aria-hidden', 'true');
      }
    });

    card.classList.toggle('is-flipped');
    const nowFlipped = card.classList.contains('is-flipped');
    card.setAttribute('aria-expanded', nowFlipped ? 'true' : 'false');

    if (cardBack) {
      cardBack.setAttribute('aria-hidden', nowFlipped ? 'false' : 'true');
    }
  }

  residuoCards.forEach(card => {
    card.addEventListener('click', () => toggleCard(card));

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleCard(card);
      }
      // Escape fecha o card e mantém o foco nele para não desorientar navegação por teclado
      if (e.key === 'Escape' && card.classList.contains('is-flipped')) {
        card.classList.remove('is-flipped');
        card.setAttribute('aria-expanded', 'false');
        const back = card.querySelector('.card-back');
        if (back) back.setAttribute('aria-hidden', 'true');
        card.focus();
      }
    });
  });

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


  // 3. BUSCA POR CEP

  const cepInput      = document.getElementById('cepInput');
  const buscarBtn     = document.getElementById('buscarBtn');
  const cepResultado  = document.getElementById('cepResultado');
  const ecopontoCards = document.getElementById('ecopontoCards');
  const mapaMsg       = document.getElementById('mapaMsg');
  const pino1         = document.getElementById('pino1');
  const pino2         = document.getElementById('pino2');

  function mascaraCEP(valor) {
    const apenas = valor.replace(/\D/g, '').slice(0, 8);
    if (apenas.length > 5) {
      return apenas.slice(0, 5) + '-' + apenas.slice(5);
    }
    return apenas;
  }

  cepInput.addEventListener('input', (e) => {
    const mascarado = mascaraCEP(e.target.value);
    e.target.value = mascarado;
    cepInput.classList.remove('is-invalid', 'is-valid');
    cepResultado.innerHTML = '';
  });

  // Aceita "00000-000" ou "00000000"; validação de existência real fica por conta da API ViaCEP
  function validarCEP(cep) {
    return /^\d{5}-\d{3}$/.test(cep) || /^\d{8}$/.test(cep);
  }

  /* Fonte: DLU Diadema, jan/2026 */
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

  function normalizar(str) {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s]/g, '')
      .trim();
  }

  // Match parcial bidirecional: cobre casos onde o nome do bairro na API é mais curto ou mais longo que o cadastrado
  function filtrarPorBairro(bairroAPI) {
    const termoBusca = normalizar(bairroAPI);
    return ECOPONTOS.filter(ep => {
      const bairroEp = ep.bairroNorm;
      return bairroEp.includes(termoBusca) || termoBusca.includes(bairroEp);
    });
  }

  // Fallback quando não há match de bairro
  function filtrarPorCidade(cidadeAPI) {
    const termoCidade = normalizar(cidadeAPI);
    return ECOPONTOS.filter(ep => normalizar(ep.cidade).includes(termoCidade));
  }

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

  function renderizarCards(lista) {
    const rowWrapper = ecopontoCards.querySelector('.row') || ecopontoCards;
    rowWrapper.innerHTML = lista.map(criarCardEcoponto).join('');
    ecopontoCards.style.removeProperty('display');

    const cards = ecopontoCards.querySelectorAll('.ecoponto-card');
    cards.forEach((card, i) => {
      card.style.animationDelay = `${i * 0.15}s`;
      scrollObserver.observe(card);
    });
  }

  async function buscarCEP(cep) {
    const cepLimpo = cep.replace(/\D/g, '');
    const resposta = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
    if (!resposta.ok) {
      throw new Error(`ViaCEP retornou status ${resposta.status}`);
    }
    return resposta.json();
  }

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

  async function handleBusca() {
    const cep = cepInput.value.trim();

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
      cepInput.focus();
      return;
    }

    buscarBtn.disabled = true;
    buscarBtn.innerHTML = `
      <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
      Buscando...
    `;

    try {
      const dados = await buscarCEP(cep);

      if (dados.erro) {
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

      cepInput.classList.add('is-valid');
      const { bairro, localidade, uf } = dados;
      let ecopontosFiltrados = filtrarPorBairro(bairro);
      let modoFallback = false;

      if (ecopontosFiltrados.length === 0) {
        ecopontosFiltrados = filtrarPorCidade(localidade);
        modoFallback = true;
      }

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
      buscarBtn.disabled = false;
      buscarBtn.innerHTML = `<i class="bi bi-search me-2"></i>Buscar`;
    }
  }

  if (buscarBtn) {
    buscarBtn.addEventListener('click', handleBusca);
  }

  if (cepInput) {
    cepInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleBusca();
    });
  }


  // 4. ANIMAÇÕES DE ENTRADA

  const observerOptions = {
    root: null,
    rootMargin: '0px',
    threshold: 0.15,
  };

  const scrollObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        scrollObserver.unobserve(entry.target);
      }
    });
  }, observerOptions);

  const animatables = document.querySelectorAll(
    '.residuo-card, .step-card, .ecoponto-card, .lei-banner, .lixeiras-legend, .mapa-simulado'
  );

  animatables.forEach((el, index) => {
    el.classList.add('animate-on-scroll');
    const delay = (index % 3) * 0.1;
    el.style.transitionDelay = `${delay}s`;
    scrollObserver.observe(el);
  });


  // 5. BOTÃO VOLTAR AO TOPO

  const voltarTopoBtn = document.getElementById('voltarTopo');

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


  // 6. SMOOTH SCROLL
  // O CSS declara scroll-padding-top: var(--navbar-h), então não aplicamos offset manual aqui
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });


  // 7. PINOS DO MAPA

  const mapaPinos = document.querySelectorAll('.mapa-pino:not(.mapa-pino--inativo)');

  mapaPinos.forEach(pino => {
    pino.setAttribute('tabindex', '0');
    pino.setAttribute('role', 'button');

    pino.addEventListener('focus', () => pino.classList.add('ativo'));
    pino.addEventListener('blur',  () => {
      if (!ecopontoCards.style.display || ecopontoCards.style.display === 'none') {
        pino.classList.remove('ativo');
      }
    });
  });

  console.log('%c🌿 EcoPonto Interativo — Inicializado (v2.0)', 'color:#52B788;font-weight:bold;font-size:13px;');

}); // end DOMContentLoaded
