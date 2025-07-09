export default class PreloadScene extends Phaser.Scene {
  constructor() { 
    // Define o nome da cena como 'PreloadScene'
    super('PreloadScene'); 
  }

  preload() {
    // Carrega diversas imagens de fundo que serão usadas para transições durante o jogo
    this.load.image('forest-bg', 'assets/images/forest-bg.png');
    this.load.image('forest-bg1', 'assets/images/1.png');
    this.load.image('forest-bg2', 'assets/images/22.png');
    this.load.image('forest-bg3', 'assets/images/3.png');
    this.load.image('forest-bg4', 'assets/images/4.png');
    this.load.image('forest-bg5', 'assets/images/5.png');
    this.load.image('forest-bg6', 'assets/images/6.png');
    this.load.image('forest-bg7', 'assets/images/7.png');
    this.load.image('forest-bg8', 'assets/images/8.png');

    // Imagem do chão (plataformas estáticas)
    this.load.image('chao', 'assets/images/chao.png');
    
     // Carrega o sprite sheet do jogador com dimensões dos frames individuais
    this.load.spritesheet('player', 'assets/sprites/1.png', {
      frameWidth: 256,  
      frameHeight: 458
    });

    // Sprite do inimigo (estático, sem animação)
    this.load.image('inimigo', 'assets/sprites/inimigo.png');
    // Sprite sheet da moeda, usada para animação de giro
    this.load.spritesheet('coin', 'assets/sprites/coin1.png', {
      frameWidth: 129,
      frameHeight: 128
    });

    // Música de fundo e efeitos sonoros
    this.load.audio('bgMusic', 'assets/audio/musica_fundo.mp3');
    this.load.audio('coinSound', 'assets/audio/coin.wav');
    this.load.audio('stompSound', 'assets/audio/stomp.wav');
  }

  create() {
    // Após carregar todos os assets, inicia a cena de Menu
    this.scene.start('MenuScene');
  }
}
