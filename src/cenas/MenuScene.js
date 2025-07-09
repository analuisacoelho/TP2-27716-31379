export default class extends Phaser.Scene {
  constructor() {
    // Define o nome da cena como 'MenuScene'
    super('MenuScene');
  }

  create() {
    // Verifica se a música de fundo já está a tocar; se não, adiciona e toca em loop
    if (!this.sound.get('bgMusic')) {
    this.sound.add('bgMusic', { loop: true }).play();
    }

    // Obtém as dimensões da tela
    const { width, height } = this.sys.game.config;

    // Adiciona uma imagem de fundo centralizada, cobrindo toda a tela
    this.add.image(width / 2, height / 2, 'forest-bg6')
      .setDisplaySize(width, height) // Garante que a imagem cobre o ecrã
      .setDepth(-1);                 // Envia para trás de todos os elementos

    // Título do jogo
    this.add.text(width / 2, height * 0.2, 'Forest Run', {
      fontSize: '64px',
      fill: '#fff',
      stroke: '#000',    // contorno preto
      strokeThickness: 6 // espessura do contorno
    }).setOrigin(0.5);   // centraliza o texto

    // Carrega o recorde guardado no localStorage ou usa 0 como padrão
    const maxScore = localStorage.getItem('maxScore') || 0;

    // Exibe o recorde
    this.add.text(width / 2, height * 0.27, 'Recorde: ' + maxScore, {
      fontSize: '28px',
      fill: '#ffff00'
    }).setOrigin(0.5);

    // Botão "Iniciar"
    const btnStart = this.add.text(width / 2, height * 0.50, 'Iniciar', {
      fontSize: '40px',
      fill: '#0f0'
    }).setOrigin(0.5).setInteractive(); // habilita interatividade

    // Efeitos de hover (passar o rato)
    btnStart.on('pointerover', () => btnStart.setStyle({ fill: '#ff0' }));
    btnStart.on('pointerout', () => btnStart.setStyle({ fill: '#0f0' }));
    // Ao clicar, inicia a cena principal do jogo
    btnStart.on('pointerdown', () => this.scene.start('GameScene'));

    // Botão "Sair do Jogo"
    const btnExit = this.add.text(width / 2, height * 0.60, 'Sair do Jogo', {
      fontSize: '32px',
      fill: '#ff6666'
    }).setOrigin(0.5).setInteractive();

    // Efeitos de hover para o botão de sair
    btnExit.on('pointerover', () => btnExit.setStyle({ fill: '#ff0' }));
    btnExit.on('pointerout', () => btnExit.setStyle({ fill: '#ff6666' }));
    // Ao clicar em "Sair do Jogo", exibe mensagem de agradecimento e pausa a cena
    btnExit.on('pointerdown', () => {
      // Cria um retângulo preto semitransparente cobrindo a tela
      this.add.rectangle(0, 0, width, height, 0x000000, 0.9).setOrigin(0);
      // Mensagem
      this.add.text(width / 2, height / 2, 'Obrigado por jogar!\nPode fechar a aba.', {
        fontSize: '32px',
        fill: '#fff',
        align: 'center'
      }).setOrigin(0.5);

      // Pausa a cena de menu (efeito de "tela final")
      this.scene.pause();
    });
  }
}
