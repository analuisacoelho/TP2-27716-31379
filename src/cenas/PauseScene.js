export default class PauseScene extends Phaser.Scene {
  constructor() {
    // Define o nome da cena como 'PauseScene'
    super('PauseScene');
  }

  create() {
    // Obtém as dimensões da tela do jogo
    const { width, height } = this.sys.game.config;

    // Adiciona um retângulo escuro semi-transparente ao centro (fundo do menu)
    const menuBg = this.add.rectangle(width / 2, height / 2, 300, 200, 0x000000, 0.8);

    // Botão "Continuar"
    const continueBtn = this.add.text(width / 2, height / 2 - 40, 'Continuar', {
      fontSize: '24px',
      fill: '#fff',
      backgroundColor: '#333',
      padding: { x: 10, y: 5 }
    })
      .setOrigin(0.5) // Centraliza o texto
      .setInteractive() // Permite interação com o rato
      .on('pointerdown', () => {
        this.scene.stop();            // Fecha PauseScene
        this.scene.resume('GameScene'); // Retoma GameScene
      });

    // Botão "Sair"
    const exitBtn = this.add.text(width / 2, height / 2 + 40, 'Sair', {
      fontSize: '24px',
      fill: '#fff',
      backgroundColor: '#333',
      padding: { x: 10, y: 5 }
    })
      .setOrigin(0.5)
      .setInteractive()
      .on('pointerdown', () => {
        this.scene.stop('GameScene');  // Termina GameScene
        this.scene.start('MenuScene'); // Volta ao Menu
      });
  }
}
