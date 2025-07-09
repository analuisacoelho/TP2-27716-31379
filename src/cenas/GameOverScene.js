export default class GameOverScene extends Phaser.Scene {
  // Define o nome da cena como 'GameOverScene'
  constructor() {
    super('GameOverScene');
  }

  // Método chamado ao iniciar a cena, recebendo dados da cena anterior
  init(data) {
    // Armazena a pontuação final recebida ou usa 0 se não for fornecida
    this.finalScore = data.score || 0;
  }

  // Método responsável por criar os elementos visuais da cena
  create() {
    // Obtém a largura e altura da tela do jogo a partir da configuração
    const { width, height } = this.sys.game.config;

    // Cria um fundo preto semi-transparente que cobre toda a tela
    this.add.rectangle(0, 0, width, height, 0x000000, 0.6).setOrigin(0); // fundo escuro

    // Exibe o texto "PERDEU!" no topo da tela, com fonte vermelha e contorno preto
    this.add.text(width / 2, height * 0.3, 'PERDEU!', {
      fontSize: '64px',
      fill: '#f00',
      stroke: '#000',
      strokeThickness: 6
    }).setOrigin(0.5); // Centraliza o texto

    // Exibe a pontuação final logo abaixo, em branco
    this.add.text(width / 2, height * 0.4, 'Pontuação: ' + this.finalScore, {
      fontSize: '36px',
      fill: '#fff'
    }).setOrigin(0.5); // Centraliza o texto

    // Cria o botão "Tentar novamente"
    const restart = this.add.text(width / 2, height * 0.55, 'Tentar novamente', {
      fontSize: '32px',
      fill: '#0f0'
    }).setOrigin(0.5).setInteractive(); // Habilita a interação com o rato

    // Altera a cor do texto quando o ponteiro passa por cima (hover)
    restart.on('pointerover', () => restart.setStyle({ fill: '#ff0' }));
    // Restaura a cor original quando o ponteiro sai
    restart.on('pointerout', () => restart.setStyle({ fill: '#0f0' }));
    // Reinicia o jogo ao clicar no botão
    restart.on('pointerdown', () => this.scene.start('GameScene'));

    // Cria o botão "Sair"
    const exit = this.add.text(width / 2, height * 0.65, 'Sair', {
      fontSize: '32px',
      fill: '#f00'
    }).setOrigin(0.5).setInteractive(); // Também interativo

    // Hover: muda a cor do botão para amarelo
    exit.on('pointerover', () => exit.setStyle({ fill: '#ff0' }));
    // Quando o rato sai, volta ao vermelho
    exit.on('pointerout', () => exit.setStyle({ fill: '#f00' }));
    // Volta para o menu principal ao clicar no botão
    exit.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
