# Usa imagem oficial do Node
FROM node:18

# Cria diretório de trabalho dentro do container
WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala dependências
RUN npm install

# Copia todo o restante do código
COPY . .

# Expõe a porta do servidor
EXPOSE 3000

# Comando para iniciar
CMD ["npm", "start"]
