# O Que Você Esqueceu

[![Deploy to GitHub Pages](https://github.com/leonardoconstantino/o-que-voce-esqueceu/actions/workflows/deploy.yml/badge.svg)](https://github.com/leonardoconstantino/o-que-voce-esqueceu/actions/workflows/deploy.yml)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=flat&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-06B6D4?style=flat&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> *"Todo desenho é um pacto com o que deixamos para trás."*

Um jogo atmosférico de ateliê e arena roguelite onde a sua pintura em tela torna-se o mundo físico que você deve enfrentar. As ferramentas de arte que você negligencia ou explora em excesso manifestam-se como colossos sentientes, confrontando o desenhista em uma batalha pelo próprio significado da criação.

---

### 🎮 [JOGAR AGORA NO GITHUB PAGES](https://leonardoconstantino.github.io/o-que-voce-esqueceu/)

---

![O Que Você Esqueceu - Key Visual](./assets/hero.png)

---

## 🎨 O Conceito

Em **O Que Você Esqueceu**, cada sessão de jogo se divide em dois ciclos interdependentes:

1. **O Ateliê (Criação sob Pressão)**:
   Diante de um papel cru, você dispõe de 60 segundos ao som de um metrônomo implacável. Utilizando um conjunto clássico de ferramentas (pincel, borracha, balde, linha, spray, carimbo e esfuminho), você desenha livremente. Durante o processo, cada hesitação, velocidade de traço, acúmulo de pigmento e ferramenta ignorada são registrados silenciosamente.

2. **A Arena (Consequência Viva)**:
   Ao soar o último compasso do metrônomo, sua tela é decomposta através de um pipeline de conversão procedural:
   - A matéria desenhada torna-se a geometria da arena, obstáculos de tinta, armadilhas cáusticas e coberturas.
   - A ferramenta que você **mais negligenciou** (ou utilizou com **desvio obsessivo**) ganha consciência e ressurge como o **Chefe Titânico da Sessão**, acompanhado de lacaios concebidos a partir da matéria física do próprio meio (cerdas vorazes, pedras de látex abrasivo, poças viscerais de pigmento, agulhas geométricas e nuvens difusas de aerossol).

3. **A Resolução e a Memória Permanente**:
   Ao final do confronto, você decide o destino da ferramenta confrontada:
   - **Reconciliar**: Restaura o equilíbrio da ferramenta, pacificando seu ressentimento e fortalecendo seu vínculo para as próximas obras.
   - **Destruir**: Elimina a ferramenta permanentemente da sua paleta. Suas opções no ateliê diminuem a cada ciclo, forçando você a criar com o que resta.

---

## ✨ Principais Recursos

- **Pipeline de Conversão de Canvas em Tempo Real**: Análise morfológica de traços, densidade de pixels, cadência motora e extração de contornos vetoriais para geração dinâmica do mapa de combate.
- **Sete Ferramentas Vivas com Identidade Artística**:
  - 🖌️ **Pincel (*Verde Pigmento*)**: Traços fluidos caligráficos; gera lacaios de cerdas sinuosas e ataques em chicote.
  - 🧽 **Borracha (*Cinza Bruma*)**: Apaga matéria e cria vazios; gera monólitos de fricção que anulam projéteis e consomem o espaço.
  - 🪣 **Balde de Preenchimento (*Vinho Ferido*)**: Explosões densas de cor; gera poças cáusticas que limitam a movimentação.
  - 📏 **Linha / Régua (*Grafite Úmido*)**: Precisão ortogonal; dispara projéteis perfurantes geométricos de alta velocidade.
  - 💨 **Spray / Aerosol (*Âmbar de Ateliê*)**: Dispersão caótica de microgotículas; cria zonas de dano difuso contínuo.
  - 💮 **Carimbo (*Sépia Queimada*)**: Selos rituais octogonais; invoca ondas de choque de impacto rítmico.
  - 🌪️ **Esfuminho / Carvão (*Azul Memória*)**: Borrões fantasmagóricos e névoa etérea; confunde a visibilidade e gera espectros velozes.
- **Persistência Relacional em IndexedDB**: Memória contínua que rastreia sessões, afinidades, ressentimento e ferramentas quebradas entre recargas do navegador.
- **Paisagem Sonora Procedural (Web Audio API)**: Síntese de áudio em tempo real sem dependência de arquivos externos pesados — metrônomo orgânico, riscos táteis de grafite, impactos aquosos e harmonias atmosféricas adaptativas.
- **Zero Dependências Pesadas de Frameworks de Jogo**: Renderização de alta performance em Canvas 2D nativo otimizado, sem inchaço de dependências.

---

## 🕹️ Controles

| Ação | Teclado & Mouse |
| :--- | :--- |
| **Desenhar (Ateliê)** | `Botão Esquerdo do Mouse` / `Arrastar Touch` |
| **Trocar Ferramentas** | `Clique nos Ícones do Painel` ou Teclas Numéricas `1` a `7` |
| **Movimento (Arena)** | Teclas `W`, `A`, `S`, `D` ou `Setas Direcionais` |
| **Mirar** | `Cursor do Mouse` |
| **Atacar (Pincelada de Grafite)** | `Botão Esquerdo do Mouse` ou `Barra de Espaço` |
| **Esquiva Rápida (Dash com Invulnerabilidade)** | `Shift` ou `Botão Direito do Mouse` |
| **Silenciar / Reativar Áudio** | Tecla `M` ou Ícone de Som |

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão 18 ou superior (Node 20+ recomendado)
- Gerenciador de pacotes `npm` (incluso no Node.js) ou `bun` / `pnpm`

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/leonardoconstantino/o-que-voce-esqueceu.git
   cd o-que-voce-esqueceu
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Abra seu navegador em [http://localhost:3000](http://localhost:3000).

4. **Gerar a build de produção:**
   ```bash
   npm run build
   ```

5. **Visualizar a build localmente:**
   ```bash
   npm run preview
   ```

---

## ⚙️ Deploy Automático no GitHub Pages

O projeto conta com uma pipeline configurada via **GitHub Actions** em `.github/workflows/deploy.yml`:

- **Gatilhos**: Qualquer `push` nas branches `main` ou `master`, além de disparo manual via `workflow_dispatch`.
- **Caminho Base Dinâmico**: O `vite.config.ts` ajusta automaticamente o base path para `/o-que-voce-esqueceu/` no ambiente do GitHub Actions e `./` ou `/` em ambientes locais.
- **Publicação Contínua**: O runner do GitHub Actions compila os arquivos, valida tipagem e assets, e despacha o resultado diretamente para a infraestrutura do GitHub Pages via `actions/deploy-pages@v4`.

---

## 📜 Licença

Distribuído sob a licença **MIT**. Consulte `LICENSE` para mais informações.
