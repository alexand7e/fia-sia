# Deploy

## Docker (produção)
1. Build: `docker build -t fia-sia .`
2. Run: `docker run -p 3000:3000 --env-file .env fia-sia`

## Docker Compose
- Produção: `docker compose up app`
- Desenvolvimento: `docker compose --profile dev up app-dev`

## Variáveis de ambiente
- `PORT`: Porta do servidor (padrão `3000`)
- `PUBLIC_DIR`: Caminho do diretório de estáticos (padrão `./public`)
