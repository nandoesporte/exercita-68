
// Este script pode ser utilizado para gerar automaticamente os ícones do PWA
// Necessita da instalação do pacote 'sharp' para processamento de imagens
// Execute com: node scripts/generate-pwa-icons.js

const fs = require('fs');
const path = require('path');

console.log('Este script é um guia para gerar ícones PWA.');
console.log('Para gerar os ícones você precisa:');
console.log('1. Instalar o pacote "sharp": npm install sharp --save-dev');
console.log('2. Ter uma imagem de origem de alta resolução (pelo menos 512x512)');
console.log('3. Executar este script depois de ajustar o caminho da imagem de origem');

console.log('\nExemplo de código para gerar ícones:');
console.log(`
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Caminho da sua logo atual
const sourceIcon = path.join(__dirname, '../public/lovable-uploads/9de18deb-691c-457f-af33-cd32cf6c27d7.png');

// Tamanhos dos ícones para o PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Diretório para salvar os ícones
const iconDir = path.join(__dirname, '../public/icons');

// Criar diretório se não existir
if (!fs.existsSync(iconDir)) {
  fs.mkdirSync(iconDir, { recursive: true });
}

// Gerar ícones em diferentes tamanhos
async function generateIcons() {
  try {
    for (const size of sizes) {
      await sharp(sourceIcon)
        .resize(size, size)
        .png()
        .toFile(path.join(iconDir, \`icon-\${size}x\${size}.png\`));
      
      console.log(\`Ícone \${size}x\${size} gerado com sucesso!\`);
    }
    console.log('Todos os ícones foram gerados!');
  } catch (error) {
    console.error('Erro ao gerar ícones:', error);
  }
}

generateIcons();
`);

console.log('\nPor enquanto, crie uma pasta "public/icons" e adicione manualmente os ícones nestas dimensões:');
console.log('72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512');
