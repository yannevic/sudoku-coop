# Monorepo Template

Este é meu template de um projeto **Monorepo**

# Instalação

- Pegar o link do repositório.
- Abrir no CMD a pasta de onde o novo projeto será salvo.
- Digitar `git clone url_do_projeto nome_do_novo_projeto` e dar enter.

## Rodar na raiz do projeto

```
npm install
```

```
npm run dev
```

## Para subir o projeto a primeira vez, verificar se existe origem de repositório.

```
git remote -v
```

Caso não exista nenhuma origin:

```
git remote add origin url_do_projeto
```

Caso já exista:

```
git remote set-url origin url_do_projeto
```
