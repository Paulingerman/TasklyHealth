# Taskly Health

Taskly Health é uma aplicação web local para organização de hábitos saudáveis. O projeto reúne rotina diária, hidratação, treinos, alimentação, perfil e progresso semanal em uma interface estilo dashboard.

## Objetivo do projeto

O objetivo é oferecer uma solução simples para acompanhar hábitos de saúde sem depender de banco de dados externo. Os registros ficam salvos no navegador por meio do `localStorage`, permitindo demonstrar funcionalidades de front-end, persistência local, organização de telas e experiência de usuário.

## Funcionalidades

- Cadastro de perfil local com nome, peso, altura e objetivo.
- Dashboard com resumo do dia, rotina e indicadores principais.
- Controle de hidratação com meta diária e botões rápidos.
- Organização de treinos, fichas e exercícios.
- Registro alimentar com calorias e macronutrientes.
- Configuração de rotina com sono, refeições e dias de treino.
- Tela de progresso com score semanal, radar visual, metas e histórico dos últimos 7 dias.
- Backup local com exportação e importação de dados em JSON.
- Tema claro e escuro.

## Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript
- Node.js
- Express
- LocalStorage
- Boxicons
- Google Fonts

## Estrutura do projeto

```text
TasklyHealth-main/
├── backend/
│   ├── package.json
│   ├── package-lock.json
│   └── server.js
├── css/
│   └── styles.css
├── js/
│   ├── auth.js
│   ├── dashboard.js
│   ├── data.js
│   ├── diet.js
│   ├── exercises.js
│   ├── hydration.js
│   ├── main.js
│   ├── profile.js
│   ├── progress.js
│   ├── router.js
│   ├── routine.js
│   └── state.js
├── pages/
│   ├── dashboard.html
│   ├── diet.html
│   ├── exercises.html
│   ├── hydration.html
│   ├── profile.html
│   ├── progress.html
│   └── routine.html
├── index.html
├── package.json
└── README.md
```

## Como executar

Clone o repositório e instale as dependências do backend:

```bash
git clone https://github.com/Paulingerman/TasklyHealth.git
cd TasklyHealth
npm run install:backend
npm start
```

Depois acesse no navegador:

```text
http://localhost:3000
```

Também é possível entrar diretamente na pasta `backend`:

```bash
cd backend
npm install
npm start
```

## Observações importantes

Este projeto está em modo local. Ele não usa banco de dados, autenticação real nem servidor para armazenar informações pessoais. Os dados ficam no navegador do usuário. Por isso, a tela de perfil possui opção de exportar e importar backup em JSON.

As pastas `node_modules`, `data` e `backend/data` não devem ser enviadas para o GitHub. Elas ficam protegidas pelo `.gitignore`.

## Possíveis melhorias futuras

- Criar autenticação real com banco de dados.
- Adicionar gráficos com biblioteca dedicada.
- Gerar relatório mensal em PDF.
- Criar validações mais detalhadas para alimentação e treinos.
- Adicionar testes automatizados.
- Melhorar acessibilidade com navegação completa por teclado.

## Autor

Desenvolvido por **Paulo Germano Mendonça Vasconcelos**.

- GitHub: [@Paulingerman](https://github.com/Paulingerman)
- E-mail: paulogo9009@gmail.com
