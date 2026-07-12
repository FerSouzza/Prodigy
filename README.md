# PRODIGY — Personal Training System

Sistema de gestão de treinos pessoais. Cadastro de alunos, programação de exercícios por dia, periodização em 4 semanas e exportação de ficha em PDF via Google Sheets.

---

## Deploy no GitHub Pages

O projeto usa GitHub Actions para fazer o build e publicar automaticamente a cada `git push` na branch `main`.

### 1. Crie o repositório e suba o código (veja seção abaixo)

### 2. Ative o GitHub Pages

No repositório do GitHub:
1. **Settings → Pages**
2. Em **Source**, selecione **GitHub Actions**
3. Salva

Pronto. Na próxima vez que você fizer `git push`, o GitHub Actions vai buildar e publicar automaticamente. O site ficará em:

```
https://SEU_USUARIO.github.io/NOME_DO_REPO/
```

### 3. Adicione a URL do Pages no Google Cloud

Para o login Google funcionar no site publicado, adicione a URL nas origens autorizadas:

1. [console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services → Credentials**
2. Clique no seu OAuth Client ID → **Edit**
3. Em **Authorized JavaScript origins**, adicione:
   ```
   https://SEU_USUARIO.github.io
   ```
4. Salve

> No app, configure o Client ID clicando em **⚙** — as credenciais ficam no `localStorage` do navegador.

---

## Subir para o GitHub (primeira vez)

### 1. Crie um repositório no GitHub

Acesse [github.com/new](https://github.com/new):
- **Repository name:** `prodigy-training-system` (ou o nome que quiser)
- **Visibility:** Public ou Private
- **NÃO** marque nenhuma das opções de inicializar (sem README, sem .gitignore)
- Clique em **Create repository**

O GitHub vai mostrar uma página com instruções. Copie a URL do repositório (formato `https://github.com/SEU_USUARIO/NOME_DO_REPO.git`).

---

### 2. No terminal, dentro da pasta do projeto

```powershell
git init
git add .
git commit -m "feat: initial commit — PRODIGY training system"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/NOME_DO_REPO.git
git push -u origin main
```

> Substitua `SEU_USUARIO` e `NOME_DO_REPO` pelos seus dados reais.

---

### 3. Para enviar atualizações futuras

```powershell
git add .
git commit -m "descricao da mudanca"
git push
```

---

## Rodar localmente após clonar

Se você ou outra pessoa clonar o repositório:

```powershell
git clone https://github.com/SEU_USUARIO/NOME_DO_REPO.git
cd NOME_DO_REPO
pnpm install
pnpm dev
```

Abra **http://localhost:5173** no navegador.

> Se o `pnpm install` der erro de build scripts, rode antes:
> ```powershell
> pnpm approve-builds
> ```

---

## O que mudar nos arquivos antes de usar

### `src/app/App.tsx` — Configurar Google Sheets

No código, a planilha já está pré-configurada com o ID:
```
1S24821JDPKc3CYc3d-OKdql5YHmecFOojzpKLl8uyFo
```

Se quiser trocar a planilha, localize esta linha:

```tsx
const [spreadsheetId, setSpreadsheetId] = useState(
  () => localStorage.getItem("prodigy_sheet_id") ?? "1S24821JDPKc3CYc3d-OKdql5YHmecFOojzpKLl8uyFo"
);
```

Substitua o ID pelo da sua planilha (disponível na URL do Google Sheets).

O **Client ID OAuth 2.0** você configura diretamente pelo app, clicando no ícone **⚙** no canto superior direito — não precisa editar código.

---

## Estrutura do projeto

```
prodigy-training-system/
├── index.html                  ← entrada do app
├── src/
│   ├── main.tsx                ← monta o React na página
│   ├── app/
│   │   └── App.tsx             ← toda a lógica do sistema
│   └── styles/
│       ├── index.css           ← importa fonts, tailwind e tema
│       ├── fonts.css           ← Google Fonts (Outfit, DM Sans, DM Mono)
│       ├── theme.css           ← tokens de cor dark/light
│       └── tailwind.css        ← configuração do Tailwind
├── .gitignore
├── .npmrc                      ← permite build dos pacotes nativos
├── package.json
├── pnpm-workspace.yaml
└── vite.config.ts
```

---

## Configurar Google Sheets (passo a passo)

### No Google Cloud Console

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie ou selecione um projeto
3. **APIs & Services → Library** — ative:
   - `Google Sheets API`
   - `Google Drive API`
4. **APIs & Services → OAuth consent screen**
   - Tipo: **External** → preencha nome e e-mail → salva
5. **APIs & Services → Credentials → + Create Credentials → OAuth client ID**
   - Tipo: **Web application**
   - **Authorized JavaScript origins** → adicione:
     ```
     http://localhost:5173
     ```
   - Clique em **Create** → copie o **Client ID**

### No app

1. Clique no ícone **⚙** no canto superior direito
2. Cole o **Client ID**
3. O ID da planilha já vem preenchido automaticamente
4. Clique em **Salvar configurações**

As credenciais ficam salvas no `localStorage` — não precisam ser inseridas novamente.

---

## Fluxo de uso

| Etapa | O que fazer |
|---|---|
| **1 — Cadastro** | Nome do aluno, sexo e dias de treino da semana |
| **2 — Treino** | Exercícios por dia — biblioteca com +130 exercícios |
| **3 — Periodização** | Objetivos e cargas para cada uma das 4 semanas |
| **4 — Resumo** | Visualiza tudo → Salva na planilha → Exporta PDF |

---

## Problemas comuns

| Problema | Solução |
|---|---|
| `pnpm install` falha com `ERR_PNPM_IGNORED_BUILDS` | Rode `pnpm approve-builds` antes |
| Popup de login bloqueado | Permita popups para `localhost:5173` no navegador |
| Erro 403 ao salvar | Verifique se Sheets API e Drive API estão ativadas |
| "Origem não autorizada" | Adicione `http://localhost:5173` no Google Cloud → OAuth Client |
| PDF em branco | Aguarde 2–3 segundos após salvar antes de exportar |
